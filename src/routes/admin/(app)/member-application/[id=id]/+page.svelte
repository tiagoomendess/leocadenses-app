<script lang="ts">
	import { Alert, Button, Card } from 'flowbite-svelte';
	import { UserAddOutline } from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DateTime from '#lib/components/DateTime.svelte';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const application = $derived(data.application);
	const canEdit = $derived(can(data.user.permissions, 'edit_member_application'));
</script>

<PageHeader
	title={application.name}
	back={resolve('/admin/(app)/member-application')}
	backLabel="Candidatos"
>
	{#snippet actions()}
		{#if can(data.user.permissions, 'add_members')}
			<Button
				href="{resolve('/admin/(app)/members/create')}?application={application.id}"
				class="gap-2"
			>
				<UserAddOutline class="size-4" />
				Converter em sócio
			</Button>
		{/if}
		{#if can(data.user.permissions, 'delete_member_application')}
			<DeleteButton title="Apagar a candidatura de “{application.name}”?" />
		{/if}
	{/snippet}
</PageHeader>

<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
	Recebida em <DateTime value={application.createdAt} />.
</p>

{#if !canEdit}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

<EntityForm
	{form}
	action="?/save"
	readonly={!canEdit}
	cancelHref={resolve('/admin/(app)/member-application')}
>
	<Card size="xl" class="max-w-3xl p-6">
		<div class="grid gap-5 sm:grid-cols-2">
			<TextField
				name="name"
				label="Nome"
				value={application.name}
				required
				maxlength={100}
				class="sm:col-span-2"
			/>
			<TextField name="phone" label="Telemóvel" value={application.phone} required maxlength={50} />
			<TextField name="email" type="email" label="Email" value={application.email} maxlength={50} />
			<SelectField
				name="document_type_id"
				label="Tipo de documento"
				value={String(application.documentTypeId)}
				options={data.documentTypes.map((type) => ({ value: String(type.id), label: type.name }))}
				required
			/>
			<TextField
				name="document"
				label="Documento"
				value={application.document}
				required
				maxlength={50}
			/>
			<TextField
				name="address"
				label="Morada"
				value={application.address}
				maxlength={255}
				class="sm:col-span-2"
			/>
		</div>
	</Card>
</EntityForm>
