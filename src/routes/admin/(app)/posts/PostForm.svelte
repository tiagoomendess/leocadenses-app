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
	import ToggleField from '#lib/components/admin/form/ToggleField.svelte';

	export type PostValues = {
		title: string;
		slug: string;
		categoryId: number | null;
		excerpt: string | null;
		body: string;
		seoTitle: string | null;
		metaDescription: string | null;
		metaKeywords: string | null;
		status: string;
		featured: boolean;
		imageUrl: string | null;
	};

	let {
		post,
		categories,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		post: PostValues;
		categories: { id: number; name: string }[];
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();

	const STATUS = [
		{ value: 'PUBLISHED', label: 'Publicada' },
		{ value: 'DRAFT', label: 'Rascunho' },
		{ value: 'PENDING', label: 'Pendente' }
	];
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel} multipart>
	<div class="grid gap-6 xl:grid-cols-3">
		<div class="space-y-6 xl:col-span-2">
			<Card size="xl" class="space-y-5 p-6">
				<TextField name="title" label="Título" value={post.title} required maxlength={191} />
				<TextField
					name="slug"
					label="Slug (endereço)"
					hint="/posts/slug — em branco gera a partir do título. Mudar o slug muda o endereço da notícia."
					value={post.slug}
					maxlength={191}
				/>
				<TextareaField name="excerpt" label="Resumo" value={post.excerpt} rows={2} />
				<RichTextField
					name="body"
					label="Texto"
					value={post.body}
					required
					uploadUrl="{resolve('/admin/api/editor/images')}?folder=posts"
				/>
			</Card>
			<Card size="xl" class="space-y-5 p-6">
				<Heading tag="h2" class="text-lg font-medium">Pesquisa e partilha</Heading>
				<TextField name="seo_title" label="Título SEO" value={post.seoTitle} maxlength={191} />
				<TextareaField
					name="meta_description"
					label="Descrição"
					hint="Aparece na lista de notícias, nos resultados de pesquisa e ao partilhar."
					value={post.metaDescription}
					rows={2}
				/>
				<TextareaField
					name="meta_keywords"
					label="Palavras-chave"
					value={post.metaKeywords}
					rows={2}
				/>
			</Card>
		</div>

		<div class="space-y-6">
			<Card size="xl" class="space-y-5 p-6">
				<SelectField name="status" label="Estado" value={post.status} options={STATUS} required />
				<SelectField
					name="category_id"
					label="Categoria"
					value={post.categoryId === null ? '' : String(post.categoryId)}
					options={[
						{ value: '', label: '— Sem categoria —' },
						...categories.map((category) => ({ value: String(category.id), label: category.name }))
					]}
				/>
				<ToggleField name="featured" label="Destaque" checked={post.featured} />
			</Card>
			<Card size="xl" class="p-6">
				<Heading tag="h2" class="mb-4 text-lg font-medium">Imagem</Heading>
				<ImageField
					name="image"
					label={post.imageUrl ? 'Substituir imagem' : 'Imagem da notícia'}
					current={post.imageUrl}
					accept="image/jpeg,image/png,image/gif,image/webp"
				/>
				{#if post.imageUrl}
					<Checkbox name="remove_image" class="mt-3">Remover a imagem</Checkbox>
				{/if}
			</Card>
		</div>
	</div>
</EntityForm>
