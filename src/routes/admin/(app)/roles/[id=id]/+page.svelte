<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import RoleForm from '../RoleForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_roles'));
	const message = $derived(
		form && typeof form === 'object' && 'message' in form && !('errors' in form)
			? String(form.message)
			: null
	);
</script>

<PageHeader title={data.role.displayName} back={resolve('/admin/(app)/roles')} backLabel="Funções">
	{#snippet actions()}
		{#if can(data.user.permissions, 'delete_roles')}
			<DeleteButton title="Apagar a função “{data.role.displayName}”?" />
		{/if}
	{/snippet}
</PageHeader>

{#if message}
	<Alert color="red" class="mb-6">{message}</Alert>
{/if}
{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<RoleForm
	role={data.role}
	groups={data.groups}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/roles')}
/>
