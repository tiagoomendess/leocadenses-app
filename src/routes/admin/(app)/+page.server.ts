import { can } from '#lib/auth/permissions.ts';
import { dashboardCounts } from '#lib/server/admin/dashboard.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const user = requirePermission('browse_admin');
	// Member numbers are only for those who can see members.
	const counts = can(user.permissions, 'browse_members') ? await dashboardCounts() : null;
	return { counts };
};
