<script lang="ts">
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
	import {
		dashboardItem,
		isActive,
		visibleNavigation,
		type NavGroup
	} from '#lib/admin/navigation.ts';

	let {
		user,
		pathname,
		open,
		onClose
	}: {
		user: { name: string; email: string; avatar: string; permissions: string[] };
		pathname: string;
		open: boolean;
		onClose: () => void;
	} = $props();

	const groups = $derived(visibleNavigation(user.permissions));
	const DashboardIcon = dashboardItem.icon;

	// Groups toggled by hand; the others follow the current page.
	let toggled = $state<Record<string, boolean>>({});

	const containsActive = (group: NavGroup) =>
		group.items.some((item) => isActive(pathname, item.href));
	const isExpanded = (group: NavGroup) => toggled[group.label] ?? containsActive(group);

	const linkClass = (active: boolean) =>
		[
			'flex items-center rounded-lg px-3 py-2 text-sm',
			active
				? 'bg-primary-50 font-medium text-primary-800 dark:bg-gray-700 dark:text-white'
				: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
		].join(' ');
</script>

<svelte:window onkeydown={(event) => open && event.key === 'Escape' && onClose()} />

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
		aria-hidden="true"
		tabindex="-1"
		onclick={onClose}
	></button>
{/if}

<aside
	id="sidenav"
	class={[
		'fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-gray-200 bg-white transition-[translate,visibility] duration-200 lg:visible lg:translate-x-0 dark:border-gray-700 dark:bg-gray-800',
		// Off-screen on small screens until opened; `invisible` keeps it out of the tab order.
		open ? 'translate-x-0' : 'invisible -translate-x-full'
	]}
>
	<!-- Like the old site's side menu: the club picture with the user's avatar, name and email. -->
	<div class="relative shrink-0 overflow-hidden bg-primary-800 px-4 pt-6 pb-4 text-white">
		<img src="/images/header.jpg" alt="" class="absolute inset-0 size-full object-cover" />
		<div class="absolute inset-0 bg-linear-to-t from-primary-950/90 to-primary-950/20"></div>
		<div class="relative">
			<img
				src={user.avatar}
				alt=""
				class="size-16 rounded-full bg-white object-cover ring-2 ring-white/80"
			/>
			<p class="mt-3 truncate font-medium">{user.name}</p>
			<p class="truncate text-sm text-white/80">{user.email}</p>
		</div>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu">
		<!-- eslint-disable svelte/no-navigation-without-resolve -- static /admin paths -->
		<a
			href={dashboardItem.href}
			class={linkClass(isActive(pathname, dashboardItem.href))}
			aria-current={isActive(pathname, dashboardItem.href) ? 'page' : undefined}
			onclick={onClose}
		>
			<DashboardIcon class="me-3 size-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
			{dashboardItem.label}
		</a>

		{#if groups.length}
			<hr class="my-3 border-gray-200 dark:border-gray-700" />
		{/if}

		<ul class="space-y-1">
			{#each groups as group (group.label)}
				{@const expanded = isExpanded(group)}
				{@const id = `nav-group-${group.label}`}
				<li>
					<button
						type="button"
						class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
						aria-expanded={expanded}
						aria-controls={id}
						onclick={() => (toggled[group.label] = !expanded)}
					>
						<group.icon class="me-3 size-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
						<span class="flex-1 text-left">{group.label}</span>
						<ChevronDownOutline
							class={['size-4 transition-transform', expanded && 'rotate-180']}
							aria-hidden="true"
						/>
					</button>
					{#if expanded}
						<ul {id} class="mt-1 space-y-1 ps-8" transition:slide={{ duration: 150 }}>
							{#each group.items as item (item.href)}
								{@const active = isActive(pathname, item.href)}
								<li>
									<a
										href={item.href}
										class={linkClass(active)}
										aria-current={active ? 'page' : undefined}
										onclick={onClose}
									>
										{item.label}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</nav>
</aside>
