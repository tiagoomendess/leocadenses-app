<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import FormField from '#lib/components/admin/form/FormField.svelte';
	import ImageField from '#lib/components/admin/form/ImageField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const inputClass =
		'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
</script>

<PageHeader title="O meu perfil" />

<EntityForm {form} multipart cancelHref={resolve('/admin/(app)')}>
	<div class="grid gap-6 xl:grid-cols-3">
		<Card size="xl" class="space-y-5 p-6 xl:col-span-2">
			<TextField name="name" label="Nome" value={data.account.name} required maxlength={191} />
			<TextField
				name="email"
				type="email"
				label="Email (para entrar)"
				value={data.account.email}
				required
				maxlength={191}
			/>
			<Heading tag="h2" class="pt-2 text-lg font-medium">Mudar a palavra-passe</Heading>
			<div class="grid gap-5 sm:grid-cols-2">
				<FormField name="current_password" label="Palavra-passe atual">
					{#snippet children(field)}
						<input
							id={field.id}
							name="current_password"
							type="password"
							autocomplete="current-password"
							class={inputClass}
							aria-invalid={field.invalid || undefined}
							aria-describedby={field.describedBy}
						/>
					{/snippet}
				</FormField>
				<FormField name="password" label="Nova palavra-passe" hint="Pelo menos 8 caracteres.">
					{#snippet children(field)}
						<input
							id={field.id}
							name="password"
							type="password"
							autocomplete="new-password"
							minlength="8"
							class={inputClass}
							aria-invalid={field.invalid || undefined}
							aria-describedby={field.describedBy}
						/>
					{/snippet}
				</FormField>
			</div>
		</Card>
		<Card size="xl" class="p-6">
			<ImageField
				name="avatar"
				label="Fotografia"
				current={data.avatarUrl}
				accept="image/jpeg,image/png,image/gif,image/webp"
				square
			/>
		</Card>
	</div>
</EntityForm>
