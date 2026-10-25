import { listMembers } from '#lib/server/admin/members.ts';
import { done } from '#lib/server/admin/crud.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { setFlash } from '#lib/server/flash.ts';
import { generatePendingCards } from '#lib/server/members/card-service.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	requirePermission('browse_members');
	return listMembers(url);
};

export const actions: Actions = {
	/** What the old cron did every five minutes, on demand. */
	generateCards: async ({ cookies, url }) => {
		requirePermission('edit_members');
		const { generated, failed } = await generatePendingCards();
		if (failed > 0) {
			setFlash(cookies, {
				type: 'error',
				message: `${generated} cartão(ões) gerado(s), ${failed} falhou(aram). Veja os registos do servidor.`
			});
			return;
		}
		done(cookies, url.pathname + url.search, `${generated} cartão(ões) gerado(s).`);
	}
};
