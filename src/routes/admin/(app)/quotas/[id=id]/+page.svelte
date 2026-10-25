<script lang="ts">
	import { Alert, Badge } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import QuotaForm from '../QuotaForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_quotas'));
</script>

<PageHeader
	title="Quota {data.quota.name}"
	back={resolve('/admin/(app)/quotas')}
	backLabel="Quotas"
>
	{#snippet actions()}
		<Badge color="green" large>{data.payments} pagamento(s)</Badge>
		{#if can(data.user.permissions, 'delete_quotas')}
			<DeleteButton title="Apagar a quota {data.quota.name}?" />
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<QuotaForm
	quota={data.quota}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/quotas')}
/>
