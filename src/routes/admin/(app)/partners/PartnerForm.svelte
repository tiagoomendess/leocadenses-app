<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import ImageField from '#lib/components/admin/form/ImageField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import ToggleField from '#lib/components/admin/form/ToggleField.svelte';

	export type PartnerValues = {
		name: string;
		url: string | null;
		position: number;
		visible: boolean;
	};

	let {
		partner,
		picture,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		partner: PartnerValues;
		/** URL of the stored picture; null on create, where it must be uploaded. */
		picture: string | null;
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel} multipart>
	<div class="grid gap-6 xl:grid-cols-3">
		<Card size="xl" class="p-6 xl:col-span-2">
			<Heading tag="h2" class="mb-5 text-lg font-medium">Parceiro</Heading>
			<div class="grid gap-5 md:grid-cols-3">
				<TextField
					name="name"
					label="Nome"
					value={partner.name}
					required
					maxlength={50}
					autocomplete="off"
					class="md:col-span-2"
				/>
				<TextField
					name="position"
					type="number"
					label="Posição"
					hint="Ordem no site (menor primeiro)."
					value={partner.position}
					required
					min={0}
					step={1}
				/>
				<TextField
					name="url"
					label="Ligação"
					hint="https://…, mailto:… ou # para não ter ligação."
					value={partner.url}
					maxlength={191}
					placeholder="https://"
					class="md:col-span-3"
				/>
			</div>
		</Card>

		<div class="space-y-6">
			<Card size="xl" class="p-6">
				<Heading tag="h2" class="mb-5 text-lg font-medium">Imagem</Heading>
				<ImageField
					name="picture"
					label={picture === null ? 'Logótipo' : 'Substituir logótipo'}
					current={picture}
					accept="image/jpeg,image/png,image/gif,image/webp"
					hint="PNG com fundo transparente fica melhor."
				/>
			</Card>
			<Card size="xl" class="p-6">
				<ToggleField name="visible" label="Visível no site" checked={partner.visible} />
			</Card>
		</div>
	</div>
</EntityForm>
