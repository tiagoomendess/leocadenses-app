import { userCan } from '#lib/server/auth/guard.ts';
import { checkCard } from '#lib/server/members/cards.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const card = await checkCard(params.token);
	// Every scan must reach the server (the first one marks the card as printed).
	setHeaders({ 'cache-control': 'private, no-store' });

	const canBrowse = userCan('browse_members');
	if (!card.valid) {
		return { valid: false as const, editId: userCan('edit_members') ? card.memberId : null };
	}
	return {
		valid: true as const,
		number: card.number,
		paidQuotas: card.paidQuotas,
		upToDate: card.upToDate,
		// Personal data only for users who could see it in the backoffice (Voyager's @can).
		details: canBrowse ? { name: card.name, phone: card.phone, email: card.email } : null,
		editId: userCan('edit_members') ? card.memberId : null
	};
};
