import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { saveQuota } from '#lib/server/admin/quotas.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	requirePermission('add_quotas');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('add_quotas');
		const result = await saveQuota(await request.formData(), null);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/quotas'), `Quota ${result.name} criada.`);
	}
};
