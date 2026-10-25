import { R2_PUBLIC_URL } from '$app/env/private';
import {
	replaceLegacyIcons,
	sanitizeHtml,
	toDisplayHtml,
	toStoredHtml,
	trimTrailingEmptyParagraphs
} from './html';

export { isBlankHtml, plainText } from './html';

const cdn = () => R2_PUBLIC_URL ?? '';

/** Stored body → safe HTML for a public page, uploads loaded from the CDN. */
export function renderHtml(stored: string | null | undefined): string {
	return stored ? sanitizeHtml(replaceLegacyIcons(toDisplayHtml(stored, cdn()))) : '';
}

/** Stored body → editor value (upload paths become loadable URLs). */
export function editorHtml(stored: string | null | undefined): string {
	return stored ? toDisplayHtml(stored, cdn()) : '';
}

/** Submitted editor HTML → stored body: upload paths, sanitised, no trailing empty paragraph. */
export function storedHtml(submitted: string): string {
	return trimTrailingEmptyParagraphs(sanitizeHtml(toStoredHtml(submitted, cdn())));
}
