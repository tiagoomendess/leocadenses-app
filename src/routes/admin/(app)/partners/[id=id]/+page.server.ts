import { resolve } from '$app/paths';
import { done, guardedDelete, orNotFound, failed } from '#lib/server/admin/crud.ts';
import { deletePartner, findPartner, savePartner } from '#lib/server/admin/partners.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_partners');
	const partner = orNotFound(await findPartner(params.id));
	return { partner, picture: mediaUrl(partner.picture) };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_partners');
		const partner = orNotFound(await findPartner(params.id));
		const result = await savePartner(await request.formData(), partner);
		if (!result.ok) return failed(result);
		done(
			cookies,
			resolve('/admin/(app)/partners/[id=id]', { id: partner.id }),
			`Parceiro “${result.name}” guardado.`
		);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_partners');
		const partner = orNotFound(await findPartner(params.id));
		const failure = await guardedDelete(() => deletePartner(partner));
		if (failure) return failure;
		done(cookies, resolve('/admin/(app)/partners'), `Parceiro “${partner.name}” apagado.`);
	}
};
