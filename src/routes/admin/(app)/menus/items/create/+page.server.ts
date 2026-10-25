import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { saveMenuItem, topLevelItems } from '#lib/server/admin/menu.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('add_menus');
	return { parents: await topLevelItems() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('add_menus');
		const result = await saveMenuItem(await request.formData(), null);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/menus'), `Item “${result.title}” criado.`);
	}
};
