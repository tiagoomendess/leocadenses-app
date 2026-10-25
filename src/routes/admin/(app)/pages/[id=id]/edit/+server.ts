import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { RequestHandler } from './$types';

/** Voyager's edit URL: the record page is the edit form now. */
export const GET: RequestHandler = ({ params }) =>
	redirect(301, resolve('/admin/(app)/pages/[id=id]', { id: params.id }));
