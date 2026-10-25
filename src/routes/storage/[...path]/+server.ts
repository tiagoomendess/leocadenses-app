import { error, redirect } from '@sveltejs/kit';
import { keyFromPath, mediaUrl } from '#lib/server/storage/index.ts';
import type { RequestHandler } from './$types';

/**
 * The old site served uploads from /storage/... (Laravel's public disk). They now live in R2
 * behind cdn.leocadenses.pt; old links (post bodies, search engines, shared images) are sent
 * there permanently.
 */
export const GET: RequestHandler = ({ params, setHeaders }) => {
	const key = keyFromPath(params.path);
	const url = key ? mediaUrl(key) : null;
	if (!url) error(404, 'Not found');
	setHeaders({ 'cache-control': 'public, max-age=86400' });
	redirect(301, url, { external: true });
};

export const HEAD = GET;
