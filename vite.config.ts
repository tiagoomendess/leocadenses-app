import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { enhancedImages } from '@sveltejs/enhanced-img';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		enhancedImages(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// scripts/deploy.sh builds into build.next while build/ keeps serving.
			adapter: adapter({ out: process.env.BUILD_DIR || 'build' }),
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					// Turnstile (membership form) loads its script from Cloudflare.
					'script-src': ['self', 'https://challenges.cloudflare.com'],
					// Svelte transitions, Flowbite and legacy CMS bodies set inline style attributes.
					'style-src': ['self', 'unsafe-inline'],
					// Media comes from R2 (cdn.leocadenses.pt), next-game emblems from domingoasdez and
					// legacy post bodies may point anywhere. localhost: LocalStack in development.
					'img-src': ['self', 'data:', 'blob:', 'https:', 'http://localhost:*'],
					'font-src': ['self', 'data:'],
					'connect-src': ['self', 'https://challenges.cloudflare.com'],
					// Turnstile, the Google Forms embedded in a legacy post, and YouTube videos.
					'frame-src': [
						'https://challenges.cloudflare.com',
						'https://docs.google.com',
						'https://www.youtube-nocookie.com',
						'https://www.youtube.com'
					],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			}
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// URLs stay unprefixed (legacy paths must not change); the language follows a cookie,
			// then the browser, then pt-PT. /admin is always pt-PT (src/lib/i18n.ts).
			strategy: ['custom-admin', 'cookie', 'preferredLanguage', 'baseLocale']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				// Pre-bundle the UI libraries up front: discovering them mid-run reloads the test page.
				optimizeDeps: { include: ['flowbite-svelte', 'flowbite-svelte-icons'] },
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
