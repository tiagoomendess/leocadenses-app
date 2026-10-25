import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { done, failed, guardedDelete, orNotFound } from '#lib/server/admin/crud.ts';
import { deleteUser, findUser, roleOptions, saveUser } from '#lib/server/admin/users.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_users');
	const user = orNotFound(await findUser(params.id));
	return {
		account: {
			id: user.id,
			name: user.name,
			email: user.email,
			roleId: user.roleId,
			extraRoleIds: user.extraRoleIds
		},
		avatarUrl: mediaUrl(user.avatar),
		roles: await roleOptions()
	};
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		const acting = requirePermission('edit_users');
		const user = orNotFound(await findUser(params.id));
		const result = await saveUser(await request.formData(), user, acting.id);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/users'), `Utilizador “${result.name}” guardado.`);
	},

	delete: async ({ params, cookies }) => {
		const acting = requirePermission('delete_users');
		const user = orNotFound(await findUser(params.id));
		if (user.id === acting.id)
			return fail(409, { message: 'Não pode apagar a sua própria conta.' });
		const failure = await guardedDelete(() => deleteUser(user));
		if (failure) return failure;
		done(cookies, resolve('/admin/(app)/users'), `Utilizador “${user.name}” apagado.`);
	}
};
