/**
 * Light / dark mode. The choice is a `theme` cookie (absent = follow the system), read by the
 * pre-paint script in src/app.html and by hooks.server.ts, so the first paint is already right.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

const COOKIE = 'theme';
/** Browser chrome colours; keep in sync with the theme-color metas in src/app.html. */
const THEME_COLORS = { light: '#f9fafb', dark: '#030712' };

export function getThemePreference(): ThemePreference {
	const match = document.cookie.match(/(?:^|; )theme=(light|dark)/);
	return match ? (match[1] as 'light' | 'dark') : 'system';
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
		const media = meta.getAttribute('media') ?? '';
		const color =
			preference === 'system' && media.includes('dark')
				? THEME_COLORS.dark
				: preference === 'system' && media.includes('light')
					? THEME_COLORS.light
					: dark
						? THEME_COLORS.dark
						: THEME_COLORS.light;
		meta.setAttribute('content', color);
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
