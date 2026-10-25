<script lang="ts">
	import { BottomNav, BottomNavItem } from 'flowbite-svelte';
	import {
		HomeOutline,
		HomeSolid,
		NewspaperOutline,
		NewspaperSolid,
		ShieldOutline,
		ShieldSolid,
		UserAddOutline,
		UserAddSolid
	} from 'flowbite-svelte-icons';
	import type { Component } from 'svelte';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { TAB_ROOTS, type TabId } from '#lib/navigation.ts';

	type Props = { active: TabId | null };

	let { active }: Props = $props();

	type Tab = {
		id: TabId;
		href: string;
		label: () => string;
		icon: Component;
		activeIcon: Component;
	};

	const tabs: Tab[] = [
		{
			id: 'home',
			href: resolve('/(site)'),
			label: m.nav_home,
			icon: HomeOutline,
			activeIcon: HomeSolid
		},
		{
			id: 'news',
			href: resolve('/(site)/posts'),
			label: m.nav_news,
			icon: NewspaperOutline,
			activeIcon: NewspaperSolid
		},
		{
			id: 'member',
			href: resolve('/(site)/novo-socio'),
			label: m.nav_member,
			icon: UserAddOutline,
			activeIcon: UserAddSolid
		},
		{
			id: 'club',
			href: resolve('/(site)/clube'),
			label: m.nav_club,
			icon: ShieldOutline,
			activeIcon: ShieldSolid
		}
	];

	function onclick(tab: Tab, event: MouseEvent) {
		// Tapping the tab you are on, at its root, scrolls back to the top.
		if (tab.id === active && window.location.pathname === TAB_ROOTS[tab.id]) {
			event.preventDefault();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<!-- Flowbite renders a <div>: the role makes it the page's main navigation landmark. -->
<BottomNav
	role="navigation"
	aria-label={m.nav_label()}
	position="fixed"
	class="start-1/2 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] h-16 w-[min(100%-1.5rem,26rem)] -translate-x-1/2 rounded-full border border-gray-200/80 bg-white/80 shadow-lg shadow-gray-900/10 backdrop-blur-xl rtl:translate-x-1/2 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-black/40"
	classes={{ inner: 'grid-cols-4 max-w-none px-1.5' }}
>
	{#each tabs as tab (tab.id)}
		{@const isActive = tab.id === active}
		{@const Icon = isActive ? tab.activeIcon : tab.icon}
		<BottomNavItem
			href={tab.href}
			btnName={tab.label()}
			active={isActive}
			aria-current={isActive ? 'page' : undefined}
			onclick={(event: MouseEvent) => onclick(tab, event)}
			class="group my-1.5 rounded-full px-1 hover:bg-transparent dark:hover:bg-transparent {isActive
				? 'bg-primary-50 dark:bg-primary-950/60'
				: ''}"
			classes={{
				span: `mt-0.5 text-[0.7rem] font-medium ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'}`
			}}
		>
			<Icon
				class="size-6 {isActive
					? 'text-primary-700 dark:text-primary-400'
					: 'text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'}"
			/>
		</BottomNavItem>
	{/each}
</BottomNav>
