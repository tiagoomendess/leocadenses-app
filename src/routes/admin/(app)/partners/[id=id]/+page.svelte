<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PartnerForm from '../PartnerForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_partners'));
	const canDelete = $derived(can(data.user.permissions, 'delete_partners'));
</script>

<PageHeader title={data.partner.name} back={resolve('/admin/(app)/partners')} backLabel="Parceiros">
	{#snippet actions()}
		{#if canDelete}
			<DeleteButton title="Apagar o parceiro “{data.partner.name}”?" />
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<PartnerForm
	partner={data.partner}
	picture={data.picture}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/partners')}
/>
