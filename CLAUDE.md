# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start bot in dev/watch mode (use during development)
npm run build        # compile TypeScript via Robo.js
npm run start        # run the compiled bot
npm run lint:style   # format with Prettier (run before committing)
```

There are no automated tests; validate changes by running the bot in dev mode.

## Setup

1. Copy `.env.example` to `.env` and fill in all values.
2. Run `schema.sql` against a MariaDB database to create all tables.
3. `npm install && npm run dev`

## Architecture

This is a **Robo.js** Discord bot (wraps discord.js v14). Robo.js uses file-system routing:

- **`src/commands/<group>/<name>.ts`** — each file becomes a slash command. The folder name is the command group, the file name is the sub-command. Export `config` (via `createCommandConfig`) and a default async handler.
- **`src/events/<eventName>.ts`** (or `src/events/<eventName>/<file>.ts`) — handlers fired when the matching discord.js event fires. `clientReady/` contains startup jobs.
- **`config/robo.ts`** — Robo.js config: Discord intents/partials, Flashcore (Keyv/MariaDB) for ephemeral KV storage.

### Database

Two database layers:

| Layer | Purpose |
|---|---|
| `src/utill/functions/database/pool.ts` | Raw MariaDB connection pool (via `mariadb`) for all persistent data |
| Flashcore (Keyv + `@keyv/mysql`) | Temporary KV store — used for in-flight verification codes and tokens |

Database helpers live in `src/utill/functions/database/` (one file per table: `players`, `servers`, `bans`, `warnings`, `setting`, `online_players`, `factions`, `members`). All are re-exported from `src/utill/functions/index.ts` and importable as `~/utill`.

### Path alias

`~/` resolves to `src/`. Use `~/utill` to import utilities, types, and constants everywhere.

### Types

All TypeScript types are in `src/utill/types/` and exported through `~/utill`:
- `database/` — DB row shapes (`db_player`, `db_server`, etc.)
- `api/` — Fabric and Paper server API shapes
- `eventStream/` — SSE event payloads from the Minecraft plugin
- `settings/` — guild settings shapes (`role_settings`, `modmail_settings`, etc.)

Use `type` (not `interface`) for all type definitions.

### Server event stream

`src/events/clientReady/eventStreamFactions.ts` opens a persistent SSE connection to the Minecraft server's plugin API on startup, listening for faction events (`faction.chat`, `faction.member_join`, `claim.added`, etc.). Each event payload is typed via `src/utill/types/eventStream/`. Use `eventTimestampCheck` to guard against replayed events.

### Verification flow

1. `/verify mc` — player provides MC username; bot fetches UUID from Mojang, stores in `players` table, assigns Discord role.
2. `/verify email` — player provides UEA email; bot sends a code via Gmail SMTP (Nodemailer), stores code+email in Flashcore. A button opens a modal to submit the code (`btn-verify_email` / `modal-verify_email` interaction handlers).
3. `/verify member` — bot scrapes the SU website with Puppeteer to confirm society membership and assigns the member role.

### Scheduled jobs (clientReady/)

| File | Job |
|---|---|
| `playerMsgUpdateJob.ts` | Periodically updates a channel with player message counts |
| `reloadTokensJob.ts` | Refreshes Paper API tokens on a schedule |
| `resetPlayersMsgJob.ts` | Resets per-player message counts |

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Functions | `camelCase` | `getProfileByDId` |
| Variables (domain/DB) | `snake_case` | `already_verified`, `server_id` |
| Variables (library objects) | `camelCase` | `firstActionRow`, `expiryDate` |
| Types | `snake_case` | `db_player`, `role_settings` |
| DB columns | `snake_case` | `mc_uuid`, `created_at` |
| Event handler files | `type-name.ts` | `btn-warn_create.ts`, `modal-verify_mc.ts` |
| All other files | `snake_case` | `online_players.ts` |
| Discord option names | `kebab-case` | `mc-username` |

## Code Style

- No semicolons; tabs for indentation; single quotes; no trailing commas (enforced by Prettier).
- Wrap async DB/network calls in `try/catch`; log errors with `log.error()`; return `null` or `false` on failure rather than throwing.
- Avoid `any` — use the types from `~/utill`.
