<script lang="ts">
	import { CalendarMonthOutline, MapPinAltOutline } from 'flowbite-svelte-icons';
	import { formatNaive } from '#lib/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	type Props = {
		game: {
			homeTeam: string;
			awayTeam: string;
			homeEmblem: string | null;
			awayEmblem: string | null;
			ground: string | null;
			date: string | null;
		} | null;
		logo: string;
	};

	let { game, logo }: Props = $props();
</script>

<section
	aria-labelledby="next-game-title"
	class="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
>
	<h2
		id="next-game-title"
		class="mb-4 text-center text-sm font-semibold tracking-widest text-primary-700 uppercase dark:text-primary-400"
	>
		{m.home_next_game()}
	</h2>

	{#if game}
		<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
			{#each [{ name: game.homeTeam, emblem: game.homeEmblem }, null, { name: game.awayTeam, emblem: game.awayEmblem }] as team, index (index)}
				{#if team}
					<div class="flex flex-col items-center gap-2 text-center">
						<div class="flex size-20 items-center justify-center sm:size-24">
							{#if team.emblem}
								<img
									src={team.emblem}
									alt=""
									class="max-h-full max-w-full object-contain"
									loading="lazy"
								/>
							{/if}
						</div>
						<span
							class="text-sm leading-tight font-bold text-gray-900 sm:text-base dark:text-white"
						>
							{team.name}
						</span>
					</div>
				{:else}
					<span class="text-lg font-light text-gray-400">{m.home_vs()}</span>
				{/if}
			{/each}
		</div>

		<div
			class="mt-5 flex flex-col items-center gap-1.5 text-sm text-gray-600 sm:flex-row sm:justify-center sm:gap-5 dark:text-gray-300"
		>
			{#if game.date}
				<span class="inline-flex items-center gap-1.5">
					<CalendarMonthOutline class="size-4 text-primary-700 dark:text-primary-400" />
					<time datetime={game.date.replace(' ', 'T')} class="first-letter:uppercase">
						{formatNaive(game.date, getLocale(), {
							weekday: 'long',
							day: 'numeric',
							month: 'long',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</time>
				</span>
			{/if}
			{#if game.ground}
				<span class="inline-flex items-center gap-1.5">
					<MapPinAltOutline class="size-4 text-primary-700 dark:text-primary-400" />
					{game.ground}
				</span>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col items-center gap-3 text-center">
			<img src={logo} alt="" class="size-20" />
			<p class="text-gray-600 dark:text-gray-300">{m.home_no_game()}</p>
		</div>
	{/if}
</section>
