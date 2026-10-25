import { asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { settings } from '#lib/server/db/schema.ts';
import { clearSettingsCache } from '#lib/server/settings.ts';
import { IMAGE_LIMITS } from '#lib/server/storage/images.ts';
import { deleteFile, mediaUrl, STORAGE_FOLDERS } from '#lib/server/storage/index.ts';
import { storeUpload } from './uploads';

/** What each setting is for, shown under its field. Voyager's `admin.*` ones styled Voyager. */
const HINTS: Record<string, string> = {
	'site.title': 'Nome do site, no título das páginas.',
	'site.description': 'Descrição curta do site.',
	'site.logo': 'Emblema mostrado na página inicial e no clube.',
	'site.header_image': 'Fotografia grande do topo da página inicial.',
	'site.google_analytics_tracking_id': 'Não usado pelo novo site.'
};

export type SettingField = {
	id: number;
	key: string;
	label: string;
	type: 'text' | 'text_area' | 'image' | 'checkbox';
	value: string | null;
	imageUrl: string | null;
	hint: string | null;
};

const asType = (type: string): SettingField['type'] =>
	type === 'image' || type === 'text_area' || type === 'checkbox' ? type : 'text';

/** Settings grouped as in Voyager (Site, Admin, ...). */
export async function settingGroups() {
	const rows = await db.select().from(settings).orderBy(asc(settings.group), asc(settings.order));
	const groups = new Map<string, SettingField[]>();
	for (const row of rows) {
		const group = row.group ?? 'Outras';
		if (!groups.has(group)) groups.set(group, []);
		groups.get(group)!.push({
			id: row.id,
			key: row.key,
			label: row.displayName,
			type: asType(row.type),
			value: row.value,
			imageUrl: row.type === 'image' ? mediaUrl(row.value) : null,
			hint:
				HINTS[row.key] ??
				(row.key.startsWith('admin.') ? 'Aspeto do antigo Voyager; não usado.' : null)
		});
	}
	// The site's own settings first.
	return [...groups]
		.sort(([a], [b]) => (a === 'Site' ? -1 : b === 'Site' ? 1 : a.localeCompare(b)))
		.map(([group, fields]) => ({ group, fields }));
}

/**
 * Saves every submitted setting: `setting-<id>` text values, `image-<id>` uploads (replacing
 * the previous file) and `remove-<id>` to clear an image.
 */
export async function saveSettings(formData: FormData): Promise<Record<string, string[]>> {
	const errors: Record<string, string[]> = {};
	const rows = await db.select().from(settings);
	for (const row of rows) {
		const type = asType(row.type);
		if (type === 'image') {
			const file = formData.get(`image-${row.id}`);
			if (file instanceof File && file.size > 0) {
				const stored = await storeUpload(file, {
					folder: STORAGE_FOLDERS.settings,
					resize: {
						fit: 'inside',
						maxSize:
							row.key === 'site.header_image'
								? IMAGE_LIMITS.contentMaxSize
								: IMAGE_LIMITS.logoMaxSize
					}
				});
				if (stored && 'error' in stored) {
					errors[`image-${row.id}`] = [stored.error];
					continue;
				}
				if (stored) {
					await db.update(settings).set({ value: stored.key }).where(eq(settings.id, row.id));
					await deleteFile(row.value);
				}
			} else if (formData.get(`remove-${row.id}`) === 'on' && row.value) {
				await db.update(settings).set({ value: null }).where(eq(settings.id, row.id));
				await deleteFile(row.value);
			}
			continue;
		}
		const field = `setting-${row.id}`;
		const submitted =
			type === 'checkbox' ? (formData.get(field) === 'on' ? '1' : '0') : formData.get(field);
		if (typeof submitted !== 'string') continue;
		const value = submitted.trim() || null;
		if (value !== row.value) {
			await db.update(settings).set({ value }).where(eq(settings.id, row.id));
		}
	}
	clearSettingsCache();
	return errors;
}
