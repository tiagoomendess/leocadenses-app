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

<PageHeader title="Quotas">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/quotas/create')}
			label="Nova quota"
			granted={data.user.permissions}
			permission="add_quotas"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4"><ListSearch q={data.list.q} placeholder="Procurar quota" /></div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Ainda não há quotas." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<SortHeader state={data.list} column="name" label="Nome" />
			<SortHeader state={data.list} column="due_date" label="Data limite" defaultDir="desc" />
			<TableHeadCell class="w-32">Pagamentos</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.rows as quota (quota.id)}
				<TableBodyRow>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/quotas/[id=id]', { id: quota.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{quota.name}
						</a>
					</TableBodyCell>
					<TableBodyCell><DateTime value={quota.dueDate} /></TableBodyCell>
					<TableBodyCell class="tabular-nums">{quota.payments}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
