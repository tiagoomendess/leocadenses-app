import { error, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { can, type Permission } from '#lib/auth/permissions.ts';
import type { SessionUser } from '#lib/auth/user.ts';
import { loginUrl } from './redirect';

/** The signed-in user. `hooks.server.ts` already sends anonymous /admin requests to the login. */
export function requireUser(): SessionUser {
	const event = getRequestEvent();
	const user = event.locals.user;
	if (!user) redirect(303, loginUrl(event.url.pathname + event.url.search));
	return user;
}

/**
 * Call at the top of every load, form action and endpoint that reads or writes an entity
 * (`requirePermission('edit_members')`). Layout loads alone do not protect actions or nested
 * loads, so each one checks for itself.
 */
export function requirePermission(permission: Permission): SessionUser {
	const user = requireUser();
	if (!can(user.permissions, permission)) error(403, 'Sem permissão');
	return user;
}

/** Passes with any one of `permissions` (data several sections need). */
export function requireAnyPermission(permissions: readonly Permission[]): SessionUser {
	const user = requireUser();
	if (!permissions.some((permission) => can(user.permissions, permission))) {
		error(403, 'Sem permissão');
	}
	return user;
}

/** Whether the current request's user holds `permission` (for optional extras on public pages). */
export function userCan(permission: Permission): boolean {
	return can(getRequestEvent().locals.user?.permissions, permission);
}
