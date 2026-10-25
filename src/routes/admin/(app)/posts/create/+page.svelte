<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PostForm from '../PostForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHeader title="Nova notícia" back={resolve('/admin/(app)/posts')} backLabel="Notícias" />

<PostForm
	post={{
		title: '',
		slug: '',
		categoryId: null,
		excerpt: null,
		body: '',
		seoTitle: null,
		metaDescription: null,
		metaKeywords: null,
		status: 'DRAFT',
		featured: false,
		imageUrl: null
	}}
	categories={data.categories}
	{form}
	cancelHref={resolve('/admin/(app)/posts')}
	submitLabel="Criar"
/>
