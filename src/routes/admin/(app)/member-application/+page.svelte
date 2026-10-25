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
	import EmptyState from '#lib/components/admin/list/EmptyState.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Candidatos" />

<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
	Pedidos enviados pelo formulário “Novo Sócio”. Abra um pedido para o converter em sócio.
</p>

<div class="mb-4">
	<ListSearch q={data.list.q} placeholder="Procurar por nome, email ou telefone" />
</div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Não há candidaturas por tratar." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<SortHeader state={data.list} column="name" label="Nome" />
			<TableHeadCell class="hidden md:table-cell">Contacto</TableHeadCell>
			<SortHeader state={data.list} column="created_at" label="Recebido" class="w-44" />
		</TableHead>
		<TableBody>
			{#each data.rows as application (application.id)}
				<TableBodyRow>
					<TableBodyCell>
						<a
							href={resolve('/admin/(app)/member-application/[id=id]', { id: application.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{application.name}
						</a>
					</TableBodyCell>
					<TableBodyCell class="hidden md:table-cell">
						{application.phone}
						{#if application.email}
							<span class="block text-xs text-gray-500">{application.email}</span>
						{/if}
					</TableBodyCell>
					<TableBodyCell><DateTime value={application.createdAt} /></TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
