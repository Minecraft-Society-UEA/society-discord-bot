# Contributing

Thanks for helping out with the UEA Minecraft Society bot! Here's what you need to know to get started.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (check `.nvmrc` or `package.json` for the version)
- A MariaDB database instance
- A Discord bot token and application

### Setup

1. Fork and clone the repo:

   ```bash
   git clone https://github.com/<your-username>/uea-mc-soc.git
   cd uea-mc-soc
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the `.env.example` file to just a `.env` file and fill in discord token and database connection info. (+ any other other thing you need)

4. Setup the Database connect to your database by the means of your choice and paste the `schema.sql` in asn execute the sql itll creat all the dbs you need.

5. Start the bot in dev mode:
   ```bash
   npm run dev
   ```

---

## Project Structure

```
C:
├───.robo (ROBO.js misc stuff/build stuff)
├───config (mainly robos config)
├───node_modules (node stuffs)
├───src
│   ├───api (unsed for now maybe have server talk to bot...)
│   ├───commands (all files are registered as slash commands there path being there sub command and file name the command name)
│   │   ├───admin (admin commands)
│   │   ├───unlink (commands for unlinking/removing info from the bot)
│   │   └───verify (the commands for our verification proccsess)
│   ├───events (events these files are called and ran when there named djs event is triggerd)
│   ├───images (welcome message background image)
│   └───utill (a folder for misilaouse things)
│       ├───constants (random non variables)
│       ├───functions (supporting functions)
│       │   ├───database
│       │   ├───email
│       │   └───server
│       └───types (types folder for ts interfaces and types)
│           ├───api
│           │   ├───fabric
│           │   └───paper
│           ├───database
│           └───settings
└───to be done (files from stuff i started and may even return to)
```

---

## Making Changes

### Branching

Create a branch from `main` for your work:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Commit Style

Keep commits small and focused. Use a short, descriptive message:

```
feat: add player online count command
fix: resolve email verification edge case
refactor: tidy up database type definitions
```

### Code Style

This project uses **Prettier** for formatting. Run it before committing:

```bash
npm run lint:style
```

#### Naming conventions

| Thing                         | Convention     | Example                                                      |
| ----------------------------- | -------------- | ------------------------------------------------------------ |
| Functions                     | `camelCase`    | `getProfileByDId`, `createServer`                            |
| Variables — domain/DB related | `snake_case`   | `already_verified`, `user_code`, `server_id`, `banned_till`  |
| Variables — library objects   | `camelCase`    | `firstActionRow`, `disabledComponents`, `expiryDate`         |
| Types                         | `snake_case`   | `db_player`, `db_server`, `mc_rank_type`, `role_settings`    |
| DB column names               | `snake_case`   | `user_id`, `mc_uuid`, `created_at`                           |
| Event Folder files            | `type-name.ts` | `btn-warn_create.ts`, `modal-verify_mc.ts`                   |
| All other files               | `snake_case`   | `players_online.ts`, `create_server.ts`, `online_players.ts` |
| Discord option names          | `kebab-case`   | `mc-username`                                                |

sorry if there are any inconsistanty

#### TypeScript

- Use `type` over `interface` — all existing types use `type`
- Avoid `any` — use the types in `src/utill/types/` and import them via `~/utill`
- No semicolons on type definitions (Prettier handles this)
- Type properties have no trailing commas

#### General

- No semicolons at end of statements (Prettier config)
- Tabs for indentation
- Single quotes for strings
- Wrap error-prone async calls in `try/catch` and log with `log.error()`
- Return `null` or `false` on errors, not thrown exceptions

---

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a PR against `main` on the main repo.
3. Give the PR a clear title and describe what it changes and why.
4. One of the maintainers will review it.
