import { defineEnvVars } from '@sveltejs/kit/env';

/** Empty strings count as "not set" so `.env` files can list every key. */
function optionalString(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function flag(defaultValue: boolean) {
	return (value: string | undefined) => {
		const normalized = value?.trim().toLowerCase();
		if (!normalized) return defaultValue;
		if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
		if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
		throw new Error('Must be true or false');
	};
}

/** An http(s) origin or base URL, returned without a trailing slash. */
function httpUrl(fallback?: string) {
	return (value: string | undefined) => {
		const raw = optionalString(value) ?? fallback;
		if (raw === undefined) return undefined;
		let url: URL;
		try {
			url = new URL(raw);
		} catch {
			throw new Error('Must be an http(s) URL');
		}
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			throw new Error('Must be an http(s) URL');
		}
		return raw.replace(/\/+$/, '');
	};
}

export const variables = defineEnvVars({
	DATABASE_URL: {
		description:
			'MySQL/MariaDB connection string of the Leocadenses database (data only; schema changes go through `npm run db:migrate`).',
		schema: (value) => {
			const raw = optionalString(value);
			if (!raw || !raw.startsWith('mysql://')) throw new Error('Must be a mysql:// URL');
			return raw;
		}
	},
	SESSION_SECRET: {
		description: 'HMAC secret that signs the session cookie. At least 32 random characters.',
		schema: (value) => {
			const secret = optionalString(value);
			if (!secret || secret.length < 32) throw new Error('Must be at least 32 characters long');
			return secret;
		}
	},
	SITE_URL: {
		description:
			'Public address of the site. Used in member-card QR codes, the sitemap and social share tags.',
		schema: httpUrl('https://leocadenses.pt')
	},
	R2_ENDPOINT: {
		description: 'Cloudflare R2 S3 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
		schema: httpUrl()
	},
	R2_ACCESS_KEY_ID: {
		description: 'R2 API token access key id (Object Read & Write on the bucket).',
		schema: optionalString
	},
	R2_SECRET_ACCESS_KEY: {
		description: 'R2 API token secret access key.',
		schema: optionalString
	},
	R2_BUCKET: {
		description: 'R2 bucket. Keys are the Voyager paths stored in the database (posts/...).',
		schema: optionalString
	},
	R2_REGION: {
		description: 'R2 region. Always "auto" for Cloudflare.',
		schema: (value) => optionalString(value) ?? 'auto'
	},
	R2_PUBLIC_URL: {
		description:
			'Public domain of the bucket. Media URLs and the /storage/... redirects point here.',
		schema: httpUrl('https://cdn.leocadenses.pt')
	},
	R2_FORCE_PATH_STYLE: {
		description: 'Use path-style S3 URLs. Only for LocalStack in development.',
		schema: flag(false)
	},
	PUBLIC_TURNSTILE_SITE_KEY: {
		description: 'Cloudflare Turnstile site key of the membership form.',
		schema: (value) => optionalString(value) ?? '',
		public: true
	},
	TURNSTILE_SECRET_KEY: {
		description: 'Cloudflare Turnstile secret key. Empty: the check is skipped (development only).',
		schema: optionalString
	},
	DOMINGOASDEZ_URL: {
		description: 'Domingo às Dez site, whose API gives the next game shown on the home page.',
		schema: httpUrl('https://domingoasdez.com')
	},
	DOMINGOASDEZ_MEDIA_URL: {
		description: "Domingo às Dez's media CDN, where the next game's club emblems are.",
		schema: httpUrl('https://cdn.domingoasdez.com')
	},
	DOMINGOASDEZ_TEAM_ID: {
		description: "Leocadenses' team id on Domingo às Dez.",
		schema: (value) => {
			const id = Number(optionalString(value) ?? 2);
			if (!Number.isInteger(id) || id <= 0) throw new Error('Must be a positive integer');
			return id;
		}
	}
});
