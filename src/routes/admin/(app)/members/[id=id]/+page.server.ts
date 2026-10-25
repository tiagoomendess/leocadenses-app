import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { can } from '#lib/auth/permissions.ts';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import {
	addMemberPayment,
	cardImageUrl,
	deleteMember,
	documentTypeList,
	findMember,
	memberQuotas,
	memberStatus,
	removeMemberPayment,
	restoreMember,
	saveMember
} from '#lib/server/admin/members.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { cardUrl, generateCard, tryGenerateCard } from '#lib/server/members/card-service.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const user = requirePermission('read_members');
	const member = orNotFound(await findMember(params.id));
	const [documentTypes, quotas, upToDate] = await Promise.all([
		documentTypeList(),
		can(user.permissions, 'browse_quota_payments') || can(user.permissions, 'add_quota_payments')
			? memberQuotas(member.id)
			: Promise.resolve(null),
		memberStatus(member)
	]);
	return {
		member,
		documentTypes,
		quotas,
		upToDate,
		card: member.card
			? {
					image: cardImageUrl(member.card) ?? '',
					checkUrl: member.cardToken ? cardUrl(member.cardToken) : null,
					printed: member.cardPrinted
				}
			: null
	};
};

const memberHref = (id: number) => resolve('/admin/(app)/members/[id=id]', { id });

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_members');
		const member = orNotFound(await findMember(params.id));
		const result = await saveMember(await request.formData(), member);
		if (!result.ok) return failed(result);
		if (result.generateCard && !(await tryGenerateCard(member.id))) {
			done(
				cookies,
				memberHref(member.id),
				'Dados guardados, mas o cartão não foi gerado.',
				'error'
			);
		}
		done(cookies, memberHref(member.id), `Sócio “${result.name}” guardado.`);
	},

	regenerateCard: async ({ params, cookies }) => {
		requirePermission('edit_members');
		const member = orNotFound(await findMember(params.id));
		await generateCard(member.id);
		done(cookies, memberHref(member.id), 'Cartão gerado. O anterior deixou de ser válido.');
	},

	addPayment: async ({ params, request, cookies }) => {
		requirePermission('add_quota_payments');
		const member = orNotFound(await findMember(params.id));
		const { error } = await addMemberPayment(member.id, await request.formData());
		if (error) return fail(400, { message: error });
		done(cookies, memberHref(member.id), 'Pagamento registado.');
	},

	removePayment: async ({ params, request, cookies }) => {
		requirePermission('delete_quota_payments');
		const member = orNotFound(await findMember(params.id));
		const paymentId = Number((await request.formData()).get('payment_id'));
		if (!Number.isInteger(paymentId) || paymentId <= 0)
			return fail(400, { message: 'Pagamento inválido.' });
		await removeMemberPayment(member.id, paymentId);
		done(cookies, memberHref(member.id), 'Pagamento removido.');
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_members');
		const member = orNotFound(await findMember(params.id));
		await deleteMember(member.id);
		done(cookies, resolve('/admin/(app)/members'), `Sócio “${member.name}” apagado.`);
	},

	restore: async ({ params, cookies }) => {
		requirePermission('delete_members');
		const member = orNotFound(await findMember(params.id));
		await restoreMember(member.id);
		done(cookies, memberHref(member.id), `Sócio “${member.name}” recuperado.`);
	}
};
