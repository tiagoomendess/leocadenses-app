<script lang="ts" module>
	type TurnstileApi = {
		render: (
			element: HTMLElement,
			options: { sitekey: string; theme?: 'auto' | 'light' | 'dark'; language?: string }
		) => string;
		reset: (widgetId?: string) => void;
		remove: (widgetId: string) => void;
	};

	declare global {
		interface Window {
			turnstile?: TurnstileApi;
		}
	}

	const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
	let loading: Promise<TurnstileApi> | null = null;

	/** Loads Cloudflare's script once per page view (explicit rendering works with client routing). */
	function loadTurnstile(): Promise<TurnstileApi> {
		if (window.turnstile) return Promise.resolve(window.turnstile);
		loading ??= new Promise((done, fail) => {
			const script = document.createElement('script');
			script.src = SCRIPT;
			script.async = true;
			script.dataset.cfasync = 'false';
			script.onload = () =>
				window.turnstile ? done(window.turnstile) : fail(new Error('turnstile'));
			script.onerror = () => {
				loading = null;
				fail(new Error('Could not load Turnstile'));
			};
			document.head.append(script);
		});
		return loading;
	}
</script>

<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';

	type Props = {
		siteKey: string;
		/** Bump after each submission: tokens are single use, so the widget renders a new one. */
		resetKey?: number;
	};

	let { siteKey, resetKey = 0 }: Props = $props();

	let widgetId: string | null = null;
	let api: TurnstileApi | null = null;

	function mount(element: HTMLElement) {
		let cancelled = false;
		void loadTurnstile().then((turnstile) => {
			if (cancelled) return;
			api = turnstile;
			widgetId = turnstile.render(element, {
				sitekey: siteKey,
				theme: 'auto',
				language: getLocale().toLowerCase()
			});
		});
		return () => {
			cancelled = true;
			if (api && widgetId) api.remove(widgetId);
			widgetId = null;
		};
	}

	$effect(() => {
		if (resetKey > 0 && api && widgetId) api.reset(widgetId);
	});
</script>

{#if siteKey}
	<div {@attach mount} class="min-h-[65px]"></div>
{/if}
