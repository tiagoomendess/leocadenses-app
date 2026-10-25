# Architecture

How the Leocadenses app is built and the rules to follow when changing it. The plan in
[plan.md](plan.md) lists what is ported and in which order; this document records how it ended up.

## Overview

One SvelteKit 3 app serves both the public site and the backoffice (`/admin`). It runs on Node
(adapter-node) on a VPS, behind nginx and Cloudflare, on port 3005. It reads and writes the same
MariaDB database the Laravel + Voyager site used, without changing its data model. Uploaded files
live in the Cloudflare R2 bucket `leocadenses`, public at `https://cdn.leocadenses.pt`.

## Legacy site

The old site is in `E:\Projetos\leocadenses-website` (Laravel 8, Voyager 1.5) and runs locally at
http://localhost:8001 against the same local database. Everything the old site did is listed in
the inventory table of [plan.md](plan.md); its URLs must keep answering.

## Database

- **This app owns the schema** (see "Migrations"). `src/lib/server/db/schema.ts` is the source of
  truth. It keeps every table Laravel and Voyager created, including the Voyager internals the
  app does not use (`data_rows`, `data_types`, `translations`, `failed_jobs`, ...), so the
  baseline rebuilds the whole database. Dropping those is a later "contract" migration.
- `created_at` / `updated_at` are filled automatically (`timestamps` in `db/columns.ts`), like
  Eloquent did. Don't set them by hand.
- Relations for `db.query.*` live in `db/relations.ts`. `quota_payments` has no foreign keys
  (Laravel never declared them), so code must not assume referential integrity there.
- Production runs MariaDB 10.11; the local copy runs in the local-env MySQL 8. The migrations
  only use syntax both accept.

### Dates

Laravel ran with `timezone = Europe/Lisbon` and wrote `TIMESTAMP` columns as naive Lisbon
wall-clock strings. Both apps leave the MySQL session time zone at the server default, so the
strings round-trip unchanged. This app keeps that contract (`src/lib/dates.ts`):

- Columns are read as strings: the pool uses `dateStrings: true` and every timestamp column is
  `mode: 'string'`. Never turn them into `Date`s with a time zone.
- New values are `nowNaive()`, the Lisbon wall clock as `YYYY-MM-DD HH:MM:SS`.
- Display with `formatNaive()` (formats exactly what is stored). Comparisons between stored
  values and "now" compare naive strings (same format, so string order is time order).
- Form inputs use `naiveToInput()` / `inputToNaive()` with `type="datetime-local"`.

### Migrations

Schema changes are drizzle-kit migrations in `drizzle/migrations/` (SQL, journal and snapshots,
all committed). `0000_baseline.sql` is the schema the Laravel + Voyager migrations built (up to
`2022_11_16_174830_alter_member_application_table`); a fresh database built from it is identical
to the existing one (checked with `mysqldump --no-data` on both). Existing databases never run
it: `npm run db:baseline` (`scripts/db-baseline.ts`) records it as applied, once per database.
Laravel's `migrations` table stays as a record and is excluded from drizzle.

| Migration                  | What it does                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| `0000_baseline`            | The Laravel schema (fresh databases only)                         |
| `0001_database_collation`  | Database default collation `utf8mb4_unicode_ci`, like every table |
| `0002_quotas_due_date_fix` | Drops the accidental `ON UPDATE CURRENT_TIMESTAMP` on `due_date`  |

Workflow:

1. Edit `schema.ts` (and `relations.ts`).
2. `npm run db:generate -- --name <what_changes>`, then read the SQL and fix it if needed. Data
   migrations / backfills: `npm run db:generate -- --custom --name <what>`.
3. `npm run db:migrate` on the local `leocadenses` database, then check that the app still works.
4. Commit the schema change, the migration and the code that needs it together.

`npm run db:pending` lists the migrations `db:migrate` would apply; `npm run db:pull`
introspects a database into `drizzle/pull/` (git-ignored) to look for drift; `npm run db:check`
checks the migration files. Never use `drizzle-kit push`, and never edit a migration that has been
applied anywhere: add a new one.

**Rules.**

