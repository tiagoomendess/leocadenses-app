import { DOMINGOASDEZ_MEDIA_URL, DOMINGOASDEZ_TEAM_ID, DOMINGOASDEZ_URL } from '$app/env/private';

/**
 * The club's next game, from Domingo às Dez's legacy API (`GET /api/games/next/{team_id}`), as
 * the old HomeController did. Cached for five minutes; any failure shows "no game" instead of
 * breaking the home page.
 */
export type NextGame = {
	homeTeam: string;
	awayTeam: string;
	homeEmblem: string | null;
	awayEmblem: string | null;
	ground: string | null;
	/** Naive `YYYY-MM-DD HH:MM` (Lisbon wall clock), or null when the API sends none. */
	date: string | null;
};

type ApiResponse = {
	has_game?: boolean;
	home_team?: string;
	away_team?: string;
	home_emblem?: string;
	away_emblem?: string;
	away_team_emblem?: string;
	ground?: string;
	date?: string;
};

const TTL_MS = 5 * 60_000;
const TIMEOUT_MS = 5_000;
let cache: { at: number; game: NextGame | null } | null = null;

/**
 * Emblems come as site paths. Uploads (`/storage/...`) live on Domingo às Dez's CDN (its site
 * only redirects them to a legacy origin); other paths (the default emblem) on the site itself.
 * The old view glued them onto the site URL with a double slash, so they never showed.
 */
export function emblemUrl(
	path: string | undefined,
	siteBase: string,
	mediaBase: string
): string | null {
	if (!path) return null;
	if (/^https?:\/\//i.test(path)) return path;
	const base = path.startsWith('/storage/') ? mediaBase : siteBase;
	try {
		return new URL(path, `${base.replace(/\/+$/, '')}/`).href;
	} catch {
		return null;
	}
}

/** `2026/11/01 10:00` → `2026-11-01 10:00`. */
export function apiDate(value: string | undefined): string | null {
	const match = value?.match(/^(\d{4})[/-](\d{2})[/-](\d{2})(?:\s+(\d{2}):(\d{2}))?/);
	if (!match) return null;
	const [, y, mo, d, h = '00', mi = '00'] = match;
	return `${y}-${mo}-${d} ${h}:${mi}`;
}

export function parseNextGame(
	body: ApiResponse,
	siteBase: string,
	mediaBase: string
): NextGame | null {
	if (!body.has_game || !body.home_team || !body.away_team) return null;
	return {
		homeTeam: body.home_team,
		awayTeam: body.away_team,
		homeEmblem: emblemUrl(body.home_emblem, siteBase, mediaBase),
		awayEmblem: emblemUrl(body.away_team_emblem ?? body.away_emblem, siteBase, mediaBase),
		ground: body.ground?.trim() || null,
		date: apiDate(body.date)
	};
}

export async function nextGame(fetchImpl: typeof fetch = fetch): Promise<NextGame | null> {
	if (cache && Date.now() - cache.at < TTL_MS) return cache.game;
	const base = DOMINGOASDEZ_URL ?? 'https://domingoasdez.com';
	const media = DOMINGOASDEZ_MEDIA_URL ?? 'https://cdn.domingoasdez.com';
	let game: NextGame | null = null;
	try {
		const response = await fetchImpl(`${base}/api/games/next/${DOMINGOASDEZ_TEAM_ID}`, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
			headers: { accept: 'application/json' }
		});
		if (response.ok) game = parseNextGame((await response.json()) as ApiResponse, base, media);
	} catch (error) {
		console.error('next game: Domingo às Dez did not answer', error);
	}
	cache = { at: Date.now(), game };
	return game;
}
