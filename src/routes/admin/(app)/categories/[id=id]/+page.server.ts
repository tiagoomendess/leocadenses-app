import { resolve } from '$app/paths';
import {
	categoryOptions,
	deleteCategory,
	findCategory,
	saveCategory
} from '#lib/server/admin/categories.ts';
import { done, failed, guardedDelete, orNotFound } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_categories');
	const category = orNotFound(await findCategory(params.id));
	const parents = (await categoryOptions()).filter((option) => option.id !== category.id);
	return { category, parents };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_categories');
		const category = orNotFound(await findCategory(params.id));
		const result = await saveCategory(await request.formData(), category);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/categories'), `Categoria “${result.name}” guardada.`);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_categories');
		const category = orNotFound(await findCategory(params.id));
		const failure = await guardedDelete(() => deleteCategory(category.id));
		if (failure) return failure;
		done(cookies, resolve('/admin/(app)/categories'), `Categoria “${category.name}” apagada.`);
	}
};