- Expand, then contract: new columns are nullable or have a default. Renames and drops take
  several steps: add the new column, backfill, move every reader, and only then drop the old one
  in a later migration. This keeps a rollback to the previous build possible.
- No `NOT NULL` without a default on existing tables; don't remove enum values still used.
- New tables follow the Laravel conventions: unsigned integer ids, snake_case, `timestamps` from
  `db/columns.ts`. They inherit the database collation that `0001` sets; `db:baseline` refuses a
  database whose tables aren't `utf8mb4_unicode_ci`.
- One logical change per migration. MySQL/MariaDB commit every DDL statement, so a migration that
  fails halfway stays half applied: drizzle's transaction does not roll it back.
- Order matters: drizzle only runs migrations newer than the last applied one, so a migration
  generated on an old branch and merged after a newer one would be skipped. Regenerate it on top
  of `master` before merging (`migrations.spec.ts` checks the journal order).

**Production** runs migrations as an explicit deploy step (`scripts/deploy.sh`: `db:pending`,
then `db:backup`, then `db:migrate`), never at startup, with `MIGRATION_DATABASE_URL`: a user with
DDL rights, so the app's runtime user can stay limited to `SELECT/INSERT/UPDATE/DELETE`.

## Authentication and permissions

- Same accounts and passwords as the old site: the `users` table, bcrypt hashes with Laravel's
  `$2y$` prefix (`auth/password.ts` verifies them and writes new ones the same way).
- Sessions are stateless HMAC-signed cookies (`leo_session`, `auth/session.ts`): 12 h sliding, or
  30 days with "Manter sessão iniciada". The token carries a fingerprint of the password hash,
  so changing a password signs out every other session.
- Permissions are Voyager's: a user holds the keys of `users.role_id` plus every role in
  `user_roles` (`auth/users.ts → permissionKeys`), re-read on every request. `browse_admin` is
  needed to sign in at all; everything else is `<browse|read|edit|add|delete>_<table>`.
- `hooks.server.ts` loads the user on every request (public pages show extras to signed-in
  users) and sends anonymous `/admin/*` requests to `/admin/login`. That is not enough on its own:
  every load, action and endpoint calls `requirePermission()` (`auth/guard.ts`).
