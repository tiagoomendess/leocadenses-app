import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { safeRedirectPath } from '#lib/server/auth/redirect.ts';
import { startSession } from '#lib/server/auth/session.ts';
import {
	clearLoginFailures,
	isLoginThrottled,
	recordLoginFailure,
	throttleKey
} from '#lib/server/auth/throttle.ts';
import { attemptLogin } from '#lib/server/auth/users.ts';
import { clientIp } from '#lib/server/client-ip.ts';
import { checkbox, parseForm } from '#lib/server/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
	if (locals.user) redirect(303, redirectTo);
	return { redirectTo };
};

const LoginForm = z.object({
	email: z.string().trim().min(1).max(191),
	password: z.string().min(1).max(255),
	remember: checkbox,
	redirectTo: z.string().optional()
});

type LoginFailure = {
	email: string;
	reason: 'required' | 'invalid' | 'forbidden' | 'throttled';
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const form = parseForm(LoginForm, await request.formData());
		if (!form.success) {
			return fail(400, {
				email: String(form.values.email ?? ''),
				reason: 'required'
			} satisfies LoginFailure);
		}

		const { email, password, remember } = form.data;
		const key = throttleKey(email, clientIp(getClientAddress));
		if (isLoginThrottled(key)) {
			return fail(429, { email, reason: 'throttled' } satisfies LoginFailure);
		}

		const result = await attemptLogin(email, password);
		if (!result.ok) {
			if (result.reason === 'invalid') recordLoginFailure(key);
			return fail(result.reason === 'forbidden' ? 403 : 400, {
				email,
				reason: result.reason
			} satisfies LoginFailure);
		}

		clearLoginFailures(key);
		await startSession(
			cookies,
			{ id: result.user.id, passwordHash: result.passwordHash },
			remember
		);
		redirect(303, safeRedirectPath(form.data.redirectTo));
	}
};
