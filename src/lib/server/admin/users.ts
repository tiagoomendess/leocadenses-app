import { and, asc, count, eq, inArray, like, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/index.ts';
import { permissionRole, permissions, roles, userRoles, users } from '#lib/server/db/schema.ts';
import { hashPassword, verifyPassword } from '#lib/server/auth/password.ts';
import { parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams
} from '#lib/server/list.ts';
import { IMAGE_LIMITS } from '#lib/server/storage/images.ts';
import { deleteFile, mediaUrl, STORAGE_FOLDERS } from '#lib/server/storage/index.ts';
import { optionalId, requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { imageInput, storeUpload } from './uploads';

const DEFAULT_AVATAR = 'users/default.png';

// ---------------------------------------------------------------------------------------------
// Users

const USER_SORTS = ['name', 'email', 'id'] as const;

export async function listUsers(url: URL) {
	const params = parseListParams(url, USER_SORTS, { sort: 'name', dir: 'asc' });
	const where = params.q
		? or(like(users.name, containsPattern(params.q)), like(users.email, containsPattern(params.q)))
		: undefined;
	const [{ total }] = await db.select({ total: count() }).from(users).where(where);
	const state = listState(params, total);
	const column = { name: users.name, email: users.email, id: users.id }[
		state.sort as (typeof USER_SORTS)[number]
	];
	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			avatar: users.avatar,
			role: roles.displayName
		})
		.from(users)
		.leftJoin(roles, eq(roles.id, users.roleId))
		.where(where)
		.orderBy(orderBy(column, state.dir))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, rows: rows.map((row) => ({ ...row, avatar: mediaUrl(row.avatar) })) };
}

export async function findUser(id: number) {
	const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!row) return null;
	const extra = await db
		.select({ roleId: userRoles.roleId })
		.from(userRoles)
		.where(eq(userRoles.userId, id));
	return { ...row, extraRoleIds: extra.map((item) => item.roleId) };
}

export async function roleOptions() {
	return db
		.select({ id: roles.id, name: roles.name, displayName: roles.displayName })
		.from(roles)
		.orderBy(asc(roles.id));
}

const password = (requiredOnCreate: boolean) =>
	z
		.string()
		.optional()
		.transform((value) => value ?? '')
		.refine((value) => value === '' || (value.length >= 8 && value.length <= 255), {
			error: () => 'A palavra-passe tem de ter pelo menos 8 caracteres.'
		})
		.refine((value) => !requiredOnCreate || value !== '', {
			error: () => 'Indique a palavra-passe.'
		});

const roleIds = z
	.union([z.string(), z.array(z.string())])
	.optional()
	.transform((value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]))
	.transform((values) => [...new Set(values.filter((v) => /^\d+$/.test(v)).map(Number))]);

const userForm = (creating: boolean) =>
	z.object({
		name: requiredText(191),
		email: requiredText(191).pipe(z.email()),
		password: password(creating),
		role_id: optionalId(),
		extra_roles: roleIds,
		avatar: imageInput(),
		remove_avatar: z
			.string()
			.optional()
			.transform((value) => value === 'on')
	});

type User = typeof users.$inferSelect;

async function emailTaken(email: string, exceptId: number | null) {
	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			and(
				sql`LOWER(${users.email}) = ${email.toLowerCase()}`,
				exceptId ? ne(users.id, exceptId) : undefined
			)
		)
		.limit(1);
	return Boolean(row);
}

