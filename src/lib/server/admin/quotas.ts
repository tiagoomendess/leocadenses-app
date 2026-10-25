import { count, eq, like, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/index.ts';
import { quotaPayments, quotas } from '#lib/server/db/schema.ts';
import { parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams
} from '#lib/server/list.ts';
import { requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { requiredDateTime } from './fields';

const SORTS = ['due_date', 'name'] as const;

export async function listQuotas(url: URL) {
	const params = parseListParams(url, SORTS, { sort: 'due_date', dir: 'desc' });
	const where = params.q ? like(quotas.name, containsPattern(params.q)) : undefined;
	const [{ total }] = await db.select({ total: count() }).from(quotas).where(where);
	const state = listState(params, total);
	const column = state.sort === 'name' ? quotas.name : quotas.dueDate;
	const rows = await db
		.select({
			id: quotas.id,
			name: quotas.name,
			dueDate: quotas.dueDate,
			payments: sql<number>`(select count(*) from ${quotaPayments} where ${quotaPayments.quotaId} = ${quotas.id})`
		})
		.from(quotas)
		.where(where)
		.orderBy(orderBy(column, state.dir))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, rows: rows.map((row) => ({ ...row, payments: Number(row.payments) })) };
}

export async function findQuota(id: number) {
	const [row] = await db.select().from(quotas).where(eq(quotas.id, id)).limit(1);
	return row ?? null;
}

const QuotaForm = z.object({ name: requiredText(25), due_date: requiredDateTime() });

type Quota = typeof quotas.$inferSelect;

export async function saveQuota(
	formData: FormData,
	existing: Quota | null
): Promise<SaveResult<{ id: number; name: string }>> {
	const form = parseForm(QuotaForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	// Always written: until migration 0002 runs, MySQL would otherwise reset it on update.
	const values = { name: form.data.name, dueDate: form.data.due_date };
	if (existing) {
		await db.update(quotas).set(values).where(eq(quotas.id, existing.id));
		return { ok: true, id: existing.id, name: values.name };
	}
	const [created] = await db.insert(quotas).values(values).$returningId();
	return { ok: true, id: created.id, name: values.name };
}

/** Number of payments of a quota (they have no foreign key, so the delete checks). */
export async function quotaPaymentCount(id: number) {
	const [{ total }] = await db
		.select({ total: count() })
		.from(quotaPayments)
		.where(eq(quotaPayments.quotaId, id));
	return total;
}

export async function deleteQuota(id: number) {
	await db.delete(quotas).where(eq(quotas.id, id));
}
