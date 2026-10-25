<script lang="ts">
	import { Alert, Badge, Button, Card, Heading, Input, Label } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		DownloadOutline,
		RefreshOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { can } from '#lib/auth/permissions.ts';
	import DateTime from '#lib/components/DateTime.svelte';
	import DeleteButton from '#lib/components/admin/form/DeleteButton.svelte';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import { formatEuros } from '#lib/format.ts';
	import MemberForm from '../MemberForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const permissions = $derived(data.user.permissions);
	const canEdit = $derived(can(permissions, 'edit_members') && !data.member.deletedAt);
	const actionMessage = $derived(
		form && typeof form === 'object' && 'message' in form && !('errors' in form)
			? String(form.message)
			: null
	);

	let busy = $state<string | null>(null);
	const submitting = (key: string) => () => {
		busy = key;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = null;
		};
	};
</script>

<PageHeader
	title="{data.member.number} · {data.member.name}"
	back={resolve('/admin/(app)/members')}
	backLabel="Sócios"
>
	{#snippet actions()}
		{#if data.upToDate}
			<Badge color="green" large>Quotas em dia</Badge>
		{:else}
			<Badge color="red" large>Quotas em atraso</Badge>
		{/if}
		{#if can(permissions, 'delete_members') && !data.member.deletedAt}
			<DeleteButton title="Apagar o sócio “{data.member.name}”?">
				O cartão deixa de ser válido. O sócio pode ser recuperado na lista “Apagados”.
			</DeleteButton>
		{/if}
	{/snippet}
</PageHeader>

{#if data.member.deletedAt}
	<Alert color="red" class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<span>Sócio apagado em <DateTime value={data.member.deletedAt} />.</span>
		{#if can(permissions, 'delete_members')}
			<form method="POST" action="?/restore" use:enhance={submitting('restore')}>
				<Button type="submit" size="xs" color="alternative" loading={busy === 'restore'}>
					Recuperar
				</Button>
			</form>
		{/if}
	</Alert>
{:else if !can(permissions, 'edit_members')}
	<Alert color="blue" class="mb-6">Só tem permissão para ver este registo.</Alert>
{/if}

{#if actionMessage}
	<Alert color="red" class="mb-6">{actionMessage}</Alert>
{/if}

<div class="grid gap-6 xl:grid-cols-3">
	<div class="xl:col-span-2">
		<MemberForm
			member={data.member}
			documentTypes={data.documentTypes}
			{form}
			action="?/save"
			readonly={!canEdit}
			cancelHref={resolve('/admin/(app)/members')}
		/>
	</div>

	<div class="space-y-6">
		<Card size="xl" class="p-6">
			<Heading tag="h2" class="mb-4 text-lg font-medium">Cartão de sócio</Heading>
			{#if data.card}
				<img
					src={data.card.image}
					alt="Cartão de sócio de {data.member.name}"
					class="w-full rounded-lg shadow"
				/>
				<div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
					{#if data.card.printed}
						<Badge color="gray">Impresso / verificado</Badge>
					{:else}
						<Badge color="indigo">Por imprimir</Badge>
					{/if}
					{#if data.card.checkUrl}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- absolute card URL -->
						<a
							href={data.card.checkUrl}
							target="_blank"
							rel="noopener"
							class="text-primary-700 hover:underline dark:text-primary-400"
						>
							Ver verificação
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<Button href={data.card.image} download color="alternative" size="sm" class="gap-2">
						<DownloadOutline class="size-4" />
						Descarregar
					</Button>
				</div>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">Este sócio ainda não tem cartão.</p>
			{/if}
			{#if canEdit}
				<form method="POST" action="?/regenerateCard" class="mt-4" use:enhance={submitting('card')}>
					<Button type="submit" size="sm" class="gap-2" loading={busy === 'card'}>
						<RefreshOutline class="size-4" />
						{data.card ? 'Regenerar cartão' : 'Gerar cartão'}
					</Button>
				</form>
			{/if}
		</Card>

		{#if data.quotas}
			<Card size="xl" class="p-6">
				<Heading tag="h2" class="mb-4 text-lg font-medium">Quotas</Heading>
				<ul class="divide-y divide-gray-100 dark:divide-gray-700">
					{#each data.quotas as quota (quota.id)}
						<li class="py-3">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="font-medium text-gray-900 dark:text-white">{quota.name}</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">
										Até <DateTime value={quota.dueDate} dateOnly />
									</p>
								</div>
								{#if quota.payment}
									<div class="flex items-center gap-2">
										<span
											class="inline-flex items-center gap-1 text-sm font-medium text-primary-700 dark:text-primary-400"
										>
											<CheckCircleSolid class="size-4" />
											{quota.payment.amount !== null ? formatEuros(quota.payment.amount) : 'Paga'}
										</span>
										{#if can(permissions, 'delete_quota_payments') && !data.member.deletedAt}
											<form
												method="POST"
												action="?/removePayment"
												use:enhance={submitting(`rm-${quota.payment.id}`)}
											>
												<input type="hidden" name="payment_id" value={quota.payment.id} />
												<button
													type="submit"
													class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700"
													aria-label="Remover o pagamento de {quota.name}"
													title="Remover pagamento"
													disabled={busy !== null}
												>
													<TrashBinOutline class="size-4" />
												</button>
											</form>
										{/if}
									</div>
								{:else if can(permissions, 'add_quota_payments') && !data.member.deletedAt}
									<form
										method="POST"
										action="?/addPayment"
										class="flex items-end gap-2"
										use:enhance={submitting(`add-${quota.id}`)}
									>
										<input type="hidden" name="quota_id" value={quota.id} />
										<div>
											<Label for="amount-{quota.id}" class="sr-only">Montante de {quota.name}</Label
											>
											<Input
												id="amount-{quota.id}"
												name="amount"
												value="10"
												inputmode="decimal"
												size="sm"
												class="w-20"
											/>
										</div>
										<Button type="submit" size="xs" loading={busy === `add-${quota.id}`}
											>Marcar paga</Button
										>
									</form>
								{:else}
									<Badge color="red">Por pagar</Badge>
								{/if}
							</div>
						</li>
					{:else}
						<li class="py-3 text-sm text-gray-500">Ainda não há quotas.</li>
					{/each}
				</ul>
			</Card>
		{/if}
	</div>
</div>
