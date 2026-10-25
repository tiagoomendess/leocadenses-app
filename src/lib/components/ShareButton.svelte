<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { ShareNodesOutline } from 'flowbite-svelte-icons';
	import { m } from '#lib/paraglide/messages.js';

	type Props = { title: string; class?: string };

	let { title, class: className }: Props = $props();

	let copied = $state(false);

	async function share() {
		const url = window.location.href;
		if (navigator.share) {
			try {
				await navigator.share({ title, url });
			} catch {
				// Cancelled by the user.
			}
			return;
		}
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<Button color="alternative" size="xs" pill class={className} onclick={share}>
	<ShareNodesOutline class="me-1.5 size-4" />
	<span aria-live="polite">{copied ? m.link_copied() : m.share()}</span>
</Button>
