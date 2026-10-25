import { requireUser } from '#lib/server/auth/guard.ts';
import { takeFlash } from '#lib/server/flash.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	const user = requireUser();
	return {
		user: {
			...user,
			avatar: mediaUrl(user.avatar) ?? '/images/logo.png'
		},
		/** Toast after a create / save / delete redirect. */
		flash: takeFlash(cookies)
	};
};
