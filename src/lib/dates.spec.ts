import { describe, expect, it } from 'vitest';
import { formatNaive, inputToNaive, naiveToDate, naiveToInput, nowNaive } from './dates';

describe('nowNaive', () => {
	it('writes the Lisbon wall clock in summer (UTC+1)', () => {
		expect(nowNaive(new Date('2026-07-18T12:30:05Z'))).toBe('2026-07-18 13:30:05');
	});

	it('writes the Lisbon wall clock in winter (UTC+0)', () => {
		expect(nowNaive(new Date('2026-12-01T23:59:59Z'))).toBe('2026-12-01 23:59:59');
	});

	it('crosses midnight with the offset', () => {
		expect(nowNaive(new Date('2026-08-14T23:15:00Z'))).toBe('2026-08-15 00:15:00');
	});
});

describe('naiveToDate', () => {
	it('keeps the stored wall clock in the UTC fields', () => {
		expect(naiveToDate('2022-07-18 22:00:00')?.toISOString()).toBe('2022-07-18T22:00:00.000Z');
	});

	it('accepts dates without a time', () => {
		expect(naiveToDate('2024-07-18')?.toISOString()).toBe('2024-07-18T00:00:00.000Z');
	});

	it('rejects garbage', () => {
		expect(naiveToDate('not a date')).toBeNull();
	});
});

describe('formatNaive', () => {
	it('formats the value exactly as stored, without shifting it', () => {
		expect(
			formatNaive('2021-10-28 23:30:00', 'pt-PT', { dateStyle: 'short', timeStyle: 'short' })
		).toBe('28/10/21, 23:30');
	});

	it('returns an empty string for missing values', () => {
		expect(formatNaive(null, 'pt-PT')).toBe('');
	});
});

describe('datetime-local inputs', () => {
	it('round-trips a stored value', () => {
		expect(naiveToInput('2026-07-18 13:31:00')).toBe('2026-07-18T13:31');
		expect(inputToNaive('2026-07-18T13:31')).toBe('2026-07-18 13:31:00');
	});

	it('rejects an invalid input', () => {
		expect(inputToNaive('')).toBeNull();
	});
});
