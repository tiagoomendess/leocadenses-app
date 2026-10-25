import { and, asc, eq, isNull } from 'drizzle-orm';
import { nowNaive } from '#lib/dates.ts';
import { db } from '#lib/server/db/index.ts';
import { members, quotaPayments, quotas } from '#lib/server/db/schema.ts';
import { hasAllQuotasPaid, hasValidDocument } from './rules';

export type CardCheck =
	| { valid: false; memberId: number | null }
	| {
			valid: true;
			memberId: number;
			number: number;
			name: string;
			phone: string | null;
			email: string | null;
			paidQuotas: string[];
			upToDate: boolean;
	  };

/** Every quota with its due date, oldest first. */
export async function allQuotas() {
	return db
		.select({ id: quotas.id, name: quotas.name, dueDate: quotas.dueDate })
		.from(quotas)
		.orderBy(asc(quotas.dueDate), asc(quotas.id));
}

/** The quota ids a member has paid. */
export async function paidQuotaIds(memberId: number): Promise<Set<number>> {
	const rows = await db
		.select({ quotaId: quotaPayments.quotaId })
		.from(quotaPayments)
		.where(eq(quotaPayments.memberId, memberId));
	return new Set(rows.map((row) => row.quotaId));
}

/**
 * Ports `MemberController::verify` (`/c/{token}`, the QR code on the member card): the card is
 * valid when the token belongs to a member with an identity document. The first scan marks the
 * card as printed, as before (the club scans each card once after printing it).
 */
export async function checkCard(token: string): Promise<CardCheck> {
	const [member] = await db
		.select()
		.from(members)
		.where(and(eq(members.cardToken, token), isNull(members.deletedAt)))
		.limit(1);
	if (!member) return { valid: false, memberId: null };

	if (!member.cardPrinted) {
		await db.update(members).set({ cardPrinted: true }).where(eq(members.id, member.id));
	}

	if (!hasValidDocument(member.document)) return { valid: false, memberId: member.id };

	const [quotaList, paid] = await Promise.all([allQuotas(), paidQuotaIds(member.id)]);
	return {
		valid: true,
		memberId: member.id,
		number: member.number,
		name: member.name,
		phone: member.phone,
		email: member.email,
		paidQuotas: quotaList.filter((quota) => paid.has(quota.id)).map((quota) => quota.name),
		upToDate: hasAllQuotasPaid(member.createdAt, quotaList, paid, nowNaive())
	};
}
