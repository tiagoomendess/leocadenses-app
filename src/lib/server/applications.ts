import { resolveMx, resolve4, resolve6 } from 'node:dns/promises';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { m } from '#lib/paraglide/messages.js';
import { db } from '#lib/server/db/index.ts';
import { documentTypes, memberApplication } from '#lib/server/db/schema.ts';
import { checkbox } from '#lib/server/forms.ts';
import { integer, required } from '#lib/server/validation.ts';

/**
 * The membership form of /novo-socio (`MemberApplicationController::store`). Field names are the
 * old form's, and so are the rules, except the maximum lengths of email and document, which the
 * old site allowed beyond what the columns hold (varchar 50).
 */
export const ApplicationForm = z.object({
	nome: required(z.string().min(5).max(60)),
	telefone: required(z.string().min(9).max(30)),
	email: required(z.email().min(6).max(50)),
	document_type: required(integer(1, 999)),
	documento: required(z.string().min(6).max(50)),
	address: required(z.string().min(6).max(100)),
	authorization: checkbox.refine((value) => value, { error: () => m.member_consent_required() })
});

export type Application = z.output<typeof ApplicationForm>;

export async function documentTypeOptions() {
	return db
		.select({ id: documentTypes.id, name: documentTypes.name })
		.from(documentTypes)
		.orderBy(asc(documentTypes.id));
}

export async function documentTypeExists(id: number): Promise<boolean> {
	const [row] = await db
		.select({ id: documentTypes.id })
		.from(documentTypes)
		.where(eq(documentTypes.id, id))
		.limit(1);
	return Boolean(row);
}

const DNS_TIMEOUT_MS = 3_000;

/**
 * Laravel's `email:dns`: the domain must be able to receive mail (an MX record, or an A/AAAA
 * record as fallback). DNS trouble on our side does not block the applicant.
 */
export async function emailDomainReceivesMail(email: string): Promise<boolean> {
	const domain = email.split('@').pop()?.trim().toLowerCase();
	if (!domain) return false;
	const lookup = async () => {
		for (const resolver of [resolveMx, resolve4, resolve6] as const) {
			try {
				const records = await resolver(domain);
				if (records.length > 0) return true;
			} catch (error) {
				const code = (error as NodeJS.ErrnoException).code;
				if (code !== 'ENODATA' && code !== 'ENOTFOUND') return true;
			}
		}
		return false;
	};
	const timeout = new Promise<boolean>((done) => setTimeout(() => done(true), DNS_TIMEOUT_MS));
	return Promise.race([lookup(), timeout]);
}

export async function saveApplication(application: Application) {
	await db.insert(memberApplication).values({
		name: application.nome,
		phone: application.telefone,
		email: application.email,
		documentTypeId: application.document_type,
		document: application.documento,
		address: application.address
	});
}
