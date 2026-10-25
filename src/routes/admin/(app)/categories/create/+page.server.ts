import { resolve } from '$app/paths';
import { categoryOptions, saveCategory } from '#lib/server/admin/categories.ts';
import { done, failed } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('add_categories');
	return { parents: await categoryOptions() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('add_categories');
		const result = await saveCategory(await request.formData(), null);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/categories'), `Categoria “${result.name}” criada.`);
	}
};
