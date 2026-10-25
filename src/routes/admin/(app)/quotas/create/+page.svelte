<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import QuotaForm from '../QuotaForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<PageHeader title="Nova quota" back={resolve('/admin/(app)/quotas')} backLabel="Quotas" />

<QuotaForm
	quota={{ name: '', dueDate: null }}
	{form}
	cancelHref={resolve('/admin/(app)/quotas')}
	submitLabel="Criar"
/>
