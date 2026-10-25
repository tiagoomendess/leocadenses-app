<script lang="ts">
	import {
		Badge,
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { RefreshOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import CreateButton from '#lib/components/admin/list/CreateButton.svelte';
	import EmptyState from '#lib/components/admin/list/EmptyState.svelte';
	import ListFilter from '#lib/components/admin/list/ListFilter.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const FILTERS = [
		{ value: 'overdue', label: 'Quotas em atraso' },
		{ value: 'pending_card', label: 'Cartão por gerar' },
		{ value: 'not_printed', label: 'Cartão por imprimir' },
		{ value: 'deleted', label: 'Apagados' }
	];

	let generating = $state(false);
</script>

<PageHeader title="Sócios">
	{#snippet actions()}
		{#if can(data.user.permissions, 'edit_members')}
			<form
				method="POST"
				action="?/generateCards"
				use:enhance={() => {
					generating = true;
					return async ({ update }) => {
						await update();
						generating = false;
					};
				}}
			>
				<Button type="submit" color="alternative" class="gap-2" loading={generating}>
					<RefreshOutline class="size-4" />
					Gerar cartões pendentes
				</Button>
			</form>
		{/if}
		<CreateButton
			href={resolve('/admin/(app)/members/create')}
			label="Novo sócio"
			granted={data.user.permissions}
			permission="add_members"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row">
	<div class="flex-1">
		<ListSearch q={data.list.q} placeholder="Procurar por nº, nome, telefone, email ou documento" />
	</div>
	<ListFilter
		name="filter"
		value={data.filter}
		label="Filtrar sócios"
		allLabel="Todos os sócios"
		options={FILTERS}
		class="sm:w-56"
	/>
</div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Nenhum sócio encontrado." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<SortHeader state={data.list} column="number" label="Nº" defaultDir="desc" class="w-20" />
			<SortHeader state={data.list} column="name" label="Nome" />
			<TableHeadCell class="hidden md:table-cell">Telemóvel</TableHeadCell>
			<TableHeadCell>Quotas</TableHeadCell>
			<TableHeadCell class="hidden sm:table-cell">Cartão</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.rows as member (member.id)}
				<TableBodyRow>
					<TableBodyCell class="font-semibold tabular-nums">{member.number}</TableBodyCell>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/members/[id=id]', { id: member.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{member.name}
						</a>
					</TableBodyCell>
					<TableBodyCell class="hidden md:table-cell">{member.phone ?? ''}</TableBodyCell>
					<TableBodyCell>
						{#if member.upToDate}
							<Badge color="green">Em dia</Badge>
						{:else}
							<Badge color="red">Em atraso</Badge>
						{/if}
					</TableBodyCell>
					<TableBodyCell class="hidden sm:table-cell">
						{#if member.generateCard}
							<Badge color="yellow">Por gerar</Badge>
						{:else if member.card && !member.cardPrinted}
							<Badge color="indigo">Por imprimir</Badge>
						{:else if member.card}
							<Badge color="gray">Impresso</Badge>
						{/if}
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
