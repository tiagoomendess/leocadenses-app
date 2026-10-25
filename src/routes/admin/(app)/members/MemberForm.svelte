<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextareaField from '#lib/components/admin/form/TextareaField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import ToggleField from '#lib/components/admin/form/ToggleField.svelte';

	export type MemberValues = {
		number: number;
		name: string;
		phone: string | null;
		email: string | null;
		documentTypeId: number;
		document: string;
		address: string | null;
		notes: string | null;
		generateCard: boolean;
	};

	let {
		member,
		documentTypes,
		applicationId = null,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		member: MemberValues;
		documentTypes: { id: number; name: string }[];
		/** The application this new member comes from (deleted once the member is saved). */
		applicationId?: number | null;
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel}>
	{#if applicationId}
		<input type="hidden" name="application_id" value={applicationId} />
	{/if}
	<Card size="xl" class="p-6">
		<Heading tag="h2" class="mb-5 text-lg font-medium">Dados do sócio</Heading>
		<div class="grid gap-5 md:grid-cols-4">
			<TextField
				name="number"
				type="number"
				label="Nº de sócio"
				value={member.number}
				required
				min={1}
				max={9999}
				step={1}
			/>
			<TextField
				name="name"
				label="Nome"
				value={member.name}
				required
				maxlength={60}
				autocomplete="off"
				class="md:col-span-3"
			/>
			<TextField
				name="phone"
				type="tel"
				label="Telemóvel"
				value={member.phone}
				maxlength={13}
				class="md:col-span-2"
			/>
			<TextField
				name="email"
				type="email"
				label="Email"
				value={member.email}
				maxlength={100}
				class="md:col-span-2"
			/>
			<SelectField
				name="document_type_id"
				label="Tipo de documento"
				value={String(member.documentTypeId)}
				options={documentTypes.map((type) => ({ value: String(type.id), label: type.name }))}
				required
			/>
			<TextField
				name="document"
				label="Documento"
				hint="Sem documento, o cartão aparece como inválido."
				value={member.document}
				required
				maxlength={20}
				class="md:col-span-3"
			/>
			<TextField
				name="address"
				label="Morada"
				value={member.address}
				maxlength={255}
				class="md:col-span-4"
			/>
			<TextareaField
				name="notes"
				label="Notas"
				value={member.notes}
				maxlength={255}
				rows={2}
				class="md:col-span-4"
			/>
		</div>
		<ToggleField
			name="generate_card"
			label="Gerar cartão"
			hint="O cartão é gerado ao guardar (substitui o anterior, que deixa de ser válido)."
			checked={member.generateCard}
			class="mt-6"
		/>
	</Card>
</EntityForm>
