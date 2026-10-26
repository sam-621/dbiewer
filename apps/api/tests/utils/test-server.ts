import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { like } from 'drizzle-orm';

import { createApp } from '@/app';
import type { AppContext } from '@/context';
import { createAppContext } from '@/context';
import { createDatabase } from '@/persistence/database';
import { verification } from '@/persistence/schema';

type TestServerOptions = {
  headers?: Record<string, string>;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

const MAGIC_LINK_IDENTIFIER_PREFIX = 'magic-link:';

const getEnv = (name: 'DATABASE_URL' | 'ADMIN_DATABASE_URL') => {
  const url = process.env[name];

  if (!url) throw new Error(`${name} is required for e2e tests`);

  return url;
};

export class TestServer {
  private readonly headers: Record<string, string>;
  private readonly database = createDatabase(getEnv('DATABASE_URL'));
  private readonly adminDatabase = createDatabase(getEnv('ADMIN_DATABASE_URL'));
  private readonly server: Server;
  readonly appContext: AppContext;

  constructor(options: TestServerOptions = {}) {
    this.headers = options.headers ?? {};
    this.appContext = createAppContext({ app: this.database.db, admin: this.adminDatabase.db });
    this.server = createApp(this.appContext).listen(0);
  }

  async signIn(email: string) {
    await fetch(`${this.url}/api/auth/sign-in/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const [row] = await this.adminDatabase.db
      .select({ identifier: verification.identifier })
      .from(verification)
      .where(like(verification.value, `%"email":"${email}"%`));

    if (!row) throw new Error(`No magic link found for ${email}`);

    const token = row.identifier.slice(MAGIC_LINK_IDENTIFIER_PREFIX.length);
    const response = await fetch(`${this.url}/api/auth/magic-link/verify?token=${token}`);
    const cookies = response.headers.getSetCookie().map(cookie => cookie.split(';')[0]);

    if (!cookies.length) throw new Error(`Failed to sign in ${email}`);

    return { cookie: cookies.join('; ') };
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    headers?: Record<string, string>
  ) {
    const response = await fetch(`${this.url}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...this.headers, ...headers },
      body: JSON.stringify({ query, variables })
    });

    return (await response.json()) as GraphQLResponse<T>;
  }

  private get url() {
    const { port } = this.server.address() as AddressInfo;

    return `http://localhost:${port}`;
  }

  async teardown() {
    await new Promise<void>((resolve, reject) =>
      this.server.close(error => (error ? reject(error) : resolve()))
    );
    await this.database.pool.end();
    await this.adminDatabase.pool.end();
    await this.appContext.services.postgresService.closePools();
  }
}
