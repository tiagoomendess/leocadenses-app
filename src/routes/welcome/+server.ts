import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Laravel's default welcome page was still routed on the old site. */
export const GET: RequestHandler = () => redirect(301, '/');
