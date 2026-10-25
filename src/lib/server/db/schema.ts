/**
 * Schema of the Leocadenses database. It was built by the Laravel + Voyager migrations
 * (E:\Projetos\leocadenses-website\database\migrations, last one
 * 2022_11_16_174830_alter_member_application_table) up to drizzle/migrations/0000_baseline.sql;
 * this file is now the source of truth.
 *
 * First generated with `drizzle-kit pull` and then curated:
 * - `tinyint(1)` flags are `boolean()`
 * - TIMESTAMP columns are naive Lisbon wall-clock strings (src/lib/dates.ts)
 * - `created_at` / `updated_at` are filled automatically (see ./columns.ts)
 * - foreign keys keep Laravel's constraint names
 * - the `migrations` table is left out
 * - Voyager's own tables (data_rows, data_types, translations, ...) are kept so the baseline
 *   reproduces the whole database; the app does not use them
 *
 * Change it through migrations: edit this file, then `npm run db:generate -- --name <what>` and
 * review the SQL (docs/architecture.md, "Migrations"). Never `drizzle-kit push`. Tables keep the
 * order and names of the introspection output so `npm run db:pull` diffs stay readable.
 */
import {
	bigint,
	boolean,
	double,
	foreignKey,
	index,
	int,
	longtext,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	tinyint,
	unique,
	varchar
} from 'drizzle-orm/mysql-core';
import { nowNaive } from '../../dates';
import { timestamps } from './columns';

export const pageStatuses = ['ACTIVE', 'INACTIVE'] as const;
export const postStatuses = ['PUBLISHED', 'DRAFT', 'PENDING'] as const;

export type PageStatus = (typeof pageStatuses)[number];
export type PostStatus = (typeof postStatuses)[number];

export const categories = mysqlTable(
	'categories',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		parentId: int('parent_id', { unsigned: true }),
		order: int('order').default(1).notNull(),
		name: varchar('name', { length: 191 }).notNull(),
		slug: varchar('slug', { length: 191 }).notNull(),
		...timestamps
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: 'categories_parent_id_foreign'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		unique('categories_slug_unique').on(table.slug)
	]
);

/** Voyager BREAD field definitions. Unused by this app. */
export const dataRows = mysqlTable(
	'data_rows',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		dataTypeId: int('data_type_id', { unsigned: true }).notNull(),
		field: varchar('field', { length: 191 }).notNull(),
		type: varchar('type', { length: 191 }).notNull(),
		displayName: varchar('display_name', { length: 191 }).notNull(),
		required: boolean('required').default(false).notNull(),
		browse: boolean('browse').default(true).notNull(),
		read: boolean('read').default(true).notNull(),
		edit: boolean('edit').default(true).notNull(),
		add: boolean('add').default(true).notNull(),
		delete: boolean('delete').default(true).notNull(),
		details: text('details'),
		order: int('order').default(1).notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.dataTypeId],
			foreignColumns: [dataTypes.id],
			name: 'data_rows_data_type_id_foreign'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

/** Voyager BREAD definitions. Unused by this app. */
export const dataTypes = mysqlTable(
	'data_types',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		name: varchar('name', { length: 191 }).notNull(),
		slug: varchar('slug', { length: 191 }).notNull(),
		displayNameSingular: varchar('display_name_singular', { length: 191 }).notNull(),
		displayNamePlural: varchar('display_name_plural', { length: 191 }).notNull(),
		icon: varchar('icon', { length: 191 }),
		modelName: varchar('model_name', { length: 191 }),
		policyName: varchar('policy_name', { length: 191 }),
		controller: varchar('controller', { length: 191 }),
		description: varchar('description', { length: 191 }),
		generatePermissions: boolean('generate_permissions').default(false).notNull(),
		serverSide: tinyint('server_side').default(0).notNull(),
		details: text('details'),
		...timestamps
	},
	(table) => [
		unique('data_types_name_unique').on(table.name),
		unique('data_types_slug_unique').on(table.slug)
	]
);

