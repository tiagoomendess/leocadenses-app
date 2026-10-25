import { and, asc, count, eq, like, ne } from 'drizzle-orm';
import { z } from 'zod';
import { slugify } from '#lib/slug.ts';
import { db } from '#lib/server/db/index.ts';
import { categories } from '#lib/server/db/schema.ts';
import { parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams
} from '#lib/server/list.ts';
import { integer, optionalId, requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { optionalSlug } from './fields';

const SORTS = ['order', 'name'] as const;

export async function listCategories(url: URL) {
	const params = parseListParams(url, SORTS, { sort: 'order', dir: 'asc' });
	const where = params.q ? like(categories.name, containsPattern(params.q)) : undefined;
	const [{ total }] = await db.select({ total: count() }).from(categories).where(where);
	const state = listState(params, total);
	const rows = await db
		.select()
		.from(categories)
		.where(where)
		.orderBy(orderBy(state.sort === 'name' ? categories.name : categories.order, state.dir))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, rows };
}

export async function categoryOptions() {
	return db
		.select({ id: categories.id, name: categories.name })
		.from(categories)
		.orderBy(asc(categories.order), asc(categories.name));
}

export async function findCategory(id: number) {
	const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
	return row ?? null;
}

const CategoryForm = z.object({
	name: requiredText(191),
	slug: optionalSlug(),
	parent_id: optionalId(),
	order: integer(0, 1_000_000)
});

type Category = typeof categories.$inferSelect;

export async function saveCategory(
	formData: FormData,
	existing: Category | null
): Promise<SaveResult<{ id: number; name: string }>> {
	const form = parseForm(CategoryForm, formData);
	if (!form.success) return rejected(form.errors, form.values);

	const slug = form.data.slug ?? slugify(form.data.name);
	const [taken] = await db
		.select({ id: categories.id })
		.from(categories)
		.where(and(eq(categories.slug, slug), existing ? ne(categories.id, existing.id) : undefined))
		.limit(1);
	if (taken) return rejected({ slug: ['Já existe uma categoria com este slug.'] }, form.values);
	if (existing && form.data.parent_id === existing.id) {
		return rejected({ parent_id: ['Uma categoria não pode ser mãe de si própria.'] }, form.values);
	}

	const values = {
		name: form.data.name,
		slug,
		parentId: form.data.parent_id,
		order: form.data.order
	};
	if (existing) {
		await db.update(categories).set(values).where(eq(categories.id, existing.id));
		return { ok: true, id: existing.id, name: values.name };
	}
	const [created] = await db.insert(categories).values(values).$returningId();
	return { ok: true, id: created.id, name: values.name };
}

export async function deleteCategory(id: number) {
	await db.delete(categories).where(eq(categories.id, id));
}
