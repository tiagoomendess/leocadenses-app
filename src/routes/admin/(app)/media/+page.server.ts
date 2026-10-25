import { fail } from '@sveltejs/kit';
import { done } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import {
	contentTypeFor,
	deleteFile,
	isSafeKey,
	listFolder,
	mediaUrl,
	putFile
} from '#lib/server/storage/index.ts';
import { IMAGE_LIMITS } from '#lib/server/storage/images.ts';
import { readUploadedImage, storeImage } from '#lib/server/storage/uploads.ts';
import type { Actions, PageServerLoad } from './$types';

/** Voyager's media manager: browse the bucket by folder, upload and delete files. */
function folderOf(url: URL): string {
	const path = (url.searchParams.get('path') ?? '').replace(/^\/+|\/+$/g, '');
	return path && isSafeKey(path) ? path : '';
}

const MAX_BYTES = 15 * 1024 * 1024;

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_media');
	const folder = folderOf(url);
	let listing: Awaited<ReturnType<typeof listFolder>> = { folders: [], files: [] };
	let error: string | null = null;
	try {
		listing = await listFolder(folder);
	} catch (cause) {
		console.error('media: could not list the bucket', cause);
		error = 'Não foi possível ler o armazenamento (R2).';
	}
	return {
		folder,
		error,
		folders: listing.folders,
		files: listing.files
			.sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0))
			.map((file) => ({
				key: file.key,
				name: file.key.split('/').pop() ?? file.key,
				size: file.size,
				url: mediaUrl(file.key) ?? '',
				image: /\.(jpe?g|png|gif|webp|svg)$/i.test(file.key)
			}))
	};
};

export const actions: Actions = {
	upload: async ({ request, url, cookies }) => {
		requirePermission('browse_media');
		const folder = folderOf(url);
		if (!folder) return fail(400, { message: 'Abra uma pasta para enviar ficheiros.' });
		const formData = await request.formData();
		const files = formData
			.getAll('files')
			.filter((file): file is File => file instanceof File && file.size > 0);
		if (files.length === 0) return fail(400, { message: 'Escolha um ficheiro.' });

		for (const file of files) {
			if (file.size > MAX_BYTES) return fail(400, { message: `${file.name}: mais de 15 MB.` });
			const image = await readUploadedImage(file);
			if (image) {
				await storeImage(image.bytes, image.format, {
					folder,
					resize: { fit: 'inside', maxSize: IMAGE_LIMITS.contentMaxSize }
				});
			} else if (/\.pdf$/i.test(file.name) && file.type === 'application/pdf') {
				const key = `${folder}/${file.name.replace(/[^\w.-]+/g, '-')}`;
				if (!isSafeKey(key)) return fail(400, { message: `${file.name}: nome inválido.` });
				await putFile(key, new Uint8Array(await file.arrayBuffer()), contentTypeFor(key));
			} else {
				return fail(400, { message: `${file.name}: só imagens (JPG, PNG, GIF, WebP) ou PDF.` });
			}
		}
		done(cookies, url.pathname + url.search, `${files.length} ficheiro(s) enviado(s).`);
	},

	delete: async ({ request, url, cookies }) => {
		requirePermission('browse_media');
		const key = String((await request.formData()).get('key') ?? '');
		if (!isSafeKey(key)) return fail(400, { message: 'Ficheiro inválido.' });
		await deleteFile(key);
		done(cookies, url.pathname + url.search, 'Ficheiro apagado.');
	}
};
