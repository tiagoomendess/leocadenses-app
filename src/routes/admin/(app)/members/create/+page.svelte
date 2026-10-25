<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import MemberForm from '../MemberForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHeader title="Novo sócio" back={resolve('/admin/(app)/members')} backLabel="Sócios" />

{#if data.applicationId}
	<Alert color="blue" class="mb-6">
		Dados preenchidos a partir da candidatura. Ao guardar, a candidatura é apagada.
	</Alert>
{/if}

<MemberForm
	member={data.member}
	documentTypes={data.documentTypes}
	applicationId={data.applicationId}
	{form}
	cancelHref={resolve('/admin/(app)/members')}
	submitLabel="Criar sócio"
/>
