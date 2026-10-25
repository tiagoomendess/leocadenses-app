import { resolve } from '$app/paths';
import { categoryOptions } from '#lib/server/admin/categories.ts';
import { savePost } from '#lib/server/admin/content.ts';
import { done, failed } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('add_posts');
	return { categories: await categoryOptions() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = requirePermission('add_posts');
		const result = await savePost(await request.formData(), null, user.id);
		if (!result.ok) return failed(result);
		done(
			cookies,
			resolve('/admin/(app)/posts/[id=id]', { id: result.id }),
			`Notícia “${result.title}” criada.`
		);
	}
};
