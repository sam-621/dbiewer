# dbiewer

Web SQL client: connect to databases, explore their schema and run queries from the browser

## Apps

| App | What it is | Stack |
|-----|------------|-------|
| `apps/api` | Backend: connections to the user's databases, query execution, schema and history | Express, GraphQL Yoga, Drizzle, Postgres |
| `apps/web` | Web client: SQL editor, schema explorer, results grid and history | React, Vite, Tailwind, i18next |
| `apps/www` | dbiewer landing: presents the product and links to the web client | Astro, Tailwind |

## Working with Claude Code

- `CLAUDE.md` at the root and in each app: rules and which doc to read before writing code.
- `<app>/docs/`: architecture, code style, testing and commands for each app or package.
- `features/<slug>/`: spec and log for each feature. Start with `/session-start <slug>`.
- `/commit`: commits following the repo's format.
- `/harness add-app <name>`: adds an app with its `CLAUDE.md`, docs and agents.
