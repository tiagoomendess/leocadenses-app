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
	import ListFilter from '#lib/components/admin/list/ListFilter.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import { formatEuros } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Pagamentos">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/quota-payments/create')}
			label="Novo pagamento"
			granted={data.user.permissions}
			permission="add_quota_payments"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row">
	<div class="flex-1">
		<ListSearch q={data.list.q} placeholder="Procurar por nº ou nome do sócio" />
	</div>
	<ListFilter
		name="quota"
		value={data.quotaFilter ? String(data.quotaFilter) : null}
		label="Filtrar por quota"
		allLabel="Todas as quotas"
		options={data.quotas.map((quota) => ({ value: String(quota.id), label: quota.name }))}
		class="sm:w-48"
	/>
</div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Nenhum pagamento encontrado." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<SortHeader state={data.list} column="id" label="#" defaultDir="desc" class="w-20" />
			<SortHeader state={data.list} column="member" label="Sócio" />
			<SortHeader state={data.list} column="quota" label="Quota" defaultDir="desc" />
			<TableHeadCell>Montante</TableHeadCell>
			<TableHeadCell class="hidden md:table-cell">Registado</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.rows as payment (payment.id)}
				<TableBodyRow>
					<TableBodyCell class="tabular-nums">
						<a
							href={resolve('/admin/(app)/quota-payments/[id=id]', { id: payment.id })}
							class="font-medium text-primary-700 hover:underline dark:text-primary-400"
						>
							{payment.id}
						</a>
					</TableBodyCell>
					<TableBodyCell>
						{#if payment.memberId}
							<a
								href={resolve('/admin/(app)/members/[id=id]', { id: payment.memberId })}
								class="text-gray-900 hover:text-primary-700 hover:underline dark:text-white"
							>
								{payment.memberNumber} · {payment.memberName}
							</a>
						{:else}
							<span class="text-gray-400">Sócio removido</span>
						{/if}
					</TableBodyCell>
					<TableBodyCell>{payment.quotaName ?? '—'}</TableBodyCell>
					<TableBodyCell class="tabular-nums">{formatEuros(payment.amount)}</TableBodyCell>
					<TableBodyCell class="hidden md:table-cell"
						><DateTime value={payment.createdAt} /></TableBodyCell
					>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
