import { listRoles } from '#lib/server/admin/users.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('browse_roles');
	const rows = await listRoles();
	return {
		rows: rows.map((row) => ({
			...row,
			users: Number(row.users),
			permissions: Number(row.permissions)
		}))
	};
};
