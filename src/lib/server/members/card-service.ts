import { and, eq, isNull } from 'drizzle-orm';
import { SITE_URL } from '$app/env/private';
import { db } from '#lib/server/db/index.ts';
import { members, uniqueCodes } from '#lib/server/db/schema.ts';
import {
	deleteFile,
	putFile,
	randomAlphanumeric,
	STORAGE_FOLDERS
} from '#lib/server/storage/index.ts';
import { drawMemberCard } from './card-image';

/** Laravel's `Str::random(9)`: the token printed in the card's QR code (`/c/<token>`). */
const TOKEN_LENGTH = 9;

/** A token never issued before (`unique_codes` keeps every one, so old cards stay invalid). */
async function newToken(): Promise<string> {
	for (;;) {
		const token = randomAlphanumeric(TOKEN_LENGTH);
		const [used] = await db
			.select({ id: uniqueCodes.id })
			.from(uniqueCodes)
			.where(eq(uniqueCodes.code, token))
			.limit(1);
		if (!used) return token;
	}
}

export function cardUrl(token: string): string {
	return `${(SITE_URL ?? 'https://leocadenses.pt').replace(/\/+$/, '')}/c/${token}`;
}

/**
 * Generates (or regenerates) a member's card, as the old `members:generate-cards` command did:
 * new token, new image at `members/cards/<token>.png`, `generate_card` and `card_printed` reset,
 * and the previous image removed. Returns the new token.
 */
export async function generateCard(memberId: number): Promise<string> {
	const [member] = await db
		.select({ id: members.id, name: members.name, number: members.number, card: members.card })
		.from(members)
		.where(eq(members.id, memberId))
		.limit(1);
	if (!member) throw new Error(`Member ${memberId} not found`);

	const token = await newToken();
	const png = await drawMemberCard({
		name: member.name,
		number: member.number,
		url: cardUrl(token)
	});
	const key = `${STORAGE_FOLDERS.memberCards}/${token}.png`;
	await putFile(key, png, 'image/png');

	try {
		await db.transaction(async (tx) => {
			await tx.insert(uniqueCodes).values({ code: token });
			await tx
				.update(members)
				.set({ card: key, cardToken: token, generateCard: false, cardPrinted: false })
				.where(eq(members.id, member.id));
		});
	} catch (error) {
		await deleteFile(key);
		throw error;
	}

	if (member.card && member.card !== key) await deleteFile(member.card);
	return token;
}

/** `generateCard` for a save that already succeeded: a failure is logged, not thrown. */
export async function tryGenerateCard(memberId: number): Promise<boolean> {
	try {
		await generateCard(memberId);
		return true;
	} catch (error) {
		console.error(`cards: could not generate the card of member ${memberId}`, error);
		return false;
	}
}

/** Cards of every member marked "Gerar cartão" (the old cron ran this every five minutes). */
export async function generatePendingCards(): Promise<{ generated: number; failed: number }> {
	const pending = await db
		.select({ id: members.id })
		.from(members)
		.where(and(eq(members.generateCard, true), isNull(members.deletedAt)));
	let generated = 0;
	let failed = 0;
	for (const { id } of pending) {
		try {
			await generateCard(id);
			generated++;
		} catch (error) {
			failed++;
			console.error(`cards: could not generate the card of member ${id}`, error);
		}
	}
	return { generated, failed };
}
