import { expect, test } from '@playwright/test';

test('pages carry the security headers', async ({ request }) => {
	const headers = (await request.get('/')).headers();
	expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
	expect(headers['x-frame-options']).toBe('DENY');
	expect(headers['x-content-type-options']).toBe('nosniff');
	// The public site is indexed; only the backoffice and card checks are not.
	expect(headers['x-robots-tag']).toBeUndefined();
	expect((await request.get('/admin/login')).headers()['x-robots-tag']).toBe('noindex, nofollow');
});

test('the backoffice sends anonymous visitors to the login, and back afterwards', async ({
	page
}) => {
	await page.goto('/admin/members?q=silva');
	await expect(page).toHaveURL('/admin/login?redirectTo=%2Fadmin%2Fmembers%3Fq%3Dsilva');
	await expect(page.locator('input[name="redirectTo"]')).toHaveValue('/admin/members?q=silva');
});

test('wrong credentials are refused', async ({ page }) => {
	await page.goto('/admin/login');
	await page.getByLabel('Email').fill('ninguem@example.com');
	await page.getByLabel('Palavra-passe').fill('errada');
	await page.getByRole('button', { name: 'Entrar' }).click();
	await expect(page.getByRole('alert')).toContainText('Email ou palavra-passe incorretos.');
});

test('cross-site form posts are rejected', async ({ request }) => {
	const response = await request.post('/admin/login', {
		headers: { origin: 'https://evil.example' },
		form: { email: 'someone@example.com', password: 'x' }
	});
	expect(response.status()).toBe(403);
});
