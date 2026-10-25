<script lang="ts">
	import { Alert, Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Leocadenses</title>
</svelte:head>

<div class="mx-auto max-w-lg py-12 text-center">
	<p class="text-5xl font-black text-primary-600">{page.status}</p>
	<h1 class="mt-2 text-xl font-semibold">
		{page.status === 404
			? 'Registo ou página não encontrada'
			: page.status === 403
				? 'Sem permissão'
				: 'Ocorreu um erro'}
	</h1>
	{#if page.error?.message && page.status !== 404}
		<Alert color="red" class="mt-4">{page.error.message}</Alert>
	{/if}
	<Button href={resolve('/admin/(app)')} class="mt-6">Voltar ao painel</Button>
</div>
