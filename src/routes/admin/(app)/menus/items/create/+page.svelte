<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import MenuItemForm from '../../MenuItemForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHeader
	title="Novo item do menu"
	back={resolve('/admin/(app)/menus')}
	backLabel="Menu do site"
/>

<MenuItemForm
	item={{
		title: '',
		url: '/pages/',
		target: '_self',
		parentId: data.parents.find((p) => p.title === 'O Clube')?.id ?? null,
		order: 1
	}}
	parents={data.parents}
	{form}
	cancelHref={resolve('/admin/(app)/menus')}
	submitLabel="Criar"
/>
