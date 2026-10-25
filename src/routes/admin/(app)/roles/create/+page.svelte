<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import RoleForm from '../RoleForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHeader title="Nova função" back={resolve('/admin/(app)/roles')} backLabel="Funções" />

<RoleForm
	role={{ name: '', displayName: '', permissionIds: [] }}
	groups={data.groups}
	{form}
	cancelHref={resolve('/admin/(app)/roles')}
	submitLabel="Criar"
/>
