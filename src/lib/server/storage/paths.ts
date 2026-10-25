/**
 * Storage keys and URLs. The database keeps Voyager's paths, relative to Laravel's public disk
 * (`posts/October2021/olxc74JEO4liJ7AGEuV7.png`); the R2 object key is that same path, and the
 * public URL is the key under the bucket's custom domain (R2_PUBLIC_URL). The old site served
 * them under `/storage/`, which now redirects to the CDN.
 */

/** Folders Voyager and the old site wrote to. */
export const STORAGE_FOLDERS = {
	posts: 'posts',
	pages: 'pages',
	partners: 'partners',
	settings: 'settings',
	users: 'users',
	memberCards: 'members/cards'
} as const;

/** Keys never change content (new uploads get new names), so the CDN can cache them forever. */
export const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable';

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** `length` random letters and digits (Laravel's `Str::random`). */
export function randomAlphanumeric(length: number): string {
	// 248 is the largest multiple of 62 below 256: rejecting bytes above it keeps the draw uniform.
	let result = '';
	while (result.length < length) {
		for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
			if (byte < 248 && result.length < length) result += ALPHANUMERIC[byte % 62];
		}
	}
	return result;
}

/** Validates an object key: relative, no `.`/`..`/empty segments, no backslashes. */
export function storageKey(key: string): string {
	if (!key || key.startsWith('/') || key.includes('\\')) {
		throw new Error(`Unsafe storage key: ${key}`);
	}
	if (key.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) {
		throw new Error(`Unsafe storage key: ${key}`);
	}
	return key;
}

export function isSafeKey(key: string): boolean {
	try {
		storageKey(key);
		return true;
	} catch {
		return false;
	}
}

/**
 * A new, never reused key in Voyager's layout: `folder/MonthYYYY/<20 random>.ext`
 * (`posts/October2026/aB3dE5fG7hJ9kL1mN3pQ.jpg`).
 */
export function newKey(folder: string, extension: string, now: Date = new Date()): string {
	const ext = extension.replace(/^\./, '').toLowerCase();
	if (!/^[a-z0-9]{1,8}$/.test(ext)) throw new Error(`Invalid file extension: ${extension}`);
	const month = `${MONTHS[now.getUTCMonth()]}${now.getUTCFullYear()}`;
	return storageKey(
		`${folder.replace(/^\/+|\/+$/g, '')}/${month}/${randomAlphanumeric(20)}.${ext}`
	);
}

/** Percent-encodes each segment of a key for use in a URL path. */
export function encodeKey(key: string): string {
	return key.split('/').map(encodeURIComponent).join('/');
}

/**
 * The public URL of a stored file: the key under `publicBaseUrl`. Absolute http(s) URLs pass
 * through (legacy fields sometimes hold them); empty values give null.
 */
export function publicUrl(value: string | null | undefined, publicBaseUrl: string): string | null {
	if (!value) return null;
	if (/^https?:\/\//i.test(value)) return value;
	const key = keyFromPath(value);
	return key ? `${publicBaseUrl.replace(/\/+$/, '')}/${encodeKey(key)}` : null;
}

/** Named entities TinyMCE wrote into attribute values (Portuguese letters, mostly). */
const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	quot: '"',
	apos: "'",
	lt: '<',
	gt: '>',
	nbsp: ' ',
	aacute: 'á',
	agrave: 'à',
	acirc: 'â',
	atilde: 'ã',
	eacute: 'é',
	ecirc: 'ê',
	iacute: 'í',
	oacute: 'ó',
	ocirc: 'ô',
	otilde: 'õ',
	uacute: 'ú',
	ccedil: 'ç',
	Aacute: 'Á',
	Agrave: 'À',
	Acirc: 'Â',
	Atilde: 'Ã',
	Eacute: 'É',
	Ecirc: 'Ê',
	Iacute: 'Í',
	Oacute: 'Ó',
	Ocirc: 'Ô',
	Otilde: 'Õ',
	Uacute: 'Ú',
	Ccedil: 'Ç'
};

/** Decodes the HTML entities of an attribute value (`Captura de ecr&atilde;.png`). */
export function decodeHtmlEntities(value: string): string {
	return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
		if (entity[0] === '#') {
			const code =
				entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
			return Number.isFinite(code) && code > 0 && code <= 0x10ffff
				? String.fromCodePoint(code)
				: match;
		}
		return NAMED_ENTITIES[entity] ?? match;
	});
}

/**
 * The key behind a stored value or a legacy URL path: `posts/x.jpg`, `/storage/posts/x.jpg`,
 * `storage/posts/x.jpg`, also percent-encoded or with HTML entities. Null when it is not a safe
 * key.
 */
export function keyFromPath(value: string): string | null {
	let key = decodeHtmlEntities(value.trim()).replace(/^\/+/, '');
	if (key.startsWith('storage/')) key = key.slice('storage/'.length);
	try {
		key = decodeURIComponent(key);
	} catch {
		return null;
	}
	return isSafeKey(key) ? key : null;
}

const CONTENT_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	ico: 'image/x-icon',
	pdf: 'application/pdf'
};

/** Content type from a key's extension (for files uploaded as-is). */
export function contentTypeFor(key: string): string {
	const ext = key.split('.').pop()?.toLowerCase() ?? '';
	return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}
