import { expect, test } from '@playwright/test';

test.describe('on a phone', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test('the dock moves between sections and marks the current one', async ({ page }) => {
		await page.goto('/');
		const dock = page.getByRole('navigation', { name: 'Navegação principal' });
		await expect(dock.getByRole('link', { name: 'Início' })).toHaveAttribute(
			'aria-current',
			'page'
		);

		await dock.getByRole('link', { name: 'Notícias' }).click();
		await expect(page).toHaveURL('/posts');
		await expect(dock.getByRole('link', { name: 'Notícias' })).toHaveAttribute(
			'aria-current',
			'page'
		);

		await dock.getByRole('link', { name: 'Clube' }).click();
		await expect(page).toHaveURL('/clube');
	});

	test('the back button returns to the list, or to the section without history', async ({
		page
	}) => {
		await page.goto('/posts');
		await page.locator('main a[href^="/posts/"]').first().click();
		await expect(page).toHaveURL(/\/posts\/.+/);
		await page.getByRole('link', { name: 'Voltar' }).click();
		await expect(page).toHaveURL('/posts');
		await expect(page.getByRole('link', { name: 'Voltar' })).toHaveCount(0);

		// Opened from a shared link: no history, so "Voltar" goes to the section.
		await page.goto('/pages/palmares');
		await expect(page.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/clube');
	});
});

test('the theme toggle switches and remembers the choice', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	const html = page.locator('html');
	await expect(html).not.toHaveClass(/dark/);

	await page.getByRole('button', { name: 'Alternar tema claro/escuro' }).click();
	await expect(html).toHaveClass(/dark/);

	await page.reload();
	await expect(html).toHaveClass(/dark/);
});

test('the language picker translates the site but never the backoffice', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Idioma' }).click();
	await page.getByRole('button', { name: 'English' }).click();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
	await expect(page.getByRole('navigation', { name: 'Main navigation' })).toContainText('News');

	await page.goto('/admin/login');
	await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entrar');
});
