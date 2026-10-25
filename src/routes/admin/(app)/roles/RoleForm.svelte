<script lang="ts">
	import { Card, Checkbox, Heading } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';

	let {
		role,
		groups,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		role: { name: string; displayName: string; permissionIds: number[] };
		groups: { table: string; items: { id: number; key: string }[] }[];
		form: unknown;
		action?: string;
		readonly?: boolean;
		cancelHref: ResolvedPathname;
		submitLabel?: string;
	} = $props();

	/** Portuguese names of Voyager's tables and actions. */
	const TABLES: Record<string, string> = {
		'': 'Geral',
		categories: 'Categorias',
		member_application: 'Candidatos',
		members: 'Sócios',
		menus: 'Menu do site',
		pages: 'Páginas',
		partners: 'Parceiros',
		posts: 'Notícias',
		quota_payments: 'Pagamentos',
		quotas: 'Quotas',
		roles: 'Funções',
		settings: 'Definições',
		users: 'Utilizadores'
	};
	const ACTIONS: Record<string, string> = {
		browse: 'Listar',
		read: 'Ver',
		edit: 'Editar',
		add: 'Criar',
		delete: 'Apagar'
	};
	const GENERAL: Record<string, string> = {
		browse_admin: 'Entrar na administração',
		browse_media: 'Media',
		browse_bread: 'BREAD (Voyager)',
		browse_database: 'Base de dados (Voyager)',
		browse_compass: 'Compass (Voyager)'
	};

	const label = (key: string) => GENERAL[key] ?? ACTIONS[key.split('_')[0]] ?? key;

	// A deeply reactive map the checkboxes bind into, reset when another role is opened. A writable
	// $derived would hold a plain object, so ticking a box would not update "Todas/Nenhuma".
	// eslint-disable-next-line svelte/prefer-writable-derived -- see above
	let checked = $state<Record<number, boolean>>({});
	$effect.pre(() => {
		checked = Object.fromEntries(role.permissionIds.map((id) => [id, true]));
	});

	function toggleGroup(items: { id: number }[], value: boolean) {
		for (const item of items) checked[item.id] = value;
	}
</script>

<EntityForm {form} {action} {readonly} {cancelHref} {submitLabel}>
	<Card size="xl" class="mb-6 max-w-3xl p-6">
		<div class="grid gap-5 sm:grid-cols-2">
			<TextField
				name="display_name"
				label="Nome"
				value={role.displayName}
				required
				maxlength={191}
			/>
			<TextField
				name="name"
				label="Identificador"
				hint="Nome interno, sem espaços (ex.: direção)."
				value={role.name}
				required
				maxlength={191}
			/>
		</div>
	</Card>

	<Heading tag="h2" class="mb-3 text-lg font-medium">Permissões</Heading>
	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each groups as group (group.table)}
			{@const all = group.items.every((item) => checked[item.id])}
			<Card size="xl" class="p-5">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-medium text-gray-900 dark:text-white">
						{TABLES[group.table] ?? group.table}
					</h3>
					{#if !readonly}
						<button
							type="button"
							class="text-xs text-primary-700 hover:underline dark:text-primary-400"
							onclick={() => toggleGroup(group.items, !all)}
						>
							{all ? 'Nenhuma' : 'Todas'}
						</button>
					{/if}
				</div>
				<div class="space-y-2">
					{#each group.items as item (item.id)}
						<Checkbox name="permissions" value={String(item.id)} bind:checked={checked[item.id]}>
							{label(item.key)}
						</Checkbox>
					{/each}
				</div>
			</Card>
		{/each}
	</div>
</EntityForm>
