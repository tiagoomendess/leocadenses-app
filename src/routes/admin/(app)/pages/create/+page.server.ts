import { resolve } from '$app/paths';
import { savePage } from '#lib/server/admin/content.ts';
import { done, failed } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	requirePermission('add_pages');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = requirePermission('add_pages');
		const result = await savePage(await request.formData(), null, user.id);
		if (!result.ok) return failed(result);
		done(
			cookies,
			resolve('/admin/(app)/pages/[id=id]', { id: result.id }),
			`Página “${result.title}” criada.`
		);
	}
};
