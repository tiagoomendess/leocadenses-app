<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const page = $derived(data.page);
</script>

<Seo
	title={page.title}
	description={page.description}
	keywords={page.keywords}
	image={page.image}
	noindex={page.preview}
/>

<article>
	{#if page.preview}
		<Badge color="yellow" class="mb-3">{m.preview_badge()}</Badge>
	{/if}
	<h1 class="mb-5 text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
		{page.title}
	</h1>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised on the server (renderHtml) -->
	<div class="cms rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-900">{@html page.html}</div>
</article>
