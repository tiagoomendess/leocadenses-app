<script lang="ts">
	import { Alert, Breadcrumb, BreadcrumbItem, Button, Card, Fileupload } from 'flowbite-svelte';
	import { FolderOutline, PaperClipOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const base = resolve('/admin/(app)/media');
	const folderHref = (path: string) => (path ? `${base}?path=${encodeURIComponent(path)}` : base);
	const crumbs = $derived(
		data.folder
			? data.folder.split('/').map((name, index, parts) => ({
					name,
					path: parts.slice(0, index + 1).join('/')
				}))
			: []
	);
	const formatSize = (bytes: number) =>
		bytes > 1024 * 1024
			? `${(bytes / 1024 / 1024).toFixed(1)} MB`
			: `${Math.max(1, Math.round(bytes / 1024))} KB`;

	let uploading = $state(false);
	let files = $state<FileList>();
</script>

<PageHeader title="Media" />

<Breadcrumb class="mb-4">
	<BreadcrumbItem href={base} home>Armazenamento</BreadcrumbItem>
	{#each crumbs as crumb (crumb.path)}
		<BreadcrumbItem href={folderHref(crumb.path)}>{crumb.name}</BreadcrumbItem>
	{/each}
</Breadcrumb>

{#if data.error}
	<Alert color="red" class="mb-4">{data.error}</Alert>
{/if}
{#if form?.message}
	<Alert color="red" class="mb-4">{form.message}</Alert>
{/if}

{#if data.folder}
	<Card size="xl" class="mb-6 p-4">
		<form
			method="POST"
			action="?/upload&path={encodeURIComponent(data.folder)}"
			enctype="multipart/form-data"
			class="flex flex-col gap-3 sm:flex-row sm:items-center"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					await update();
					uploading = false;
					files = undefined;
				};
			}}
		>
			<Fileupload
				bind:files
				name="files"
				multiple
				accept="image/*,application/pdf"
				class="flex-1"
			/>
			<Button type="submit" loading={uploading} disabled={!files?.length}
				>Enviar para esta pasta</Button
			>
		</form>
	</Card>
{/if}

<!-- eslint-disable svelte/no-navigation-without-resolve -- folderHref resolves; files are CDN URLs -->
{#if data.folders.length}
	<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
		{#each data.folders as path (path)}
			<a
				href={folderHref(path)}
				class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium hover:border-primary-500 dark:border-gray-700 dark:bg-gray-800"
			>
				<FolderOutline class="size-5 shrink-0 text-accent-600" />
				<span class="truncate">{path.split('/').pop()}</span>
			</a>
		{/each}
	</div>
{/if}

{#if data.files.length}
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
		{#each data.files as file (file.key)}
			<Card size="xl" class="overflow-hidden p-0">
				<a
					href={file.url}
					target="_blank"
					rel="noopener"
					class="block aspect-square bg-gray-100 dark:bg-gray-700"
				>
					{#if file.image}
						<img src={file.url} alt="" loading="lazy" class="size-full object-contain" />
					{:else}
						<div class="flex size-full items-center justify-center">
							<PaperClipOutline class="size-10 text-gray-400" />
						</div>
					{/if}
				</a>
				<div class="space-y-2 p-3">
					<p class="truncate text-xs font-medium" title={file.name}>{file.name}</p>
					<p class="text-xs text-gray-500">{formatSize(file.size)}</p>
					<div class="flex items-center justify-between">
						<CopyButton value={file.url} />
						<form
							method="POST"
							action="?/delete&path={encodeURIComponent(data.folder)}"
							use:enhance={({ cancel }) => {
								if (!confirm(`Apagar ${file.name}? Páginas que o usem deixam de o mostrar.`))
									cancel();
							}}
						>
							<input type="hidden" name="key" value={file.key} />
							<button
								type="submit"
								class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700"
								aria-label="Apagar {file.name}"
							>
								<TrashBinOutline class="size-4" />
							</button>
						</form>
					</div>
				</div>
			</Card>
		{/each}
	</div>
{:else if !data.folders.length && !data.error}
	<p class="text-gray-500">Pasta vazia.</p>
{/if}
<!-- eslint-enable svelte/no-navigation-without-resolve -->
