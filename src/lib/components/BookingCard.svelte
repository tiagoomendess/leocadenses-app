<script lang="ts">
	import { ArrowRightOutline, CalendarEditSolid, PhoneSolid } from 'flowbite-svelte-icons';
	import { m } from '#lib/paraglide/messages.js';
	import type { PhoneLink } from '#lib/phone.ts';

	type Props = {
		booking: {
			title: string | null;
			text: string | null;
			phone: PhoneLink;
			image: string | null;
		};
	};

	let { booking }: Props = $props();
</script>

<!-- Pitch hire: the club's photo with the title over it and a button that opens the phone app. -->
<section
	aria-labelledby="booking-title"
	class="relative isolate overflow-hidden rounded-3xl bg-primary-900 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
>
	{#if booking.image}
		<img
			src={booking.image}
			alt=""
			class="absolute inset-0 -z-10 size-full object-cover"
			loading="lazy"
		/>
	{/if}
	<div
		class="absolute inset-0 -z-10 bg-linear-to-t from-gray-950/95 via-gray-950/50 to-gray-950/5"
	></div>

	<div class="flex min-h-80 flex-col justify-end gap-4 p-5 sm:min-h-96 sm:p-6">
		{#if booking.title}
			<p
				class="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest uppercase ring-1 ring-white/20 backdrop-blur-md"
			>
				<CalendarEditSolid class="size-3.5 text-accent-400" aria-hidden="true" />
				{m.home_booking_eyebrow()}
			</p>
		{/if}

		<div>
			<h2
				id="booking-title"
				class="text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl"
			>
				{booking.title ?? m.home_booking_eyebrow()}
			</h2>
			{#if booking.text}
				<p class="mt-1.5 text-sm text-white/80 sm:text-base">{booking.text}</p>
			{/if}
		</div>

		<!-- eslint-disable svelte/no-navigation-without-resolve -- a tel: link opens the phone app -->
		<a
			href={booking.phone.href}
			class="group flex items-center gap-3 rounded-2xl bg-white p-2.5 pe-4 text-gray-900 shadow-lg shadow-black/25 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none active:scale-[0.98] sm:w-fit sm:min-w-80"
		>
			<span
				class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white"
			>
				<PhoneSolid class="size-6" aria-hidden="true" />
			</span>
			<span class="min-w-0 flex-1">
				<span class="block text-xs font-semibold text-gray-600">{m.home_booking_call()}</span>
				<span class="block text-xl font-extrabold tracking-wide tabular-nums">
					{booking.phone.display}
				</span>
			</span>
			<ArrowRightOutline
				class="size-5 text-gray-500 transition group-hover:translate-x-1 rtl:rotate-180"
				aria-hidden="true"
			/>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
</section>
