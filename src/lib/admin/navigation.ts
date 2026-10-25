import {
	CogOutline,
	GridOutline,
	NewspaperOutline,
	UsersGroupOutline
} from 'flowbite-svelte-icons';
import type { Component } from 'svelte';
import { can, type Permission } from '#lib/auth/permissions.ts';

/**
 * The backoffice menu: Voyager's sections, grouped. Each entry shows only to users who can
 * browse it (`browse_<table>`), like Voyager's menu did.
 */
export type NavItem = { label: string; href: string; permission: Permission };
export type NavGroup = { label: string; icon: Component; items: NavItem[] };

export const dashboardItem = { label: 'Painel', href: '/admin', icon: GridOutline };

export const NAVIGATION: NavGroup[] = [
	{
		label: 'Clube',
		icon: UsersGroupOutline,
		items: [
			{ label: 'Sócios', href: '/admin/members', permission: 'browse_members' },
			{ label: 'Quotas', href: '/admin/quotas', permission: 'browse_quotas' },
			{ label: 'Pagamentos', href: '/admin/quota-payments', permission: 'browse_quota_payments' },
			{
				label: 'Candidatos',
				href: '/admin/member-application',
				permission: 'browse_member_application'
			}
		]
	},
	{
		label: 'Conteúdos',
		icon: NewspaperOutline,
		items: [
			{ label: 'Notícias', href: '/admin/posts', permission: 'browse_posts' },
			{ label: 'Páginas', href: '/admin/pages', permission: 'browse_pages' },
			{ label: 'Categorias', href: '/admin/categories', permission: 'browse_categories' },
			{ label: 'Parceiros', href: '/admin/partners', permission: 'browse_partners' },
			{ label: 'Media', href: '/admin/media', permission: 'browse_media' }
		]
	},
	{
		label: 'Sistema',
		icon: CogOutline,
		items: [
			{ label: 'Utilizadores', href: '/admin/users', permission: 'browse_users' },
			{ label: 'Funções', href: '/admin/roles', permission: 'browse_roles' },
			{ label: 'Definições', href: '/admin/settings', permission: 'browse_settings' },
			{ label: 'Menu do site', href: '/admin/menus', permission: 'browse_menus' }
		]
	}
];

/** The groups and entries `granted` may open. */
export function visibleNavigation(granted: readonly string[]): NavGroup[] {
	return NAVIGATION.map((group) => ({
		...group,
		items: group.items.filter((item) => can(granted, item.permission))
	})).filter((group) => group.items.length > 0);
}

/** The entry owning `pathname` (its list, detail and edit pages). */
export function isActive(pathname: string, href: string): boolean {
	if (href === '/admin') return pathname === '/admin';
	return pathname === href || pathname.startsWith(`${href}/`);
}
