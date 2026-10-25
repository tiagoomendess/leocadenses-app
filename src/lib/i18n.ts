/**
 * Locale rules shared by the server and client hooks.
 *
 * The public site follows the visitor's language (cookie, then browser, then pt-PT). The
 * backoffice is Portuguese only: the `custom-admin` strategy (first in vite.config.ts) answers
 * pt-PT for every /admin URL, so messages shared with the site (form validation) are Portuguese
 * there too.
 */
import { baseLocale } from '#lib/paraglide/runtime.js';

export const ADMIN_LOCALE_STRATEGY = 'custom-admin';

export function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

/** The locale forced on `pathname`, or undefined to let the next strategy decide. */
export function adminLocale(pathname: string) {
	return isAdminPath(pathname) ? baseLocale : undefined;
}
