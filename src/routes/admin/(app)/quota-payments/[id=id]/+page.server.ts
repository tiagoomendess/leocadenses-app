import { resolve } from '$app/paths';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import {
	deletePayment,
	findPayment,
	memberOption,
	quotaOptions,
	savePayment
} from '#lib/server/admin/payments.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_quota_payments');
	const payment = orNotFound(await findPayment(params.id));
	return {
		payment,
		member:
			payment.memberNumber !== null && payment.memberName !== null
				? memberOption({
						id: payment.memberId,
						number: payment.memberNumber,
						name: payment.memberName
					})
				: null,
		quotas: await quotaOptions()
	};
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_quota_payments');
		const payment = orNotFound(await findPayment(params.id));
		const result = await savePayment(await request.formData(), payment);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/quota-payments'), `Pagamento #${payment.id} guardado.`);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_quota_payments');
		const payment = orNotFound(await findPayment(params.id));
		await deletePayment(payment.id);
		done(cookies, resolve('/admin/(app)/quota-payments'), `Pagamento #${payment.id} apagado.`);
	}
};
