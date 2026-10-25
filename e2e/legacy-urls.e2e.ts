import { expect, test } from '@playwright/test';

/**
 * Every URL the old Laravel site answered (routes/web.php, the Wayback Machine and its sitemap)
 * must still answer: with the page, or with a permanent redirect where things moved.
 */
const PAGES: [path: string, text: RegExp][] = [
	['/', /Próximo jogo/i],
	['/posts', /Notícias/],
	['/posts?page=2', /Notícias/],
	['/posts?page=4', /Notícias/],
	['/posts/campanha-de-regularizacao-de-quotas-2022-23', /Regularização de Quotas/],
	['/posts/rifas-de-natal-2022', /Natal/],
	['/pages/palmares', /Palmarés/],
	['/pages/orgaos-sociais', /Órgãos Sociais/],
	['/pages/contactos', /Contactos/],
	['/novo-socio', /Quero ser sócio/],
	['/clube', /O Clube/],
	['/admin/login', /Entrar/]
];

for (const [path, text] of PAGES) {
	test(`GET ${path}`, async ({ page }) => {
		const response = await page.goto(path);
		expect(response?.status()).toBe(200);
		await expect(page.locator('body')).toContainText(text);
	});
}

test('files and assets of the old site', async ({ request }) => {
	for (const path of ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/images/post_default.jpg']) {
		expect((await request.get(path)).status(), path).toBe(200);
	}
	const sitemap = await (await request.get('/sitemap.xml')).text();
	expect(sitemap).toContain('/posts/campanha-de-regularizacao-de-quotas-2022-23');
	expect(sitemap).not.toContain('/pages/home<');
});

test('uploads redirect to the CDN', async ({ request }) => {
	const response = await request.get('/storage/posts/July2022/quotas.jpg', { maxRedirects: 0 });
	expect(response.status()).toBe(301);
	expect(response.headers()['location']).toMatch(/\/posts\/July2022\/quotas\.jpg$/);
	expect((await request.get('/storage/../.env', { maxRedirects: 0 })).status()).toBe(404);
});

test('Voyager edit URLs and /welcome redirect', async ({ request }) => {
	const welcome = await request.get('/welcome', { maxRedirects: 0 });
	expect(welcome.status()).toBe(301);
	const admin = await request.get('/admin/members/12/edit', { maxRedirects: 0 });
	expect(admin.status()).toBe(303);
	expect(admin.headers()['location']).toContain('/admin/login?redirectTo=');
});

test('unknown pages and pages past the last one are 404', async ({ request }) => {
	expect((await request.get('/posts/nao-existe')).status()).toBe(404);
	expect((await request.get('/posts?page=999')).status()).toBe(404);
	expect((await request.get('/pages/nao-existe')).status()).toBe(404);
});

test('an unknown card is invalid and never indexed', async ({ page }) => {
	const response = await page.goto('/c/XXXXXXXXX');
	expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cartão inválido');
});
