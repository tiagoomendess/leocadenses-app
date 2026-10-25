<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';
	import PageHeader from '#lib/components/admin/list/PageHeader.svelte';
	import { visibleNavigation } from '#lib/admin/navigation.ts';
	import { formatNumber } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const groups = $derived(visibleNavigation(data.user.permissions));

	const stats = $derived(
		data.counts
			? [
					{ label: 'Sócios', value: formatNumber(data.counts.members), href: '/admin/members' },
					{
						label: data.counts.quota ? `Quota ${data.counts.quota.name} paga` : 'Quota da época',
						value: data.counts.quota ? formatNumber(data.counts.quota.paid) : '—',
						href: '/admin/quota-payments'
					},
					{
						label: 'Candidaturas por tratar',
						value: formatNumber(data.counts.applications),
						href: '/admin/member-application'
					},
					{
						label: 'Cartões por gerar',
						value: formatNumber(data.counts.pendingCards),
						href: '/admin/members?filter=pending_card'
					}
				]
			: []
	);
</script>

<PageHeader title="Olá, {data.user.name.split(' ')[0]}" />

<!-- eslint-disable svelte/no-navigation-without-resolve -- static /admin paths -->
{#if stats.length}
	<div class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each stats as stat (stat.label)}
			<a href={stat.href} class="group">
				<Card size="xl" class="h-full p-5 transition group-hover:shadow-md">
					<p class="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
					<p class="mt-1 text-3xl font-semibold text-gray-900 tabular-nums dark:text-white">
						{stat.value}
					</p>
				</Card>
			</a>
		{/each}
	</div>
{/if}

<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
	{#each groups as group (group.label)}
		<Card size="xl" class="p-5">
			<h2 class="mb-3 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
				<group.icon class="size-5 text-primary-700 dark:text-primary-400" />
				{group.label}
			</h2>
			<ul class="divide-y divide-gray-100 dark:divide-gray-700">
				{#each group.items as item (item.href)}
					<li>
						<a
							href={item.href}
							class="flex items-center justify-between py-2.5 text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-400"
						>
							{item.label}
							<ArrowRightOutline class="size-4" />
						</a>
					</li>
				{/each}
			</ul>
		</Card>
	{/each}
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
