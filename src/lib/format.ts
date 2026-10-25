/** Whole numbers with the locale's digit grouping (counts on the dashboard). */
export function formatNumber(value: number, locale = 'pt-PT'): string {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** Money in euros (quota payments). */
export function formatEuros(value: number | null | undefined, locale = 'pt-PT'): string {
	if (value === null || value === undefined) return '';
	return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
}
