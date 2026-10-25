<script lang="ts">
	import { Alert, Card } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import CreateButton from '#lib/components/admin/list/CreateButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader title="Menu do site">
	{#snippet actions()}
		<CreateButton
			href={resolve('/admin/(app)/menus/items/create')}
			label="Novo item"
			granted={data.user.permissions}
			permission="add_menus"
		/>
	{/snippet}
</PageHeader>

<Alert color="blue" class="mb-6 max-w-3xl">
	A navegação principal do site é a barra de baixo (Início, Notícias, Sócio, Clube). Os sub-itens
	deste menu aparecem como lista na página “O Clube”.
</Alert>

<Card size="xl" class="max-w-3xl p-0">
	<ul class="divide-y divide-gray-100 dark:divide-gray-700">
		{#each data.tree as item (item.id)}
			<li class="p-4">
				<a
					href={resolve('/admin/(app)/menus/items/[id=id]', { id: item.id })}
					class="font-medium text-gray-900 hover:text-primary-700 hover:underline dark:text-white"
				>
					{item.title}
				</a>
				<span class="ms-2 text-xs text-gray-500">{item.url}</span>
				{#if item.children.length}
					<ul class="mt-2 space-y-1 border-s border-gray-200 ps-4 dark:border-gray-700">
						{#each item.children as child (child.id)}
							<li>
								<a
									href={resolve('/admin/(app)/menus/items/[id=id]', { id: child.id })}
									class="text-gray-700 hover:text-primary-700 hover:underline dark:text-gray-300"
								>
									{child.title}
								</a>
								<span class="ms-2 text-xs text-gray-500">{child.url}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{:else}
			<li class="p-4 text-gray-500">O menu está vazio.</li>
		{/each}
	</ul>
</Card>
