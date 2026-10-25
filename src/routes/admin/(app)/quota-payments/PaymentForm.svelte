<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import SearchSelect from '#lib/components/SearchSelect.svelte';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import FormField from '#lib/components/admin/form/FormField.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import type { Option } from '#lib/options.ts';

	let {
		payment,
		member,
		quotas,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		payment: { quotaId: number | null; amount: number | null; notes: string | null };
		/** The selected member (from `load`), so the edit form needs no request. */
		member: Option | null;
		quotas: { id: number; name: string }[];
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();

	// Starts from the stored member; the select then writes the admin's choice into it.
	let selected = $derived<Option | null>(member);
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel}>
	<Card size="xl" class="max-w-3xl p-6">
		<div class="grid gap-5 sm:grid-cols-2">
			<FormField name="member_id" label="Sócio" required class="sm:col-span-2">
				{#snippet children(field)}
					<SearchSelect
						name="member_id"
						id={field.id}
						endpoint={resolve('/admin/api/options/members')}
						bind:value={selected}
						placeholder="Procurar por nº ou nome"
						label="Sócio"
						required
						disabled={readonly}
						invalid={field.invalid}
						describedBy={field.describedBy}
					/>
				{/snippet}
			</FormField>
			<SelectField
				name="quota_id"
				label="Quota"
				value={payment.quotaId === null
					? quotas[0]
						? String(quotas[0].id)
						: ''
					: String(payment.quotaId)}
				options={quotas.map((quota) => ({ value: String(quota.id), label: quota.name }))}
				required
			/>
			<TextField
				name="amount"
				label="Montante (€)"
				hint="Em branco se não foi registado."
				value={payment.amount === null ? '' : String(payment.amount).replace('.', ',')}
			/>
			<TextField
				name="notes"
				label="Observações"
				value={payment.notes}
				maxlength={255}
				class="sm:col-span-2"
			/>
		</div>
	</Card>
</EntityForm>
