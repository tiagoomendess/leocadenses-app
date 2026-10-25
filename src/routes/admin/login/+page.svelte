<script lang="ts">
	import { Alert, Button, Card, Checkbox, Input, Label } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);

	const messages = {
		required: 'Indique o email e a palavra-passe.',
		invalid: 'Email ou palavra-passe incorretos.',
		forbidden: 'Esta conta não tem acesso à administração.',
		throttled: 'Demasiadas tentativas. Aguarde um minuto e tente novamente.'
	} as const;

	const errorMessage = $derived(form?.reason ? messages[form.reason] : null);
</script>

<svelte:head>
	<title>Entrar · Leocadenses</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
	<a href={resolve('/(site)')} class="mb-6 flex items-center gap-3">
		<img src="/images/logo.png" alt="" class="h-14 w-14" />
		<span class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
			Leocadenses
			<span class="font-light text-gray-500 dark:text-gray-400">· Administração</span>
		</span>
	</a>

	<Card size="sm" class="w-full p-6 sm:p-8">
		<h1 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Entrar</h1>

		{#if errorMessage}
			<Alert color="red" class="mb-4" role="alert">{errorMessage}</Alert>
		{/if}

		<form
			method="POST"
			class="space-y-5"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

			<div>
				<Label for="email" class="mb-2">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autocomplete="username"
					required
					value={form?.email ?? ''}
				/>
			</div>

			<div>
				<Label for="password" class="mb-2">Palavra-passe</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>
			</div>

			<Checkbox name="remember">Manter sessão iniciada</Checkbox>

			<Button type="submit" class="w-full" loading={submitting}>Entrar</Button>
		</form>
	</Card>
</main>
