import { siteMenuTree } from '#lib/server/admin/menu.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('browse_menus');
	return { tree: await siteMenuTree() };
};
