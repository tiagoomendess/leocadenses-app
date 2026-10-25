import { and, count, desc, eq, like, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import { slugify } from '#lib/slug.ts';
import { editorHtml, isBlankHtml, storedHtml } from '#lib/server/cms/index.ts';
import { db } from '#lib/server/db/index.ts';
import { pages, pageStatuses, posts, postStatuses } from '#lib/server/db/schema.ts';
import { checkbox, parseForm } from '#lib/server/forms.ts';
import {
	containsPattern,
	listState,
	orderBy,
	pageOffset,
	parseListParams
} from '#lib/server/list.ts';
import { IMAGE_LIMITS } from '#lib/server/storage/images.ts';
import { deleteFile, mediaUrl, STORAGE_FOLDERS } from '#lib/server/storage/index.ts';
import { optionalId, optionalText, requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { oneOf, optionalSlug } from './fields';
import { imageInput, storeUpload } from './uploads';

/** Pages the site uses as blocks of other pages: they keep their slug and cannot be deleted. */
export const SYSTEM_PAGES = ['home', 'member-application'] as const;
export const isSystemPage = (slug: string) => (SYSTEM_PAGES as readonly string[]).includes(slug);

const body = (max = 65_535) =>
	z
		.string()
		.max(max)
		.optional()
		.transform((value) => value ?? '');

// ---------------------------------------------------------------------------------------------
// Posts ("Notícias")

const POST_SORTS = ['id', 'title', 'status'] as const;

export async function listPosts(url: URL) {
	const params = parseListParams(url, POST_SORTS, { sort: 'id', dir: 'desc' });
	const status = postStatuses.find((value) => value === url.searchParams.get('status')) ?? null;
	const where = and(
		params.q
			? or(
					like(posts.title, containsPattern(params.q)),
					like(posts.slug, containsPattern(params.q))
				)
			: undefined,
		status ? eq(posts.status, status) : undefined
	);
	const [{ total }] = await db.select({ total: count() }).from(posts).where(where);
	const state = listState(params, total);
	const column = { id: posts.id, title: posts.title, status: posts.status }[
		state.sort as (typeof POST_SORTS)[number]
	];
	const rows = await db
		.select({
			id: posts.id,
			title: posts.title,
			slug: posts.slug,
			status: posts.status,
			featured: posts.featured,
			image: posts.image,
			createdAt: posts.createdAt
		})
		.from(posts)
		.where(where)
		.orderBy(orderBy(column, state.dir), desc(posts.id))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, status, rows: rows.map((row) => ({ ...row, image: mediaUrl(row.image) })) };
}

export async function findPost(id: number) {
	const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	return row ?? null;
}

/** The post as the form edits it: body with loadable image URLs, picture URL. */
export function postFormValues(post: typeof posts.$inferSelect) {
	return { ...post, body: editorHtml(post.body), imageUrl: mediaUrl(post.image) };
}

const PostForm = z.object({
	title: requiredText(191),
	slug: optionalSlug(),
	category_id: optionalId(),
	excerpt: optionalText(65_535),
	body: body(),
	seo_title: optionalText(191),
	meta_description: optionalText(65_535),
	meta_keywords: optionalText(65_535),
	status: oneOf(postStatuses),
	featured: checkbox,
	image: imageInput(),
	remove_image: checkbox
});

type Post = typeof posts.$inferSelect;

export async function savePost(
	formData: FormData,
	existing: Post | null,
	authorId: number
): Promise<SaveResult<{ id: number; title: string }>> {
	const form = parseForm(PostForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;

	const html = storedHtml(data.body);
	if (isBlankHtml(html)) return rejected({ body: ['Escreva o texto da notícia.'] }, form.values);

	const slug = data.slug ?? slugify(data.title);
	if (!slug) return rejected({ slug: ['Indique um slug.'] }, form.values);
	const [taken] = await db
		.select({ id: posts.id })
		.from(posts)
		.where(and(eq(posts.slug, slug), existing ? ne(posts.id, existing.id) : undefined))
		.limit(1);
	if (taken) return rejected({ slug: ['Já existe uma notícia com este slug.'] }, form.values);

	const stored = await storeUpload(data.image, {
		folder: STORAGE_FOLDERS.posts,
		resize: { fit: 'inside', maxSize: IMAGE_LIMITS.contentMaxSize }
	});
	if (stored && 'error' in stored) return rejected({ image: [stored.error] }, form.values);
	const image = stored?.key ?? (data.remove_image ? null : (existing?.image ?? null));

	const values = {
		title: data.title,
		slug,
		categoryId: data.category_id,
		excerpt: data.excerpt,
		body: html,
		seoTitle: data.seo_title,
		metaDescription: data.meta_description,
		metaKeywords: data.meta_keywords,
		status: data.status,
		featured: data.featured,
		image
	};
	if (existing) {
		await db.update(posts).set(values).where(eq(posts.id, existing.id));
		if (existing.image && existing.image !== image) await deleteFile(existing.image);
		return { ok: true, id: existing.id, title: values.title };
	}
	const [created] = await db
		.insert(posts)
		.values({ ...values, authorId })
		.$returningId();
	return { ok: true, id: created.id, title: values.title };
}

export async function deletePost(post: Post) {
	await db.delete(posts).where(eq(posts.id, post.id));
	await deleteFile(post.image);
}

// ---------------------------------------------------------------------------------------------
// Pages ("Páginas")

const PAGE_SORTS = ['title', 'status', 'id'] as const;

export async function listPages(url: URL) {
	const params = parseListParams(url, PAGE_SORTS, { sort: 'title', dir: 'asc' });
	const where = params.q
		? or(like(pages.title, containsPattern(params.q)), like(pages.slug, containsPattern(params.q)))
		: undefined;
	const [{ total }] = await db.select({ total: count() }).from(pages).where(where);
	const state = listState(params, total);
	const column = { title: pages.title, status: pages.status, id: pages.id }[
		state.sort as (typeof PAGE_SORTS)[number]
	];
	const rows = await db
		.select({
			id: pages.id,
			title: pages.title,
			slug: pages.slug,
			status: pages.status,
			updatedAt: pages.updatedAt
		})
		.from(pages)
		.where(where)
		.orderBy(orderBy(column, state.dir))
		.limit(state.pageSize)
		.offset(pageOffset(state));
	return { list: state, rows };
}

export async function findPage(id: number) {
	const [row] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
	return row ?? null;
}

export function pageFormValues(page: typeof pages.$inferSelect) {
	return { ...page, body: editorHtml(page.body), imageUrl: mediaUrl(page.image) };
}

const PageForm = z.object({
	title: requiredText(191),
	slug: optionalSlug(),
	excerpt: optionalText(65_535),
	body: body(),
	meta_description: optionalText(65_535),
	meta_keywords: optionalText(65_535),
	status: oneOf(pageStatuses),
	image: imageInput(),
	remove_image: checkbox
});

type Page = typeof pages.$inferSelect;

export async function savePage(
	formData: FormData,
	existing: Page | null,
	authorId: number
): Promise<SaveResult<{ id: number; title: string }>> {
	const form = parseForm(PageForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;

	// The home page and the membership form find their block by slug.
	const slug =
		existing && isSystemPage(existing.slug) ? existing.slug : (data.slug ?? slugify(data.title));
	if (!slug) return rejected({ slug: ['Indique um slug.'] }, form.values);
	const [taken] = await db
		.select({ id: pages.id })
		.from(pages)
		.where(and(eq(pages.slug, slug), existing ? ne(pages.id, existing.id) : undefined))
		.limit(1);
	if (taken) return rejected({ slug: ['Já existe uma página com este slug.'] }, form.values);

	const stored = await storeUpload(data.image, {
		folder: STORAGE_FOLDERS.pages,
		resize: { fit: 'inside', maxSize: IMAGE_LIMITS.contentMaxSize }
	});
	if (stored && 'error' in stored) return rejected({ image: [stored.error] }, form.values);
	const image = stored?.key ?? (data.remove_image ? null : (existing?.image ?? null));

	const values = {
		title: data.title,
		slug,
		excerpt: data.excerpt,
		body: storedHtml(data.body),
		metaDescription: data.meta_description,
		metaKeywords: data.meta_keywords,
		status: data.status,
		image
	};
	if (existing) {
		await db.update(pages).set(values).where(eq(pages.id, existing.id));
		if (existing.image && existing.image !== image) await deleteFile(existing.image);
		return { ok: true, id: existing.id, title: values.title };
	}
	const [created] = await db
		.insert(pages)
		.values({ ...values, authorId })
		.$returningId();
	return { ok: true, id: created.id, title: values.title };
}

export async function deletePage(page: Page) {
	await db.delete(pages).where(eq(pages.id, page.id));
	await deleteFile(page.image);
}
