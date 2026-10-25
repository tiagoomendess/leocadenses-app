/**
 * Dates as the Laravel site stored them.
 *
 * Laravel ran with `timezone = Europe/Lisbon` and wrote TIMESTAMP columns as naive
 * `YYYY-MM-DD HH:MM:SS` strings of the Lisbon wall clock. Both apps leave the MySQL session time
 * zone at the server default, so those strings round-trip unchanged. This app does the same:
 * columns are read as strings (`dateStrings: true`, drizzle `mode: 'string'`), new values are
 * the Lisbon wall clock (`nowNaive()`), and they are displayed as stored, never shifted.
 */

export const TIME_ZONE = 'Europe/Lisbon';

const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/;

const wallClock = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23'
});

/** The Lisbon wall clock at `date` as a naive `YYYY-MM-DD HH:MM:SS` string. */
export function nowNaive(date: Date = new Date()): string {
	const parts = Object.fromEntries(
		wallClock.formatToParts(date).map((part) => [part.type, part.value])
	);
	return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * A naive string as a Date whose UTC fields are the stored wall clock. Only for formatting with
 * `timeZone: 'UTC'` (see `formatNaive`) or comparing naive values with each other.
 */
export function naiveToDate(value: string): Date | null {
	const match = NAIVE.exec(value.trim());
	if (!match) return null;
	const [, y, mo, d, h = '0', mi = '0', s = '0'] = match;
	const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
	return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a stored naive value as it reads on the Lisbon wall clock. */
export function formatNaive(
	value: string | null | undefined,
	locale: string,
	options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
	const date = value ? naiveToDate(value) : null;
	if (!date) return '';
	return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

/** `<input type="datetime-local">` value (`YYYY-MM-DDTHH:MM`) of a stored naive value. */
export function naiveToInput(value: string | null | undefined): string {
	const match = value ? NAIVE.exec(value.trim()) : null;
	if (!match) return '';
	const [, y, mo, d, h = '00', mi = '00'] = match;
	return `${y}-${mo}-${d}T${h}:${mi}`;
}

/** Stored naive value of a `<input type="datetime-local">` (or `type="date"`) value. */
export function inputToNaive(value: string): string | null {
	const date = naiveToDate(value);
	if (!date) return null;
	return date.toISOString().slice(0, 19).replace('T', ' ');
}
