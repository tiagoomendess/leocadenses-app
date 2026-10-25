import { error } from '@sveltejs/kit';
import { publishedPosts } from '#lib/server/content.ts';
import type { PageServerLoad } from './$types';

/** 19 posts at the time of the port: 6 per page keeps the indexed `?page=2..4` links valid. */
const PER_PAGE = 6;

export const load: PageServerLoad = async ({ url }) => {
	// Like Laravel's paginator, anything that is not a positive number is page 1.
	const requested = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

	const result = await publishedPosts(page, PER_PAGE);
	if (page > result.lastPage) error(404, 'Not found');

	return { ...result, page };
};
