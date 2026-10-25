<script lang="ts">
	import {
		ChevronRightOutline,
		FacebookSolid,
		InstagramSolid,
		LockOutline,
		XSolid
	} from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import PartnersStrip from '#lib/components/PartnersStrip.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** The old footer's links. */
	const social = [
		{ name: 'Facebook', href: 'https://www.facebook.com/leocadenses', icon: FacebookSolid },
		{ name: 'Instagram', href: 'https://www.instagram.com/leocadenses/', icon: InstagramSolid },
		{ name: 'X (Twitter)', href: 'https://twitter.com/gdrleocadenses', icon: XSolid }
	];

	const isExternal = (url: string) => /^https?:\/\//.test(url);
</script>

<Seo title={m.club_title()} description={m.club_description()} />

<section class="flex flex-col items-center gap-3 py-4 text-center">
	<img src={data.logo} alt="" class="size-28 drop-shadow" />
	<h1 class="text-3xl font-extrabold tracking-tight">{m.club_title()}</h1>
	<p class="max-w-md text-gray-600 dark:text-gray-300">{m.club_description()}</p>
</section>

{#if data.links.length > 0}
	<section aria-labelledby="club-pages" class="mt-4">
		<h2
			id="club-pages"
			class="mb-2 px-1 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400"
		>
			{m.club_pages()}
		</h2>
		<ul
			class="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white shadow-sm dark:divide-gray-800 dark:bg-gray-900"
		>
			{#each data.links as link (link.url)}
				<li>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- menu URLs come from the menu builder -->
					<a
						href={link.url}
						target={link.target === '_blank' || isExternal(link.url) ? '_blank' : undefined}
						rel={isExternal(link.url) ? 'noopener noreferrer' : undefined}
						class="flex items-center justify-between px-5 py-4 font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
					>
						{link.title}
						<ChevronRightOutline class="size-5 text-gray-400 rtl:rotate-180" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section aria-labelledby="club-social" class="mt-6">
	<h2
		id="club-social"
		class="mb-2 px-1 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400"
	>
		{m.club_social()}
	</h2>
	<ul class="grid grid-cols-3 gap-3">
		{#each social as item (item.href)}
			<li>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external link -->
				<a
					href={item.href}
					target="_blank"
					rel="noopener noreferrer"
					class="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 text-sm font-medium shadow-sm transition hover:text-primary-700 dark:bg-gray-900 dark:hover:text-primary-400"
				>
					<item.icon class="size-7" />
					{item.name}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</li>
		{/each}
	</ul>
</section>

<PartnersStrip partners={data.partners} />

<footer class="mt-10 flex flex-col items-center gap-3 text-center text-xs text-gray-500">
	<a
		href={resolve('/admin/login')}
		class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-gray-200/60 dark:hover:bg-gray-800"
	>
		<LockOutline class="size-4" />
		{m.club_backoffice()}
	</a>
	<p>{m.copyright({ year: new Date().getFullYear() })}</p>
</footer>
