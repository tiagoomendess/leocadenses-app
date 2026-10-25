import { error } from '@sveltejs/kit';
import { userCan } from '#lib/server/auth/guard.ts';
import { findPage } from '#lib/server/content.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const page = await findPage(params.slug, userCan('read_pages'));
	if (!page) error(404, 'Not found');
	return { page };
};
