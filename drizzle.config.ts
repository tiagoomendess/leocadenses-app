import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env');

// Migrations run with a DDL-privileged user in production; the app only needs DML.
const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error('MIGRATION_DATABASE_URL or DATABASE_URL is not set');

// This app owns the schema of the database the Laravel site built (docs/architecture.md,
// "Migrations").
// - `npm run db:generate` diffs src/lib/server/db/schema.ts into ./drizzle/migrations
// - `npm run db:migrate` applies pending migrations (explicit deploy step, never on startup)
// - `npm run db:pull` introspects the database into ./drizzle/pull (git-ignored) to check drift
// Never run `drizzle-kit push`: it changes the database without a migration.
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle/migrations',
	dialect: 'mysql',
	dbCredentials: { url },
	// Laravel's own migration history is kept as a record but no longer managed.
	tablesFilter: ['!migrations', '!__drizzle_migrations'],
	migrations: { table: '__drizzle_migrations' },
	breakpoints: true,
	verbose: true,
	strict: true
});
