/**
 * Light / dark mode. The choice is a `theme` cookie (absent = follow the system), read by the
 * pre-paint script in src/app.html and by hooks.server.ts, so the first paint is already right.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

const COOKIE = 'theme';
/** Browser chrome colours (the page background: gray-50 / gray-950). */
const THEME_COLORS = { light: '#f9fafb', dark: '#030712' };

/** The preference stored in the `theme` cookie's value. */
export function themePreference(cookie: string | undefined): ThemePreference {
	return cookie === 'light' || cookie === 'dark' ? cookie : 'system';
}

export function getThemePreference(): ThemePreference {
	return themePreference(document.cookie.match(/(?:^|; )theme=(light|dark)/)?.[1]);
}

/**
 * The colour of the theme-color meta for one system scheme (`media="(prefers-color-scheme: …)"`):
 * that scheme's while following the system, otherwise the chosen theme's for both. Mobile
 * browsers (iPhone Safari's status bar) paint it, so it must match the page even when the site's
 * choice differs from the phone's.
 */
export function chromeColor(scheme: 'light' | 'dark', preference: ThemePreference): string {
	return THEME_COLORS[preference === 'system' ? scheme : preference];
}

export function isDark() {
	return document.documentElement.classList.contains('dark');
}

export function setThemePreference(preference: ThemePreference) {
	if (preference === 'system') {
		document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
	} else {
		document.cookie = `${COOKIE}=${preference}; path=/; max-age=31536000; samesite=lax`;
	}

	const dark =
		preference === 'system'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
			: preference === 'dark';
	applyTheme(dark);
}

export function toggleTheme(): ThemePreference {
	const next = isDark() ? 'light' : 'dark';
	setThemePreference(next);
	return next;
}

function syncBrowserChrome(dark: boolean) {
	const preference = getThemePreference();
	for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
		const scheme = meta.getAttribute('media')?.includes('dark') ? 'dark' : 'light';
		meta.setAttribute('content', chromeColor(scheme, preference));
	}
	document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function applyTheme(dark: boolean) {
	const update = () => {
		document.documentElement.classList.toggle('dark', dark);
		syncBrowserChrome(dark);
	};

	if (isDark() === dark) {
		syncBrowserChrome(dark);
		return;
	}

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (!document.startViewTransition || reduceMotion) update();
	else document.startViewTransition(update);
}
