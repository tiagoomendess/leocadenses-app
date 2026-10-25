<script lang="ts">
	import { Card, Checkbox, Heading, Helper } from 'flowbite-svelte';
	import type { ResolvedPathname } from '$app/types';
	import EntityForm from '#lib/components/admin/form/EntityForm.svelte';
	import ImageField from '#lib/components/admin/form/ImageField.svelte';
	import SelectField from '#lib/components/admin/form/SelectField.svelte';
	import TextField from '#lib/components/admin/form/TextField.svelte';

	let {
		user,
		avatarUrl,
		roles,
		creating = false,
		form,
		action,
		readonly = false,
		cancelHref,
		submitLabel
	}: {
		user: { name: string; email: string; roleId: number | null; extraRoleIds: number[] };
		avatarUrl: string | null;
		roles: { id: number; displayName: string }[];
		creating?: boolean;
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
			<div class="grid gap-5 sm:grid-cols-2">
				<TextField name="name" label="Nome" value={user.name} required maxlength={191} />
				<TextField
					name="email"
					type="email"
					label="Email"
					value={user.email}
					required
					maxlength={191}
					autocomplete="off"
				/>
				<div class="sm:col-span-2">
					<label
						for="field-password"
						class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
					>
						{creating ? 'Palavra-passe' : 'Nova palavra-passe'}
					</label>
					<input
						id="field-password"
						name="password"
						type="password"
						autocomplete="new-password"
						minlength="8"
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
					<Helper class="mt-1.5">
						{creating ? 'Pelo menos 8 caracteres.' : 'Em branco mantém a atual.'}
					</Helper>
				</div>
			</div>
		</Card>
		<div class="space-y-6">
			<Card size="xl" class="space-y-5 p-6">
				<Heading tag="h2" class="text-lg font-medium">Funções</Heading>
				<SelectField
					name="role_id"
					label="Função principal"
					value={user.roleId === null ? '' : String(user.roleId)}
					options={[
						{ value: '', label: '— Nenhuma —' },
						...roles.map((role) => ({ value: String(role.id), label: role.displayName }))
					]}
				/>
				<fieldset>
					<legend class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
						>Funções adicionais</legend
					>
					<div class="space-y-2">
						{#each roles as role (role.id)}
							<Checkbox
								name="extra_roles"
								value={String(role.id)}
								checked={user.extraRoleIds.includes(role.id)}
							>
								{role.displayName}
							</Checkbox>
						{/each}
					</div>
				</fieldset>
			</Card>
			<Card size="xl" class="p-6">
				<ImageField
					name="avatar"
					label="Fotografia"
					current={avatarUrl}
					accept="image/jpeg,image/png,image/gif,image/webp"
					square
				/>
				{#if avatarUrl && !creating}
					<Checkbox name="remove_avatar" class="mt-3">Repor a fotografia por omissão</Checkbox>
				{/if}
			</Card>
		</div>
	</div>
</EntityForm>
