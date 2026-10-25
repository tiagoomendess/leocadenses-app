<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import CategoryForm from '../CategoryForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_categories'));
</script>

<PageHeader
	title={data.category.name}
	back={resolve('/admin/(app)/categories')}
	backLabel="Categorias"
>
	{#snippet actions()}
		{#if can(data.user.permissions, 'delete_categories')}
			<DeleteButton title="Apagar a categoria “{data.category.name}”?">
				As notícias desta categoria ficam sem categoria.
			</DeleteButton>
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<CategoryForm
	category={data.category}
	parents={data.parents}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/categories')}
/>
