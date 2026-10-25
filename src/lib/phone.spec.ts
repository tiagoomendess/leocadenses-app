import { describe, expect, it } from 'vitest';
import { phoneLink } from './phone';

describe('phoneLink', () => {
	it('links and groups Portuguese numbers', () => {
		expect(phoneLink('969090862')).toEqual({ href: 'tel:+351969090862', display: '969 090 862' });
		expect(phoneLink(' 969 090 862 ')).toEqual({
			href: 'tel:+351969090862',
			display: '969 090 862'
		});
		expect(phoneLink('+351 253 000 000')?.href).toBe('tel:+351253000000');
	});

	it('keeps other international numbers as typed', () => {
		expect(phoneLink('+33 6 12 34 56 78')).toEqual({
			href: 'tel:+33612345678',
			display: '+33 6 12 34 56 78'
		});
		expect(phoneLink('0033612345678')?.href).toBe('tel:+33612345678');
	});

	it('ignores empty or unusable values', () => {
		expect(phoneLink('')).toBeNull();
		expect(phoneLink(null)).toBeNull();
		expect(phoneLink('ligue-nos')).toBeNull();
	});
});
