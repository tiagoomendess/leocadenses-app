<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';

	let {
		category,
		parents,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		category: { name: string; slug: string; parentId: number | null; order: number };
		parents: { id: number; name: string }[];
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();

	const parentOptions = $derived([
		{ value: '', label: '— Nenhuma —' },
		...parents.map((parent) => ({ value: String(parent.id), label: parent.name }))
	]);
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel}>
	<Card size="xl" class="max-w-3xl p-6">
		<div class="grid gap-5 sm:grid-cols-2">
			<TextField name="name" label="Nome" value={category.name} required maxlength={191} />
			<TextField
				name="slug"
				label="Slug"
				hint="Deixe em branco para gerar a partir do nome."
				value={category.slug}
				maxlength={191}
			/>
			<SelectField
				name="parent_id"
				label="Categoria mãe"
				value={category.parentId === null ? '' : String(category.parentId)}
				options={parentOptions}
			/>
			<TextField
				name="order"
				type="number"
				label="Ordem"
				value={category.order}
				required
				min={0}
				step={1}
			/>
		</div>
	</Card>
</EntityForm>
