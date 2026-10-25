import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the production build (`vite preview`, with .env). They read the
// local `leocadenses` database and never write to it, so they need the local-env MySQL with the
// old site's data; anything that changes data is covered by unit tests.
export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		locale: 'pt-PT',
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000
	}
});
