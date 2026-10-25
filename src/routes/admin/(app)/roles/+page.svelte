<script lang="ts">
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import CreateButton from '#lib/components/admin/list/CreateButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Funções">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/roles/create')}
			label="Nova função"
			granted={data.user.permissions}
			permission="add_roles"
		/>
	{/snippet}
</PageHeader>

<Table hoverable shadow>
	<TableHead>
		<TableHeadCell>Nome</TableHeadCell>
		<TableHeadCell class="w-36">Utilizadores</TableHeadCell>
		<TableHeadCell class="w-36">Permissões</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each data.rows as role (role.id)}
			<TableBodyRow>
				<TableBodyCell>
					<a
						href={resolve('/admin/(app)/roles/[id=id]', { id: role.id })}
						class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
					>
						{role.displayName}
					</a>
					<span class="block text-xs text-gray-500">{role.name}</span>
				</TableBodyCell>
				<TableBodyCell class="tabular-nums">{role.users}</TableBodyCell>
				<TableBodyCell class="tabular-nums">{role.permissions}</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
