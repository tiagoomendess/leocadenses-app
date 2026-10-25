<script lang="ts">
	import {
		Badge,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import DateTime from '#lib/components/DateTime.svelte';
	import CreateButton from '#lib/components/admin/list/CreateButton.svelte';
	import EmptyState from '#lib/components/admin/list/EmptyState.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Páginas">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/pages/create')}
			label="Nova página"
			granted={data.user.permissions}
			permission="add_pages"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4"><ListSearch q={data.list.q} placeholder="Procurar por título ou slug" /></div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Ainda não há páginas." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<SortHeader state={data.list} column="title" label="Título" />
			<SortHeader state={data.list} column="status" label="Estado" class="w-32" />
			<TableHeadCell class="hidden w-44 md:table-cell">Atualizada</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.rows as page (page.id)}
				<TableBodyRow>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/pages/[id=id]', { id: page.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{page.title}
						</a>
						<span class="block text-xs text-gray-500">/pages/{page.slug}</span>
					</TableBodyCell>
					<TableBodyCell>
						<Badge color={page.status === 'ACTIVE' ? 'green' : 'gray'}>
							{page.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
						</Badge>
					</TableBodyCell>
					<TableBodyCell class="hidden md:table-cell"
						><DateTime value={page.updatedAt} /></TableBodyCell
					>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
