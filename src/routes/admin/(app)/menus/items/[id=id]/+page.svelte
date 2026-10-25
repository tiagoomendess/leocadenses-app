<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import MenuItemForm from '../../MenuItemForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_menus'));
</script>

<PageHeader title={data.item.title} back={resolve('/admin/(app)/menus')} backLabel="Menu do site">
	{#snippet actions()}
		{#if can(data.user.permissions, 'delete_menus')}
			<DeleteButton title="Apagar o item “{data.item.title}”?" />
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<MenuItemForm
	item={data.item}
	parents={data.parents}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/menus')}
/>