/** Identity document types of members and applications: NIF, CC, PASSPORT. */
export const documentTypes = mysqlTable('document_types', {
	id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
	name: varchar('name', { length: 25 }).notNull(),
	...timestamps
});

/** Laravel queue failures. Unused by this app. */
export const failedJobs = mysqlTable(
	'failed_jobs',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		uuid: varchar('uuid', { length: 191 }).notNull(),
		connection: text('connection').notNull(),
		queue: text('queue').notNull(),
		payload: longtext('payload').notNull(),
		exception: longtext('exception').notNull(),
		failedAt: timestamp('failed_at', { mode: 'string' }).defaultNow().notNull()
	},
	(table) => [unique('failed_jobs_uuid_unique').on(table.uuid)]
);

/** Membership applications sent from /novo-socio ("Candidatos"). */
export const memberApplication = mysqlTable('member_application', {
	id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	phone: varchar('phone', { length: 50 }).notNull(),
	email: varchar('email', { length: 50 }),
	document: varchar('document', { length: 50 }).notNull(),
	documentTypeId: bigint('document_type_id', { mode: 'number', unsigned: true }).notNull(),
	/** Never filled: the form has no photo upload. */
	picture: varchar('picture', { length: 255 }),
	...timestamps,
	address: varchar('address', { length: 255 })
});

/** Club members ("Sócios"). `card` is the R2 key of the generated card image. */
export const members = mysqlTable(
	'members',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		number: int('number', { unsigned: true }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		phone: varchar('phone', { length: 50 }),
		email: varchar('email', { length: 100 }),
		document: varchar('document', { length: 50 }).notNull(),
		documentTypeId: bigint('document_type_id', { mode: 'number', unsigned: true }).notNull(),
		address: varchar('address', { length: 255 }),
		/** Never filled by the old site. */
		picture: varchar('picture', { length: 255 }),
		/** Soft delete. The old site never set it (Voyager hard-deleted members). */
		deletedAt: timestamp('deleted_at', { mode: 'string' }),
		...timestamps,
		generateCard: boolean('generate_card').default(true).notNull(),
		card: varchar('card', { length: 255 }),
		cardToken: varchar('card_token', { length: 9 }),
		cardPrinted: boolean('card_printed').default(false).notNull(),
		notes: varchar('notes', { length: 255 })
	},
	(table) => [
		unique('members_number_unique').on(table.number),
		unique('members_card_token_unique').on(table.cardToken)
	]
);

export const menuItems = mysqlTable(
	'menu_items',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		menuId: int('menu_id', { unsigned: true }),
		title: varchar('title', { length: 191 }).notNull(),
		url: varchar('url', { length: 191 }).notNull(),
		target: varchar('target', { length: 191 }).default('_self').notNull(),
		iconClass: varchar('icon_class', { length: 191 }),
		color: varchar('color', { length: 191 }),
		parentId: int('parent_id'),
		order: int('order').notNull(),
		...timestamps,
		/** Voyager route name (admin menu only). */
		route: varchar('route', { length: 191 }),
		parameters: text('parameters')
	},
	(table) => [
		foreignKey({
			columns: [table.menuId],
			foreignColumns: [menus.id],
			name: 'menu_items_menu_id_foreign'
		}).onDelete('cascade')
	]
);

/** Menus: `site` drives the public navigation; `admin` was Voyager's sidebar (unused). */
export const menus = mysqlTable(
	'menus',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		name: varchar('name', { length: 191 }).notNull(),
		...timestamps
	},
	(table) => [unique('menus_name_unique').on(table.name)]
);

