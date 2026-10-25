import { count, eq, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/index.ts';
import { partners } from '#lib/server/db/schema.ts';
import { parseForm } from '#lib/server/forms.ts';
import { checkbox } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams
} from '#lib/server/list.ts';
import { IMAGE_LIMITS } from '#lib/server/storage/images.ts';
import { deleteFile, mediaUrl, STORAGE_FOLDERS } from '#lib/server/storage/index.ts';
import { integer, optional, requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { imageInput, replaceFile, storeUpload } from './uploads';

const SORTS = ['position', 'name', 'id'] as const;

export async function listPartners(url: URL) {
	const params = parseListParams(url, SORTS, { sort: 'position', dir: 'asc' });
	const where = params.q
		? or(
				like(partners.name, containsPattern(params.q)),
				like(partners.url, containsPattern(params.q))
			)
		: undefined;
	const [{ total }] = await db.select({ total: count() }).from(partners).where(where);
	const state = listState(params, total);
	const column = { position: partners.position, name: partners.name, id: partners.id }[
		state.sort as (typeof SORTS)[number]
	];
	const rows = await db
		.select()
		.from(partners)
		.where(where)
		.orderBy(orderBy(column, state.dir), orderBy(partners.id, 'asc'))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return {
		list: state,
		rows: rows.map((row) => ({ ...row, picture: mediaUrl(row.picture) }))
	};
}

export async function findPartner(id: number) {
	const [row] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
	return row ?? null;
}

/** Voyager let partners link anywhere, including `mailto:` and a bare `#` (no link). */
const partnerUrl = optional(
	z
		.string()
		.max(191)
		.refine((value) => /^(https?:\/\/\S+|mailto:\S+|#)$/i.test(value))
);

const PartnerForm = z.object({
	name: requiredText(50),
	url: partnerUrl,
	position: integer(0, 32767),
	visible: checkbox,
	picture: imageInput()
});

type Partner = typeof partners.$inferSelect;

/** Creates (`existing` null) or updates a partner. The picture is required on create. */
export async function savePartner(
	formData: FormData,
	existing: Partner | null
): Promise<SaveResult<{ id: number; name: string }>> {
	const form = parseForm(PartnerForm, formData);
	if (!form.success) return rejected(form.errors, form.values);

	const stored = await storeUpload(form.data.picture, {
		folder: STORAGE_FOLDERS.partners,
		resize: { fit: 'inside', maxSize: IMAGE_LIMITS.logoMaxSize }
	});
	if (stored && 'error' in stored) return rejected({ picture: [stored.error] }, form.values);
	const picture = stored?.key ?? existing?.picture ?? null;
	if (!picture) return rejected({ picture: ['Escolha uma imagem.'] }, form.values);

	const values = {
		name: form.data.name,
		url: form.data.url,
		position: form.data.position,
		visible: form.data.visible,
		picture
	};
	let id = existing?.id;
	if (existing) {
		await db.update(partners).set(values).where(eq(partners.id, existing.id));
		await replaceFile(existing.picture, stored?.key ?? null);
	} else {
		const [result] = await db.insert(partners).values(values).$returningId();
		id = result.id;
	}
	return { ok: true, id: id!, name: values.name };
}

export async function deletePartner(partner: Partner) {
	await db.delete(partners).where(eq(partners.id, partner.id));
	// Voyager kept the file; nothing else points at it, so it goes too.
	await deleteFile(partner.picture);
}
