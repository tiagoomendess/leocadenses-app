<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import { naiveToInput } from '#lib/dates.ts';

	let {
		quota,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		quota: { name: string; dueDate: string | null };
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel}>
	<Card size="xl" class="max-w-2xl p-6">
		<div class="grid gap-5 sm:grid-cols-2">
			<TextField
				name="name"
				label="Nome"
				hint="A época, por exemplo 2026/27."
				value={quota.name}
				required
				maxlength={25}
			/>
			<TextField
				name="due_date"
				type="datetime-local"
				label="Data limite"
				hint="Depois desta data a quota conta como em atraso."
				value={naiveToInput(quota.dueDate)}
				required
			/>
		</div>
	</Card>
</EntityForm>
