/**
 * Voyager's permission keys (`permissions` table, granted to roles through `permission_role`).
 * Each BREAD table has `browse_` (list), `read_` (view), `edit_`, `add_` and `delete_` keys.
 * `browse_admin` is required to enter the backoffice at all; `browse_media` opens the media
 * library. Unlike domingoasdez there is no wildcard: the admin role simply holds every key.
 */
export const ACTIONS = ['browse', 'read', 'edit', 'add', 'delete'] as const;

export const TABLES = [
	'menus',
	'roles',
	'users',
	'settings',
	'categories',
	'posts',
	'pages',
	'members',
	'quotas',
	'quota_payments',
	'member_application',
	'partners'
] as const;

export type Action = (typeof ACTIONS)[number];
export type Table = (typeof TABLES)[number];

export type Permission =
	| 'browse_admin'
	| 'browse_media'
	| 'browse_bread'
	| 'browse_database'
	| 'browse_compass'
	| `${Action}_${Table}`;

/** Required to sign in to the backoffice (Voyager's admin middleware). */
export const ADMIN_ACCESS_PERMISSION: Permission = 'browse_admin';

/** Ports Voyager's `$user->hasPermission($key)`: an exact match among the granted keys. */
export function can(granted: Iterable<string> | null | undefined, permission: Permission): boolean {
	if (!granted) return false;
	const keys = granted instanceof Set ? (granted as Set<string>) : new Set(granted);
	return keys.has(permission);
}
