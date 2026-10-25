export const LOGIN_PATH = '/admin/login';
export const ADMIN_HOME = '/admin';

/**
 * Only same-origin, absolute paths are allowed after login (`/admin/members?page=2`), never
 * `//evil.example` or `/\evil.example`, which browsers treat as other origins.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = ADMIN_HOME): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
		return fallback;
	}
	try {
		const url = new URL(value, 'http://localhost');
		if (url.origin !== 'http://localhost') return fallback;
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
}

export function loginUrl(redirectTo: string) {
	const target = safeRedirectPath(redirectTo, ADMIN_HOME);
	return target === ADMIN_HOME
		? LOGIN_PATH
		: `${LOGIN_PATH}?redirectTo=${encodeURIComponent(target)}`;
}
