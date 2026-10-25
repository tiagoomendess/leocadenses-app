import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
	like,
	max,
	ne,
	or,
	sql,
	type SQL
} from 'drizzle-orm';
import { z } from 'zod';
import { nowNaive } from '#lib/dates.ts';
import { db } from '#lib/server/db/index.ts';
import {
	documentTypes,
	memberApplication,
	members,
	quotaPayments,
	quotas
} from '#lib/server/db/schema.ts';
import { checkbox, parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams,
	searchId
} from '#lib/server/list.ts';
import { allQuotas } from '#lib/server/members/cards.ts';
import { hasAllQuotasPaid } from '#lib/server/members/rules.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import {
	integer,
	optional,
	optionalEmail,
	optionalText,
	requiredId,
	requiredText
} from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { optionalAmount } from './fields';

const SORTS = ['number', 'name', 'created_at'] as const;

export const MEMBER_FILTERS = {
	overdue: 'Quotas em atraso',
	pending_card: 'Cartão por gerar',
	not_printed: 'Cartão por imprimir',
	deleted: 'Apagados'
} as const;
export type MemberFilter = keyof typeof MEMBER_FILTERS;

function parseFilter(value: string | null): MemberFilter | null {
	return value && value in MEMBER_FILTERS ? (value as MemberFilter) : null;
}

/** Paid quota ids per member. */
async function paymentsByMember(memberIds: number[]) {
	const byMember = new Map<number, Set<number>>();
	if (memberIds.length === 0) return byMember;
	const rows = await db
		.select({ memberId: quotaPayments.memberId, quotaId: quotaPayments.quotaId })
		.from(quotaPayments)
		.where(inArray(quotaPayments.memberId, memberIds));
	for (const row of rows) {
		if (!byMember.has(row.memberId)) byMember.set(row.memberId, new Set());
		byMember.get(row.memberId)!.add(row.quotaId);
	}
	return byMember;
}

export async function listMembers(url: URL) {
	const params = parseListParams(url, SORTS, { sort: 'number', dir: 'desc' });
	const filter = parseFilter(url.searchParams.get('filter'));

	const conditions: (SQL | undefined)[] = [
		filter === 'deleted' ? isNotNull(members.deletedAt) : isNull(members.deletedAt)
	];
	if (params.q) {
		const pattern = containsPattern(params.q);
		const number = searchId(params.q);
		conditions.push(
			or(
				like(members.name, pattern),
				like(members.phone, pattern),
				like(members.email, pattern),
				like(members.document, pattern),
				number ? eq(members.number, number) : undefined
			)
		);
	}
	if (filter === 'pending_card') conditions.push(eq(members.generateCard, true));
	if (filter === 'not_printed') {
		conditions.push(and(isNotNull(members.card), eq(members.cardPrinted, false)));
	}
	const where = and(...conditions);
	const column = { number: members.number, name: members.name, created_at: members.createdAt }[
		params.sort as (typeof SORTS)[number]
	];
	const columns = {
		id: members.id,
		number: members.number,
		name: members.name,
		phone: members.phone,
		createdAt: members.createdAt,
		card: members.card,
		cardPrinted: members.cardPrinted,
		generateCard: members.generateCard
	};

	const quotaList = await allQuotas();
	const today = nowNaive();
	const withStatus = async <Row extends { id: number; createdAt: string | null }>(rows: Row[]) => {
		const paid = await paymentsByMember(rows.map((row) => row.id));
		return rows.map((row) => ({
			...row,
			upToDate: hasAllQuotasPaid(row.createdAt, quotaList, paid.get(row.id) ?? new Set(), today)
		}));
	};

	if (filter === 'overdue') {
		// The rule needs every member's payments, so this filter runs in memory (a few hundred rows).
		const all = await withStatus(
			await db.select(columns).from(members).where(where).orderBy(orderBy(column, params.dir))
		);
		const overdue = all.filter((row) => !row.upToDate);
		const state = listState(params, overdue.length);
		const offset = pageOffset(state);
		return { list: state, filter, rows: overdue.slice(offset, offset + state.pageSize) };
	}

	const [{ total }] = await db.select({ total: count() }).from(members).where(where);
	const state = listState(params, total);
	const rows = await db
		.select(columns)
		.from(members)
		.where(where)
		.orderBy(orderBy(column, state.dir), desc(members.id))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, filter, rows: await withStatus(rows) };
}

export async function findMember(id: number) {
	const [row] = await db.select().from(members).where(eq(members.id, id)).limit(1);
	return row ?? null;
}

export async function documentTypeList() {
	return db
		.select({ id: documentTypes.id, name: documentTypes.name })
		.from(documentTypes)
		.orderBy(asc(documentTypes.id));
}

/** The number a new member gets by default: the highest one plus one. */
export async function nextMemberNumber() {
	const [{ value }] = await db.select({ value: max(members.number) }).from(members);
	return (value ?? 0) + 1;
}

/** Each quota with this member's payment (if any), newest season first. */
export async function memberQuotas(memberId: number) {
	const [quotaList, payments] = await Promise.all([
		db
			.select({ id: quotas.id, name: quotas.name, dueDate: quotas.dueDate })
			.from(quotas)
			.orderBy(desc(quotas.dueDate)),
		db
			.select({
				id: quotaPayments.id,
				quotaId: quotaPayments.quotaId,
				amount: quotaPayments.amount,
				notes: quotaPayments.notes,
				createdAt: quotaPayments.createdAt
			})
			.from(quotaPayments)
			.where(eq(quotaPayments.memberId, memberId))
	]);
	return quotaList.map((quota) => ({
		...quota,
		payment: payments.find((payment) => payment.quotaId === quota.id) ?? null
	}));
}

