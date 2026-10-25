<script lang="ts">
	import { Alert, Button } from 'flowbite-svelte';
	import { ArrowUpRightFromSquareOutline } from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PostForm from '../PostForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_posts'));
</script>

<PageHeader title={data.post.title} back={resolve('/admin/(app)/posts')} backLabel="Notícias">
	{#snippet actions()}
		<Button
			href={resolve('/(site)/posts/[slug]', { slug: data.post.slug })}
			target="_blank"
			color="alternative"
			class="gap-2"
		>
			<ArrowUpRightFromSquareOutline class="size-4" />
			{data.post.status === 'PUBLISHED' ? 'Ver no site' : 'Pré-visualizar'}
		</Button>
		{#if can(data.user.permissions, 'delete_posts')}
			<DeleteButton title="Apagar a notícia “{data.post.title}”?" />
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<PostForm
	post={data.post}
	categories={data.categories}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/posts')}
/>
