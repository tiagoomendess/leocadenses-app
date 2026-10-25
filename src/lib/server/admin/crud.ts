import { error, fail, redirect, type Cookies } from '@sveltejs/kit';
import type { FieldErrors } from '#lib/forms.ts';
import { isRowReferencedError } from '#lib/server/db/errors.ts';
import { setFlash } from '#lib/server/flash.ts';
import { invalid } from '#lib/server/forms.ts';

/**
 * Small helpers every backoffice section uses: 404 for a missing row, the "saved" redirect with a
 * toast, and the delete that reports a row still in use instead of failing with a 500.
 */

export function orNotFound<T>(row: T | null | undefined): T {
	if (!row) error(404, 'Registo não encontrado');
	return row;
}

/** Shows `message` as a toast on the next page and redirects there (303). */
export function done(
	cookies: Cookies,
	href: string,
	message: string,
	type: 'success' | 'error' = 'success'
): never {
	setFlash(cookies, { type, message });
	redirect(303, href);
}

/** Runs a delete; a foreign key still pointing at the row becomes a 409 with an explanation. */
export async function guardedDelete(run: () => Promise<unknown>) {
	try {
		await run();
		return null;
	} catch (cause) {
		if (isRowReferencedError(cause)) {
			return fail(409, {
				message: 'Não é possível apagar: este registo ainda é usado noutro sítio.'
			});
		}
		throw cause;
	}
}

/** What a section's `save…()` returns: the saved row, or the errors to show in the form. */
export type SaveResult<Saved> =
	| ({ ok: true } & Saved)
	| { ok: false; errors: FieldErrors; values: Record<string, string>; message?: string };

export function rejected(
	errors: FieldErrors,
	values: Record<string, string>,
	message?: string
): { ok: false; errors: FieldErrors; values: Record<string, string>; message?: string } {
	return { ok: false, errors, values, message };
}

/** The `fail(400)` of a rejected save. */
export function failed(result: {
	errors: FieldErrors;
	values: Record<string, string>;
	message?: string;
}) {
	return invalid(result.errors, result.values, result.message);
}
