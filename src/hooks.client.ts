import { defineCustomClientStrategy } from '#lib/paraglide/runtime.js';
import { adminLocale, ADMIN_LOCALE_STRATEGY } from '#lib/i18n.ts';

defineCustomClientStrategy(ADMIN_LOCALE_STRATEGY, {
	getLocale: () => adminLocale(window.location.pathname),
	// The site's language picker stores the choice in the cookie strategy; nothing to keep here.
	setLocale: () => {}
});
