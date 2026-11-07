# dbiewer

Web SQL client: connect to databases, explore their schema and run queries from the browser

## Apps

| App | What it is | Stack |
|-----|------------|-------|
| `apps/api` | Backend: connections to the user's databases, query execution, schema and history | Express, GraphQL Yoga, Drizzle, Postgres |
| `apps/web` | Web client: SQL editor, schema explorer, results grid and history | React, Vite, Tailwind, i18next |
| `apps/www` | dbiewer landing: presents the product and links to the web client | Astro, Tailwind |

## Host

dbiewer is open source and free. You can run it locally or on any host that runs Node and Postgres.

### What you need

- Node 22.9 or newer and Yarn
- A Postgres database for dbiewer's own data
- A GitHub OAuth app, used for sign in. Its callback URL is `<API_URL>/api/auth/callback/github`

### 1. Database

Create the role the API connects with. Run it as a superuser, before the first migration:

```sql
CREATE ROLE app_user WITH LOGIN PASSWORD '<password>' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE <database> TO app_user;
```

The API queries as `app_user` so row level security keeps each workspace's data apart. Migrations run as the superuser.

### 2. API (`apps/api`)

Copy `.env.example` to `.env` (or set the variables on your host):

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | Port the API listens on |
| `DATABASE_URL` | Connection as `app_user` |
| `ADMIN_DATABASE_URL` | Connection as a superuser, for migrations and auth |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL of the API |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | From your GitHub OAuth app |
| `WEB_URL` | Public URL of the web client |
| `CONNECTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32`. Encrypts saved connection passwords: keep a backup, losing it makes them unreadable |

```sh
yarn install
yarn migrate .env
yarn build
yarn start
```

Special characters in a password inside a connection URL must be URL-encoded (`/` becomes `%2F`).

### 3. Web client (`apps/web`)

Set `VITE_API_URL` to the public URL of the API, then build and serve `dist/` as static files:

```sh
yarn install
yarn build
```

The web client and the API must share the same site (for example `app.example.com` and `api.example.com`) so the session cookie reaches the API.

### 4. Landing (optional, `apps/www`)

Set `PUBLIC_APP_URL` to the web client's URL, then `yarn install && yarn build` and serve `dist/`.

### Local development

Same steps with the local values in each `.env.example` (fill in the secrets and the GitHub keys), using `yarn dev` in `apps/api` and `apps/web` instead of `build` and `start`.

## Working with Claude Code

- `CLAUDE.md` at the root and in each app: rules and which doc to read before writing code.
- `<app>/docs/`: architecture, code style, testing and commands for each app or package.
- `features/<slug>/`: spec and log for each feature. Start with `/session-start <slug>`.
- `/commit`: commits following the repo's format.
- `/harness add-app <name>`: adds an app with its `CLAUDE.md`, docs and agents.
