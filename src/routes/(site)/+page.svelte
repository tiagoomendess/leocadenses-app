<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { ArrowRightOutline, UserAddSolid } from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import NextGameCard from '#lib/components/NextGameCard.svelte';
	import PartnersStrip from '#lib/components/PartnersStrip.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title={data.title} description={m.site_description()} image={data.header} />

<h1 class="sr-only">{data.title}</h1>

<section
	class="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl"
	aria-label={m.site_full_name()}
>
	<img
		src={data.header}
		alt=""
		class="aspect-[16/10] w-full object-cover sm:aspect-[16/8]"
		fetchpriority="high"
	/>
	<div
		class="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/30 to-transparent"
	></div>
	<div class="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5">
		<img src={data.logo} alt="" class="size-16 drop-shadow-lg sm:size-20" />
		<div class="text-white">
			<p class="text-xs font-semibold tracking-widest text-accent-400 uppercase">
				{m.club_since()}
			</p>
			<p class="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
				{m.site_name()}
			</p>
			<p class="text-sm text-white/80">{m.site_full_name()}</p>
		</div>
	</div>
</section>

<div class="mt-5 space-y-5">
	<NextGameCard game={data.game} logo={data.logo} />

	<a
		href={resolve('/(site)/novo-socio')}
		class="group flex items-center gap-4 rounded-3xl bg-accent-400 p-5 text-gray-900 shadow-sm transition hover:bg-accent-300 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
	>
		<span class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900/10">
			<UserAddSolid class="size-6" />
		</span>
		<span class="min-w-0 flex-1">
			<span class="block text-lg font-extrabold">{m.home_cta_title()}</span>
			<span class="block text-sm text-gray-800">{m.home_cta_text()}</span>
		</span>
		<ArrowRightOutline class="size-5 transition group-hover:translate-x-1 rtl:rotate-180" />
	</a>

	{#if data.body}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised on the server (renderHtml) -->
		<div class="cms rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-900">{@html data.body}</div>
	{/if}

	{#if data.posts.length > 0}
		<section aria-labelledby="latest-news">
			<div class="mb-3 flex items-baseline justify-between">
				<h2 id="latest-news" class="text-xl font-extrabold tracking-tight">
					{m.home_latest_news()}
				</h2>
				<Button href={resolve('/(site)/posts')} color="alternative" size="xs" pill>
					{m.see_all()}
				</Button>
			</div>
			<div class="grid gap-4 sm:grid-cols-3">
				{#each data.posts as post (post.slug)}
					<PostCard {post} variant="compact" />
				{/each}
			</div>
		</section>
	{/if}

	<PartnersStrip partners={data.partners} />
</div>
