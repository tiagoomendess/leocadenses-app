<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PartnerForm from '../PartnerForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<PageHeader title="Novo parceiro" back={resolve('/admin/(app)/partners')} backLabel="Parceiros" />

<PartnerForm
	partner={{ name: '', url: '', position: 1, visible: true }}
	picture={null}
	{form}
	cancelHref={resolve('/admin/(app)/partners')}
	submitLabel="Criar"
/>
