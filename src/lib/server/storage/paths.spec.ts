import { describe, expect, it } from 'vitest';
import {
	contentTypeFor,
	encodeKey,
	keyFromPath,
	newKey,
	publicUrl,
	randomAlphanumeric,
	storageKey
} from './paths';

const CDN = 'https://cdn.leocadenses.pt';

describe('storageKey', () => {
	it('accepts Voyager paths', () => {
		expect(storageKey('posts/October2021/q73DjCfXvJOwySdJ0cFb.png')).toBe(
			'posts/October2021/q73DjCfXvJOwySdJ0cFb.png'
		);
	});

	it.each(['', '/posts/x.jpg', 'posts/../.env', 'posts//x.jpg', './x', 'posts\\x.jpg'])(
		'rejects %s',
		(key) => {
			expect(() => storageKey(key)).toThrow();
		}
	);
});

describe('newKey', () => {
	it('follows Voyager: folder/MonthYYYY/<20 random>.ext', () => {
		const key = newKey('posts', 'JPG', new Date('2026-10-25T12:00:00Z'));
		expect(key).toMatch(/^posts\/October2026\/[A-Za-z0-9]{20}\.jpg$/);
	});

	it('rejects odd extensions', () => {
		expect(() => newKey('posts', 'php?.x')).toThrow();
	});
});

describe('randomAlphanumeric', () => {
	it('uses letters and digits only', () => {
		expect(randomAlphanumeric(9)).toMatch(/^[A-Za-z0-9]{9}$/);
		expect(randomAlphanumeric(200)).toMatch(/^[A-Za-z0-9]{200}$/);
	});
});

describe('keyFromPath', () => {
	it('understands stored keys and legacy /storage paths', () => {
		expect(keyFromPath('posts/July2022/quotas.jpg')).toBe('posts/July2022/quotas.jpg');
		expect(keyFromPath('/storage/posts/July2022/quotas.jpg')).toBe('posts/July2022/quotas.jpg');
		expect(keyFromPath('storage/pages/November2021/campo_1.jpg')).toBe(
			'pages/November2021/campo_1.jpg'
		);
	});

	it('decodes percent-encoded names', () => {
		expect(keyFromPath('/storage/posts/November2022/Captura%20de%20ecr%C3%A3.png')).toBe(
			'posts/November2022/Captura de ecrã.png'
		);
	});

	it('decodes HTML entities TinyMCE left in attribute values', () => {
		expect(keyFromPath('/storage/posts/November2022/Captura de ecr&atilde; 15.png')).toBe(
			'posts/November2022/Captura de ecrã 15.png'
		);
	});

	it('refuses traversal', () => {
		expect(keyFromPath('/storage/../.env')).toBeNull();
		expect(keyFromPath('/storage/posts/%2e%2e/x')).toBeNull();
	});
});

describe('publicUrl', () => {
	it('puts the key under the CDN, encoding each segment', () => {
		expect(publicUrl('posts/November2022/Captura de ecrã.png', CDN)).toBe(
			'https://cdn.leocadenses.pt/posts/November2022/Captura%20de%20ecr%C3%A3.png'
		);
		expect(encodeKey('a b/c')).toBe('a%20b/c');
	});

	it('passes absolute URLs through and ignores empty values', () => {
		expect(publicUrl('https://example.com/x.png', CDN)).toBe('https://example.com/x.png');
		expect(publicUrl(null, CDN)).toBeNull();
		expect(publicUrl('', CDN)).toBeNull();
	});
});

describe('contentTypeFor', () => {
	it('maps common extensions', () => {
		expect(contentTypeFor('posts/x.JPG')).toBe('image/jpeg');
		expect(contentTypeFor('members/cards/abc.png')).toBe('image/png');
		expect(contentTypeFor('x.unknown')).toBe('application/octet-stream');
	});
});
