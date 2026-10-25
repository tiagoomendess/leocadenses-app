import { resolve } from '$app/paths';
import { categoryOptions } from '#lib/server/admin/categories.ts';
import { deletePost, findPost, postFormValues, savePost } from '#lib/server/admin/content.ts';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_posts');
	const post = orNotFound(await findPost(params.id));
	return { post: postFormValues(post), categories: await categoryOptions() };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		const user = requirePermission('edit_posts');
		const post = orNotFound(await findPost(params.id));
		const result = await savePost(await request.formData(), post, user.id);
		if (!result.ok) return failed(result);
		done(
			cookies,
			resolve('/admin/(app)/posts/[id=id]', { id: post.id }),
			`Notícia “${result.title}” guardada.`
		);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_posts');
		const post = orNotFound(await findPost(params.id));
		await deletePost(post);
		done(cookies, resolve('/admin/(app)/posts'), `Notícia “${post.title}” apagada.`);
	}
};
