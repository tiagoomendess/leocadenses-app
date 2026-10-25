import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand
} from '@aws-sdk/client-s3';
import { R2_PUBLIC_URL } from '$app/env/private';
import { CACHE_IMMUTABLE, newKey, publicUrl, storageKey } from './paths';
import { r2 } from './r2';

export * from './paths';

/** The public CDN URL of a stored file (see `publicUrl`). */
export function mediaUrl(value: string | null | undefined): string | null {
	return publicUrl(value, R2_PUBLIC_URL ?? '');
}

/** Uploads bytes under `key` (the value saved in the database). */
export async function putFile(key: string, body: Uint8Array, contentType: string): Promise<void> {
	const { client, bucket } = r2();
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: storageKey(key),
			Body: body,
			ContentType: contentType,
			CacheControl: CACHE_IMMUTABLE
		})
	);
}

/** Stores a file under a new random name in `folder` and returns its key. */
export async function storeFile(
	folder: string,
	body: Uint8Array,
	extension: string,
	contentType: string
): Promise<string> {
	const key = newKey(folder, extension);
	await putFile(key, body, contentType);
	return key;
}

/** The bytes of a stored file. Throws when it doesn't exist. */
export async function readFile(key: string): Promise<Uint8Array> {
	const { client, bucket } = r2();
	const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: storageKey(key) }));
	if (!object.Body) throw new Error(`Empty storage object: ${key}`);
	return object.Body.transformToByteArray();
}

export async function fileExists(key: string): Promise<boolean> {
	const { client, bucket } = r2();
	try {
		await client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey(key) }));
		return true;
	} catch (error) {
		if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
			return false;
		}
		throw error;
	}
}

export type StoredFile = { key: string; size: number; lastModified: Date | null };
export type FolderListing = { folders: string[]; files: StoredFile[] };

/** The subfolders and files directly inside `folder` ('' for the root), like a file browser. */
export async function listFolder(folder: string): Promise<FolderListing> {
	const { client, bucket } = r2();
	const prefix = folder ? `${storageKey(folder)}/` : '';
	const folders: string[] = [];
	const files: StoredFile[] = [];
	let token: string | undefined;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				Delimiter: '/',
				ContinuationToken: token
			})
		);
		for (const common of page.CommonPrefixes ?? []) {
			if (common.Prefix) folders.push(common.Prefix.slice(0, -1));
		}
		for (const object of page.Contents ?? []) {
			if (!object.Key || object.Key === prefix) continue;
			files.push({
				key: object.Key,
				size: object.Size ?? 0,
				lastModified: object.LastModified ?? null
			});
		}
		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);
	return { folders, files };
}

/**
 * Deletes a stored file. Never throws: a missing file must not break the flow that removes it
 * (same contract as Laravel's Storage::delete). Empty values and URLs are ignored.
 */
export async function deleteFile(key: string | null | undefined): Promise<void> {
	if (!key || /^https?:\/\//i.test(key)) return;
	try {
		const { client, bucket } = r2();
		await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey(key) }));
	} catch (error) {
		console.warn(`storage: could not delete ${key}`, error);
	}
}
