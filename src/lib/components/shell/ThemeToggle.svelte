<script lang="ts">
	import { MoonOutline, SunOutline } from 'flowbite-svelte-icons';
	import IconButton from '#lib/components/ui/IconButton.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { toggleTheme } from '#lib/theme.ts';

	let { class: className }: { class?: string } = $props();
</script>

<!-- Both icons are rendered and swapped with CSS, so the server never guesses the theme. -->
<IconButton label={m.theme_toggle()} class={className} onclick={() => toggleTheme()}>
	<MoonOutline class="size-5 dark:hidden" />
	<SunOutline class="hidden size-5 dark:block" />
</IconButton>
