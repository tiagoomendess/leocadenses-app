import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { roleOptions, saveUser } from '#lib/server/admin/users.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('add_users');
	return { roles: await roleOptions() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = requirePermission('add_users');
		const result = await saveUser(await request.formData(), null, user.id);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/users'), `Utilizador “${result.name}” criado.`);
	}
};
