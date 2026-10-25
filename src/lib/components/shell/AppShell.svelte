<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { isTabRoot, parentOf, tabFromPath } from '#lib/navigation.ts';
	import BackButton from './BackButton.svelte';
	import BottomDock from './BottomDock.svelte';
	import LanguagePicker from './LanguagePicker.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { children }: { children: Snippet } = $props();

	const pathname = $derived(page.url.pathname);
	const showBack = $derived(!isTabRoot(pathname));
</script>

<a
	href="#content"
	class="sr-only z-50 rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:start-4 focus:top-4 dark:bg-gray-900"
>
	{m.site_name()}
</a>

<header
	class="sticky top-0 z-40 border-b border-gray-200/70 bg-gray-50/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/80"
>
	<div class="mx-auto flex h-14 max-w-3xl items-center gap-1 px-2 sm:px-4">
		{#if showBack}
			<BackButton fallback={parentOf(pathname)} />
		{/if}
		<a
			href={resolve('/(site)')}
			class="flex min-w-0 items-center gap-2 rounded-full py-1 pe-3 {showBack ? '' : 'ps-1'}"
		>
			<img src="/images/logo.png" alt="" class="size-9 shrink-0" width="36" height="36" />
			<span class="truncate text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
				{m.site_name()}
			</span>
		</a>
		<div class="ms-auto flex items-center">
			<LanguagePicker />
			<ThemeToggle />
		</div>
	</div>
</header>

<main
	id="content"
	class="mx-auto w-full max-w-3xl px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+7rem)]"
>
	{@render children()}
</main>

<BottomDock active={tabFromPath(pathname)} />
