import { eq, inArray, sql } from 'drizzle-orm';
import { ADMIN_ACCESS_PERMISSION, can } from '#lib/auth/permissions.ts';
import type { SessionUser } from '#lib/auth/user.ts';
import { db } from '#lib/server/db/index.ts';
import { permissionRole, permissions, userRoles, users } from '#lib/server/db/schema.ts';
import { verifyPassword } from './password';

type UserRow = {
	id: number;
	roleId: number | null;
	name: string;
	email: string;
	avatar: string | null;
	password: string;
};

const userColumns = {
	id: users.id,
	roleId: users.roleId,
	name: users.name,
	email: users.email,
	avatar: users.avatar,
	password: users.password
};

/**
 * Ports Voyager's `User::hasPermission`: the keys of the user's main role (`users.role_id`) plus
 * those of every extra role in `user_roles`.
 */
export async function permissionKeys(userId: number, roleId: number | null): Promise<string[]> {
	const extra = await db
		.select({ roleId: userRoles.roleId })
		.from(userRoles)
		.where(eq(userRoles.userId, userId));
	const roleIds = [...new Set([roleId, ...extra.map((row) => row.roleId)])].filter(
		(id): id is number => id !== null
	);
	if (roleIds.length === 0) return [];

	const rows = await db
		.selectDistinct({ key: permissions.key })
		.from(permissionRole)
		.innerJoin(permissions, eq(permissionRole.permissionId, permissions.id))
		.where(inArray(permissionRole.roleId, roleIds));
	return rows.map((row) => row.key).sort();
}

/** A user's permission keys read fresh from the database (after editing roles). */
export async function currentPermissionKeys(userId: number): Promise<string[]> {
	const [row] = await db
		.select({ roleId: users.roleId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return row ? permissionKeys(userId, row.roleId) : [];
}

async function toSessionUser(row: UserRow) {
	const user: SessionUser = {
		id: row.id,
		name: row.name.trim() || row.email.split('@')[0],
		email: row.email,
		avatar: row.avatar,
		permissions: await permissionKeys(row.id, row.roleId)
	};
	return { user, passwordHash: row.password };
}

/** The user behind a session. Re-read on every request so revoked roles take effect at once. */
export async function loadSessionUser(userId: number) {
	const [row] = await db.select(userColumns).from(users).where(eq(users.id, userId)).limit(1);
	return row ? toSessionUser(row) : null;
}

export type LoginResult =
	| { ok: true; user: SessionUser; passwordHash: string }
	| { ok: false; reason: 'invalid' | 'forbidden' };

/**
 * Checks an email and password against the Laravel `users` table. Unknown email and wrong
 * password give the same answer; a valid account without `browse_admin` is told it has no
 * access (Voyager let it in and sent it back to the site).
 */
export async function attemptLogin(email: string, password: string): Promise<LoginResult> {
	const normalized = email.trim().toLowerCase();
	if (!normalized || !password) return { ok: false, reason: 'invalid' };

	const [row] = await db
		.select(userColumns)
		.from(users)
		.where(sql`LOWER(${users.email}) = ${normalized}`)
		.limit(1);

	if (!row || !(await verifyPassword(password, row.password))) {
		return { ok: false, reason: 'invalid' };
	}

	const session = await toSessionUser(row);
	if (!can(session.user.permissions, ADMIN_ACCESS_PERMISSION)) {
		return { ok: false, reason: 'forbidden' };
	}
	return { ok: true, ...session };
}