export async function saveUser(
	formData: FormData,
	existing: User | null,
	actingUserId: number
): Promise<SaveResult<{ id: number; name: string; passwordChanged: boolean }>> {
	const form = parseForm(userForm(existing === null), formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;

	if (await emailTaken(data.email, existing?.id ?? null)) {
		return rejected({ email: ['Já existe um utilizador com este email.'] }, form.values);
	}
	const known = new Set((await roleOptions()).map((role) => role.id));
	if (data.role_id !== null && !known.has(data.role_id)) {
		return rejected({ role_id: ['Função inválida.'] }, form.values);
	}
	// Taking the admin area away from yourself would lock you out of this page.
	if (existing?.id === actingUserId) {
		const keys = await keysOfRoles([data.role_id, ...data.extra_roles]);
		if (!keys.has('browse_admin')) {
			return rejected(
				{ role_id: ['Não pode tirar a si próprio o acesso à administração.'] },
				form.values
			);
		}
	}

	const stored = await storeUpload(data.avatar, {
		folder: STORAGE_FOLDERS.users,
		resize: { fit: 'square', size: IMAGE_LIMITS.avatarSize }
	});
	if (stored && 'error' in stored) return rejected({ avatar: [stored.error] }, form.values);
	const avatar =
		stored?.key ?? (data.remove_avatar ? DEFAULT_AVATAR : (existing?.avatar ?? DEFAULT_AVATAR));

	const values = {
		name: data.name,
		email: data.email,
		roleId: data.role_id,
		avatar,
		...(data.password ? { password: await hashPassword(data.password) } : {})
	};

	let id: number;
	if (existing) {
		await db.update(users).set(values).where(eq(users.id, existing.id));
		id = existing.id;
		if (existing.avatar && existing.avatar !== avatar && existing.avatar !== DEFAULT_AVATAR) {
			await deleteFile(existing.avatar);
		}
	} else {
		const [created] = await db
			.insert(users)
			.values({ ...values, password: values.password ?? '' })
			.$returningId();
		id = created.id;
	}

	await db.transaction(async (tx) => {
		await tx.delete(userRoles).where(eq(userRoles.userId, id));
		const extra = data.extra_roles.filter((roleId) => known.has(roleId) && roleId !== data.role_id);
		if (extra.length)
			await tx.insert(userRoles).values(extra.map((roleId) => ({ userId: id, roleId })));
	});

	return { ok: true, id, name: data.name, passwordChanged: Boolean(data.password) };
}

export async function deleteUser(user: User) {
	await db.delete(users).where(eq(users.id, user.id));
	if (user.avatar && user.avatar !== DEFAULT_AVATAR) await deleteFile(user.avatar);
}

async function keysOfRoles(ids: (number | null)[]) {
	const roleIdList = ids.filter((id): id is number => id !== null);
	if (!roleIdList.length) return new Set<string>();
	const rows = await db
		.selectDistinct({ key: permissions.key })
		.from(permissionRole)
		.innerJoin(permissions, eq(permissions.id, permissionRole.permissionId))
		.where(inArray(permissionRole.roleId, roleIdList));
	return new Set(rows.map((row) => row.key));
}

// ---------------------------------------------------------------------------------------------
// Own profile

const ProfileForm = z.object({
	name: requiredText(191),
	email: requiredText(191).pipe(z.email()),
	current_password: z
		.string()
		.optional()
		.transform((value) => value ?? ''),
	password: password(false),
	avatar: imageInput()
});

export async function saveProfile(
	formData: FormData,
	user: User
): Promise<SaveResult<{ passwordHash: string | null }>> {
	const form = parseForm(ProfileForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;

	if (await emailTaken(data.email, user.id)) {
		return rejected({ email: ['Já existe um utilizador com este email.'] }, form.values);
	}
	if (data.password && !(await verifyPassword(data.current_password, user.password))) {
		return rejected({ current_password: ['A palavra-passe atual não está certa.'] }, form.values);
	}
	const stored = await storeUpload(data.avatar, {
		folder: STORAGE_FOLDERS.users,
		resize: { fit: 'square', size: IMAGE_LIMITS.avatarSize }
	});
	if (stored && 'error' in stored) return rejected({ avatar: [stored.error] }, form.values);

	const passwordHash = data.password ? await hashPassword(data.password) : null;
	await db
		.update(users)
		.set({
			name: data.name,
			email: data.email,
			...(stored ? { avatar: stored.key } : {}),
			...(passwordHash ? { password: passwordHash } : {})
		})
		.where(eq(users.id, user.id));
	if (stored && user.avatar && user.avatar !== DEFAULT_AVATAR) await deleteFile(user.avatar);
	return { ok: true, passwordHash };
}

// ---------------------------------------------------------------------------------------------
// Roles

export async function listRoles() {
	return db
		.select({
			id: roles.id,
			name: roles.name,
			displayName: roles.displayName,
			users: sql<number>`(select count(*) from ${users} where ${users.roleId} = ${roles.id})`,
			permissions: sql<number>`(select count(*) from ${permissionRole} where ${permissionRole.roleId} = ${roles.id})`
		})
		.from(roles)
		.orderBy(asc(roles.id));
}

export async function findRole(id: number) {
	const [row] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
	if (!row) return null;
	const granted = await db
		.select({ permissionId: permissionRole.permissionId })
		.from(permissionRole)
		.where(eq(permissionRole.roleId, id));
	return { ...row, permissionIds: granted.map((item) => item.permissionId) };
}

/** Every permission, grouped by table (Voyager's role screen). */
export async function permissionGroups() {
	const rows = await db
		.select({ id: permissions.id, key: permissions.key, tableName: permissions.tableName })
		.from(permissions)
		.orderBy(asc(permissions.tableName), asc(permissions.id));
	const groups = new Map<string, { id: number; key: string }[]>();
	for (const row of rows) {
		const group = row.tableName ?? '';
		if (!groups.has(group)) groups.set(group, []);
		groups.get(group)!.push({ id: row.id, key: row.key });
	}
	return [...groups].map(([table, items]) => ({ table, items }));
}

const RoleForm = z.object({
	name: requiredText(191),
	display_name: requiredText(191),
	permissions: roleIds
});

export async function saveRole(
	formData: FormData,
	existing: { id: number } | null
): Promise<SaveResult<{ id: number; name: string }>> {
	const form = parseForm(RoleForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;
	const [taken] = await db
		.select({ id: roles.id })
		.from(roles)
		.where(and(eq(roles.name, data.name), existing ? ne(roles.id, existing.id) : undefined))
		.limit(1);
	if (taken) return rejected({ name: ['Já existe uma função com este nome.'] }, form.values);

	const known = new Set(
		(await db.select({ id: permissions.id }).from(permissions)).map((row) => row.id)
	);
	const granted = data.permissions.filter((id) => known.has(id));

	let id: number;
	if (existing) {
		await db
			.update(roles)
			.set({ name: data.name, displayName: data.display_name })
			.where(eq(roles.id, existing.id));
		id = existing.id;
	} else {
		const [created] = await db
			.insert(roles)
			.values({ name: data.name, displayName: data.display_name })
			.$returningId();
		id = created.id;
	}
	await db.transaction(async (tx) => {
		await tx.delete(permissionRole).where(eq(permissionRole.roleId, id));
		if (granted.length) {
			await tx
				.insert(permissionRole)
				.values(granted.map((permissionId) => ({ permissionId, roleId: id })));
		}
	});
	return { ok: true, id, name: data.display_name };
}

export async function deleteRole(id: number) {
	await db.delete(roles).where(eq(roles.id, id));
}
