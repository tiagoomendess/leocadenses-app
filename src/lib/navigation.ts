/**
 * The public site's dock. Each tab owns the paths below it, which decides the highlighted tab
 * and where the back button goes when there is no in-app history (a shared link).
 */
export type TabId = 'home' | 'news' | 'member' | 'club';

export const TAB_ROOTS: Record<TabId, string> = {
	home: '/',
	news: '/posts',
	member: '/novo-socio',
	club: '/clube'
};

/** Longest prefix first. */
const PATH_OWNERS: { prefix: string; tab: TabId }[] = [
	{ prefix: '/novo-socio', tab: 'member' },
	{ prefix: '/posts', tab: 'news' },
	{ prefix: '/pages', tab: 'club' },
	{ prefix: '/clube', tab: 'club' }
];

export function tabFromPath(pathname: string): TabId | null {
	if (pathname === '/') return 'home';
	for (const { prefix, tab } of PATH_OWNERS) {
		if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return tab;
	}
	return null;
}

/** Where "back" leads without history: the owning tab's root, or the home page. */
export function parentOf(pathname: string): string {
	const tab = tabFromPath(pathname);
	return tab ? TAB_ROOTS[tab] : '/';
}

export function isTabRoot(pathname: string): boolean {
	return Object.values(TAB_ROOTS).includes(pathname);
}
