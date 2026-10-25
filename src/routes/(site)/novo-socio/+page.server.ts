import { fail } from '@sveltejs/kit';
import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';
import { m } from '#lib/paraglide/messages.js';
import {
	ApplicationForm,
	documentTypeExists,
	documentTypeOptions,
	emailDomainReceivesMail,
	saveApplication
} from '#lib/server/applications.ts';
import { clientIp } from '#lib/server/client-ip.ts';
import { pageBlock } from '#lib/server/content.ts';
import { parseForm } from '#lib/server/forms.ts';
import { createRateLimiter } from '#lib/server/rate-limit.ts';
import { verifyTurnstile } from '#lib/server/turnstile.ts';
import type { Actions, PageServerLoad } from './$types';

/** Same cookie as the old site (`member_application_submitted`, 10080 minutes). */
const SUBMITTED_COOKIE = 'member_application_submitted';
const SUBMITTED_MAX_AGE = 7 * 24 * 60 * 60;

/** A handful of applications per hour per address is plenty for a family. */
const limiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5 });

export const load: PageServerLoad = async ({ cookies }) => {
	const [body, documentTypes] = await Promise.all([
		pageBlock('member-application'),
		documentTypeOptions()
	]);
	return {
		body,
		documentTypes,
		submitted: Boolean(cookies.get(SUBMITTED_COOKIE)),
		turnstileSiteKey: PUBLIC_TURNSTILE_SITE_KEY
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = clientIp(getClientAddress);
		const formData = await request.formData();
		const form = parseForm(ApplicationForm, formData);
		const values = form.values;

		if (limiter.isLimited(ip)) {
			return fail(429, { errors: {}, values, message: m.member_throttled() });
		}
		if (!(await verifyTurnstile(formData.get('cf-turnstile-response'), ip))) {
			return fail(400, { errors: {}, values, message: m.member_captcha_failed() });
		}
		if (!form.success) {
			return fail(400, { errors: form.errors, values, message: m.member_error() });
		}

		const errors: Record<string, string[]> = {};
		if (!(await documentTypeExists(form.data.document_type))) {
			errors.document_type = [m.validation_invalid()];
		}
		if (!(await emailDomainReceivesMail(form.data.email))) {
			errors.email = [m.member_email_domain()];
		}
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values, message: m.member_error() });
		}

		limiter.record(ip);
		await saveApplication(form.data);
		cookies.set(SUBMITTED_COOKIE, '1', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: SUBMITTED_MAX_AGE
		});
		return { submitted: true };
	}
};
