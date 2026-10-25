<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';

	let {
		item,
		parents,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		item: { title: string; url: string; target: string; parentId: number | null; order: number };
		parents: { id: number; title: string }[];
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel}>
	<Card size="xl" class="max-w-3xl p-6">
		<div class="grid gap-5 sm:grid-cols-2">
			<TextField name="title" label="Título" value={item.title} required maxlength={191} />
			<TextField
				name="url"
				label="Ligação"
				hint="/pages/contactos, # (só agrupa) ou https://…"
				value={item.url}
				required
				maxlength={191}
			/>
			<SelectField
				name="parent_id"
				label="Dentro de"
				hint="Os sub-itens aparecem na página “O Clube”."
				value={item.parentId === null ? '' : String(item.parentId)}
				options={[
					{ value: '', label: '— Primeiro nível —' },
					...parents.map((parent) => ({ value: String(parent.id), label: parent.title }))
				]}
			/>
			<TextField
				name="order"
				type="number"
				label="Ordem"
				value={item.order}
				required
				min={0}
				step={1}
			/>
			<SelectField
				name="target"
				label="Abrir"
				value={item.target === '_blank' ? '_blank' : '_self'}
				options={[
					{ value: '_self', label: 'Na mesma janela' },
					{ value: '_blank', label: 'Numa janela nova' }
				]}
			/>
		</div>
	</Card>
</EntityForm>
