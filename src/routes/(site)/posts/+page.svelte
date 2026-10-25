<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import PostCard from '#lib/components/PostCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const pageHref = (page: number) =>
		page === 1 ? resolve('/(site)/posts') : `${resolve('/(site)/posts')}?page=${page}`;
</script>

<Seo title={m.news_title()} description={m.news_description()} />

<h1 class="mb-4 text-3xl font-extrabold tracking-tight">{m.news_title()}</h1>

{#if data.posts.length === 0}
	<p class="rounded-2xl bg-white p-6 text-center text-gray-600 dark:bg-gray-900 dark:text-gray-400">
		{m.news_empty()}
	</p>
{:else}
	<div class="grid gap-4 sm:grid-cols-2">
		{#each data.posts as post (post.slug)}
			<PostCard {post} />
		{/each}
	</div>

	{#if data.lastPage > 1}
		<nav class="mt-6 flex items-center justify-between gap-3" aria-label={m.news_title()}>
			{#if data.page > 1}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- pageHref resolves -->
				<Button href={pageHref(data.page - 1)} color="alternative" pill>
					<ArrowLeftOutline class="me-1.5 size-4 rtl:rotate-180" />
					{m.news_newer()}
				</Button>
			{:else}
				<span></span>
			{/if}
			<span class="text-sm text-gray-500 dark:text-gray-400">
				{m.news_page({ page: data.page, total: data.lastPage })}
			</span>
			{#if data.page < data.lastPage}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- pageHref resolves -->
				<Button href={pageHref(data.page + 1)} color="alternative" pill>
					{m.news_older()}
					<ArrowRightOutline class="ms-1.5 size-4 rtl:rotate-180" />
				</Button>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
{/if}
