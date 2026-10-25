import { describe, expect, it } from 'vitest';
import { loginUrl, safeRedirectPath } from './redirect';

describe('safeRedirectPath', () => {
	it('keeps same-origin paths with query and hash', () => {
		expect(safeRedirectPath('/admin/members?page=2#top')).toBe('/admin/members?page=2#top');
	});

	it.each([
		null,
		undefined,
		'',
		'members',
		'//evil.example',
		'/\\evil.example',
		'https://evil.example/x',
		'javascript:alert(1)'
	])('falls back for %s', (value) => {
		expect(safeRedirectPath(value)).toBe('/admin');
		expect(safeRedirectPath(value, '/')).toBe('/');
	});
});

describe('loginUrl', () => {
	it('carries the page to return to', () => {
		expect(loginUrl('/admin/members?q=silva')).toBe(
			'/admin/login?redirectTo=%2Fadmin%2Fmembers%3Fq%3Dsilva'
		);
		expect(loginUrl('/admin')).toBe('/admin/login');
		expect(loginUrl('//evil.example')).toBe('/admin/login');
	});
});
