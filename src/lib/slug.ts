/**
 * URL slug of a title, like Voyager's `slugify` field option (Laravel's `Str::slug`):
 * "Campanha de Regularização 2022/23" → "campanha-de-regularizacao-2022-23".
 */
export function slugify(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 180);
}

/** Lowercase letters, digits and single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
