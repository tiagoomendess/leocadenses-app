import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import {
	deletePage,
	findPage,
	isSystemPage,
	pageFormValues,
	savePage
} from '#lib/server/admin/content.ts';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { clearSettingsCache } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_pages');
	const page = orNotFound(await findPage(params.id));
	return { page: pageFormValues(page), system: isSystemPage(page.slug) };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		const user = requirePermission('edit_pages');
		const page = orNotFound(await findPage(params.id));
		const result = await savePage(await request.formData(), page, user.id);
		if (!result.ok) return failed(result);
		clearSettingsCache();
		done(
			cookies,
			resolve('/admin/(app)/pages/[id=id]', { id: page.id }),
			`Página “${result.title}” guardada.`
		);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_pages');
		const page = orNotFound(await findPage(params.id));
		if (isSystemPage(page.slug)) {
			return fail(409, { message: 'Esta página faz parte do site e não pode ser apagada.' });
		}
		await deletePage(page);
		done(cookies, resolve('/admin/(app)/pages'), `Página “${page.title}” apagada.`);
	}
};
