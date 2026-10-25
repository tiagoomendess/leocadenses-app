<script lang="ts" module>
	// How many entries back the in-app history goes; survives the button remounting between pages.
	let depth = 0;
</script>

<script lang="ts">
	import { ChevronLeftOutline } from 'flowbite-svelte-icons';
	import { afterNavigate } from '$app/navigation';
	import IconButton from '#lib/components/ui/IconButton.svelte';
	import { m } from '#lib/paraglide/messages.js';

	type Props = {
		/** Parent route, used when there is no in-app page to go back to (e.g. a shared link). */
		fallback: string;
	};

	let { fallback }: Props = $props();

	afterNavigate((navigation) => {
		if (navigation.type === 'enter') depth = 0;
		else if (navigation.type === 'popstate') depth = Math.max(0, depth + (navigation.delta ?? -1));
		else depth += 1;
	});

	function onclick(event: MouseEvent) {
		if (depth === 0) return;
		event.preventDefault();
		history.back();
	}
</script>

<IconButton href={fallback} label={m.action_back()} {onclick}>
	<ChevronLeftOutline class="size-6" />
</IconButton>
