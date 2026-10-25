import { requireUser } from '#lib/server/auth/guard.ts';
import { takeFlash } from '#lib/server/flash.ts';
import { siteSettings } from '#lib/server/settings.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const user = requireUser();
	const settings = await siteSettings();
	return {
		user: {
			...user,
			avatar: mediaUrl(user.avatar) ?? '/images/logo.png'
		},
		/** Behind the user's name in the side menu (Definições → Admin Background Image). */
		menuImage: mediaUrl(settings['admin.bg_image']) ?? '/images/header.jpg',
		/** Toast after a create / save / delete redirect. */
		flash: takeFlash(cookies)
	};
};
