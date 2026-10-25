<script lang="ts">
	import { BarsOutline } from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';
	import ThemeToggle from '#lib/components/shell/ThemeToggle.svelte';
	import UserMenu from './UserMenu.svelte';

	let {
		user,
		menuOpen,
		onToggleMenu
	}: {
		user: { name: string; email: string; avatar: string };
		menuOpen: boolean;
		onToggleMenu: () => void;
	} = $props();
</script>

<header
	class="fixed inset-x-0 top-0 z-30 h-16 bg-primary-700 text-white shadow-md lg:ps-72 dark:border-b dark:border-gray-700 dark:bg-gray-800"
>
	<div class="flex h-full items-center gap-2 px-2 sm:px-4">
		<button
			type="button"
			class="inline-flex size-10 items-center justify-center rounded-lg hover:bg-white/10 focus:ring-2 focus:ring-white/40 focus:outline-none lg:hidden"
			aria-label="Abrir ou fechar o menu"
			aria-controls="sidenav"
			aria-expanded={menuOpen}
			onclick={onToggleMenu}
		>
			<BarsOutline class="size-6" aria-hidden="true" />
		</button>

		<a
			href={resolve('/admin/(app)')}
			class="flex min-w-0 flex-1 items-center justify-center gap-2 truncate text-xl font-extralight sm:text-2xl"
		>
			<img src="/images/logo.png" alt="" class="size-8" />
			Leocadenses
		</a>

		<div class="flex items-center gap-1">
			<ThemeToggle class="text-white hover:bg-white/10 dark:text-white" />
			<UserMenu {user} />
		</div>
	</div>
</header>
