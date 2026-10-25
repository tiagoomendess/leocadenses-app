import type { SessionUser } from '#lib/auth/user.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			/** The signed-in backoffice user, on every route (public pages show them extras). */
			user: SessionUser | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
