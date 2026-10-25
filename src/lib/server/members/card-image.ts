import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createCanvas, GlobalFonts, loadImage, type Image } from '@napi-rs/canvas';
import QRCode from 'qrcode';

/**
 * Draws a member card exactly like the old `members:generate-cards` command (Intervention Image
 * on `public/images/base_cartao_socio.png`): the name in capitals and "SÓCIO Nº n" in white
 * Roboto, and a QR code to `/c/<token>` in white on transparent in the bottom-right corner.
 * The QR code is drawn locally instead of fetched from api.qrserver.com.
 *
 * The template and fonts are in `assets/member-card/` at the app root (the working directory of
 * `npm run dev`, PM2 and the scripts).
 */
const ASSETS = resolve(process.cwd(), 'assets', 'member-card');

const LAYOUT = {
	textX: 60,
	nameY: 510,
	numberY: 550,
	fontSize: 33,
	qrSize: 240,
	qrMargin: 60
} as const;

const FONTS = { bold: 'Leocadenses Roboto Bold', medium: 'Leocadenses Roboto Medium' };

let template: Promise<Image> | null = null;
let fontsRegistered = false;

function registerFonts() {
	if (fontsRegistered) return;
	GlobalFonts.registerFromPath(join(ASSETS, 'Roboto-Bold.ttf'), FONTS.bold);
	GlobalFonts.registerFromPath(join(ASSETS, 'Roboto-Medium.ttf'), FONTS.medium);
	fontsRegistered = true;
}

function loadTemplate(): Promise<Image> {
	template ??= readFile(join(ASSETS, 'base_cartao_socio.png')).then((data) => loadImage(data));
	return template;
}

export type CardContent = { name: string; number: number; url: string };

/** The card as PNG bytes (1011 × 638, like the old ones). */
export async function drawMemberCard({ name, number, url }: CardContent): Promise<Uint8Array> {
	registerFonts();
	const base = await loadTemplate();
	const canvas = createCanvas(base.width, base.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(base, 0, 0);

	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.font = `${LAYOUT.fontSize}px "${FONTS.bold}"`;
	ctx.fillText(name.trim().toLocaleUpperCase('pt-PT'), LAYOUT.textX, LAYOUT.nameY);
	ctx.font = `${LAYOUT.fontSize}px "${FONTS.medium}"`;
	ctx.fillText(`SÓCIO Nº ${number}`, LAYOUT.textX, LAYOUT.numberY);

	const qr = await QRCode.toBuffer(url, {
		type: 'png',
		width: LAYOUT.qrSize,
		margin: 0,
		errorCorrectionLevel: 'M',
		color: { dark: '#ffffffff', light: '#00000000' }
	});
	const qrImage = await loadImage(qr);
	ctx.drawImage(
		qrImage,
		base.width - LAYOUT.qrMargin - LAYOUT.qrSize,
		base.height - LAYOUT.qrMargin - LAYOUT.qrSize,
		LAYOUT.qrSize,
		LAYOUT.qrSize
	);

	return new Uint8Array(await canvas.encode('png'));
}
