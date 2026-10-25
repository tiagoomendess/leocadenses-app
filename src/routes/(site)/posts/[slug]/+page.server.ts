import { error } from '@sveltejs/kit';
import { userCan } from '#lib/server/auth/guard.ts';
import { findPost } from '#lib/server/content.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await findPost(params.slug, userCan('read_posts'));
	if (!post) error(404, 'Not found');
	return { post };
};
