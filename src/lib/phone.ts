/**
 * A phone number as people read it and as a `tel:` link, which opens the phone app when tapped.
 * Portuguese numbers (9 digits starting with 2 or 9) get the +351 prefix and are grouped 3-3-3;
 * numbers already in international form (+… or 00…) are kept as typed.
 */
export type PhoneLink = { href: string; display: string };

export function phoneLink(raw: string | null | undefined): PhoneLink | null {
	const value = raw?.trim();
	if (!value) return null;
	const digits = value.replace(/[^\d+]/g, '');

	const portuguese = digits.replace(/^(\+351|00351)/, '');
	if (/^[29]\d{8}$/.test(portuguese)) {
		return {
			href: `tel:+351${portuguese}`,
			display: portuguese.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
		};
	}

	const international = digits.replace(/^00/, '+');
	if (/^\+\d{7,15}$/.test(international)) return { href: `tel:${international}`, display: value };

	return null;
}
