<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		/** Accessible name; also shown as the tooltip. */
		label: string;
		href?: string;
		children: Snippet;
		class?: string;
	} & Omit<HTMLButtonAttributes & HTMLAnchorAttributes, 'class' | 'children'>;

	let { label, href, children, class: className, ...rest }: Props = $props();

	const classes = $derived([
		'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition',
		'hover:bg-gray-900/5 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none active:scale-95',
		'dark:text-gray-200 dark:hover:bg-white/10',
		className
	]);
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved paths -->
	<a {href} aria-label={label} title={label} class={classes} {...rest}>
		{@render children()}
	</a>
{:else}
	<button type="button" aria-label={label} title={label} class={classes} {...rest}>
		{@render children()}
	</button>
{/if}
