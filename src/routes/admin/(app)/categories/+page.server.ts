import { listCategories } from '#lib/server/admin/categories.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_categories');
	return listCategories(url);
};
