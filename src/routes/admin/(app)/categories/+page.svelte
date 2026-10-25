<script lang="ts">
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead } from 'flowbite-svelte';
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

<PageHeader title="Categorias">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/categories/create')}
			label="Nova categoria"
			granted={data.user.permissions}
			permission="add_categories"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4"><ListSearch q={data.list.q} placeholder="Procurar categoria" /></div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Ainda não há categorias." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<SortHeader state={data.list} column="name" label="Nome" />
			<SortHeader state={data.list} column="order" label="Ordem" class="w-28" />
		</TableHead>
		<TableBody>
			{#each data.rows as category (category.id)}
				<TableBodyRow>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/categories/[id=id]', { id: category.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{category.name}
						</a>
						<span class="block text-xs text-gray-500">{category.slug}</span>
					</TableBodyCell>
					<TableBodyCell class="tabular-nums">{category.order}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
