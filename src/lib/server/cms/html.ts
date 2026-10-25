import DOMPurify from 'isomorphic-dompurify';
import { encodeKey, keyFromPath } from '#lib/server/storage/paths.ts';

/**
 * Post and page bodies are HTML written in an editor (Voyager's TinyMCE, now TipTap) and shown
 * raw. They reference uploads by `/storage/<key>` path (the old site also wrote absolute
 * `https://leocadenses.pt/storage/...` URLs). These pure helpers convert between what is stored,
 * what the editor loads and what pages render; `#lib/server/cms/index.ts` binds them to the CDN.
 */

/** Hosts whose iframes bodies may embed (a Google Form in a 2022 post, YouTube videos). */
const IFRAME_HOSTS = new Set([
	'docs.google.com',
	'www.youtube.com',
	'youtube.com',
	'www.youtube-nocookie.com'
]);

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
	if (data.tagName !== 'iframe') return;
	const element = node as Element;
	let host = '';
	try {
		host = new URL(element.getAttribute('src') ?? '').hostname;
	} catch {
		// Relative or invalid: not an allowed embed.
	}
	if (!IFRAME_HOSTS.has(host)) element.parentNode?.removeChild(element);
});

export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true },
		ADD_TAGS: ['iframe', 'video', 'source'],
		ADD_ATTR: [
			'target',
			'allow',
			'allowfullscreen',
			'frameborder',
			'scrolling',
			'marginheight',
			'marginwidth',
			'controls',
			'playsinline',
			'poster',
			'width',
			'height',
			'border',
			'cellpadding',
			'cellspacing',
			'align'
		]
	});
}

const ATTRIBUTE_URL = /\b(src|href|poster)=(["'])\s*([^"']*?)\s*\2/gi;
/** Upload URLs the old site wrote: absolute on its domain, root-relative or relative. */
const LEGACY_STORAGE = /^(?:https?:\/\/(?:www\.)?leocadenses\.pt)?\/?(storage\/.+)$/i;

function storedKey(url: string): string | null {
	const match = LEGACY_STORAGE.exec(url);
	return match ? keyFromPath(match[1]) : null;
}

/** Stored body → HTML that loads uploads straight from `cdnBase`. */
export function toDisplayHtml(html: string, cdnBase: string): string {
	const base = cdnBase.replace(/\/+$/, '');
	return html.replace(ATTRIBUTE_URL, (match, attr: string, quote: string, url: string) => {
		const key = storedKey(url);
		return key ? `${attr}=${quote}${base}/${encodeKey(key)}${quote}` : match;
	});
}

/**
 * Materialize icon ligatures of legacy bodies: `<i class="material-icons">phone</i>`, or `<em>`
 * once TinyMCE had normalised the `<i>`.
 */
const MATERIAL_ICON =
	/<(i|em)\b[^>]*class=(["'])[^"']*\bmaterial-icons\b[^"']*\2[^>]*>\s*([a-z_]+)\s*<\/\1>/gi;

/**
 * The site no longer loads the Material Icons font, which would show the ligature as a word
 * ("phone"). Icons become a styled span (`.cms .cms-icon-<name>` in layout.css).
 */
export function replaceLegacyIcons(html: string): string {
	return html.replace(
		MATERIAL_ICON,
		(_match, _tag: string, _quote: string, name: string) =>
			`<span class="cms-icon cms-icon-${name.toLowerCase()}" aria-hidden="true"></span>`
	);
}

/** Inverse of `toDisplayHtml` for editor output: CDN and legacy upload URLs → `/storage/<key>`. */
export function toStoredHtml(html: string, cdnBase: string): string {
	const base = cdnBase.replace(/\/+$/, '');
	return html.replace(ATTRIBUTE_URL, (match, attr: string, quote: string, url: string) => {
		const key = url.startsWith(`${base}/`)
			? keyFromPath(url.slice(base.length + 1).split(/[?#]/)[0])
			: storedKey(url);
		return key ? `${attr}=${quote}/storage/${encodeKey(key)}${quote}` : match;
	});
}

/** The editor always keeps an empty paragraph at the end; it is not stored. */
export function trimTrailingEmptyParagraphs(html: string): string {
	return html.replace(/(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+\s*$/i, '');
}

/** True when a body has no text and nothing visible (an image, video, embed, table or rule). */
export function isBlankHtml(html: string): boolean {
	return !html.replace(/<[^>]*>|&nbsp;|\s/g, '') && !/<(img|video|iframe|table|hr)\b/i.test(html);
}

/** Plain text of a body, cut to `length` characters (for descriptions and previews). */
export function plainText(html: string, length = 160): string {
	const blocks = html.replace(/<\/(p|h[1-6]|li|div|blockquote|tr|td|th)>|<br\s*\/?>/gi, '$& ');
	const fragment = DOMPurify.sanitize(blocks, { RETURN_DOM_FRAGMENT: true });
	const text = (fragment.textContent ?? '').replace(/\s+/g, ' ').trim();
	const chars = Array.from(text);
	return chars.length > length
		? `${chars
				.slice(0, length - 1)
				.join('')
				.trimEnd()}…`
		: text;
}
