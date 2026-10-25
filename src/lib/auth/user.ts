/** The signed-in user, as exposed to pages through `locals.user` / layout data. */
export type SessionUser = {
	id: number;
	name: string;
	email: string;
	/** R2 key of the avatar (`users/default.png` by default), or null. */
	avatar: string | null;
	/** Permission keys granted through the user's main role and extra roles. */
	permissions: string[];
};
