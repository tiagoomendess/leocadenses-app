import { count, eq, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/index.ts';
import { documentTypes, memberApplication } from '#lib/server/db/schema.ts';
import { parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams
} from '#lib/server/list.ts';
import { optional, optionalEmail, requiredId, requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';

const SORTS = ['created_at', 'name'] as const;

/** Membership applications ("Candidatos"), oldest first like Voyager, so none is forgotten. */
export async function listApplications(url: URL) {
	const params = parseListParams(url, SORTS, { sort: 'created_at', dir: 'asc' });
	const where = params.q
		? or(
				like(memberApplication.name, containsPattern(params.q)),
				like(memberApplication.email, containsPattern(params.q)),
				like(memberApplication.phone, containsPattern(params.q))
			)
		: undefined;
	const [{ total }] = await db.select({ total: count() }).from(memberApplication).where(where);
	const state = listState(params, total);
	const rows = await db
		.select({
			id: memberApplication.id,
			name: memberApplication.name,
			phone: memberApplication.phone,
			email: memberApplication.email,
			createdAt: memberApplication.createdAt
		})
		.from(memberApplication)
		.where(where)
		.orderBy(
			orderBy(
				state.sort === 'name' ? memberApplication.name : memberApplication.createdAt,
				state.dir
			),
			orderBy(memberApplication.id, state.dir)
		)
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, rows };
}

export async function findApplication(id: number) {
	const [row] = await db
		.select()
		.from(memberApplication)
		.where(eq(memberApplication.id, id))
		.limit(1);
	return row ?? null;
}

const ApplicationForm = z.object({
	name: requiredText(100),
	phone: requiredText(50),
	email: optionalEmail(50),
	document_type_id: requiredId(),
	document: requiredText(50),
	address: optional(z.string().max(255))
});

export async function saveApplication(
	formData: FormData,
	id: number
): Promise<SaveResult<{ name: string }>> {
	const form = parseForm(ApplicationForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const [type] = await db
		.select({ id: documentTypes.id })
		.from(documentTypes)
		.where(eq(documentTypes.id, form.data.document_type_id))
		.limit(1);
	if (!type) return rejected({ document_type_id: ['Tipo de documento inválido.'] }, form.values);
	await db
		.update(memberApplication)
		.set({
			name: form.data.name,
			phone: form.data.phone,
			email: form.data.email,
			documentTypeId: form.data.document_type_id,
			document: form.data.document,
			address: form.data.address
		})
		.where(eq(memberApplication.id, id));
	return { ok: true, name: form.data.name };
}

export async function deleteApplication(id: number) {
	await db.delete(memberApplication).where(eq(memberApplication.id, id));
}
