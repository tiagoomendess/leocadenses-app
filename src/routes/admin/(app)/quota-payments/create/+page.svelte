<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PaymentForm from '../PaymentForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHeader
	title="Novo pagamento"
	back={resolve('/admin/(app)/quota-payments')}
	backLabel="Pagamentos"
/>

<PaymentForm
	payment={{ quotaId: null, amount: 10, notes: null }}
	member={data.member}
	quotas={data.quotas}
	{form}
	cancelHref={resolve('/admin/(app)/quota-payments')}
	submitLabel="Registar"
/>
