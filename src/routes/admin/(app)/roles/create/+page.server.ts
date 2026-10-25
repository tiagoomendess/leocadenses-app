import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { permissionGroups, saveRole } from '#lib/server/admin/users.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('add_roles');
	return { groups: await permissionGroups() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('add_roles');
		const result = await saveRole(await request.formData(), null);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/roles'), `Função “${result.name}” criada.`);
	}
};
