import { json } from '@sveltejs/kit';
import { requireAnyPermission } from '#lib/server/auth/guard.ts';
import { IMAGE_LIMITS } from '#lib/server/storage/images.ts';
import { mediaUrl, STORAGE_FOLDERS } from '#lib/server/storage/index.ts';
import { readUploadedImage, storeImage } from '#lib/server/storage/uploads.ts';
import type { RequestHandler } from './$types';

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Image inserted into a post or page body from the editor (Voyager's TinyMCE uploaded into the
 * BREAD's folder). `?folder=pages` for pages, posts otherwise. Answers `{ url }` or `{ message }`.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const pagesFolder = url.searchParams.get('folder') === 'pages';
	requireAnyPermission(pagesFolder ? ['add_pages', 'edit_pages'] : ['add_posts', 'edit_posts']);

	const formData = await request.formData().catch(() => null);
	const file = formData?.get('file');
	if (!(file instanceof File) || file.size === 0) {
		return json({ message: 'Escolha uma imagem.' }, { status: 400 });
	}
	if (file.size > MAX_BYTES) {
		return json({ message: 'A imagem não pode ter mais de 15 MB.' }, { status: 400 });
	}
	const upload = await readUploadedImage(file);
	if (!upload)
		return json({ message: 'Formato não suportado. Use JPG, PNG, GIF ou WebP.' }, { status: 400 });

	const key = await storeImage(upload.bytes, upload.format, {
		folder: pagesFolder ? STORAGE_FOLDERS.pages : STORAGE_FOLDERS.posts,
		resize: { fit: 'inside', maxSize: IMAGE_LIMITS.contentMaxSize }
	});
	return json({ url: mediaUrl(key) });
};
