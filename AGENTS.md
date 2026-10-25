## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, enhanced-img, sveltekit-adapter, drizzle, paraglide, ai-tools
- **UI**: flowbite-svelte, flowbite-svelte-icons (component docs through the `flowbite-svelte` MCP server)

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Project Context

**Project brief**: @INIT.MD
**Implementation plan**: @docs/plan.md
**Architecture and conventions**: @docs/architecture.md

Public site and backoffice of GDR Leocadenses, in one SvelteKit app. It replaces the Laravel 8 +
Voyager site (`E:\Projetos\leocadenses-website`, runs locally at http://localhost:8001) on the same
MariaDB database and the same data model. When porting a feature, read the legacy controller
(`app/Http/Controllers/*`), model (`app/*.php`), view (`resources/views/*`) and its Voyager BREAD
config (`data_rows` / `data_types` in the database) first, and keep the same validation, side
effects and URLs. domingoasdez-app and domingoasdez-admin (`C:\Users\Tiago\Desktop\repos`) are the
reference port: reuse their code where the plan says so.

## Rules

- **Schema changes only through migrations** (docs/architecture.md, "Migrations"): edit
  `src/lib/server/db/schema.ts`, `npm run db:generate -- --name <what>`, review the SQL. Expand,
  then contract. Never `drizzle-kit push`, never edit an applied migration, no DDL outside
  migrations.
- Locally the legacy site and this app share the `leocadenses` database in the local Docker
  MySQL (`C:\Users\Tiago\Desktop\repos\local-env`). Running `npm run db:migrate` there is fine.
  Never touch the production database.
- The local `.env` holds the **production** R2 keys (`leocadenses` bucket, public at
  `https://cdn.leocadenses.pt`). Only `scripts/storage-upload.ts` may write to it. Day-to-day
  development uses a dev bucket or LocalStack (docs/architecture.md, "Storage").
- Permissions keep Voyager's keys: `browse_admin`, `browse_media` and
  `browse_|read_|edit_|add_|delete_<table>`. A user's permissions are those of `users.role_id`
  plus every role in `user_roles`. Every `load`, form action and endpoint under `/admin` calls
  `requirePermission(...)` from `#lib/server/auth/guard.ts`.
- Store files only through `#lib/server/storage`. The database keeps Voyager-relative keys
  (`posts/October2021/x.jpg`); build URLs with `mediaUrl()`. Process images with
  `optimizeImage()` and delete replaced files with `deleteFile()`.
- Legacy URLs must keep working (docs/plan.md, inventory table). Never rename a public route.
- Use Flowbite Svelte components; support light and dark mode in everything.
- Public-site text goes through Paraglide (`messages/{pt-PT,en-GB,es-ES,fr-FR}.json`). The
  backoffice is pt-PT only and uses plain strings.
- Validate form input with zod via `parseForm()` from `#lib/server/forms.ts`.
- Before finishing: `npm run validate` (lint, type check, unit tests) must pass.
