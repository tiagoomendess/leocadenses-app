<script lang="ts">
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { CheckOutline, LanguageOutline } from 'flowbite-svelte-icons';
	import IconButton from '#lib/components/ui/IconButton.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale, type Locale } from '#lib/paraglide/runtime.js';

	/** Each language in its own name, so visitors recognise theirs. */
	const NAMES: Record<Locale, string> = {
		'pt-PT': 'Português',
		'en-GB': 'English',
		'es-ES': 'Español',
		'fr-FR': 'Français'
	};

	const current = getLocale();
	let open = $state(false);
</script>

<IconButton id="language-picker" label={m.language_picker()}>
	<LanguageOutline class="size-5" />
</IconButton>
<Dropdown triggeredBy="#language-picker" bind:isOpen={open} simple class="w-44">
	{#each locales as locale (locale)}
		<DropdownItem
			class="flex w-full items-center justify-between gap-2"
			lang={locale}
			onclick={() => {
				open = false;
				// Stores the cookie and reloads, so the server renders the new language.
				if (locale !== current) setLocale(locale);
			}}
		>
			{NAMES[locale]}
			{#if locale === current}
				<CheckOutline class="size-4 text-primary-700 dark:text-primary-400" />
			{/if}
		</DropdownItem>
	{/each}
</Dropdown>
