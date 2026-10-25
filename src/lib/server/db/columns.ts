import { timestamp } from 'drizzle-orm/mysql-core';
import { nowNaive } from '../../dates';

/**
 * Eloquent fills `created_at` / `updated_at` on every save. Drizzle does the same through
 * `$defaultFn` (insert) and `$onUpdateFn` (update), so writes stay compatible with Laravel.
 * Values are naive Lisbon wall-clock strings (see src/lib/dates.ts).
 */
export const timestamps = {
	createdAt: timestamp('created_at', { mode: 'string' }).$defaultFn(() => nowNaive()),
	updatedAt: timestamp('updated_at', { mode: 'string' })
		.$defaultFn(() => nowNaive())
		.$onUpdateFn(() => nowNaive())
};
