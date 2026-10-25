import { listPosts } from '#lib/server/admin/content.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_posts');
	return listPosts(url);
};