export const pages = mysqlTable(
	'pages',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		authorId: int('author_id').notNull(),
		title: varchar('title', { length: 191 }).notNull(),
		excerpt: text('excerpt'),
		body: text('body'),
		image: varchar('image', { length: 191 }),
		slug: varchar('slug', { length: 191 }).notNull(),
		metaDescription: text('meta_description'),
		metaKeywords: text('meta_keywords'),
		status: mysqlEnum('status', pageStatuses).default('INACTIVE').notNull(),
		...timestamps
	},
	(table) => [unique('pages_slug_unique').on(table.slug)]
);

export const partners = mysqlTable('partners', {
	id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
	name: varchar('name', { length: 50 }).notNull(),
	picture: varchar('picture', { length: 255 }).notNull(),
	url: varchar('url', { length: 191 }),
	position: smallint('position').default(1).notNull(),
	visible: boolean('visible').default(false).notNull(),
	...timestamps
});

/** Laravel password reset tokens. Unused (the old site had no reset flow). */
export const passwordResets = mysqlTable(
	'password_resets',
	{
		email: varchar('email', { length: 191 }).notNull(),
		token: varchar('token', { length: 191 }).notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
	},
	(table) => [index('password_resets_email_index').on(table.email)]
);

export const permissionRole = mysqlTable(
	'permission_role',
	{
		permissionId: bigint('permission_id', { mode: 'number', unsigned: true }).notNull(),
		roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.permissionId, table.roleId] }),
		index('permission_role_permission_id_index').on(table.permissionId),
		index('permission_role_role_id_index').on(table.roleId),
		foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: 'permission_role_permission_id_foreign'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: 'permission_role_role_id_foreign'
		}).onDelete('cascade')
	]
);

/** Voyager permission keys: `browse_admin`, `browse_media`, `<action>_<table>`. */
export const permissions = mysqlTable(
	'permissions',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		key: varchar('key', { length: 191 }).notNull(),
		tableName: varchar('table_name', { length: 191 }),
		...timestamps
	},
	(table) => [index('permissions_key_index').on(table.key)]
);

/** Laravel Sanctum tokens. Unused by this app. */
export const personalAccessTokens = mysqlTable(
	'personal_access_tokens',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		tokenableType: varchar('tokenable_type', { length: 191 }).notNull(),
		tokenableId: bigint('tokenable_id', { mode: 'number', unsigned: true }).notNull(),
		name: varchar('name', { length: 191 }).notNull(),
		token: varchar('token', { length: 64 }).notNull(),
		abilities: text('abilities'),
		lastUsedAt: timestamp('last_used_at', { mode: 'string' }),
		...timestamps
	},
	(table) => [
		index('personal_access_tokens_tokenable_type_tokenable_id_index').on(
			table.tokenableType,
			table.tokenableId
		),
		unique('personal_access_tokens_token_unique').on(table.token)
	]
);

export const posts = mysqlTable(
	'posts',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		authorId: int('author_id').notNull(),
		categoryId: int('category_id'),
		title: varchar('title', { length: 191 }).notNull(),
		seoTitle: varchar('seo_title', { length: 191 }),
		excerpt: text('excerpt'),
		body: text('body').notNull(),
		image: varchar('image', { length: 191 }),
		slug: varchar('slug', { length: 191 }).notNull(),
		metaDescription: text('meta_description'),
		metaKeywords: text('meta_keywords'),
		status: mysqlEnum('status', postStatuses).default('DRAFT').notNull(),
		featured: boolean('featured').default(false).notNull(),
		...timestamps
	},
	(table) => [unique('posts_slug_unique').on(table.slug)]
);

/** A member's payment of one season's quota. No foreign keys, as in Laravel. */
export const quotaPayments = mysqlTable('quota_payments', {
	id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
	memberId: bigint('member_id', { mode: 'number', unsigned: true }).notNull(),
	quotaId: bigint('quota_id', { mode: 'number', unsigned: true }).notNull(),
	amount: double('amount'),
	notes: varchar('notes', { length: 255 }),
	createdAt: timestamp('created_at', { mode: 'string' })
		.defaultNow()
		.notNull()
		.$defaultFn(() => nowNaive()),
	updatedAt: timestamp('updated_at', { mode: 'string' })
		.defaultNow()
		.onUpdateNow()
		.notNull()
		.$defaultFn(() => nowNaive())
		.$onUpdateFn(() => nowNaive())
});

