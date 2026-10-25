/**
 * Member rules ported from the old `App\Member` model. Pure, so they are unit tested.
 */

/**
 * `Member::isValid()`: a card is valid when the member has an identity document longer than four
 * characters. (The old code also meant to reject "nada", but its condition was always true;
 * "nada" is four characters, so the length rule already rejects it.)
 */
export function hasValidDocument(document: string | null | undefined): boolean {
	return typeof document === 'string' && document.length > 4;
}

export type QuotaDue = { id: number; dueDate: string };

/**
 * `Member::hasAllQuotasPaid()`: every quota due after the member joined and before today must be
 * paid. A member with no payments at all is never up to date. Dates are naive Lisbon strings
 * (`YYYY-MM-DD HH:MM:SS`), so they compare as strings.
 */
export function hasAllQuotasPaid(
	memberCreatedAt: string | null,
	quotas: readonly QuotaDue[],
	paidQuotaIds: ReadonlySet<number>,
	today: string
): boolean {
	if (paidQuotaIds.size === 0) return false;
	// Laravel compared `due_date > NULL`, which matches nothing: no quota was ever due.
	if (!memberCreatedAt) return true;
	const cutoff = `${today.slice(0, 10)} 00:00:00`;
	return quotas
		.filter((quota) => quota.dueDate > memberCreatedAt && quota.dueDate < cutoff)
		.every((quota) => paidQuotaIds.has(quota.id));
}
