<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Leocadenses</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Outside the public shell (backoffice, files): kept plain and Portuguese like the backoffice. -->
<main class="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
	<img src="/images/logo.png" alt="" class="size-16" />
	<p class="text-5xl font-black text-primary-600">{page.status}</p>
	<h1 class="text-xl font-bold">
		{page.status === 404
			? 'Página não encontrada'
			: page.status === 403
				? 'Sem acesso'
				: 'Ocorreu um erro'}
	</h1>
	{#if page.error?.message && page.status !== 404}
		<p class="max-w-sm text-gray-600 dark:text-gray-300">{page.error.message}</p>
	{/if}
	<a
		href={resolve('/(site)')}
		class="mt-2 font-medium text-primary-700 hover:underline dark:text-primary-400"
	>
		Ir para o site
	</a>
</main>
