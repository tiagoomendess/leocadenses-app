import { clubLinks, visiblePartners } from '#lib/server/content.ts';
import { siteSettings } from '#lib/server/settings.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [links, partners, settings] = await Promise.all([
		clubLinks(),
		visiblePartners(),
		siteSettings()
	]);
	return { links, partners, logo: mediaUrl(settings['site.logo']) ?? '/images/logo.png' };
};
