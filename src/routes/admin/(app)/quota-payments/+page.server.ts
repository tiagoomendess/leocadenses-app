import { listPayments, quotaOptions } from '#lib/server/admin/payments.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_quota_payments');
	const [result, quotas] = await Promise.all([listPayments(url), quotaOptions()]);
	return { ...result, quotas };
};
