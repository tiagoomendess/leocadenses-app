// `npm run storage:verify`: lists every file the database references (post and page images,
// partner logos, member cards, avatars, image settings and /storage/ links inside post and page
// bodies) that is missing from the R2 bucket. Exits with 1 when something is missing.
import { existsSync } from 'node:fs';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { keyFromPath } from '../src/lib/server/storage/paths.ts';

if (!process.env.DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env');

const { DATABASE_URL, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
	process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
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

/** src/href values inside bodies (they may contain spaces: "Captura de ecrã ....png"). */
const ATTRIBUTE_URL = /\b(?:src|href|poster)=(["'])\s*([^"']*?)\s*\1/gi;
/** Upload URLs, as the old site wrote them: absolute on its domain, root-relative or relative. */
const STORAGE_LINK = /^(?:https?:\/\/(?:www\.)?leocadenses\.pt)?\/?storage\//i;

function bodyLinks(html: string | null): string[] {
	return [...String(html ?? '').matchAll(ATTRIBUTE_URL)]
		.map((match) => match[2].split(/[?#]/)[0])
		.filter((url) => STORAGE_LINK.test(url));
}

/** key → where it is referenced. */
const references = new Map<string, Set<string>>();
function reference(value: string | null, where: string) {
	if (!value || /^https?:\/\/(?!(?:www\.)?leocadenses\.pt)/i.test(value)) return;
	const key = keyFromPath(value.replace(/^https?:\/\/(?:www\.)?leocadenses\.pt/i, ''));
	if (!key) return;
	if (!references.has(key)) references.set(key, new Set());
	references.get(key)!.add(where);
}

const connection = await mysql.createConnection(DATABASE_URL);
try {
	const query = async (sql: string) => (await connection.query<RowDataPacket[]>(sql))[0];

	for (const row of await query('select id, image, body from posts')) {
		reference(row.image, `posts#${row.id} image`);
		for (const link of bodyLinks(row.body)) reference(link, `posts#${row.id} body`);
	}
	for (const row of await query('select id, image, body from pages')) {
		reference(row.image, `pages#${row.id} image`);
		for (const link of bodyLinks(row.body)) reference(link, `pages#${row.id} body`);
	}
	for (const row of await query('select id, picture from partners')) {
		reference(row.picture, `partners#${row.id}`);
	}
	for (const row of await query('select id, card from members where deleted_at is null')) {
		reference(row.card, `members#${row.id} card`);
	}
	for (const row of await query('select id, avatar from users')) {
		reference(row.avatar, `users#${row.id} avatar`);
	}
	for (const row of await query(`select \`key\`, value from settings where type = 'image'`)) {
		reference(row.value, `settings ${row.key}`);
	}
} finally {
	await connection.end();
}

let missing = 0;
for (const [key, where] of [...references].sort(([a], [b]) => a.localeCompare(b))) {
	try {
		await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
	} catch (error) {
		if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404) {
			throw error;
		}
		missing++;
		console.log(`missing ${key} (${[...where].join(', ')})`);
	}
}

console.log(`${references.size} referenced files, ${missing} missing in ${R2_BUCKET}`);
if (missing > 0) process.exitCode = 1;
