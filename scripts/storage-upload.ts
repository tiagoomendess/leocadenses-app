// `npm run storage:upload -- <dir> [--dry-run] [--create-bucket]`: copies the old site's uploads
// (Laravel's storage/app/public) into the R2 bucket, key = path relative to <dir>
// (posts/October2021/x.jpg), as the database references them. Idempotent: files already in the
// bucket with the same size are skipped. `--create-bucket` creates the bucket when missing
// (LocalStack in development; R2 buckets are created in the Cloudflare dashboard).
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import {
	CreateBucketCommand,
	HeadBucketCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { CACHE_IMMUTABLE, contentTypeFor, isSafeKey } from '../src/lib/server/storage/paths.ts';

if (!process.env.R2_ENDPOINT && existsSync('.env')) process.loadEnvFile('.env');

const args = process.argv.slice(2);
const dir = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const createBucket = args.includes('--create-bucket');
if (!dir) throw new Error('Usage: npm run storage:upload -- <dir> [--dry-run] [--create-bucket]');

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
	throw new Error('Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET');
}

const client = new S3Client({
	region: process.env.R2_REGION || 'auto',
	endpoint: R2_ENDPOINT,
	credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
	forcePathStyle: ['1', 'true', 'yes', 'on'].includes(
		(process.env.R2_FORCE_PATH_STYLE ?? '').toLowerCase()
	),
	requestChecksumCalculation: 'WHEN_REQUIRED',
	responseChecksumValidation: 'WHEN_REQUIRED'
});

/** Files that are part of Laravel's skeleton, not uploads. */
const SKIP = new Set(['.gitignore', '.gitkeep']);

async function* walk(folder: string): AsyncGenerator<string> {
	for (const entry of await readdir(folder, { withFileTypes: true })) {
		const path = join(folder, entry.name);
		if (entry.isDirectory()) yield* walk(path);
		else if (entry.isFile() && !SKIP.has(entry.name)) yield path;
	}
}

async function remoteSize(key: string): Promise<number | null> {
	try {
		const head = await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
		return head.ContentLength ?? null;
	} catch (error) {
		if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
			return null;
		}
		throw error;
	}
}

async function ensureBucket() {
	try {
		await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
	} catch {
		if (!createBucket) throw new Error(`Bucket ${R2_BUCKET} not found (use --create-bucket)`);
		await client.send(new CreateBucketCommand({ Bucket: R2_BUCKET }));
		console.log(`created bucket ${R2_BUCKET}`);
	}
}

const counts = { uploaded: 0, skipped: 0, invalid: 0 };
await ensureBucket();
console.log(`${dryRun ? '[dry run] ' : ''}${dir} → ${R2_ENDPOINT} / ${R2_BUCKET}`);

for await (const path of walk(dir)) {
	const key = relative(dir, path).split(sep).join('/');
	if (!isSafeKey(key)) {
		counts.invalid++;
		console.warn(`skipped (unsafe key): ${key}`);
		continue;
	}
	const body = await readFile(path);
	if ((await remoteSize(key)) === body.byteLength) {
		counts.skipped++;
		continue;
	}
	if (!dryRun) {
		await client.send(
			new PutObjectCommand({
				Bucket: R2_BUCKET,
				Key: key,
				Body: body,
				ContentType: contentTypeFor(key),
				CacheControl: CACHE_IMMUTABLE
			})
		);
	}
	counts.uploaded++;
	console.log(`${dryRun ? 'would upload' : 'uploaded'} ${key}`);
}

console.log(
	`${counts.uploaded} ${dryRun ? 'to upload' : 'uploaded'}, ${counts.skipped} already there, ${counts.invalid} skipped`
);
