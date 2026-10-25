import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/index.ts';
import { members, quotaPayments, quotas } from '#lib/server/db/schema.ts';
import { parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams,
	searchId
} from '#lib/server/list.ts';
import { optionalText, requiredId } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { optionalAmount } from './fields';

const SORTS = ['id', 'member', 'quota'] as const;

export async function quotaOptions() {
	return db.select({ id: quotas.id, name: quotas.name }).from(quotas).orderBy(desc(quotas.dueDate));
}

/** Payments, newest first (Voyager's order), with the member and the quota. */
export async function listPayments(url: URL) {
	const params = parseListParams(url, SORTS, { sort: 'id', dir: 'desc' });
	const quotaFilter = Number(url.searchParams.get('quota')) || null;

	const conditions: (SQL | undefined)[] = [];
	if (quotaFilter) conditions.push(eq(quotaPayments.quotaId, quotaFilter));
	if (params.q) {
		const number = searchId(params.q);
		conditions.push(
			or(
				like(members.name, containsPattern(params.q)),
				number ? eq(members.number, number) : undefined
			)
		);
	}
	const where = and(...conditions);
	const [{ total }] = await db
		.select({ total: count() })
		.from(quotaPayments)
		.leftJoin(members, eq(members.id, quotaPayments.memberId))
		.where(where);
	const state = listState(params, total);
	const column = { id: quotaPayments.id, member: members.number, quota: quotas.dueDate }[
		state.sort as (typeof SORTS)[number]
	];
	const rows = await db
		.select({
			id: quotaPayments.id,
			amount: quotaPayments.amount,
			notes: quotaPayments.notes,
			createdAt: quotaPayments.createdAt,
			memberId: members.id,
			memberNumber: members.number,
			memberName: members.name,
			quotaName: quotas.name
		})
		.from(quotaPayments)
		.leftJoin(members, eq(members.id, quotaPayments.memberId))
		.leftJoin(quotas, eq(quotas.id, quotaPayments.quotaId))
		.where(where)
		.orderBy(orderBy(column, state.dir), desc(quotaPayments.id))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, quotaFilter, rows };
}

export async function findPayment(id: number) {
	const [row] = await db
		.select({
			id: quotaPayments.id,
			memberId: quotaPayments.memberId,
			quotaId: quotaPayments.quotaId,
			amount: quotaPayments.amount,
			notes: quotaPayments.notes,
			createdAt: quotaPayments.createdAt,
			memberNumber: members.number,
			memberName: members.name
		})
		.from(quotaPayments)
		.leftJoin(members, eq(members.id, quotaPayments.memberId))
		.where(eq(quotaPayments.id, id))
		.limit(1);
	return row ?? null;
}

const PaymentForm = z.object({
	member_id: requiredId(),
	quota_id: requiredId(),
	amount: optionalAmount(),
	notes: optionalText(255)
});

export async function savePayment(
	formData: FormData,
	existing: { id: number } | null
): Promise<SaveResult<{ id: number }>> {
	const form = parseForm(PaymentForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;

	const [member] = await db
		.select({ id: members.id })
		.from(members)
		.where(eq(members.id, data.member_id))
		.limit(1);
	if (!member) return rejected({ member_id: ['Escolha um sócio.'] }, form.values);
	const [quota] = await db
		.select({ id: quotas.id })
		.from(quotas)
		.where(eq(quotas.id, data.quota_id))
		.limit(1);
	if (!quota) return rejected({ quota_id: ['Escolha uma quota.'] }, form.values);

	const values = {
		memberId: data.member_id,
		quotaId: data.quota_id,
		amount: data.amount,
		notes: data.notes
	};
	if (existing) {
		await db.update(quotaPayments).set(values).where(eq(quotaPayments.id, existing.id));
		return { ok: true, id: existing.id };
	}
	const [created] = await db.insert(quotaPayments).values(values).$returningId();
	return { ok: true, id: created.id };
}

export async function deletePayment(id: number) {
	await db.delete(quotaPayments).where(eq(quotaPayments.id, id));
}

export const memberOption = (row: { id: number; number: number; name: string }) => ({
	value: row.id,
	label: `${row.number} · ${row.name}`
});
