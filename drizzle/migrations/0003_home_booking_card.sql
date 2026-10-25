-- The home page's "Reservar Campo de Futebol 5" block becomes its own card, filled from four new
-- settings (Definições → Site) seeded with what the old block showed. Data only, no DDL.
INSERT INTO `settings` (`key`, `display_name`, `value`, `details`, `type`, `order`, `group`)
SELECT 'site.booking_title', 'Reservas: título', 'Reservar Campo de Futebol 5', '', 'text', 7, 'Site'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `key` = 'site.booking_title');
--> statement-breakpoint
INSERT INTO `settings` (`key`, `display_name`, `value`, `details`, `type`, `order`, `group`)
SELECT 'site.booking_text', 'Reservas: texto', 'Relvado sintético em Santa Leocádia, Barcelos', '', 'text', 8, 'Site'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `key` = 'site.booking_text');
--> statement-breakpoint
INSERT INTO `settings` (`key`, `display_name`, `value`, `details`, `type`, `order`, `group`)
SELECT 'site.booking_phone', 'Reservas: telefone', '969090862', '', 'text', 9, 'Site'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `key` = 'site.booking_phone');
--> statement-breakpoint
INSERT INTO `settings` (`key`, `display_name`, `value`, `details`, `type`, `order`, `group`)
SELECT 'site.booking_image', 'Reservas: imagem', 'pages/November2021/campo_1.jpg', '', 'image', 10, 'Site'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `key` = 'site.booking_image');
--> statement-breakpoint
-- Drops the old block from the `home` body, keeping the welcome text after it. Only when the
-- block is still exactly the original HTML (compared without line breaks); an edited body is
-- left alone.
UPDATE `pages`
SET `body` = SUBSTRING(`body`, LOCATE('<p class="flow-text" style="text-align: center;">Bem Vindos', `body`))
WHERE `slug` = 'home'
	AND LOCATE('<p class="flow-text" style="text-align: center;">Bem Vindos', `body`) > 1
	AND REPLACE(REPLACE(
		LEFT(`body`, LOCATE('<p class="flow-text" style="text-align: center;">Bem Vindos', `body`) - 1),
		CHAR(13 USING utf8mb4), ''), CHAR(10 USING utf8mb4), '')
	= '<div style="display: flex; align-items: center; justify-content: center; position: relative;"><div style="position: absolute; display: flex; justify-content: center; align-items: center; flex-direction: column;"><p class="flow-text" style="color: white; text-shadow: black 1px 1px 3px; background-color: rgba(1, 1, 1, 0.5); padding: 5px 10px; border-radius: 4px;">Reservar Campo de Futebol 5</p><p class="flow-text" style="text-align: center; z-index: 10; color: white; text-shadow: black 1px 1px 2px; background-color: rgba(1, 1, 1, 0.5); padding: 5px 10px; border-radius: 4px;"><em class="material-icons">phone</em> 969090862</p></div><p style="text-align: center;"><img style="z-index: 1;" title="Campo de Futebol 5 Relvado Sint&eacute;tico em Santa Leoc&aacute;dia, Barcelos" src="https://leocadenses.pt/storage/pages/November2021/campo_1.jpg" alt="Campo de Futebol 5 Relvado Sint&eacute;tico em Santa Leoc&aacute;dia, Barcelos" width="100%" /></p></div>';
