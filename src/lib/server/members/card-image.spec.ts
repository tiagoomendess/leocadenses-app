import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { drawMemberCard } from './card-image';

describe('drawMemberCard', () => {
	it('draws a card the size of the old ones, with a white QR code bottom-right', async () => {
		const png = await drawMemberCard({
			name: 'João da Silva',
			number: 235,
			url: 'https://leocadenses.pt/c/aB3dE5fG7'
		});
		const image = sharp(png);
		const meta = await image.metadata();
		expect([meta.format, meta.width, meta.height]).toEqual(['png', 1011, 638]);

		// The QR finder pattern's outer ring (top-left corner of the code) is white.
		const { data, info } = await image
			.extract({ left: 711, top: 338, width: 4, height: 4 })
			.raw()
			.toBuffer({ resolveWithObject: true });
		for (let i = 0; i < data.length; i += info.channels) {
			expect([data[i], data[i + 1], data[i + 2]]).toEqual([255, 255, 255]);
		}
	});
});
