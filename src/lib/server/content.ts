import { and, asc, count, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { menuItems, menus, pages, partners, posts } from '#lib/server/db/schema.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import { plainText, renderHtml } from '#lib/server/cms/index.ts';

/** Fallback picture of posts without an image (the old site's). */
export const DEFAULT_POST_IMAGE = '/images/post_default.jpg';

export type PostCard = {
	slug: string;
	title: string;
	summary: string;
	image: string;
	createdAt: string | null;
};

const cardColumns = {
	slug: posts.slug,
	title: posts.title,
	metaDescription: posts.metaDescription,
	excerpt: posts.excerpt,
	image: posts.image,
	createdAt: posts.createdAt
};

type CardRow = {
	slug: string;
	title: string;
	metaDescription: string | null;
	excerpt: string | null;
	image: string | null;
	createdAt: string | null;
};

function toCard(row: CardRow): PostCard {
	return {
		slug: row.slug,
		title: row.title,
		summary: row.metaDescription?.trim() || plainText(row.excerpt ?? '', 180),
		image: mediaUrl(row.image) ?? DEFAULT_POST_IMAGE,
		createdAt: row.createdAt
	};
}

const isPublished = eq(posts.status, 'PUBLISHED');

/** Published posts, newest first (`PostController::index`: `orderBy('id', 'desc')`). */
export async function publishedPosts(page: number, perPage: number) {
	const [rows, [{ total }]] = await Promise.all([
		db
			.select(cardColumns)
			.from(posts)
			.where(isPublished)
			.orderBy(desc(posts.id))
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ total: count() }).from(posts).where(isPublished)
	]);
	return { posts: rows.map(toCard), total, lastPage: Math.max(1, Math.ceil(total / perPage)) };
}

export async function latestPosts(limit: number): Promise<PostCard[]> {
	const rows = await db
		.select(cardColumns)
		.from(posts)
		.where(isPublished)
		.orderBy(desc(posts.id))
		.limit(limit);
	return rows.map(toCard);
}

/**
 * A post by slug. The old site showed drafts to anyone who knew the slug; now only published
 * posts are public and drafts are a preview for users who can read posts.
 */
export async function findPost(slug: string, canPreview: boolean) {
	const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
	if (!post || (post.status !== 'PUBLISHED' && !canPreview)) return null;
	return {
		slug: post.slug,
		title: post.title,
		seoTitle: post.seoTitle,
		description: post.metaDescription?.trim() || plainText(post.excerpt || post.body, 160) || null,
		keywords: post.metaKeywords,
		image: mediaUrl(post.image),
		html: renderHtml(post.body),
		createdAt: post.createdAt,
		preview: post.status !== 'PUBLISHED'
	};
}

/** A page by slug: `ACTIVE` ones, or any as a preview for users who can read pages. */
export async function findPage(slug: string, canPreview: boolean) {
	const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
	if (!page || (page.status !== 'ACTIVE' && !canPreview)) return null;
	return {
		slug: page.slug,
		title: page.title,
		description: page.metaDescription?.trim() || plainText(page.excerpt || page.body || '', 160),
		keywords: page.metaKeywords,
		image: mediaUrl(page.image),
		html: renderHtml(page.body),
		preview: page.status !== 'ACTIVE'
	};
}

/** The body of a page used as a content block (`home`, `member-application`), when active. */
export async function pageBlock(slug: string): Promise<string> {
	const [page] = await db
		.select({ body: pages.body })
		.from(pages)
		.where(and(eq(pages.slug, slug), eq(pages.status, 'ACTIVE')))
		.limit(1);
	return renderHtml(page?.body);
}

export type PartnerLogo = { name: string; url: string | null; picture: string };

/** Visible partners by position, as in the old footer. */
export async function visiblePartners(): Promise<PartnerLogo[]> {
	const rows = await db
		.select({ name: partners.name, url: partners.url, picture: partners.picture })
		.from(partners)
		.where(eq(partners.visible, true))
		.orderBy(asc(partners.position), asc(partners.id));
	return rows.flatMap((row) => {
		const picture = mediaUrl(row.picture);
		const url = row.url && row.url !== '#' ? row.url : null;
		return picture ? [{ name: row.name, url, picture }] : [];
	});
}

export type MenuLink = { title: string; url: string; target: string };

/**
 * The `site` menu's sub-items (Voyager's menu builder: "O Clube" → Órgãos Sociais, Palmarés,
 * Contactos). Top-level items are the dock now; their children are listed on /clube.
 */
export async function clubLinks(): Promise<MenuLink[]> {
	const rows = await db
		.select({
			id: menuItems.id,
			title: menuItems.title,
			url: menuItems.url,
			target: menuItems.target,
			parentId: menuItems.parentId,
			order: menuItems.order
		})
		.from(menuItems)
		.innerJoin(menus, eq(menus.id, menuItems.menuId))
		.where(and(eq(menus.name, 'site'), isNotNull(menuItems.parentId)))
		.orderBy(asc(menuItems.parentId), asc(menuItems.order));
	return rows
		.filter((row) => row.url && row.url !== '#')
		.map((row) => ({ title: row.title, url: row.url, target: row.target || '_self' }));
}