- Login: `/admin/login` (Voyager's URL), throttled to 5 failures per minute per email + IP in
  memory, which is why PM2 runs a single instance. Logout is `POST /admin/logout`.

## Storage

Uploads live in the R2 bucket `leocadenses`, public at `https://cdn.leocadenses.pt`
(`R2_PUBLIC_URL`). Everything goes through `#lib/server/storage`:

- The database keeps Voyager's relative paths (`posts/October2021/x.jpg`) and the object key is
  the same string. `mediaUrl(key)` gives the CDN URL; new files get Voyager-style keys
  (`newKey()`: `folder/MonthYYYY/<20 random>.ext`), so a key never changes content and every
  object is stored with `Cache-Control: public, max-age=31536000, immutable`.
- `/storage/<key>` (the old site's URLs, also inside post bodies) answers `301` to the CDN.
- Post and page bodies store `/storage/<key>` links (`#lib/server/cms`): `renderHtml()` points
  them at the CDN and sanitises; `editorHtml()` / `storedHtml()` convert for the editor.
- Member cards are `members/cards/<token>.png`, public by unguessable token as before.
- Images are re-encoded on upload (`optimizeImage()`: EXIF rotation, metadata stripped, size
  caps); the real format is read from the bytes.
- Migration from the old server: `npm run storage:upload -- <storage/app/public>` (idempotent),
  then `npm run storage:verify` lists referenced files missing from the bucket.
- Development uses LocalStack (local-env, port 4566) with `R2_FORCE_PATH_STYLE=true`, never
  the production bucket: `npm run storage:upload -- E:\Projetos\leocadenses-website\storage\app\public --create-bucket`
  seeds it (LocalStack keeps S3 in memory, so repeat after restarting it).

## Public site

- Routes live in `src/routes/(site)` with the old paths: `/`, `/posts`, `/posts/[slug]`,
  `/pages/[slug]`, `/novo-socio`, `/c/[token]`, plus the new `/clube` hub. Route ids include the
  group: `resolve('/(site)/posts')`.
- `AppShell` (top bar with back button, language picker and theme toggle; bottom dock) wraps
  them. The dock's tabs and the paths each one owns are in `src/lib/navigation.ts`; the back
  button uses history when there is some and the owning tab otherwise.
- Every visible string is a Paraglide message in the four locales. The language follows a
  cookie, then the browser, then pt-PT; URLs never get a locale prefix. The `custom-admin`
  strategy (`src/lib/i18n.ts`) pins `/admin` to pt-PT.
- Light/dark: a `theme` cookie read by a pre-paint script in `app.html` and by
  `hooks.server.ts` (`src/lib/theme.ts`).
- Club colours are Tailwind tokens in `routes/layout.css`: `primary` (green, Flowbite's colour)
  and `accent` (yellow, dark text only). Legacy CMS bodies get the `cms` utility (typography
  plus the few Materialize classes they use).
- The next game comes from Domingo às Dez's legacy API (`next-game.ts`, cached 5 minutes);
  emblems load from its CDN.
- `/novo-socio` validates like the old controller, checks Cloudflare Turnstile and the email
  domain's DNS, and rate-limits per IP (5 per hour).

## Backoffice

Under `/admin` (Voyager's URLs): `src/routes/admin/(app)`, one folder per Voyager BREAD slug
(`members`, `quotas`, `quota-payments`, `member-application`, `posts`, `pages`, `categories`,
`partners`, `users`, `roles`), plus `settings`, `menus` (the site menu), `media` and `profile`.

- Each section has a server module in `src/lib/server/admin/<section>.ts` (list, find, zod form,
  save, delete) and routes: the list, `create`, and `[id=id]`, which is the edit form (read-only
  without the `edit_` permission) and holds the `save` / `delete` actions. `[id=id]/edit` (the
  old Voyager URL) redirects there.
- Building blocks come from domingoasdez-admin: `#lib/components/admin/{list,form}`,
  `SearchSelect` with `/admin/api/options/*`, `RichTextField` (TipTap, HTML source mode, image
  upload to `/admin/api/editor/images`), `FlashToast` with `#lib/server/flash.ts`.
- Saves return `SaveResult` (`admin/crud.ts`): `{ ok: true, … }` or the field errors for
  `failed()`; success redirects with `done()` and a toast.
- Member cards: `members/card-image.ts` draws them exactly like the old Artisan command
  (template and fonts in `assets/member-card/`, read from the working directory);
  `members/card-service.ts` issues tokens through `unique_codes`, uploads the PNG and updates the
  member. Cards are generated when a member is saved with "Gerar cartão", from the member page,
  or with "Gerar cartões pendentes" on the list; the old 5-minute cron is gone.

## Differences from the old site

Deliberate changes, all keeping the data model:

- Draft posts and inactive pages are no longer public; signed-in users who can read them see a
  preview. The old site showed any post or page to anyone who knew the slug.
- Deleting a member sets `deleted_at` (the column existed but Voyager hard-deleted): the card
  stops validating and the member can be restored from the "Apagados" filter.
- Member address is optional (Voyager required at least 7 characters, which many members lack);
  application email and document are capped at 50 characters, the size of their columns.
- QR codes are drawn locally instead of fetched from api.qrserver.com.
- "Converter em sócio" turns an application into a member (the old flow was copy by hand).
- Not ported: Voyager's developer tools (BREAD builder, database, Compass, hooks) and its
  `admin.*` look-and-feel settings. Their tables stay in the database. Applications can only
  be created from the public form.
- Legacy bodies edited in TipTap are normalised when saved; complex layouts (the home page's
  flex box) are best edited in the editor's HTML source mode.

## Deployment

PM2 (`ecosystem.config.cjs`, one fork instance on `127.0.0.1:3005`) behind nginx
(`deploy/nginx/leocadenses.pt.conf`) and Cloudflare; `scripts/deploy.sh` builds into
`build.next`, backs up and migrates when needed, swaps builds and checks `/healthz`. The README
has the first-deploy runbook. adapter-node 6 derives the request origin (used by SvelteKit's
CSRF check of form posts) from the `Host` header and `PROTOCOL_HEADER`; it no longer reads
`ORIGIN`.
