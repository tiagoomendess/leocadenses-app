# Leocadenses: Laravel/Voyager → SvelteKit port

## Context

The old club site (Laravel 8 + Voyager, `E:\Projetos\leocadenses-website`, running locally at http://localhost:8001) is offline for good because of PHP vulnerabilities. We rebuild it in the fresh SvelteKit 3 scaffold at `C:\Users\Tiago\Desktop\repos\leocadenses-app` with these constraints:

- Same MariaDB database and data model. Production is MariaDB 10.11; a dump from today is at `C:\Users\Tiago\Desktop\dump-leocadenses-202610251718.sql`.
- Same login credentials. The 7 users have bcrypt `$2y$10$` hashes.
- Every legacy URL keeps working.
- A modern mobile-first public UI: bottom dock, back button top-left, dark and light modes, pt-PT by default.
- A bare-bones backoffice in the same app, built with flowbite-svelte. No CMS package.
- Files move from local disk to Cloudflare R2.
- Node on a VPS behind Cloudflare and nginx, port 3005.
- A migration strategy for future schema changes.

`domingoasdez-app` and `domingoasdez-admin` (same author, same stack, same port style) are the reference. We reuse their code and patterns wherever it says so below.

### Decisions already taken (with you)

- **Captcha:** Cloudflare Turnstile replaces reCAPTCHA v2.
- **Languages:** the public site chrome is translated into pt-PT (base), en-GB, es-ES and fr-FR, with a picker and no URL prefixes. The backoffice is pt-PT only. Posts and pages stay in Portuguese.
- **Media:** the R2 bucket `leocadenses` is public through its custom domain `https://cdn.leocadenses.pt` (`R2_PUBLIC_URL`). Pages link to CDN URLs directly, and every legacy `/storage/...` URL 301-redirects to the same key on the CDN. Member cards stay public by unguessable 9-character token, like before.

### What the old site actually does (inventory to port)

| Old route                                   | Behaviour                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /`                                     | Header image (`site.header_image`). Next game from `https://domingoasdez.com/api/games/next/2`; the emblem URLs are currently broken (`//storage`). "Faça-se sócio" CTA. Body of page `home`.                                                                                                                                              |
| `GET /posts?page=N`                         | `PUBLISHED` posts, `id desc`, 5 per page. Cards show image (fallback `/images/post_default.jpg`), title and `meta_description`.                                                                                                                                                                                                            |
| `GET /posts/{slug}`                         | Post by slug. The old code doesn't filter status, so drafts leak. Image lightbox, OG tags.                                                                                                                                                                                                                                                 |
| `GET /pages/{slug}`                         | Page by slug, also unfiltered. Live pages: `home`, `member-application`, `palmares`, `orgaos-sociais`, `contactos`.                                                                                                                                                                                                                        |
| `GET/POST /novo-socio`                      | Body of page `member-application` plus the form: nome, telefone, email (rfc+dns), document type, documento, morada, consent checkbox, reCAPTCHA. Saves to `member_application` and sets the cookie `member_application_submitted` for 7 days, which shows a thank-you message.                                                             |
| `GET /c/{token}`                            | Member-card QR verification. Valid means the document is longer than 4 characters. It shows the number and the paid quotas, plus an "em atraso" warning (`Member::hasAllQuotasPaid`). Users with `browse_members` also see name, phone and email; `edit_members` adds a link to the member's record. The first scan sets `card_printed=1`. |
| `/admin/**`                                 | Voyager. BREAD for users, roles, categories, posts, pages, members (Sócios), quotas, quota-payments (Pagamentos), member-application (Candidatos) and partners (Parceiros). Also media manager, menu builder and settings. You enter only with `browse_admin`.                                                                             |
| Cron `members:generate-cards` (every 5 min) | For members with `generate_card=1`: draws name and "SÓCIO Nº n" on `base_cartao_socio.png` with Roboto, adds a white QR code for `/c/{token}`, and saves `members/cards/{token}.png`. The 9-character token is made unique through `unique_codes`. Resets `card_printed`.                                                                  |
| Static                                      | `/sitemap.xml` (static), `/robots.txt` (disallows `/admin/` and `/c/*`), `/images/*`, `/storage/*`, `/welcome` (Laravel default page).                                                                                                                                                                                                     |

Roles and permissions come from `permission_role`:

- **admin:** everything.
- **direção:** everything except menus, roles, settings, categories and BREAD/database tools.
- **editor:** posts, pages and partners without delete (and without `browse_admin`).
- **user:** nothing.

Production has 2 admins and 5 direção users.

Data findings that matter:

- `members.deleted_at` exists but is never used; Voyager hard-deletes.
- `quotas.due_date` has `ON UPDATE current_timestamp()`. That is a bug: editing a quota's name resets its due date.
- `member_application.email` and `document` are `varchar(50)`, but the old validation allowed up to 70 characters.
- `translations` holds only stale Voyager "en" copies, so the frontend ignores it.
- One post embeds a Google Forms `<iframe>`.
- 232 storage files sit in `E:\Projetos\leocadenses-website\storage\app\public` (posts 83, members/cards 129, partners 11, pages 4, settings 4, users 1).
- Club colours sampled from the logo: green `#00A651`, yellow `#FFF200`, black.

---

## Architecture

SvelteKit 3 (no `svelte.config.js`; config lives in `vite.config.ts`), Svelte 5 runes, adapter-node, Tailwind v4, flowbite-svelte, drizzle-orm with mysql2, and Paraglide 2.

**Add as runtime dependencies** (native or server-only):
`flowbite-svelte`, `flowbite`, `flowbite-svelte-icons`, `bcryptjs`, `@aws-sdk/client-s3`, `sharp`, `@napi-rs/canvas`, `qrcode`, `zod`, `isomorphic-dompurify`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-text-align`, `@tiptap/extension-text-style`, and the TipTap table extension.

**Remove:**

- `@tailwindcss/forms`, which clashes with `flowbite/plugin`.
- The demo routes, `src/lib/vitest-examples`, the `task` table and the `db:push` script.
- `src/hooks.ts`, which held the URL-prefix reroute.

Add `engines` / `.nvmrc` / `.npmrc engine-strict` matching domingoasdez (Node 26.12.1).

```
src/
  env.ts  params.ts (id→number, slug, token)  hooks.server.ts  app.html
  lib/
    auth/permissions.ts                  # client-safe can()
    components/{shell,ui,admin/{list,form},editor}/
    server/
      db/{index,schema,relations,columns}.ts
      auth/{password,session-token,session,throttle,guard,users,redirect}.ts
      storage/{r2,paths,index,images,uploads}.ts
      members/{card,validity,quotas}.ts  next-game.ts  cms-html.ts  settings.ts
      forms.ts validation.ts list.ts flash.ts turnstile.ts dates.ts
  routes/
    (site)/  +layout.svelte(AppShell) +page  posts/  posts/[slug]  pages/[slug]  novo-socio/  clube/  c/[token]/
    admin/   login/ logout/ (app)/{+layout, +page(dashboard), posts, pages, categories, members, quotas,
             quota-payments, member-application, partners, users, roles, settings, menus, media, profile}
    storage/[...path]/+server.ts  sitemap.xml/+server.ts  welcome/+server.ts  healthz/+server.ts
scripts/  db-baseline.ts db-pending.ts db-backup.ts storage-upload.ts storage-verify.ts cards-generate.ts deploy.sh
drizzle/migrations/   deploy/nginx/leocadenses.pt.conf   ecosystem.config.cjs   docs/architecture.md
```

---

## Phase 0: Repository and tooling

1. `git init`. `.gitignore` covers `build*`, `.env`, `src/lib/paraglide`, `drizzle/pull`, `backups`, `.storage`.
2. Clean the scaffold: remove the demo routes and examples, and replace `README.md`.
3. Extend `AGENTS.md` with the conventions from `domingoasdez-admin/AGENTS.md`:
   - migrations only;
   - `requirePermission` in every load, action and endpoint;
   - storage only through `#lib/server/storage`;
   - Flowbite components work in both themes;
   - zod `parseForm`;
   - run the svelte-autofixer.
4. Add the local flowbite MCP (`node C:\Users\Tiago\Desktop\repos\flowbite-svelte-mcp\build\server.js`) to the project's MCP config next to the Svelte MCP.

## Phase 1: Foundation config

- **`vite.config.ts`:**
  - `adapter({ out: process.env.BUILD_DIR || 'build' })`.
  - `csp: { mode: 'auto' }` with these sources:
    - `img-src 'self' data: blob: https://cdn.leocadenses.pt https://domingoasdez.com https://cdn.domingoasdez.com`
    - `frame-src https://challenges.cloudflare.com https://docs.google.com https://www.youtube-nocookie.com https://www.youtube.com`
    - `script-src` adds `https://challenges.cloudflare.com`
  - Paraglide `strategy: ['cookie','preferredLanguage','baseLocale']`.
- **`project.inlang/settings.json`:** `baseLocale: "pt-PT"`, locales `["pt-PT","en-GB","es-ES","fr-FR"]`. Rename the `messages/*.json` files to match.
- **`src/env.ts`** (`defineEnvVars`):
  - `DATABASE_URL`
  - `SESSION_SECRET` (at least 32 characters)
  - `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=leocadenses`, `R2_REGION=auto`, `R2_PUBLIC_URL=https://cdn.leocadenses.pt`, `R2_FORCE_PATH_STYLE` (only for LocalStack). Already filled in the local `.env`.
  - `SITE_URL=https://leocadenses.pt`, used for QR codes, the sitemap and OG tags
  - `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
  - `DOMINGOASDEZ_URL=https://domingoasdez.com`, `DOMINGOASDEZ_TEAM_ID=2`
  - adapter-node variables documented in `.env.example`: `HOST=127.0.0.1`, `PORT=3005`, `ORIGIN`, `PROTOCOL_HEADER=x-forwarded-proto`, `ADDRESS_HEADER=CF-Connecting-IP`, `BODY_SIZE_LIMIT=25M`
- **`src/lib/server/db/index.ts`:** port the domingoasdez-admin pool, with `dateStrings: true`, `timezone: 'Z'` and a cache on `globalThis` for HMR.
- **`hooks.server.ts`:** `sequence(handleSecurityHeaders, handleTheme, handleParaglide, handleAuth)`.
  - `transformPageChunk` replaces `%theme.class%`, `%paraglide.lang%` and `%paraglide.dir%`, and adds `data-cfasync="false"`. Port this from `domingoasdez-admin/src/lib/server/cloudflare.ts`.
  - `/admin/**` always renders `lang="pt-PT"`.

## Phase 2: Database and migration strategy

1. **Schema.**
   - Load the dump into the local DB. The old docker site already uses the local-env MySQL; prefer a MariaDB 10.11 container to match production.
   - Run `drizzle-kit pull` (`drizzle.pull.config.ts`, output `drizzle/pull/`, git-ignored).
   - Curate the result into `src/lib/server/db/schema.ts` with **every** table except Laravel's `migrations`, Voyager internals included, so the baseline reproduces the full data model:
     - tinyint(1) → `boolean()`;
     - enums kept;
     - `timestamps` helper from `domingoasdez-admin/src/lib/server/db/columns.ts`.
   - Put the relations in `relations.ts`. Note that `quota_payments` has no foreign keys.
2. **`drizzle.config.ts`.** Port from domingoasdez-admin:
   - `process.loadEnvFile`
   - `MIGRATION_DATABASE_URL || DATABASE_URL`
   - `out: './drizzle/migrations'`
   - `tablesFilter: ['!migrations','!__drizzle_migrations']`
   - `migrations.table: '__drizzle_migrations'`
   - `breakpoints` and `strict`
3. **Migrations:**
   - `0000_baseline.sql`: generated from the curated schema. It only runs on fresh databases (CI, e2e, new dev setups). Check it against `SHOW CREATE TABLE` of production.
   - `0001_database_collation.sql`: `ALTER DATABASE … utf8mb4_unicode_ci`, as in domingoasdez.
   - `0002_quotas_due_date_fix.sql`: drop the accidental `ON UPDATE` on `quotas.due_date`. This is the first real change and a worked example. Until it runs, the save code always writes `due_date` explicitly.
4. **Scripts.** Port from `domingoasdez-admin/scripts/`:
   - `db-baseline.ts`: refuses unless Laravel's last migration is `2022_11_16_174830_alter_member_application_table` and every collation is `utf8mb4_unicode_ci`. It then creates `__drizzle_migrations` and marks 0000 as applied.
   - `db-pending.ts` and `db-backup.ts` (gzipped mysqldump, keeps 5).
   - npm scripts: `db:generate`, `db:migrate`, `db:baseline`, `db:pending`, `db:backup`, `db:check`, `db:pull`, `db:studio`.
5. **Rules** (written in `docs/architecture.md`):
   - Expand then contract: new columns are nullable or have a default; drops wait for a later migration.
   - One logical change per migration.
   - Never edit an applied migration.
   - Migrations never run at startup; `deploy.sh` runs pending check → backup → migrate.
   - `src/lib/server/db/migrations.spec.ts` checks the journal's integrity, as in domingoasdez.
6. **Dates.**
   - Laravel ran with `Europe/Lisbon`, and the columns are `TIMESTAMP`.
   - Before writing `src/lib/server/dates.ts`, compare a row in the old Voyager UI (localhost:8001) with its raw DB value. Then fix one rule: read and write naive strings in the zone the old app used, and display with `Intl` `pt-PT` / `Europe/Lisbon`.
   - Unit-test that rule.

## Phase 3: Auth and permissions (same credentials)

Port these files from `domingoasdez-admin/src/lib/server/auth/`:

- `password.ts`: `$2y$` → `$2a$` for `bcryptjs.compare`. New hashes are written back as `$2y$`, so a Laravel rollback still works.
- `session-token.ts` / `session.ts`: HMAC-signed stateless cookie `leo_session`. The payload carries the password fingerprint, so a password change revokes sessions. 12 h sliding, or 30 days with "Lembrar-me".
- `throttle.ts` (5 failures per minute per email+IP), `redirect.ts`, `guard.ts` (`requireUser`, `requirePermission`).

The permission model differs from domingoasdez. `users.ts` loads the user by `LOWER(email)`, then the permission keys from `permission_role` for `users.role_id` ∪ `user_roles.role_id`, re-checked on every request. This is the same rule as Voyager's `hasPermission`; admin is not hard-coded. `lib/auth/permissions.ts` provides `can(user, 'browse_members')`.

Routes:

- `/admin/login`: email, password, remember. Keeps Voyager's URL.
- `POST /admin/logout`.
- `/admin/profile`: change your own name, password and avatar.

Entering `/admin/(app)` requires `browse_admin`, exactly as before.

## Phase 4: Storage (R2)

- Port `domingoasdez-admin/src/lib/server/storage/{r2,index,images,uploads}.ts`. Keep the checksum workaround and lazy client; add `forcePathStyle` for LocalStack.
- **Keys:**
  - The DB keeps Voyager-relative paths (`posts/October2021/x.jpg`), and the R2 key is that same path.
  - `paths.ts` provides `storageKey()` (rejects `..`) and `newKey(folder, ext)`, which produces Voyager-style `folder/{MonthYYYY}/{20 random}.{ext}` so new and old content look alike.
  - `mediaUrl(path)` returns `${R2_PUBLIC_URL}/${path}` (each segment URL-encoded), and passes `http(s)` URLs through.
- **Every object is written with `Cache-Control: public, max-age=31536000, immutable`.** That is safe because a key never changes content: new uploads and regenerated cards always get a new key.
- **`routes/storage/[...path]/+server.ts`:** GET/HEAD answer `301` to `${R2_PUBLIC_URL}/${path}` (query string dropped, redirect cacheable for a day). This keeps old links working, including the absolute `https://leocadenses.pt/storage/...` URLs inside post bodies and anything indexed by search engines. Keys with `..` or empty segments get a 404.
- **Uploads** go through `optimizeImage`: sharp with EXIF rotation, metadata stripped, max 1600 px for posts and pages, 800 px for partners, 400 px for avatars. The real format is detected from the bytes.
- **`cms-html.ts`:**
  - Bodies are stored with root-relative `/storage/<key>` URLs, so a future domain change needs no data migration.
  - `renderHtml()` rewrites `https://leocadenses.pt/storage/…`, `/storage/…` and `storage/…` to the CDN URL, so pages skip the redirect hop.
  - `editorHtml()` does the same for TipTap, and `storedHtml()` turns CDN URLs back into `/storage/…` on save. This mirrors `domingoasdez-admin/src/lib/server/rich-text.ts`.
  - Sanitises with DOMPurify: inline `style` is allowed; `iframe` is allowed only from `docs.google.com` and YouTube.
- **Member cards** keep the key `members/cards/{token}.png` and are public by unguessable token, as before. `robots.txt` doesn't apply to the CDN host, so card objects get `X-Robots-Tag: noindex` through a Cloudflare Transform Rule on `cdn.leocadenses.pt/members/*` (documented in the runbook).
- **Migration scripts:**
  - `scripts/storage-upload.ts <dir> [--dry-run]` walks `storage/app/public`, uploads with key = relative path, sets content-type and cache-control, and is idempotent (skips when HEAD returns the same size).
  - `scripts/storage-verify.ts` collects every path the DB references (`posts.image`, `pages.image`, `partners.picture`, `members.card`, `users.avatar`, image settings, and `/storage/` URLs inside bodies) and lists the keys missing in R2.
- **Dev must not write to the production bucket.** The local `.env` currently holds the production keys, which is fine for running `storage-upload`. For day-to-day development, either:
  - create a `leocadenses-dev` bucket (with its `r2.dev` URL as `R2_PUBLIC_URL`), or
  - point at local-env LocalStack with `R2_FORCE_PATH_STYLE=true`, seeded by copying the folder to `local-env/localstack/buckets/leocadenses/`.

## Phase 5: Design system and public shell

- **`routes/layout.css`:**
  - `@import 'tailwindcss'; @plugin 'flowbite/plugin'; @plugin '@tailwindcss/typography'; @custom-variant dark (&:where(.dark, .dark *)); @source` for flowbite-svelte and the icons.
  - `@theme` defines a `primary` green scale anchored at `#00A651` (`primary-600`) and `#007A3D` (`primary-700`, which Flowbite uses for buttons, so white text keeps AA contrast).
  - An `accent` yellow scale anchored at `#FFF200`, always used with dark text.
  - Semantic surface and ink tokens per theme. Pattern: `domingoasdez-app/src/routes/layout.css`, `docs/DESIGN_SYSTEM.md`.
- **Dark/light mode.** Port the cookie approach from both domingoasdez repos:
  - a `theme` cookie;
  - a pre-paint inline script in `app.html`;
  - `%theme.class%` replaced during SSR;
  - `lib/theme.ts`;
  - `ThemeToggle.svelte` with `dark:hidden` icons.
- **`AppShell.svelte`:**
  - A slim top bar: back button or logo on the left, "Leocadenses" in the middle, theme toggle and language picker (Flowbite `Dropdown`, calling Paraglide `setLocale`) on the right.
  - `BottomDock.svelte` uses Flowbite `BottomNav` styled as a floating capsule with safe-area insets.
  - Navigation state in `lib/navigation.svelte.ts` (`tabFromPath`, `parentOf`, `isTabRoot`), ported from domingoasdez-app.
  - `BackButton.svelte` ported from `domingoasdez-app/src/lib/components/shell/BackButton.svelte`: uses `history.back()` when there is in-app history, otherwise links to the parent. Hidden on tab roots.
- **Dock tabs:**
  - Início `/`
  - Notícias `/posts` (owns `/posts/*`)
  - Sócio `/novo-socio`
  - Clube `/clube` (owns `/pages/*`)

  `/c/*` has no tab and shows the back button.

- Every public string is in `messages/{pt-PT,en-GB,es-ES,fr-FR}.json`.
- Static legacy assets are copied to `static/`: `images/post_default.jpg`, `images/header.jpg`, `images/icon.ico`, `favicon.ico`.

## Phase 6: Public pages

All pages use SSR and carry `<title>`, description and OG tags with the same texts as the old Blade views.

- **`/`:**
  - Hero from `site.header_image`.
  - Next-game card from `next-game.ts`:
    - `fetch` with a 5 s timeout and a 5-minute in-memory cache;
    - emblem URLs built with `new URL(path, DOMINGOASDEZ_URL)`;
    - fallback: logo plus "Não existem jogos marcados…".
  - "Faça-se sócio" CTA, the `home` page body, the latest 3 posts (new), and the partners strip.
- **`/posts`:**
  - Keeps `?page=N`, now 9 per page; out-of-range pages return 404 so old indexed `?page=2..4` still resolve.
  - Grid of Flowbite `Card`s; pagination with prev/next.
- **`/posts/[slug]`:**
  - `PUBLISHED` only. Drafts are visible only to users with `read_posts`, with a "Pré-visualização" badge.
  - Hero image with a lightbox (Flowbite `Modal`), sanitised body (`prose dark:prose-invert`), and a share button using `navigator.share`.
- **`/pages/[slug]`:** `ACTIVE` only, with a preview for `read_pages`. Same layout.
- **`/clube`** (new hub):
  - children of the "O Clube" item of the `site` menu (`menus`/`menu_items`), so the menu builder still drives navigation;
  - social links (Facebook, Instagram, Twitter);
  - partners;
  - contacts link.
- **`/novo-socio`:**
  - The `member-application` body plus a Flowbite form with field-level errors and a Turnstile widget (`lib/server/turnstile.ts` verifies with `remoteip`).
  - zod rules mirror the old ones, clamped to column sizes:
    - nome 5–60
    - telefone 9–30
    - email RFC plus an MX lookup with a timeout, max 50
    - `document_type` must exist
    - documento 6–50
    - morada 6–100
    - consent required
  - Per-IP throttle.
  - On success, sets the same `member_application_submitted` cookie for 7 days and shows the same thank-you text.
- **`/c/[token]`:**
  - A port of `MemberController::verify` and `card_verification.blade.php`.
  - `members/validity.ts`: `isValid` means the trimmed document is longer than 4 characters, and the member is not soft-deleted.
  - `members/quotas.ts → hasAllQuotasPaid`: quotas due after `created_at` and before now must all be paid; no payments at all means `false`.
  - The first scan sets `card_printed=1`.
  - Shows extra fields when the user can `browse_members`, and a "Ficha de sócio" button linking to `/admin/members/{id}/edit` when the user can `edit_members`.
  - `noindex`.
- **Other routes:**
  - `/sitemap.xml`: dynamic (static routes, active pages, published posts, using `SITE_URL`).
  - `static/robots.txt`: same as the old one.
  - `/welcome`: 301 to `/`.
  - `/healthz`: `SELECT 1`.
  - Friendly `+error.svelte`.

## Phase 7: Member cards

- **`members/card.ts`:**
  - Uses `@napi-rs/canvas` with the old `base_cartao_socio.png` (1011×638) and `Roboto-Bold` / `Roboto-Medium` TTFs, copied from `E:\Projetos\leocadenses-website\public\{images,fonts}` into `src/lib/server/members/card-assets/` and loaded with `new URL(…, import.meta.url)`. Confirm they ship in the build.
  - Pixel-identical layout:
    - uppercase name at (60, 510), Bold 33 px, white;
    - "SÓCIO Nº n" at (60, 550), Medium 33 px;
    - 240×240 QR at (711, 338), drawn locally with the `qrcode` package in white on transparent with margin 0, encoding `${SITE_URL}/c/${token}`. This replaces the call to `api.qrserver.com`.
- **Token:** 9 characters `[A-Za-z0-9]` from `crypto.getRandomValues`, retried until absent from `unique_codes`.
- **Writes:**
  1. Upload `members/cards/{token}.png`.
  2. In one transaction, insert the `unique_codes` row and update the member (`card`, `card_token`, `generate_card=0`, `card_printed=0`).
  3. Delete the old card key.
- **Triggers** (an improvement over the 5-minute cron):
  - right after a member save with `generate_card` checked;
  - a "Regenerar cartão" button on the member page;
  - a "Gerar cartões pendentes" bulk action;
  - `npm run cards:generate` as a CLI fallback.

## Phase 8: Backoffice (`/admin`, pt-PT, Flowbite)

**Shell:**

- `admin/(app)/+layout.svelte` with a top bar (logo, user menu, theme toggle) and a plain-Tailwind side nav. domingoasdez-admin avoided Flowbite `Sidebar` because of SSR flash.
- Nav entries are shown only for `browse_*` permissions.
- `FlashToast` for messages.

**Generic building blocks**, ported from `domingoasdez-admin/src/lib/`:

- `server/list.ts`: `parseListParams`, 25 rows per page, an allow-listed sort.
- `server/forms.ts` / `validation.ts`: zod `parseForm`, `invalid`, Portuguese messages.
- `server/flash.ts`.
- Components: `list/{PageHeader,ListSearch,SortHeader,ListPagination,EmptyState,CreateButton}`, `form/{EntityForm,TextField,TextareaField,ToggleField,SelectField,ImageField,SaveBar,DeleteButton}`, `SearchSelect` with `/admin/api/options/[entity]`, and `RichTextField` (TipTap with an HTML source mode and image upload to `/admin/api/editor/images`).
- `isRowReferencedError` handling, 409 on delete.

**URLs mirror Voyager**, so old bookmarks keep working:

- `/admin/{slug}` (browse)
- `/create`
- `/{id}` (read: the same form inside `<fieldset disabled>`)
- `/{id}/edit`
- each guarded by `browse_/add_/read_/edit_/delete_{table}`

| Section (slug)                  | Fields and notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard `/admin`              | Counts: sócios, candidaturas pendentes, sócios com a quota da época paga, notícias publicadas. Quick links.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Sócios `members`                | **List:** search by nº, name, phone, email or document; sort nº desc; filters "quotas em atraso" and "cartão por imprimir". **Form:** nº (default max+1, unique 1–9999), nome ≤60, telemóvel 9–13, email, tipo + documento ≤20, morada, notas, gerar cartão. **Detail page:** quota grid (each season paid/unpaid with amount; "Marcar pago" adds a `quota_payments` row with default amount 10; payments can be removed), card preview, download and regenerate. **Delete:** soft delete via `deleted_at` (an improvement; the column already exists). |
| Quotas `quotas`                 | Name ≤25, due date. Always writes `due_date`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Pagamentos `quota-payments`     | List `id desc` with sócio (nº + name), quota and amount; filter by quota. Create and edit with a member `SearchSelect`, quota select, amount (default 10) and notes.                                                                                                                                                                                                                                                                                                                                                                                    |
| Candidatos `member-application` | List and read. **"Converter em sócio"** pre-fills the member form and deletes the application after the save (new). Plain delete is still available.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Parceiros `partners`            | Name ≤50, image (required), url, position, visible. Sorted by position.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Posts `posts`                   | Title, slug (auto, unique), category, excerpt, body (TipTap), image, SEO title, meta description and keywords, status, featured. `author_id` = current user.                                                                                                                                                                                                                                                                                                                                                                                            |
| Páginas `pages`                 | Same as posts, with status ACTIVE/INACTIVE. `home` and `member-application` cannot be deleted and keep their slug.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Categorias `categories`         | Name, slug, parent, order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Utilizadores `users`            | Name, email, password (optional when editing, `$2y$` hash), avatar, main role, extra roles (`user_roles`).                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Funções `roles`                 | Name, display name, permission checkbox matrix grouped by `table_name`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Definições `settings`           | Edit values grouped by `group`, with an input per `type` (text, text_area, image, checkbox).                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Menu `menus`                    | Tree editor for menu `site` only: title, url, target, parent, order. The `admin` menu rows are kept but unused.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Media `media`                   | Browse R2 "folders" (ListObjectsV2 with delimiter), upload, delete, copy the CDN URL. Needs `browse_media`.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Perfil `profile`                | Own name, password and avatar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Phase 9: Deployment (VPS, Cloudflare, nginx, PM2)

- **`ecosystem.config.cjs`:** app `leocadenses`, `build/index.js`, `--env-file=.env`, 1 fork instance (the in-memory throttle needs a single process), `max_memory_restart: 384M`.
- **`deploy/nginx/leocadenses.pt.conf`**, ready to paste and modelled on `domingoasdez-admin/nginx.conf`:
  - :80 serves the ACME webroot and 301s to `https://leocadenses.pt`.
  - :443 `www` → apex 301.
  - :443 apex:
    - Let's Encrypt certificates (an alternative block for a Cloudflare Origin Certificate is included, commented);
    - `proxy_pass http://127.0.0.1:3005`;
    - `Host`, `X-Forwarded-Proto`, `X-Forwarded-For` and `CF-Connecting-IP` headers;
    - `client_max_body_size 25M`, `proxy_read_timeout 120s`;
    - security headers and HSTS;
    - logs in `/var/log/nginx/leocadenses.pt/`;
    - an optional include allowing only Cloudflare IP ranges.
- **`scripts/deploy.sh`:** port from domingoasdez-admin:
  - flock, clean-tree check, fast-forward pull;
  - `npm ci` only when the lockfile changes;
  - build into `build.next`;
  - `db:pending` → `db:backup` → `db:migrate`;
  - swap builds, `pm2 startOrReload`, poll `/healthz`;
  - `--rollback`.
- **Cutover runbook** (in `README.md`):
  1. Create the DB users: an app user with DML grants, and a migration user with DDL grants.
  2. Run `npm run db:baseline`, then `db:migrate` (applies 0001 and 0002).
  3. Create the R2 bucket and a token, run `storage-upload` from the production server's `storage/app/public` (fresher than the E: copy), then `storage-verify`.
  4. Create the Turnstile widget for `leocadenses.pt`.
  5. Write `.env`, run `deploy.sh --force`, then `pm2 save` and `pm2 startup`.
  6. Install the nginx config, run certbot, and reload.
  7. Cloudflare: DNS proxied, SSL "Full (strict)", Rocket Loader off or covered by `data-cfasync`. On `cdn.leocadenses.pt`: a cache rule ("cache everything", respect origin TTL) and the `X-Robots-Tag: noindex` Transform Rule for `/members/*`.

## Phase 10: Tests

- **Unit tests (vitest server project):**
  - password `$2y$` round trip;
  - session token (expiry, tamper, password fingerprint);
  - permission union across `role_id` and `user_roles`;
  - `hasAllQuotasPaid` and `isValid` edge cases;
  - `storageKey` rejects traversal;
  - `cms-html` rewrites and sanitises, keeping the Google Forms iframe and dropping `<script>`;
  - card token alphabet and length;
  - application zod schema;
  - `dates.ts`;
  - migration journal integrity.
- **Playwright e2e** against `build` + `preview`, a MariaDB test DB built by `db:migrate` plus a fixtures seed, and LocalStack:
  - a legacy-URL suite (below);
  - login with a fixture user that has a `$2y$` hash;
  - submitting an application (Turnstile test keys `1x00000000000000000000AA`);
  - generating a card and then visiting `/c/{token}`;
  - dark-mode toggle persistence;
  - dock and back-button navigation.

---

## Verification (end-to-end)

1. `npm run check`, `npm run lint`, `npm run test:unit -- --run`, `npm run build`. Run the Svelte autofixer on every component.
2. **Local parity against the old site.**
   - Set up: `.env` points at the local DB loaded from the dump, and at LocalStack seeded with `storage/app/public`. Run `npm run dev`.
   - Run a small parity script that requests each legacy URL on `http://localhost:8001` and on the new app, and compares status codes and key text:
     - `/`, `/posts`, `/posts?page=2..4`
     - all 19 published post slugs
     - `/pages/{home,member-application,palmares,orgaos-sociais,contactos}`
     - `/novo-socio`
     - `/c/{a real token}`
     - `/sitemap.xml`, `/robots.txt`
     - `/storage/posts/…`, `/storage/partners/…`, `/storage/settings/…` (old: 200; new: 301 to `cdn.leocadenses.pt`, which then answers 200)
     - `/images/post_default.jpg`, `/favicon.ico`
     - `/admin`, `/admin/login`, `/admin/members`, `/admin/members/{id}/edit`
3. **Manual checks in the browser pane:**
   - log in at `/admin/login` with one of your existing accounts; the credentials are typed by you;
   - check a direção-role account cannot reach Roles, Settings or Menus;
   - generate a card and compare it side by side with an old `members/cards/*.png`;
   - scan its QR with a phone and see `/c/{token}` mark it printed;
   - submit `/novo-socio`, then convert the application into a member;
   - toggle dark mode and change the language;
   - check mobile width (375 px): dock, safe areas, back button.
4. Run `npm run db:baseline` on a scratch copy of the production dump. Confirm `db:migrate` applies only 0001 and 0002, and that `db:generate` produces no diff.
5. Run `storage-verify`: zero missing keys.
6. After deploy: `curl -I https://leocadenses.pt/healthz`, the legacy-URL suite against production, `/storage/...` answering 301 to the CDN, and `cf-cache-status: HIT` on a second request to the same `https://cdn.leocadenses.pt/...` object.