/** Seasons members pay for ("2024/25"), with the date the payment is due. */
export const quotas = mysqlTable('quotas', {
	id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
	name: varchar('name', { length: 25 }).notNull(),
	// Laravel's migration left this as the table's first TIMESTAMP, so MySQL gave it
	// ON UPDATE CURRENT_TIMESTAMP and any edit reset the due date. 0002 removes that.
	dueDate: timestamp('due_date', { mode: 'string' }).defaultNow().notNull(),
	...timestamps
});

export const roles = mysqlTable(
	'roles',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		name: varchar('name', { length: 191 }).notNull(),
		displayName: varchar('display_name', { length: 191 }).notNull(),
		...timestamps
	},
	(table) => [unique('roles_name_unique').on(table.name)]
);

/** Voyager settings: `site.*` are used by the public site, `admin.*` were Voyager's look. */
export const settings = mysqlTable(
	'settings',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		key: varchar('key', { length: 191 }).notNull(),
		displayName: varchar('display_name', { length: 191 }).notNull(),
		value: text('value'),
		details: text('details'),
		type: varchar('type', { length: 191 }).notNull(),
		order: int('order').default(1).notNull(),
		group: varchar('group', { length: 191 })
	},
	(table) => [unique('settings_key_unique').on(table.key)]
);

/** Voyager multilingual copies (stale "en" duplicates). Unused by this app. */
export const translations = mysqlTable(
	'translations',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		tableName: varchar('table_name', { length: 191 }).notNull(),
		columnName: varchar('column_name', { length: 191 }).notNull(),
		foreignKey: int('foreign_key', { unsigned: true }).notNull(),
		locale: varchar('locale', { length: 191 }).notNull(),
		value: text('value').notNull(),
		...timestamps
	},
	(table) => [
		unique('translations_table_name_column_name_foreign_key_locale_unique').on(
			table.tableName,
			table.columnName,
			table.foreignKey,
			table.locale
		)
	]
);

/** Every member-card token ever issued, so a token is never reused. */
export const uniqueCodes = mysqlTable(
	'unique_codes',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		code: varchar('code', { length: 16 }).notNull(),
		...timestamps
	},
	(table) => [unique('unique_codes_code_unique').on(table.code)]
);

/** Extra roles of a user, on top of `users.role_id`. */
export const userRoles = mysqlTable(
	'user_roles',
	{
		userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
		roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.roleId] }),
		index('user_roles_user_id_index').on(table.userId),
		index('user_roles_role_id_index').on(table.roleId),
		foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: 'user_roles_role_id_foreign'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'user_roles_user_id_foreign'
		}).onDelete('cascade')
	]
);

/** Backoffice accounts. `password` is a bcrypt hash with Laravel's `$2y$` prefix. */
export const users = mysqlTable(
	'users',
	{
		id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
		roleId: bigint('role_id', { mode: 'number', unsigned: true }),
		name: varchar('name', { length: 191 }).notNull(),
		email: varchar('email', { length: 191 }).notNull(),
		avatar: varchar('avatar', { length: 191 }).default('users/default.png'),
		emailVerifiedAt: timestamp('email_verified_at', { mode: 'string' }),
		password: varchar('password', { length: 191 }).notNull(),
		rememberToken: varchar('remember_token', { length: 100 }),
		/** Voyager user settings (JSON, e.g. locale). */
		settings: text('settings'),
		...timestamps
	},
	(table) => [
		unique('users_email_unique').on(table.email),
		foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: 'users_role_id_foreign'
		})
	]
);
