import { describe, expect, it } from 'vitest';
import { hasAllQuotasPaid, hasValidDocument } from './rules';

describe('hasValidDocument', () => {
	it('needs more than four characters', () => {
		expect(hasValidDocument('123456789')).toBe(true);
		expect(hasValidDocument('12345')).toBe(true);
		expect(hasValidDocument('1234')).toBe(false);
		expect(hasValidDocument('nada')).toBe(false);
		expect(hasValidDocument('')).toBe(false);
		expect(hasValidDocument(null)).toBe(false);
	});
});

describe('hasAllQuotasPaid', () => {
	const quotas = [
		{ id: 1, dueDate: '2021-09-30 22:00:00' },
		{ id: 2, dueDate: '2022-07-18 22:00:00' },
		{ id: 3, dueDate: '2023-09-30 22:00:00' },
		{ id: 9, dueDate: '2027-07-18 13:32:00' }
	];
	const today = '2026-10-25 18:00:00';

	it('is false without any payment', () => {
		expect(hasAllQuotasPaid('2021-01-01 00:00:00', quotas, new Set(), today)).toBe(false);
	});

	it('requires every quota due since joining, but not future ones', () => {
		expect(hasAllQuotasPaid('2021-01-01 00:00:00', quotas, new Set([1, 2, 3]), today)).toBe(true);
		expect(hasAllQuotasPaid('2021-01-01 00:00:00', quotas, new Set([1, 3]), today)).toBe(false);
	});

	it('ignores quotas due before the member joined', () => {
		expect(hasAllQuotasPaid('2022-08-01 10:00:00', quotas, new Set([3]), today)).toBe(true);
	});

	it('counts a quota as due only from the day after its due date', () => {
		const due = [{ id: 5, dueDate: '2026-10-25 09:00:00' }];
		expect(hasAllQuotasPaid('2020-01-01 00:00:00', due, new Set([99]), today)).toBe(true);
		expect(hasAllQuotasPaid('2020-01-01 00:00:00', due, new Set([99]), '2026-10-26 00:00:01')).toBe(
			false
		);
	});

	it('treats a member without a creation date as owing nothing (Laravel compared with NULL)', () => {
		expect(hasAllQuotasPaid(null, quotas, new Set([1]), today)).toBe(true);
	});
});
