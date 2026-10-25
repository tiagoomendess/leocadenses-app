<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import Seo from '#lib/components/Seo.svelte';
	import ImageLightbox from '#lib/components/ImageLightbox.svelte';
	import ShareButton from '#lib/components/ShareButton.svelte';
	import { formatNaive } from '#lib/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const post = $derived(data.post);
</script>

<Seo
	title={post.seoTitle || post.title}
	description={post.description}
	keywords={post.keywords}
	image={post.image}
	type="article"
	noindex={post.preview}
/>

<article>
	{#if post.preview}
		<Badge color="yellow" class="mb-3">{m.preview_badge()}</Badge>
	{/if}

	{#if post.image}
		<ImageLightbox src={post.image} alt={post.title} class="-mx-4 mb-5 sm:mx-0" />
	{/if}

	<header class="mb-5">
		{#if post.createdAt}
			<time
				datetime={post.createdAt.replace(' ', 'T')}
				class="text-sm font-semibold tracking-wide text-primary-700 uppercase dark:text-primary-400"
			>
				{formatNaive(post.createdAt, getLocale(), {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})}
			</time>
		{/if}
		<h1 class="mt-1 text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
			{post.title}
		</h1>
		<ShareButton title={post.title} class="mt-3" />
	</header>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised on the server (renderHtml) -->
	<div class="cms">{@html post.html}</div>
</article>
