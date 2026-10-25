<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Seo from '#lib/components/Seo.svelte';
	import { m } from '#lib/paraglide/messages.js';

	const notFound = $derived(page.status === 404);
	const forbidden = $derived(page.status === 403);
	const title = $derived(
		notFound ? m.error_not_found_title() : forbidden ? m.error_forbidden_title() : m.error_title()
	);
</script>

<Seo {title} noindex />

<section class="flex flex-col items-center gap-4 py-12 text-center">
	<p class="text-6xl font-black text-primary-600">{page.status}</p>
	<h1 class="text-2xl font-extrabold">{title}</h1>
	<p class="max-w-sm text-gray-600 dark:text-gray-300">
		{notFound ? m.error_not_found_text() : m.error_text()}
	</p>
	<Button href={resolve('/(site)')} pill>{m.card_go_site()}</Button>
</section>
