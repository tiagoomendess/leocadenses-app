import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import type { RequestHandler } from './$types';

/** Liveness check for scripts/deploy.sh and monitoring: the app answers and the database too. */
export const GET: RequestHandler = async () => {
	try {
		await db.execute(sql`select 1`);
		return new Response('ok', { headers: { 'cache-control': 'no-store' } });
	} catch {
		return new Response('database unavailable', {
			status: 503,
			headers: { 'cache-control': 'no-store' }
		});
	}
};
