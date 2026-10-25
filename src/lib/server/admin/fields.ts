import { z } from 'zod';
import { SLUG_PATTERN } from '#lib/slug.ts';
import { m } from '#lib/paraglide/messages.js';
import { inputToNaive } from '#lib/dates.ts';
import { optional, required } from '#lib/server/validation.ts';

/** A slug field; blank means "make it from the title" (Voyager's slugify option). */
export const optionalSlug = () =>
	optional(
		z
			.string()
			.max(191)
			.transform((value) => value.toLowerCase())
			.refine((value) => SLUG_PATTERN.test(value), {
				error: () => 'Use só letras minúsculas, números e hífenes.'
			})
	);

/** `<input type="datetime-local">` → naive Lisbon string (src/lib/dates.ts). */
export const requiredDateTime = () =>
	required(
		z
			.string()
			.transform((value) => inputToNaive(value))
			.refine((value): value is string => value !== null, { error: () => m.validation_date() })
	);

/** A money amount: "10", "10,5" or "10.50". Blank → null. */
export const optionalAmount = () =>
	optional(
		z
			.string()
			.regex(/^\d{1,6}(?:[.,]\d{1,2})?$/, { error: () => m.validation_invalid() })
			.transform((value) => Number(value.replace(',', '.')))
	);

/** One of `values` (an enum column). */
export const oneOf = <const T extends readonly [string, ...string[]]>(values: T) =>
	required(z.enum(values));