export async function memberStatus(member: { id: number; createdAt: string | null }) {
	const [quotaList, paid] = await Promise.all([allQuotas(), paymentsByMember([member.id])]);
	return hasAllQuotasPaid(
		member.createdAt,
		quotaList,
		paid.get(member.id) ?? new Set(),
		nowNaive()
	);
}

export function cardImageUrl(card: string | null) {
	return mediaUrl(card);
}

/**
 * Voyager's rules for members (data_rows): number 1–9999 and unique, name up to 60, phone 9–13,
 * document up to 20. The address was required with at least 7 characters; many members have
 * none, so now it is optional but still at least 7 characters when given.
 */
const MemberForm = z.object({
	number: integer(1, 9999),
	name: requiredText(60),
	phone: optional(z.string().min(9).max(13)),
	email: optionalEmail(100),
	document_type_id: requiredId(),
	document: requiredText(20),
	address: optional(z.string().min(7).max(255)),
	notes: optionalText(255),
	generate_card: checkbox,
	application_id: optional(z.string().regex(/^\d+$/).transform(Number))
});

type Member = typeof members.$inferSelect;

export async function saveMember(
	formData: FormData,
	existing: Member | null
): Promise<
	SaveResult<{ id: number; name: string; generateCard: boolean; applicationId: number | null }>
> {
	const form = parseForm(MemberForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;

	const [numberTaken] = await db
		.select({ id: members.id, deleted: members.deletedAt })
		.from(members)
		.where(and(eq(members.number, data.number), existing ? ne(members.id, existing.id) : undefined))
		.limit(1);
	if (numberTaken) {
		return rejected(
			{
				number: [
					numberTaken.deleted
						? 'Este número pertence a um sócio apagado.'
						: 'Já existe um sócio com este número.'
				]
			},
			form.values
		);
	}
	const [documentType] = await db
		.select({ id: documentTypes.id })
		.from(documentTypes)
		.where(eq(documentTypes.id, data.document_type_id))
		.limit(1);
	if (!documentType)
		return rejected({ document_type_id: ['Tipo de documento inválido.'] }, form.values);

	const values = {
		number: data.number,
		name: data.name,
		phone: data.phone,
		email: data.email,
		documentTypeId: data.document_type_id,
		document: data.document,
		address: data.address,
		notes: data.notes,
		generateCard: data.generate_card
	};
	let id: number;
	if (existing) {
		await db.update(members).set(values).where(eq(members.id, existing.id));
		id = existing.id;
	} else {
		const [created] = await db.insert(members).values(values).$returningId();
		id = created.id;
	}
	return {
		ok: true,
		id,
		name: values.name,
		generateCard: values.generateCard,
		applicationId: existing ? null : (data.application_id ?? null)
	};
}

/** Soft delete: the member disappears from lists and the card stops validating. */
export async function deleteMember(id: number) {
	await db.update(members).set({ deletedAt: nowNaive() }).where(eq(members.id, id));
}

export async function restoreMember(id: number) {
	await db.update(members).set({ deletedAt: null }).where(eq(members.id, id));
}

const PaymentForm = z.object({
	quota_id: requiredId(),
	amount: optionalAmount(),
	notes: optionalText(255)
});

/** Records a member's payment of a quota (once per quota). */
export async function addMemberPayment(memberId: number, formData: FormData) {
	const form = parseForm(PaymentForm, formData);
	if (!form.success) return { error: 'Pagamento inválido.' };
	const [existing] = await db
		.select({ id: quotaPayments.id })
		.from(quotaPayments)
		.where(and(eq(quotaPayments.memberId, memberId), eq(quotaPayments.quotaId, form.data.quota_id)))
		.limit(1);
	if (existing) return { error: 'Esta quota já está paga.' };
	await db.insert(quotaPayments).values({
		memberId,
		quotaId: form.data.quota_id,
		amount: form.data.amount,
		notes: form.data.notes
	});
	return { error: null };
}

export async function removeMemberPayment(memberId: number, paymentId: number) {
	await db
		.delete(quotaPayments)
		.where(and(eq(quotaPayments.id, paymentId), eq(quotaPayments.memberId, memberId)));
}

/** A membership application, to start a member's form from it. */
export async function applicationForMember(id: number) {
	const [row] = await db
		.select()
		.from(memberApplication)
		.where(eq(memberApplication.id, id))
		.limit(1);
	return row ?? null;
}

export async function deleteApplication(id: number) {
	await db.delete(memberApplication).where(eq(memberApplication.id, id));
}

export const memberSearchColumns = { id: members.id, number: members.number, name: members.name };

/** Options of the member select (payments): by number or name. */
export async function searchMemberOptions(q: string, limit: number, offset: number) {
	const number = searchId(q);
	const where = and(
		isNull(members.deletedAt),
		q
			? or(like(members.name, containsPattern(q)), number ? eq(members.number, number) : undefined)
			: undefined
	);
	return db
		.select(memberSearchColumns)
		.from(members)
		.where(where)
		.orderBy(
			number ? sql`${members.number} = ${number} desc` : asc(members.name),
			asc(members.number)
		)
		.limit(limit)
		.offset(offset);
}
