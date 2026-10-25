import { error, redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { ADMIN_ACCESS_PERMISSION, can } from '#lib/auth/permissions.ts';
import { adminLocale, ADMIN_LOCALE_STRATEGY, isAdminPath } from '#lib/i18n.ts';
import { defineCustomServerStrategy, getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { LOGIN_PATH, loginUrl } from '#lib/server/auth/redirect.ts';
import {
	endSession,
	readSession,
	refreshSession,
	sessionMatchesPassword
} from '#lib/server/auth/session.ts';
import { loadSessionUser } from '#lib/server/auth/users.ts';
import { optOutOfRocketLoader } from '#lib/server/cloudflare.ts';

defineCustomServerStrategy(ADMIN_LOCALE_STRATEGY, {
	getLocale: (request) => (request ? adminLocale(new URL(request.url).pathname) : undefined)
});

/** Pages search engines must not index: the backoffice and member-card checks. */
function isPrivatePath(pathname: string): boolean {
	return isAdminPath(pathname) || pathname.startsWith('/c/');
}

const handleLocale: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) =>
		resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					optOutOfRocketLoader(
						html
							.replace('%paraglide.lang%', locale)
							.replace('%paraglide.dir%', getTextDirection(locale))
							.replace('%theme.class%', event.cookies.get('theme') === 'dark' ? 'dark' : '')
					)
			}
		)
	);

const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const session = await readSession(event.cookies);
	if (session) {
		const loaded = await loadSessionUser(session.u);
		if (loaded && (await sessionMatchesPassword(session, loaded.passwordHash))) {
			event.locals.user = loaded.user;
			await refreshSession(event.cookies, session);
		} else {
			// Deleted account or changed password.
			endSession(event.cookies);
		}
	}

	const { pathname } = event.url;
	if (isAdminPath(pathname) && pathname !== LOGIN_PATH) {
		const user = event.locals.user;
		// Thrown (not returned) so SvelteKit formats it for page loads, data requests and
		// enhanced form submissions alike.
		if (!user) redirect(303, loginUrl(pathname + event.url.search));
		if (!can(user.permissions, ADMIN_ACCESS_PERMISSION)) {
			error(403, 'Esta conta não tem acesso à administração.');
		}
	}

	return resolve(event);
};

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	// CSP (incl. frame-ancestors) is configured in vite.config.ts. Redirects have immutable headers.
	if (response.status >= 300 && response.status < 400) return response;
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), payment=(), geolocation=()'
	);
	if (isPrivatePath(event.url.pathname)) {
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	}
	// Pages rendered for a signed-in user may show private data (previews, member details).
	if (event.locals.user && !response.headers.has('cache-control')) {
		response.headers.set('Cache-Control', 'private, no-store');
	}
	return response;
};

export const handle = sequence(handleSecurityHeaders, handleLocale, handleAuth);
