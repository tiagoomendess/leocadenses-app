import { resolve } from '$app/paths';
import { can } from '#lib/auth/permissions.ts';
import { done, failed } from '#lib/server/admin/crud.ts';
import {
	applicationForMember,
	deleteApplication,
	documentTypeList,
	nextMemberNumber,
	saveMember
} from '#lib/server/admin/members.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import { tryGenerateCard } from '#lib/server/members/card-service.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const user = requirePermission('add_members');
	// "Converter em sócio" from a membership application pre-fills the form.
	const applicationId = Number(url.searchParams.get('application')) || null;
	const application =
		applicationId && can(user.permissions, 'read_member_application')
			? await applicationForMember(applicationId)
			: null;
	const [documentTypes, number] = await Promise.all([documentTypeList(), nextMemberNumber()]);
	return {
		documentTypes,
		applicationId: application?.id ?? null,
		member: {
			number,
			name: application?.name ?? '',
			phone: application?.phone ?? null,
			email: application?.email ?? null,
			documentTypeId: application?.documentTypeId ?? documentTypes[0]?.id ?? 1,
			document: application?.document ?? '',
			address: application?.address ?? null,
			notes: null,
			generateCard: true
		}
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = requirePermission('add_members');
		const result = await saveMember(await request.formData(), null);
		if (!result.ok) return failed(result);

		if (result.applicationId && can(user.permissions, 'delete_member_application')) {
			await deleteApplication(result.applicationId);
		}
		const href = resolve('/admin/(app)/members/[id=id]', { id: result.id });
		if (result.generateCard && !(await tryGenerateCard(result.id))) {
			done(
				cookies,
				href,
				'Sócio criado, mas o cartão não foi gerado. Use “Regenerar cartão”.',
				'error'
			);
		}
		done(cookies, href, `Sócio “${result.name}” criado.`);
	}
};
