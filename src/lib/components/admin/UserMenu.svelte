<script lang="ts">
	import { Dropdown, DropdownGroup, DropdownHeader, DropdownItem } from 'flowbite-svelte';
	import {
		ArrowRightToBracketOutline,
		ArrowUpRightFromSquareOutline,
		UserCircleOutline
	} from 'flowbite-svelte-icons';
	import { resolve } from '$app/paths';

	let { user }: { user: { name: string; email: string; avatar: string } } = $props();
</script>

<button
	id="user-menu-button"
	type="button"
	class="rounded-full focus:ring-4 focus:ring-white/40 focus:outline-none"
	aria-label="Menu da conta"
>
	<!-- Plain <img>: Flowbite Avatar adds inline onload/onerror handlers that the CSP blocks. -->
	<img
		src={user.avatar}
		alt=""
		class="size-8 rounded-full bg-white object-cover"
		width="32"
		height="32"
	/>
</button>

<Dropdown triggeredBy="#user-menu-button" placement="bottom-end" class="w-60">
	<DropdownHeader>
		<span class="block truncate font-medium">{user.name}</span>
		<span class="block truncate text-gray-500 dark:text-gray-400">{user.email}</span>
	</DropdownHeader>
	<DropdownGroup>
		<DropdownItem href={resolve('/admin/(app)/profile')} class="flex gap-2">
			<UserCircleOutline class="size-5" aria-hidden="true" />
			O meu perfil
		</DropdownItem>
		<DropdownItem href={resolve('/(site)')} target="_blank" rel="noopener" class="flex gap-2">
			<ArrowUpRightFromSquareOutline class="size-5" aria-hidden="true" />
			Ver o site
		</DropdownItem>
		<li>
			<form method="POST" action={resolve('/admin/logout')}>
				<button
					type="submit"
					class="flex w-full gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
				>
					<ArrowRightToBracketOutline class="size-5" aria-hidden="true" />
					Sair
				</button>
			</form>
		</li>
	</DropdownGroup>
</Dropdown>
