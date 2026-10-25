<script lang="ts">
	import { Card, Checkbox, Heading } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import ImageField from '#lib/components/admin/form/ImageField.svelte';
	import RichTextField from '#lib/components/admin/form/RichTextField.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextareaField from '#lib/components/admin/form/TextareaField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';

	export type PageValues = {
		title: string;
		slug: string;
		excerpt: string | null;
		body: string;
		metaDescription: string | null;
		metaKeywords: string | null;
		status: string;
		imageUrl: string | null;
	};

	let {
		page,
		system = false,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		page: PageValues;
		/** A block of another page (home, membership form): its slug cannot change. */
		system?: boolean;
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel} multipart>
	<div class="grid gap-6 xl:grid-cols-3">
		<div class="space-y-6 xl:col-span-2">
			<Card size="xl" class="space-y-5 p-6">
				<TextField name="title" label="Título" value={page.title} required maxlength={191} />
				{#if system}
					<input type="hidden" name="slug" value={page.slug} />
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Endereço: <code>/pages/{page.slug}</code> — esta página aparece noutra parte do site, por
						isso o slug é fixo.
					</p>
				{:else}
					<TextField
						name="slug"
						label="Slug (endereço)"
						hint="/pages/slug — em branco gera a partir do título."
						value={page.slug}
						maxlength={191}
					/>
				{/if}
				<TextareaField name="excerpt" label="Resumo" value={page.excerpt} rows={2} />
				<RichTextField
					name="body"
					label="Conteúdo"
					value={page.body}
					uploadUrl="{resolve('/admin/api/editor/images')}?folder=pages"
				/>
			</Card>
			<Card size="xl" class="space-y-5 p-6">
				<Heading tag="h2" class="text-lg font-medium">Pesquisa e partilha</Heading>
				<TextareaField
					name="meta_description"
					label="Descrição"
					value={page.metaDescription}
					rows={2}
				/>
				<TextareaField
					name="meta_keywords"
					label="Palavras-chave"
					value={page.metaKeywords}
					rows={2}
				/>
			</Card>
		</div>
		<div class="space-y-6">
			<Card size="xl" class="p-6">
				<SelectField
					name="status"
					label="Estado"
					value={page.status}
					options={[
						{ value: 'ACTIVE', label: 'Ativa' },
						{ value: 'INACTIVE', label: 'Inativa' }
					]}
					required
				/>
			</Card>
			<Card size="xl" class="p-6">
				<Heading tag="h2" class="mb-4 text-lg font-medium">Imagem</Heading>
				<ImageField
					name="image"
					label={page.imageUrl ? 'Substituir imagem' : 'Imagem de partilha'}
					current={page.imageUrl}
					accept="image/jpeg,image/png,image/gif,image/webp"
				/>
				{#if page.imageUrl}
					<Checkbox name="remove_image" class="mt-3">Remover a imagem</Checkbox>
				{/if}
			</Card>
		</div>
	</div>
</EntityForm>
