import { listQuotas } from '#lib/server/admin/quotas.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_quotas');
	return listQuotas(url);
};
