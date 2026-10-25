<script lang="ts">
	import { Card, Checkbox, Heading, Helper, Label, Textarea, Toggle } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import ImageField from '#lib/components/admin/form/ImageField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_settings'));
</script>

<PageHeader title="Definições" />

<EntityForm {form} multipart readonly={!canEdit} cancelHref={resolve('/admin/(app)')}>
	<div class="space-y-6">
		{#each data.groups as group (group.group)}
			<Card size="xl" class="max-w-4xl p-6">
				<Heading tag="h2" class="mb-5 text-lg font-medium">{group.group}</Heading>
				<div class="grid gap-6 md:grid-cols-2">
					{#each group.fields as field (field.id)}
						{#if field.type === 'image'}
							<div>
								<ImageField
									name="image-{field.id}"
									label={field.label}
									current={field.imageUrl}
									accept="image/jpeg,image/png,image/gif,image/webp"
									hint={field.hint ?? undefined}
								/>
								{#if field.imageUrl && canEdit}
									<Checkbox name="remove-{field.id}" class="mt-2">Remover</Checkbox>
								{/if}
							</div>
						{:else if field.type === 'text_area'}
							<div class="md:col-span-2">
								<Label for="setting-{field.id}" class="mb-2">{field.label}</Label>
								<Textarea
									id="setting-{field.id}"
									name="setting-{field.id}"
									rows={3}
									value={field.value ?? ''}
									class="w-full"
								/>
								{#if field.hint}<Helper class="mt-1.5">{field.hint}</Helper>{/if}
							</div>
						{:else if field.type === 'checkbox'}
							<div>
								<Toggle name="setting-{field.id}" checked={field.value === '1'}
									>{field.label}</Toggle
								>
								{#if field.hint}<Helper class="mt-1.5">{field.hint}</Helper>{/if}
							</div>
						{:else}
							<TextField
								name="setting-{field.id}"
								label={field.label}
								value={field.value}
								hint={field.hint ?? undefined}
							/>
						{/if}
					{/each}
				</div>
			</Card>
		{/each}
	</div>
</EntityForm>
