import { listPartners } from '#lib/server/admin/partners.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_partners');
	return listPartners(url);
};
