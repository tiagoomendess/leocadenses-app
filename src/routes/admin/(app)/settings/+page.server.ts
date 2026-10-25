import { fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { done } from '#lib/server/admin/crud.ts';
import { saveSettings, settingGroups } from '#lib/server/admin/settings.ts';
import { requirePermission } from '#lib/server/auth/guard.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requirePermission('browse_settings');
	return { groups: await settingGroups() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		requirePermission('edit_settings');
		const errors = await saveSettings(await request.formData());
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values: {}, message: 'Algumas imagens não foram guardadas.' });
		}
		done(cookies, resolve('/admin/(app)/settings'), 'Definições guardadas.');
	}
};
