import { phoneLink } from '#lib/phone.ts';
import { latestPosts, pageBlock, visiblePartners } from '#lib/server/content.ts';
import { nextGame } from '#lib/server/next-game.ts';
import { siteSettings } from '#lib/server/settings.ts';
import { mediaUrl } from '#lib/server/storage/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [settings, game, posts, partners, body] = await Promise.all([
		siteSettings(),
		nextGame(),
		latestPosts(3),
		visiblePartners(),
		pageBlock('home')
	]);
	// The pitch-hire card shows while Definições has a phone number to call.
	const phone = phoneLink(settings['site.booking_phone']);
	return {
		title: settings['site.title'] ?? 'Leocadenses',
		header: mediaUrl(settings['site.header_image']) ?? '/images/header.jpg',
		logo: mediaUrl(settings['site.logo']) ?? '/images/logo.png',
		game,
		booking: phone && {
			title: settings['site.booking_title'],
			text: settings['site.booking_text'],
			phone,
			image: mediaUrl(settings['site.booking_image'])
		},
		posts,
		partners,
		body
	};
};
