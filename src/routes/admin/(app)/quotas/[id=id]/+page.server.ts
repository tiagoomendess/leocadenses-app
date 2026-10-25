import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import { deleteQuota, findQuota, quotaPaymentCount, saveQuota } from '#lib/server/admin/quotas.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_quotas');
	const quota = orNotFound(await findQuota(params.id));
	return { quota, payments: await quotaPaymentCount(quota.id) };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_quotas');
		const quota = orNotFound(await findQuota(params.id));
		const result = await saveQuota(await request.formData(), quota);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/quotas'), `Quota ${result.name} guardada.`);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_quotas');
		const quota = orNotFound(await findQuota(params.id));
		const payments = await quotaPaymentCount(quota.id);
		if (payments > 0) {
			return fail(409, {
				message: `Esta quota tem ${payments} pagamento(s). Apague-os primeiro para não deixar pagamentos soltos.`
			});
		}
		await deleteQuota(quota.id);
		done(cookies, resolve('/admin/(app)/quotas'), `Quota ${quota.name} apagada.`);
	}
};
