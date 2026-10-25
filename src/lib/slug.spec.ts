import { describe, expect, it } from 'vitest';
import { SLUG_PATTERN, slugify } from './slug';

describe('slugify', () => {
	it('matches the slugs Voyager generated', () => {
		expect(slugify('Campanha de Regularização de Quotas 2022/23')).toBe(
			'campanha-de-regularizacao-de-quotas-2022-23'
		);
		expect(slugify('Órgãos Sociais')).toBe('orgaos-sociais');
		expect(slugify('  Palmarés!  ')).toBe('palmares');
	});

	it('produces valid slugs', () => {
		expect(SLUG_PATTERN.test(slugify('Comunicado: Notícias falsas'))).toBe(true);
		expect(SLUG_PATTERN.test('a--b')).toBe(false);
	});
});
