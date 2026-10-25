import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { resolve } from '$app/paths';
import { done, failed } from '#lib/server/admin/crud.ts';
import { saveProfile } from '#lib/server/admin/users.ts';
import { requireUser } from '#lib/server/auth/guard.ts';
import { readSession, renewSession } from '#lib/server/auth/session.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { Actions, PageServerLoad } from './$types';

/** Voyager's /admin/profile: every signed-in user edits their own account. */
async function ownAccount(id: number) {
	const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!row) error(404, 'Conta não encontrada');
	return row;
}

export const load: PageServerLoad = async () => {
	const user = requireUser();
	const account = await ownAccount(user.id);
	return {
		account: { name: account.name, email: account.email },
		avatarUrl: mediaUrl(account.avatar)
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = requireUser();
		const account = await ownAccount(user.id);
		const result = await saveProfile(await request.formData(), account);
		if (!result.ok) return failed(result);
		// A new password ends the other sessions; this one is re-signed so you stay in.
		const session = await readSession(cookies);
		if (result.passwordHash && session) await renewSession(cookies, session, result.passwordHash);
		done(cookies, resolve('/admin/(app)/profile'), 'Perfil guardado.');
	}
};
