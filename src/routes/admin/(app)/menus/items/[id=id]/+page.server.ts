import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import {
	deleteMenuItem,
	findMenuItem,
	hasChildren,
	saveMenuItem,
	topLevelItems
} from '#lib/server/admin/menu.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_menus');
	const item = orNotFound(await findMenuItem(params.id));
	return { item, parents: await topLevelItems(item.id) };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_menus');
		const item = orNotFound(await findMenuItem(params.id));
		const result = await saveMenuItem(await request.formData(), item);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/menus'), `Item “${result.title}” guardado.`);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_menus');
		const item = orNotFound(await findMenuItem(params.id));
		if (await hasChildren(item.id)) {
			return fail(409, {
				message: 'Este item tem sub-itens. Apague-os ou mude-os de sítio primeiro.'
			});
		}
		await deleteMenuItem(item.id);
		done(cookies, resolve('/admin/(app)/menus'), `Item “${item.title}” apagado.`);
	}
};
