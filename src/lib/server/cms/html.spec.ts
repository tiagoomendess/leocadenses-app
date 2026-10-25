import { describe, expect, it } from 'vitest';
import {
	isBlankHtml,
	plainText,
	replaceLegacyIcons,
	sanitizeHtml,
	toDisplayHtml,
	toStoredHtml
} from './html';

const CDN = 'https://cdn.leocadenses.pt';

describe('toDisplayHtml', () => {
	it('points every legacy upload URL at the CDN', () => {
		const html = [
			'<img src="https://leocadenses.pt/storage/posts/July2022/quotas.jpg">',
			'<img src="/storage/pages/November2021/campo_1.jpg">',
			"<a href='storage/pages/October2021/CATAO_EXEMPLO.jpg'>cartão</a>",
			'<img src="https://leocadenses.pt/storage/posts/November2022/Captura%20de%20ecr%C3%A3.png">'
		].join('');
		expect(toDisplayHtml(html, CDN)).toBe(
			[
				'<img src="https://cdn.leocadenses.pt/posts/July2022/quotas.jpg">',
				'<img src="https://cdn.leocadenses.pt/pages/November2021/campo_1.jpg">',
				"<a href='https://cdn.leocadenses.pt/pages/October2021/CATAO_EXEMPLO.jpg'>cartão</a>",
				'<img src="https://cdn.leocadenses.pt/posts/November2022/Captura%20de%20ecr%C3%A3.png">'
			].join('')
		);
	});

	it('decodes entities and encodes spaces of legacy file names', () => {
		expect(
			toDisplayHtml(
				'<img src="https://leocadenses.pt/storage/posts/November2022/Captura de ecr&atilde; 1.png">',
				CDN
			)
		).toBe(
			'<img src="https://cdn.leocadenses.pt/posts/November2022/Captura%20de%20ecr%C3%A3%201.png">'
		);
	});

	it('leaves other links alone', () => {
		const html =
			'<a href="https://leocadenses.pt/posts/convocatoria-para-assembleia-geral">x</a>' +
			'<a href="https://www.facebook.com/leocadenses">fb</a>';
		expect(toDisplayHtml(html, CDN)).toBe(html);
	});
});

describe('toStoredHtml', () => {
	it('turns CDN and legacy upload URLs back into /storage paths', () => {
		expect(
			toStoredHtml(
				'<img src="https://cdn.leocadenses.pt/posts/October2026/abc.jpg">' +
					'<img src="https://leocadenses.pt/storage/posts/July2022/quotas.jpg">',
				CDN
			)
		).toBe(
			'<img src="/storage/posts/October2026/abc.jpg"><img src="/storage/posts/July2022/quotas.jpg">'
		);
	});

	it('round-trips with toDisplayHtml', () => {
		const stored = '<p><img src="/storage/posts/November2022/Captura%20de%20ecr%C3%A3.png"></p>';
		expect(toStoredHtml(toDisplayHtml(stored, CDN), CDN)).toBe(stored);
	});
});

describe('sanitizeHtml', () => {
	it('drops scripts and event handlers', () => {
		const html = sanitizeHtml('<p onclick="x()">ok</p><script>alert(1)</script>');
		expect(html).toBe('<p>ok</p>');
	});

	it('keeps inline styles and the Google Forms embed of a legacy post', () => {
		const form =
			'<iframe src="https://docs.google.com/forms/d/e/abc/viewform?embedded=true" width="640" height="800" frameborder="0"></iframe>';
		const html = sanitizeHtml(`<div style="display: flex;">${form}</div>`);
		expect(html).toContain('style="display: flex;"');
		expect(html).toContain('src="https://docs.google.com/forms/d/e/abc/viewform?embedded=true"');
	});

	it('removes iframes from other hosts', () => {
		expect(sanitizeHtml('<iframe src="https://evil.example/x"></iframe><p>a</p>')).toBe('<p>a</p>');
	});
});

describe('replaceLegacyIcons', () => {
	it('turns Material Icons ligatures into styled spans', () => {
		expect(replaceLegacyIcons('<p><i class="material-icons left">phone</i> 969</p>')).toBe(
			'<p><span class="cms-icon cms-icon-phone" aria-hidden="true"></span> 969</p>'
		);
		// The home page has the <em> TinyMCE turned the <i> into.
		expect(replaceLegacyIcons('<em class="material-icons">phone</em> 969')).toBe(
			'<span class="cms-icon cms-icon-phone" aria-hidden="true"></span> 969'
		);
	});
});

describe('text helpers', () => {
	it('detects blank bodies', () => {
		expect(isBlankHtml('<p>&nbsp;</p><p><br></p>')).toBe(true);
		expect(isBlankHtml('<p><img src="/storage/x.jpg"></p>')).toBe(false);
	});

	it('extracts plain text', () => {
		expect(plainText('<h3>Futebol</h3><p>Campeões&nbsp;2023</p>')).toBe('Futebol Campeões 2023');
		expect(plainText('<p>abcdefghij</p>', 5)).toBe('abcd…');
	});
});
