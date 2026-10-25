import { resolve } from '$app/paths';
import {
	deleteApplication,
	findApplication,
	saveApplication
} from '#lib/server/admin/applications.ts';
import { done, failed, orNotFound } from '#lib/server/admin/crud.ts';
import { documentTypeList } from '#lib/server/admin/members.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	requirePermission('read_member_application');
	const application = orNotFound(await findApplication(params.id));
	return { application, documentTypes: await documentTypeList() };
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		requirePermission('edit_member_application');
		const application = orNotFound(await findApplication(params.id));
		const result = await saveApplication(await request.formData(), application.id);
		if (!result.ok) return failed(result);
		done(
			cookies,
			resolve('/admin/(app)/member-application/[id=id]', { id: application.id }),
			`Candidatura de “${result.name}” guardada.`
		);
	},

	delete: async ({ params, cookies }) => {
		requirePermission('delete_member_application');
		const application = orNotFound(await findApplication(params.id));
		await deleteApplication(application.id);
		done(
			cookies,
			resolve('/admin/(app)/member-application'),
			`Candidatura de “${application.name}” apagada.`
		);
	}
};
