<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatNaive } from '#lib/dates.ts';
	import { getLocale } from '#lib/paraglide/runtime.js';

	type Props = {
		post: { slug: string; title: string; summary: string; image: string; createdAt: string | null };
		/** Larger card with the summary (news list) or compact (home page). */
		variant?: 'full' | 'compact';
	};

	let { post, variant = 'full' }: Props = $props();
</script>

<a
	href={resolve('/(site)/posts/[slug]', { slug: post.slug })}
	class="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:border-gray-800 dark:bg-gray-900"
>
	<div class="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
		<img
			src={post.image}
			alt=""
			loading="lazy"
			decoding="async"
			class="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
		/>
	</div>
	<div class="flex flex-1 flex-col gap-1.5 p-4">
		{#if post.createdAt}
			<time
				datetime={post.createdAt.replace(' ', 'T')}
				class="text-xs font-medium tracking-wide text-primary-700 uppercase dark:text-primary-400"
			>
				{formatNaive(post.createdAt, getLocale(), {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})}
			</time>
		{/if}
		<h3
			class="leading-snug font-bold text-gray-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400 {variant ===
			'full'
				? 'text-lg'
				: 'text-base'}"
		>
			{post.title}
		</h3>
		{#if variant === 'full' && post.summary}
			<p class="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{post.summary}</p>
		{/if}
	</div>
</a>
