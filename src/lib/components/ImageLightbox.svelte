<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import { m } from '#lib/paraglide/messages.js';

	type Props = { src: string; alt: string; class?: string };

	let { src, alt, class: className }: Props = $props();

	let open = $state(false);
</script>

<!-- Replaces Materialize's `materialboxed`: tap the picture to see it whole. -->
<button
	type="button"
	class="block w-auto cursor-zoom-in overflow-hidden sm:rounded-3xl {className}"
	aria-label={m.image_open()}
	onclick={() => (open = true)}
>
	<img {src} {alt} class="max-h-[60vh] w-full object-cover" fetchpriority="high" />
</button>

<Modal
	bind:open
	size="xl"
	outsideclose
	autoclose
	class="bg-transparent shadow-none dark:bg-transparent"
>
	<img {src} {alt} class="mx-auto max-h-[85vh] w-auto rounded-xl" />
</Modal>
