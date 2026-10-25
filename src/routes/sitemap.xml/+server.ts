import { and, desc, eq, notInArray } from 'drizzle-orm';
import { SITE_URL } from '$app/env/private';
import { db } from '#lib/server/db/index.ts';
import { pages, posts } from '#lib/server/db/schema.ts';
import type { RequestHandler } from './$types';

/** Pages used as blocks of other pages (home, membership form) are not listed on their own. */
const BLOCK_PAGES = ['home', 'member-application'];

type Entry = { path: string; lastmod?: string | null; changefreq: string; priority: string };

const escapeXml = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The old site had a static sitemap with six URLs; this one also lists every news post. */
export const GET: RequestHandler = async () => {
	const [pageRows, postRows] = await Promise.all([
		db
			.select({ slug: pages.slug, updatedAt: pages.updatedAt })
			.from(pages)
			.where(and(eq(pages.status, 'ACTIVE'), notInArray(pages.slug, BLOCK_PAGES))),
		db
			.select({ slug: posts.slug, updatedAt: posts.updatedAt })
			.from(posts)
			.where(eq(posts.status, 'PUBLISHED'))
			.orderBy(desc(posts.id))
	]);

	const entries: Entry[] = [
		{ path: '/', changefreq: 'daily', priority: '1.0' },
		{ path: '/novo-socio', changefreq: 'monthly', priority: '0.9' },
		{ path: '/posts', changefreq: 'weekly', priority: '0.8' },
		{ path: '/clube', changefreq: 'monthly', priority: '0.7' },
		...pageRows.map((row) => ({
			path: `/pages/${encodeURIComponent(row.slug)}`,
			lastmod: row.updatedAt,
			changefreq: 'yearly',
			priority: '0.7'
		})),
		...postRows.map((row) => ({
			path: `/posts/${encodeURIComponent(row.slug)}`,
			lastmod: row.updatedAt,
			changefreq: 'yearly',
			priority: '0.6'
		}))
	];

	const base = SITE_URL ?? 'https://leocadenses.pt';
	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries.map((entry) =>
			[
				'<url>',
				`<loc>${escapeXml(base + entry.path)}</loc>`,
				entry.lastmod ? `<lastmod>${entry.lastmod.slice(0, 10)}</lastmod>` : '',
				`<changefreq>${entry.changefreq}</changefreq>`,
				`<priority>${entry.priority}</priority>`,
				'</url>'
			].join('')
		),
		'</urlset>'
	].join('\n');

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
