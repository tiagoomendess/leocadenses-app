<script lang="ts">
	import { formatNaive } from '#lib/dates.ts';

	type Props = {
		/** A stored naive value (`YYYY-MM-DD HH:MM:SS`, Lisbon wall clock). */
		value: string | null | undefined;
		/** Date only, without the time. */
		dateOnly?: boolean;
	};

	let { value, dateOnly = false }: Props = $props();

	const text = $derived(
		formatNaive(
			value,
			'pt-PT',
			dateOnly ? { dateStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' }
		)
	);
</script>

{#if value && text}
	<time datetime={value.replace(' ', 'T')} class="whitespace-nowrap">{text}</time>
{/if}
