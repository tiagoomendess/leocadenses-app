import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/private', () => ({
	DOMINGOASDEZ_URL: 'https://domingoasdez.com',
	DOMINGOASDEZ_MEDIA_URL: 'https://cdn.domingoasdez.com',
	DOMINGOASDEZ_TEAM_ID: 2
}));

const { apiDate, emblemUrl, parseNextGame } = await import('./next-game');

const SITE = 'https://domingoasdez.com';
const CDN = 'https://cdn.domingoasdez.com';

describe('parseNextGame', () => {
	it('reads the legacy API answer', () => {
		expect(
			parseNextGame(
				{
					has_game: true,
					home_team: 'Negreiros',
					home_emblem: '/storage/media/images/negreiros.png',
					away_team: 'Leocadenses',
					away_team_emblem: '/storage/media/images/leocadenses.png',
					ground: 'Campo de Negreiros',
					date: '2026/11/01 10:00'
				},
				SITE,
				CDN
			)
		).toEqual({
			homeTeam: 'Negreiros',
			awayTeam: 'Leocadenses',
			homeEmblem: 'https://cdn.domingoasdez.com/storage/media/images/negreiros.png',
			awayEmblem: 'https://cdn.domingoasdez.com/storage/media/images/leocadenses.png',
			ground: 'Campo de Negreiros',
			date: '2026-11-01 10:00'
		});
	});

	it('is null without a game', () => {
		expect(parseNextGame({ has_game: false }, SITE, CDN)).toBeNull();
	});
});

describe('helpers', () => {
	it('builds emblem URLs without the old double slash', () => {
		expect(emblemUrl('/images/default-emblem.png', SITE, CDN)).toBe(
			'https://domingoasdez.com/images/default-emblem.png'
		);
		expect(emblemUrl(undefined, SITE, CDN)).toBeNull();
	});

	it('normalises the API date', () => {
		expect(apiDate('2026/11/01 10:00')).toBe('2026-11-01 10:00');
		expect(apiDate('soon')).toBeNull();
	});
});
