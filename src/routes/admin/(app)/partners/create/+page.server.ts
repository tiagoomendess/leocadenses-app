import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { savePartner } from '#lib/server/admin/partners.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	requirePermission('add_partners');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('add_partners');
		const result = await savePartner(await request.formData(), null);
		if (!result.ok) return failed(result);
		done(
			cookies,
			resolve('/admin/(app)/partners/[id=id]', { id: result.id }),
			`Parceiro “${result.name}” criado.`
		);
	}
};
