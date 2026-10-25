import { TURNSTILE_SECRET_KEY } from '$app/env/private';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Checks a Cloudflare Turnstile token (the `cf-turnstile-response` field the widget adds to the
 * form). Without a secret key (local development) the check is skipped.
 */
export async function verifyTurnstile(
	token: FormDataEntryValue | null,
	remoteIp: string
): Promise<boolean> {
	if (!TURNSTILE_SECRET_KEY) return true;
	if (typeof token !== 'string' || !token) return false;
	try {
		const response = await fetch(VERIFY_URL, {
			method: 'POST',
			body: new URLSearchParams({
				secret: TURNSTILE_SECRET_KEY,
				response: token,
				...(remoteIp !== 'unknown' ? { remoteip: remoteIp } : {})
			}),
			signal: AbortSignal.timeout(10_000)
		});
		const result = (await response.json()) as { success?: boolean };
		return result.success === true;
	} catch (error) {
		console.error('turnstile: verification failed', error);
		return false;
	}
}
