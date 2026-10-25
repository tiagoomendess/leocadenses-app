import { listApplications } from '#lib/server/admin/applications.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_member_application');
	return listApplications(url);
};
