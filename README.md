# Discord Bot

![CI](https://github.com/raymanitis/discord-bot/actions/workflows/ci.yml/badge.svg)

A general-purpose Discord bot written in TypeScript. Moderation, button polls, reminders, welcome messages and mod logs. Data is stored in SQLite.

## Features

| Command | What it does | Who can use it |
| --- | --- | --- |
| `/help` | Lists all commands | Everyone |
| `/ping` | Shows latency | Everyone |
| `/userinfo [user]` | Account age, join date, roles | Everyone |
| `/serverinfo` | Owner, members, channels, boosts | Everyone |
| `/poll question options` | Poll with vote buttons and live results bars. One vote per person, can be changed | Everyone |
| `/remind in message` | Reminder like `/remind 1h30m stretch`. Survives bot restarts | Everyone |
| `/warn add / list / remove` | Warn members, DM them, keep history | Moderate Members |
| `/clear amount [user]` | Bulk delete messages, optionally from one user | Manage Messages |
| `/settings welcome / logs / view` | Welcome channel and message, mod log channel | Manage Server |

Also:

- Welcome messages with placeholders: `{user}`, `{username}`, `{server}`, `{memberCount}`
- Moderation actions are posted to a log channel
- Per-command cooldowns against spam
- Errors are caught and logged; users get a friendly message instead of a failed interaction
- Graceful shutdown on SIGINT and SIGTERM

## Tech stack

- **TypeScript** (strict) on Node 22
- **discord.js** v14
- **SQLite** via better-sqlite3, with versioned migrations
- **Zod** for config validation
- **Pino** for structured logging
- **Vitest** for tests (pure logic, data layer, and command handlers with mocked interactions)
- **Docker** and **GitHub Actions** CI

## Setup

1. Create an app at the [Discord Developer Portal](https://discord.com/developers/applications).
2. In **Bot**, reset the token and copy it. Turn on **Server Members Intent** (needed for welcome messages).
3. Invite the bot: **OAuth2 → URL Generator**, tick `bot` and `applications.commands`, then pick permissions: Send Messages, Embed Links, Manage Messages, Moderate Members, Read Message History.
4. Configure and run:

```bash
git clone https://github.com/raymanitis/discord-bot.git
cd discord-bot
cp .env.example .env     # fill in DISCORD_TOKEN, CLIENT_ID and (for testing) GUILD_ID
npm install
npm run deploy           # register slash commands
npm run dev
```

With `GUILD_ID` set, commands show up in that server instantly. Without it they are registered globally, which can take up to an hour.

### Run with Docker

```bash
docker compose up -d --build
docker compose run --rm bot node dist/deploy-commands.js   # once, to register commands
```

The database is kept in a Docker volume.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run with auto-reload |
| `npm run deploy` | Register slash commands |
| `npm test` | Run tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Compile and run the production build |

## Project structure

```
src/
  index.ts             starts the client and wires events
  deploy-commands.ts   registers slash commands with Discord
  config.ts            validated env config
  db.ts                SQLite store and migrations
  commands/            one file per slash command, plus the registry
  events/              interaction and member-join handlers
  lib/                 pure helpers: durations, polls, templates, cooldowns
tests/                 unit and handler tests
```

## Adding a command

1. Create `src/commands/mycommand.ts` exporting a `Command` (`data` + `execute`).
2. Add it to the list in `src/commands/index.ts`.
3. Run `npm run deploy`.

## License

MIT
