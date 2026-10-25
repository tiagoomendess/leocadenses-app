import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { findMember } from '#lib/server/admin/members.ts';
import { memberOption, quotaOptions, savePayment } from '#lib/server/admin/payments.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('add_quota_payments');
	const memberId = Number(url.searchParams.get('member')) || null;
	const member = memberId ? await findMember(memberId) : null;
	return { quotas: await quotaOptions(), member: member ? memberOption(member) : null };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('add_quota_payments');
		const result = await savePayment(await request.formData(), null);
		if (!result.ok) return failed(result);
		done(cookies, resolve('/admin/(app)/quota-payments'), 'Pagamento registado.');
	}
};
