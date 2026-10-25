import { z } from 'zod';
import { m } from '#lib/paraglide/messages.js';
import { optionalFile } from '#lib/server/validation.ts';
import { deleteFile } from '#lib/server/storage/index.ts';
import type { OptimizeOptions } from '#lib/server/storage/images.ts';
import { readUploadedImage, storeImage } from '#lib/server/storage/uploads.ts';

/** Image inputs of the backoffice forms: what the browser may send before the real check. */
export const imageInput = () =>
	optionalFile({
		maxBytes: 15 * 1024 * 1024,
		types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		typesLabel: 'JPG, PNG, GIF, WebP'
	});

export type ImageUpload = z.output<ReturnType<typeof imageInput>>;

/**
 * Stores an uploaded image (checked from its bytes, re-encoded) and returns its key, or an error
 * message for the field. Null when nothing was uploaded.
 */
export async function storeUpload(
	file: File | null,
	options: OptimizeOptions & { folder: string }
): Promise<{ key: string } | { error: string } | null> {
	if (!file) return null;
	const upload = await readUploadedImage(file);
	if (!upload) return { error: m.validation_file_type({ types: 'JPG, PNG, GIF, WebP' }) };
	return { key: await storeImage(upload.bytes, upload.format, options) };
}

/** Removes the previous file once a new one replaced it. */
export async function replaceFile(previous: string | null | undefined, next: string | null) {
	if (previous && next && previous !== next) await deleteFile(previous);
}
