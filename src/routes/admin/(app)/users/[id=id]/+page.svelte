<script lang="ts">
	import { Alert } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import UserForm from '../UserForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_users'));
	const isSelf = $derived(data.account.id === data.user.id);
</script>

<PageHeader title={data.account.name} back={resolve('/admin/(app)/users')} backLabel="Utilizadores">
	{#snippet actions()}
		{#if can(data.user.permissions, 'delete_users') && !isSelf}
			<DeleteButton title="Apagar o utilizador “{data.account.name}”?">
				As notícias e páginas que escreveu ficam no site.
			</DeleteButton>
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<UserForm
	user={data.account}
	avatarUrl={data.avatarUrl}
	roles={data.roles}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/users')}
/>
