<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PageForm from '../PageForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<PageHeader title="Nova página" back={resolve('/admin/(app)/pages')} backLabel="Páginas" />

<PageForm
	page={{
		title: '',
		slug: '',
		excerpt: null,
		body: '',
		metaDescription: null,
		metaKeywords: null,
		status: 'INACTIVE',
		imageUrl: null
	}}
	{form}
	cancelHref={resolve('/admin/(app)/pages')}
	submitLabel="Criar"
/>
