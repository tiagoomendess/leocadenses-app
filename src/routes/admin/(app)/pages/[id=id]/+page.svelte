<script lang="ts">
	import { Alert, Button } from 'flowbite-svelte';
	import { ArrowUpRightFromSquareOutline } from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import PageForm from '../PageForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canEdit = $derived(can(data.user.permissions, 'edit_pages'));
</script>

<PageHeader title={data.page.title} back={resolve('/admin/(app)/pages')} backLabel="Páginas">
	{#snippet actions()}
		<Button
			href={resolve('/(site)/pages/[slug]', { slug: data.page.slug })}
			target="_blank"
			color="alternative"
			class="gap-2"
		>
			<ArrowUpRightFromSquareOutline class="size-4" />
			Ver no site
		</Button>
		{#if can(data.user.permissions, 'delete_pages') && !data.system}
			<DeleteButton title="Apagar a página “{data.page.title}”?" />
		{/if}
	{/snippet}
</PageHeader>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<PageForm
	page={data.page}
	system={data.system}
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/pages')}
/>
