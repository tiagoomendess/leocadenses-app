import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { ADMIN_ACCESS_PERMISSION } from '#lib/auth/permissions.ts';
import { done, failed, guardedDelete, orNotFound } from '#lib/server/admin/crud.ts';
import { deleteRole, findRole, permissionGroups, saveRole } from '#lib/server/admin/users.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { currentPermissionKeys } from '#lib/server/auth/users.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_roles');
	const role = orNotFound(await findRole(params.id));
	return { role, groups: await permissionGroups() };
};

/** The role as it was, to put back a change that would lock its editor out. */
function rolePayload(role: { name: string; displayName: string; permissionIds: number[] }) {
	const data = new FormData();
	data.set('name', role.name);
	data.set('display_name', role.displayName);
	for (const id of role.permissionIds) data.append('permissions', String(id));
	return data;
}

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		const user = requirePermission('edit_roles');
		const role = orNotFound(await findRole(params.id));
		const result = await saveRole(await request.formData(), role);
		if (!result.ok) return failed(result);

		if (!(await currentPermissionKeys(user.id)).includes(ADMIN_ACCESS_PERMISSION)) {
			await saveRole(rolePayload(role), role);
			return fail(409, {
				message: 'Esta alteração tirava-lhe o acesso à administração, por isso não foi guardada.'
			});
		}
		done(cookies, resolve('/admin/(app)/roles'), `Função “${result.name}” guardada.`);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_roles');
		const role = orNotFound(await findRole(params.id));
		const failure = await guardedDelete(() => deleteRole(role.id));
		if (failure) {
			return fail(409, {
				message: 'Há utilizadores com esta função. Mude-lhes a função primeiro.'
			});
		}
		done(cookies, resolve('/admin/(app)/roles'), `Função “${role.displayName}” apagada.`);
	}
};
