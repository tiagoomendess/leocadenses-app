import { json } from '@sveltejs/kit';
import { searchMemberOptions } from '#lib/server/admin/members.ts';
import { memberOption } from '#lib/server/admin/payments.ts';
import { requireAnyPermission } from '#lib/server/auth/guard.ts';
import { parseOptionsQuery, toOptionsPage } from '#lib/server/options.ts';
import type { RequestHandler } from './$types';

/** Member select of the payment form: by number or name. */
export const GET: RequestHandler = async ({ url }) => {
	requireAnyPermission(['add_quota_payments', 'edit_quota_payments']);
	const query = parseOptionsQuery(url);
	const rows = await searchMemberOptions(query.q, query.limit, query.offset);
	return json(toOptionsPage(rows, memberOption));
};
