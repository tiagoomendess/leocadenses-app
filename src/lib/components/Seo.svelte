<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';

	type Props = {
		/** Page title; " · Leocadenses" is appended unless it already is the site name. */
		title: string;
		description?: string | null;
		image?: string | null;
		keywords?: string | null;
		type?: 'website' | 'article';
		noindex?: boolean;
	};

	let { title, description, image, keywords, type = 'website', noindex = false }: Props = $props();

	const siteName = m.site_name();
	const fullTitle = $derived(title === siteName ? title : `${title} · ${siteName}`);
	const absoluteImage = $derived(new URL(image || '/images/logo.png', page.url.origin).href);
	const canonical = $derived(`${page.url.origin}${page.url.pathname}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	{#if description}
		<meta name="description" content={description} />
		<meta property="og:description" content={description} />
	{/if}
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
	<link rel="canonical" href={canonical} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={title} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={absoluteImage} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
