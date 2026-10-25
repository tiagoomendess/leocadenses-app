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
	import EmptyState from '#lib/components/admin/list/EmptyState.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Utilizadores">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/users/create')}
			label="Novo utilizador"
			granted={data.user.permissions}
			permission="add_users"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4"><ListSearch q={data.list.q} placeholder="Procurar por nome ou email" /></div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Ainda não há utilizadores." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<TableHeadCell class="w-16"><span class="sr-only">Fotografia</span></TableHeadCell>
			<SortHeader state={data.list} column="name" label="Nome" />
			<SortHeader state={data.list} column="email" label="Email" />
			<TableHeadCell>Função</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.rows as user (user.id)}
				<TableBodyRow>
					<TableBodyCell class="py-2">
						<img
							src={user.avatar ?? '/images/logo.png'}
							alt=""
							class="size-9 rounded-full bg-white object-cover"
						/>
					</TableBodyCell>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/users/[id=id]', { id: user.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{user.name}
						</a>
					</TableBodyCell>
					<TableBodyCell>{user.email}</TableBodyCell>
					<TableBodyCell>{user.role ?? '—'}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
