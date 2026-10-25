<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import {
		BadgeCheckSolid,
		CloseCircleSolid,
		ExclamationCircleSolid,
		UserEditOutline
	} from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title={m.card_title()} description={m.card_description()} noindex />

<section class="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
	{#if data.valid}
		<BadgeCheckSolid class="mx-auto size-16 text-primary-600" />
		<h1 class="mt-2 text-2xl font-extrabold text-primary-700 dark:text-primary-400">
			{m.card_valid()}
		</h1>

		<dl class="mt-6 divide-y divide-gray-100 text-start dark:divide-gray-800">
			<div class="flex justify-between gap-4 py-2.5">
				<dt class="font-semibold">{m.card_number()}</dt>
				<dd class="text-gray-700 dark:text-gray-300">{data.number}</dd>
			</div>
			{#if data.details}
				<div class="flex justify-between gap-4 py-2.5">
					<dt class="font-semibold">{m.card_name()}</dt>
					<dd class="text-end text-gray-700 dark:text-gray-300">{data.details.name}</dd>
				</div>
				<div class="flex justify-between gap-4 py-2.5">
					<dt class="font-semibold">{m.card_phone()}</dt>
					<dd class="text-gray-700 dark:text-gray-300">{data.details.phone ?? '—'}</dd>
				</div>
				<div class="flex justify-between gap-4 py-2.5">
					<dt class="font-semibold">{m.card_email()}</dt>
					<dd class="break-all text-gray-700 dark:text-gray-300">{data.details.email ?? '—'}</dd>
				</div>
			{/if}
			<div class="flex justify-between gap-4 py-2.5">
				<dt class="font-semibold">{m.card_quotas()}</dt>
				<dd class="text-end text-gray-700 dark:text-gray-300">
					{data.paidQuotas.length > 0 ? data.paidQuotas.join(', ') : m.card_quotas_none()}
				</dd>
			</div>
		</dl>

		{#if data.upToDate}
			<p
				class="mt-5 rounded-2xl bg-primary-50 px-4 py-3 font-semibold text-primary-800 dark:bg-primary-950/60 dark:text-primary-300"
			>
				{m.card_up_to_date()}
			</p>
		{:else}
			<p
				class="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300"
			>
				<ExclamationCircleSolid class="size-5" />
				{m.card_overdue()}
			</p>
		{/if}
	{:else}
		<CloseCircleSolid class="mx-auto size-16 text-red-600" />
		<h1 class="mt-2 text-2xl font-extrabold text-red-700 dark:text-red-400">{m.card_invalid()}</h1>
		<p class="mt-3 text-gray-600 dark:text-gray-300">{m.card_invalid_help()}</p>
	{/if}

	<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
		<Button href={resolve('/(site)')} pill>{m.card_go_site()}</Button>
		{#if data.editId}
			<Button
				href={resolve('/admin/(app)/members/[id=id]', { id: data.editId })}
				color="yellow"
				pill
			>
				<UserEditOutline class="me-1.5 size-5" />
				{m.card_member_record()}
			</Button>
		{/if}
	</div>
</section>
