<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	type Props = {
		partners: { name: string; url: string | null; picture: string }[];
	};

	let { partners }: Props = $props();
</script>

{#if partners.length > 0}
	<section aria-labelledby="partners-title" class="mt-10">
		<h2
			id="partners-title"
			class="mb-4 text-center text-sm font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400"
		>
			{m.partners_title()}
		</h2>
		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each partners as partner (partner.picture)}
				<li>
					<svelte:element
						this={partner.url ? 'a' : 'div'}
						href={partner.url ?? undefined}
						target={partner.url ? '_blank' : undefined}
						rel={partner.url ? 'noopener noreferrer' : undefined}
						class="flex h-24 items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition dark:border-gray-800 dark:bg-white/95 {partner.url
							? 'hover:shadow-md'
							: ''}"
					>
						<img
							src={partner.picture}
							alt={partner.name}
							loading="lazy"
							class="max-h-full max-w-full object-contain"
						/>
					</svelte:element>
				</li>
			{/each}
		</ul>
	</section>
{/if}
