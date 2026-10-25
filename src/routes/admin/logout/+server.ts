import { redirect } from '@sveltejs/kit';
import { endSession } from '#lib/server/auth/session.ts';
import { LOGIN_PATH } from '#lib/server/auth/redirect.ts';
import type { RequestHandler } from './$types';

// POST only (SvelteKit checks the Origin of form posts), so a link or image can't sign you out.
export const POST: RequestHandler = ({ cookies }) => {
	endSession(cookies);
	redirect(303, LOGIN_PATH);
};
