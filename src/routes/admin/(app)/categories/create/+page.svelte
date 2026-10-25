<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import CategoryForm from '../CategoryForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHeader
	title="Nova categoria"
	back={resolve('/admin/(app)/categories')}
	backLabel="Categorias"
/>

<CategoryForm
	category={{ name: '', slug: '', parentId: null, order: 1 }}
	parents={data.parents}
	{form}
	cancelHref={resolve('/admin/(app)/categories')}
	submitLabel="Criar"
/>
