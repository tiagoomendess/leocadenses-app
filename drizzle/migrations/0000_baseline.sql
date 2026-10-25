-- Baseline: the schema the Laravel + Voyager migrations had built (last one
-- 2022_11_16_174830_alter_member_application_table). Existing databases are marked as migrated
-- with `npm run db:baseline` and never run this file; it only builds fresh databases (CI, tests).
-- Tables inherit Laravel's collation from the database.
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`parent_id` int unsigned,
	`order` int NOT NULL DEFAULT 1,
	`name` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `data_rows` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`data_type_id` int unsigned NOT NULL,
	`field` varchar(191) NOT NULL,
	`type` varchar(191) NOT NULL,
	`display_name` varchar(191) NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	`browse` boolean NOT NULL DEFAULT true,
	`read` boolean NOT NULL DEFAULT true,
	`edit` boolean NOT NULL DEFAULT true,
	`add` boolean NOT NULL DEFAULT true,
	`delete` boolean NOT NULL DEFAULT true,
	`details` text,
	`order` int NOT NULL DEFAULT 1,
	CONSTRAINT `data_rows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_types` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`display_name_singular` varchar(191) NOT NULL,
	`display_name_plural` varchar(191) NOT NULL,
	`icon` varchar(191),
	`model_name` varchar(191),
	`policy_name` varchar(191),
	`controller` varchar(191),
	`description` varchar(191),
	`generate_permissions` boolean NOT NULL DEFAULT false,
	`server_side` tinyint NOT NULL DEFAULT 0,
	`details` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `data_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_types_name_unique` UNIQUE(`name`),
	CONSTRAINT `data_types_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `document_types` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(25) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `document_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failed_jobs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`uuid` varchar(191) NOT NULL,
	`connection` text NOT NULL,
	`queue` text NOT NULL,
	`payload` longtext NOT NULL,
	`exception` longtext NOT NULL,
	`failed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failed_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `failed_jobs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `member_application` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(50),
	`document` varchar(50) NOT NULL,
	`document_type_id` bigint unsigned NOT NULL,
	`picture` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	`address` varchar(255),
	CONSTRAINT `member_application_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`number` int unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`email` varchar(100),
	`document` varchar(50) NOT NULL,
	`document_type_id` bigint unsigned NOT NULL,
	`address` varchar(255),
	`picture` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`generate_card` boolean NOT NULL DEFAULT true,
	`card` varchar(255),
	`card_token` varchar(9),
	`card_printed` boolean NOT NULL DEFAULT false,
	`notes` varchar(255),
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_number_unique` UNIQUE(`number`),
	CONSTRAINT `members_card_token_unique` UNIQUE(`card_token`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`menu_id` int unsigned,
	`title` varchar(191) NOT NULL,
	`url` varchar(191) NOT NULL,
	`target` varchar(191) NOT NULL DEFAULT '_self',
	`icon_class` varchar(191),
	`color` varchar(191),
	`parent_id` int,
	`order` int NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`route` varchar(191),
	`parameters` text,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`),
	CONSTRAINT `menus_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`author_id` int NOT NULL,
	`title` varchar(191) NOT NULL,
	`excerpt` text,
	`body` text,
	`image` varchar(191),
	`slug` varchar(191) NOT NULL,
	`meta_description` text,
	`meta_keywords` text,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE',
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`picture` varchar(255) NOT NULL,
	`url` varchar(191),
	`position` smallint NOT NULL DEFAULT 1,
	`visible` boolean NOT NULL DEFAULT false,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`email` varchar(191) NOT NULL,
	`token` varchar(191) NOT NULL,
	`created_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `permission_role` (
	`permission_id` bigint unsigned NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	CONSTRAINT `permission_role_permission_id_role_id_pk` PRIMARY KEY(`permission_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`key` varchar(191) NOT NULL,
	`table_name` varchar(191),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personal_access_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tokenable_type` varchar(191) NOT NULL,
	`tokenable_id` bigint unsigned NOT NULL,
	`name` varchar(191) NOT NULL,
	`token` varchar(64) NOT NULL,
	`abilities` text,
	`last_used_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `personal_access_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `personal_access_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`author_id` int NOT NULL,
	`category_id` int,
	`title` varchar(191) NOT NULL,
	`seo_title` varchar(191),
	`excerpt` text,
	`body` text NOT NULL,
	`image` varchar(191),
	`slug` varchar(191) NOT NULL,
	`meta_description` text,
	`meta_keywords` text,
	`status` enum('PUBLISHED','DRAFT','PENDING') NOT NULL DEFAULT 'DRAFT',
	`featured` boolean NOT NULL DEFAULT false,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `quota_payments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`quota_id` bigint unsigned NOT NULL,
	`amount` double,
	`notes` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quota_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotas` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(25) NOT NULL,
	`due_date` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `quotas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`display_name` varchar(191) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`key` varchar(191) NOT NULL,
	`display_name` varchar(191) NOT NULL,
	`value` text,
	`details` text,
	`type` varchar(191) NOT NULL,
	`order` int NOT NULL DEFAULT 1,
	`group` varchar(191),
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`table_name` varchar(191) NOT NULL,
	`column_name` varchar(191) NOT NULL,
	`foreign_key` int unsigned NOT NULL,
	`locale` varchar(191) NOT NULL,
	`value` text NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `translations_table_name_column_name_foreign_key_locale_unique` UNIQUE(`table_name`,`column_name`,`foreign_key`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `unique_codes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `unique_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` bigint unsigned NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	CONSTRAINT `user_roles_user_id_role_id_pk` PRIMARY KEY(`user_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`role_id` bigint unsigned,
	`name` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`avatar` varchar(191) DEFAULT 'users/default.png',
	`email_verified_at` timestamp,
	`password` varchar(191) NOT NULL,
	`remember_token` varchar(100),
	`settings` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `data_rows` ADD CONSTRAINT `data_rows_data_type_id_foreign` FOREIGN KEY (`data_type_id`) REFERENCES `data_types`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_menu_id_foreign` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_role` ADD CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_role` ADD CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `password_resets_email_index` ON `password_resets` (`email`);--> statement-breakpoint
CREATE INDEX `permission_role_permission_id_index` ON `permission_role` (`permission_id`);--> statement-breakpoint
CREATE INDEX `permission_role_role_id_index` ON `permission_role` (`role_id`);--> statement-breakpoint
CREATE INDEX `permissions_key_index` ON `permissions` (`key`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` ON `personal_access_tokens` (`tokenable_type`,`tokenable_id`);--> statement-breakpoint
CREATE INDEX `user_roles_user_id_index` ON `user_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_roles_role_id_index` ON `user_roles` (`role_id`);