import sharp from 'sharp';
import { keepsOriginal, optimizeImage, type OptimizeOptions } from './images';
import { storeFile } from './index';

/** Image formats read from the file contents (never trust the browser's MIME type). */
export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'svg' | 'webp';

export const IMAGE_FORMATS: readonly ImageFormat[] = ['png', 'jpeg', 'gif', 'svg', 'webp'];
/** Raster formats only: SVG can carry script, so it is accepted only where the plan allows. */
export const PHOTO_FORMATS: readonly ImageFormat[] = ['png', 'jpeg', 'gif', 'webp'];

const CONTENT_TYPES: Record<ImageFormat, string> = {
	png: 'image/png',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	svg: 'image/svg+xml',
	webp: 'image/webp'
};

/** The real format of an uploaded image, or null when it is not one sharp can read. */
export async function detectImageFormat(data: Uint8Array): Promise<ImageFormat | null> {
	try {
		const { format } = await sharp(data).metadata();
		return format && format in CONTENT_TYPES ? (format as ImageFormat) : null;
	} catch {
		return null;
	}
}

/**
 * Reads an uploaded picture and checks its real format against `formats` (never the browser's
 * MIME type). Null when it is something else.
 */
export async function readUploadedImage(
	file: File,
	formats: readonly ImageFormat[] = PHOTO_FORMATS
): Promise<{ bytes: Uint8Array; format: ImageFormat } | null> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const format = await detectImageFormat(bytes);
	return format && formats.includes(format) ? { bytes, format } : null;
}

/**
 * Optimises and uploads an image into `folder` (Voyager layout, see `newKey`) and returns its
 * key. GIF and SVG are stored as uploaded.
 */
export async function storeImage(
	data: Uint8Array,
	format: ImageFormat,
	{ folder, ...options }: OptimizeOptions & { folder: string }
): Promise<string> {
	const contentType = CONTENT_TYPES[format];
	const image = keepsOriginal(contentType)
		? { data, extension: format === 'jpeg' ? 'jpg' : format, contentType }
		: await optimizeImage(data, options);
	return storeFile(folder, image.data, image.extension, image.contentType);
}
