# Leocadenses

Website and backoffice of GDR Leocadenses, an amateur football club from Tamel Santa Leocádia
(Barcelos). It replaces the old Laravel + Voyager site, keeping its database, its URLs and its
logins.

- Public site: news, club pages, next game, membership application, member-card check (`/c/{token}`).
- Backoffice at `/admin`: members, quotas and payments, applications, news, pages, partners,
  users and roles, settings, menu and media.

Stack: SvelteKit 3 (Svelte 5, adapter-node), Tailwind CSS 4 with flowbite-svelte, drizzle-orm on
MariaDB/MySQL, Paraglide for translations, Cloudflare R2 for files.

See [docs/plan.md](docs/plan.md) for the implementation plan and
[docs/architecture.md](docs/architecture.md) for the conventions.

## Development

Requires Node 26.12.1 (`.nvmrc`), the local Docker MySQL with the `leocadenses` database and
LocalStack (both from `local-env`).

```sh
npm install
cp .env.example .env   # then fill in the values (development uses LocalStack for R2)
npm run db:baseline    # once, on a copy of the old database
npm run db:migrate
npm run storage:upload -- E:\Projetos\leocadenses-website\storage\app\public --create-bucket
npm run dev
```

## Scripts

| Script                   | What it does                                                   |
| ------------------------ | -------------------------------------------------------------- |
| `npm run dev`            | Development server                                             |
| `npm run build`          | Production build into `build/`                                 |
| `npm start`              | Runs the production build with `.env`                          |
| `npm run validate`       | Lint, type check and unit tests                                |
| `npm run test:e2e`       | Playwright end-to-end tests (against a production build)       |
| `npm run db:generate`    | New migration from changes to `schema.ts`                      |
| `npm run db:migrate`     | Applies pending migrations                                     |
| `npm run db:baseline`    | Marks a database built by Laravel as migrated to the baseline  |
| `npm run db:pending`     | Lists the migrations `db:migrate` would apply                  |
| `npm run db:backup`      | Gzipped mysqldump into `./backups` (keeps 5)                   |
| `npm run db:pull`        | Introspects the database into `drizzle/pull` to look for drift |
| `npm run storage:upload` | Copies the old site's uploads into the R2 bucket               |
| `npm run storage:verify` | Lists files the database references that R2 does not have      |

## Deployment

The app runs with PM2 on the VPS, on `127.0.0.1:3005`, behind nginx and Cloudflare.

### First deploy (cutover from the old site)

1. **Database users.** Keep the existing `leocadenses` database. Create a user for the app
   (`SELECT, INSERT, UPDATE, DELETE`) and one for migrations (adds `CREATE, ALTER, DROP, INDEX,
REFERENCES`), and put them in `DATABASE_URL` / `MIGRATION_DATABASE_URL`.
2. **Code.** Clone the repository on the server, `nvm use` (Node 26.12.1), `npm ci`.
3. **`.env`.** Copy `.env.example` and fill it in. Production values:
   `HOST=127.0.0.1`, `PORT=3005`,
   `PROTOCOL_HEADER=x-forwarded-proto`, `ADDRESS_HEADER=CF-Connecting-IP`,
   `BODY_SIZE_LIMIT=25M`, `SITE_URL=https://leocadenses.pt`, a new `SESSION_SECRET`, the R2
   keys (`R2_PUBLIC_URL=https://cdn.leocadenses.pt`, no `R2_FORCE_PATH_STYLE`) and the Turnstile
   keys of a widget created for `leocadenses.pt` in the Cloudflare dashboard.
4. **Migrations.** `npm run db:backup`, then `npm run db:baseline` (checks the database was
   built by the old site and records the baseline), then `npm run db:migrate` (applies
   `0001_database_collation` and `0002_quotas_due_date_fix`).
5. **Files.** From the old server's `storage/app/public` (fresher than any copy):
   `npm run storage:upload -- /path/to/storage/app/public`, then `npm run storage:verify`
   must report 0 missing.
6. **Start.** `chmod +x scripts/deploy.sh && scripts/deploy.sh --force`, then `pm2 save` and
   `pm2 startup` (once).
7. **nginx.** Install `deploy/nginx/leocadenses.pt.conf` (instructions at the top of the file),
   issue the certificate, `sudo nginx -t && sudo systemctl reload nginx`. Optionally run
   `deploy/nginx/update-cloudflare-ips.sh` and enable the Cloudflare-only include.
8. **Cloudflare.** DNS for `leocadenses.pt` and `www` proxied (orange cloud); SSL/TLS mode
   "Full (strict)"; Rocket Loader off (the app also opts its scripts out). On `cdn.leocadenses.pt`
   (the R2 custom domain): a cache rule "Cache everything" that respects the origin TTL, and a
   Transform Rule adding `X-Robots-Tag: noindex` to `/members/*` (member cards).
9. **Check.** `curl -I https://leocadenses.pt/healthz`; sign in at `/admin/login` with an
   existing account; open a few legacy URLs (`/posts`, `/pages/palmares`, `/novo-socio`,
   `/storage/posts/...`, a card's `/c/<token>`).

### Later deploys

```sh
scripts/deploy.sh               # pull master, build, back up + migrate if needed, reload, /healthz
scripts/deploy.sh --rollback    # serve the previous build again
```
