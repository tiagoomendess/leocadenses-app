<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PaymentForm from '../PaymentForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_quota_payments'));
</script>

<PageHeader
	title="Pagamento #{data.payment.id}"
	back={resolve('/admin/(app)/quota-payments')}
	backLabel="Pagamentos"
>
	{#snippet actions()}
		{#if can(data.user.permissions, 'delete_quota_payments')}
			<DeleteButton title="Apagar o pagamento #{data.payment.id}?" />
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<PaymentForm
	payment={data.payment}
	member={data.member}
	quotas={data.quotas}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/quota-payments')}
/>
