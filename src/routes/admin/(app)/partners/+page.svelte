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
	import CreateButton from '#lib/components/admin/list/CreateButton.svelte';
	import EmptyState from '#lib/components/admin/list/EmptyState.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Parceiros">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/partners/create')}
			label="Novo parceiro"
			granted={data.user.permissions}
			permission="add_partners"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4">
	<ListSearch q={data.list.q} placeholder="Procurar por nome ou ligação" />
</div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Ainda não há parceiros." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<TableHeadCell class="w-28"><span class="sr-only">Imagem</span></TableHeadCell>
			<SortHeader state={data.list} column="name" label="Nome" />
			<SortHeader state={data.list} column="position" label="Posição" class="w-28" />
		</TableHead>
		<TableBody>
			{#each data.rows as partner (partner.id)}
				<TableBodyRow>
					<TableBodyCell class="py-2">
						{#if partner.picture}
							<img
								src={partner.picture}
								alt=""
								class="h-10 w-20 rounded bg-white object-contain p-1"
								loading="lazy"
							/>
						{/if}
					</TableBodyCell>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/partners/[id=id]', { id: partner.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{partner.name}
						</a>
						{#if !partner.visible}
							<Badge color="gray" class="ms-2">Oculto</Badge>
						{/if}
						<span class="block max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
							{partner.url}
						</span>
					</TableBodyCell>
					<TableBodyCell class="tabular-nums">{partner.position}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
