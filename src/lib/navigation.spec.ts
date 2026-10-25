import { describe, expect, it } from 'vitest';
import { isTabRoot, parentOf, tabFromPath } from './navigation';

describe('navigation', () => {
	it('maps legacy paths to their tab', () => {
		expect(tabFromPath('/')).toBe('home');
		expect(tabFromPath('/posts')).toBe('news');
		expect(tabFromPath('/posts/rifas-de-natal-2022')).toBe('news');
		expect(tabFromPath('/pages/palmares')).toBe('club');
		expect(tabFromPath('/novo-socio')).toBe('member');
		expect(tabFromPath('/c/abcDEF123')).toBeNull();
		expect(tabFromPath('/postsx')).toBeNull();
	});

	it('goes back to the owning tab', () => {
		expect(parentOf('/posts/rifas-de-natal-2022')).toBe('/posts');
		expect(parentOf('/pages/contactos')).toBe('/clube');
		expect(parentOf('/c/abcDEF123')).toBe('/');
	});

	it('knows the tab roots', () => {
		expect(isTabRoot('/clube')).toBe(true);
		expect(isTabRoot('/pages/contactos')).toBe(false);
	});
});
