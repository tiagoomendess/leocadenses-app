import { describe, expect, it } from 'vitest';
import { can } from './permissions';

describe('can', () => {
	const direcao = ['browse_admin', 'browse_members', 'edit_members', 'browse_media'];

	it('grants exactly the keys the roles hold', () => {
		expect(can(direcao, 'browse_members')).toBe(true);
		expect(can(new Set(direcao), 'edit_members')).toBe(true);
	});

	it('has no wildcard: even an "admin" key grants nothing else', () => {
		expect(can(['admin'], 'browse_members')).toBe(false);
		expect(can(direcao, 'browse_roles')).toBe(false);
	});

	it('denies anonymous users', () => {
		expect(can(null, 'browse_admin')).toBe(false);
		expect(can(undefined, 'browse_admin')).toBe(false);
	});
});
