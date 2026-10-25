<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import UserForm from '../UserForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const defaultRole = $derived(data.roles.find((role) => role.name === 'user')?.id ?? null);
</script>

<PageHeader title="Novo utilizador" back={resolve('/admin/(app)/users')} backLabel="Utilizadores" />

<UserForm
	user={{ name: '', email: '', roleId: defaultRole, extraRoleIds: [] }}
	avatarUrl={null}
	roles={data.roles}
	creating
	{form}
	cancelHref={resolve('/admin/(app)/users')}
	submitLabel="Criar"
/>
