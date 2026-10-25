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
	import ListFilter from '#lib/components/admin/list/ListFilter.svelte';
	import ListPagination from '#lib/components/admin/list/ListPagination.svelte';
	import ListSearch from '#lib/components/admin/list/ListSearch.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import SortHeader from '#lib/components/admin/list/SortHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const STATUS = {
		PUBLISHED: { label: 'Publicada', color: 'green' },
		DRAFT: { label: 'Rascunho', color: 'gray' },
		PENDING: { label: 'Pendente', color: 'yellow' }
	} as const;
</script>

<PageHeader title="Notícias">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/posts/create')}
			label="Nova notícia"
			granted={data.user.permissions}
			permission="add_posts"
		/>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row">
	<div class="flex-1"><ListSearch q={data.list.q} placeholder="Procurar por título" /></div>
	<ListFilter
		name="status"
		value={data.status}
		label="Filtrar por estado"
		allLabel="Todos os estados"
		options={Object.entries(STATUS).map(([value, status]) => ({ value, label: status.label }))}
		class="sm:w-48"
	/>
</div>

{#if data.rows.length === 0}
	<EmptyState q={data.list.q} message="Ainda não há notícias." />
{:else}
	<Table hoverable shadow>
		<TableHead>
			<TableHeadCell class="w-28"><span class="sr-only">Imagem</span></TableHeadCell>
			<SortHeader state={data.list} column="title" label="Título" />
			<SortHeader state={data.list} column="status" label="Estado" class="w-32" />
			<SortHeader
				state={data.list}
				column="id"
				label="Criada"
				defaultDir="desc"
				class="hidden w-44 md:table-cell"
			/>
		</TableHead>
		<TableBody>
			{#each data.rows as post (post.id)}
				<TableBodyRow>
					<TableBodyCell class="py-2">
						<img
							src={post.image ?? '/images/post_default.jpg'}
							alt=""
							class="h-12 w-20 rounded object-cover"
							loading="lazy"
						/>
					</TableBodyCell>
					<TableBodyCell class="whitespace-normal">
						<a
							href={resolve('/admin/(app)/posts/[id=id]', { id: post.id })}
							class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
						>
							{post.title}
						</a>
						{#if post.featured}<Badge color="yellow" class="ms-2">Destaque</Badge>{/if}
						<span class="block text-xs text-gray-500">/posts/{post.slug}</span>
					</TableBodyCell>
					<TableBodyCell>
						<Badge color={STATUS[post.status].color}>{STATUS[post.status].label}</Badge>
					</TableBodyCell>
					<TableBodyCell class="hidden md:table-cell"
						><DateTime value={post.createdAt} /></TableBodyCell
					>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<ListPagination state={data.list} />
