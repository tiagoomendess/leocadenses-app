import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { settings } from '#lib/server/db/schema.ts';

/** Voyager settings the public site reads (Definições in the backoffice). */
export const SITE_SETTINGS = [
	'site.title',
	'site.description',
	'site.logo',
	'site.header_image',
	'site.google_analytics_tracking_id'
] as const;

export type SiteSettingKey = (typeof SITE_SETTINGS)[number];
export type SiteSettings = Record<SiteSettingKey, string | null>;

const TTL_MS = 60_000;
let cache: { at: number; values: SiteSettings } | null = null;

/** The site settings, cached for a minute (the backoffice clears the cache when it saves). */
export async function siteSettings(): Promise<SiteSettings> {
	if (cache && Date.now() - cache.at < TTL_MS) return cache.values;
	const rows = await db
		.select({ key: settings.key, value: settings.value })
		.from(settings)
		.where(inArray(settings.key, [...SITE_SETTINGS]));
	const values = Object.fromEntries(SITE_SETTINGS.map((key) => [key, null])) as SiteSettings;
	for (const row of rows) values[row.key as SiteSettingKey] = row.value?.trim() || null;
	cache = { at: Date.now(), values };
	return values;
}

export function clearSettingsCache() {
	cache = null;
}
