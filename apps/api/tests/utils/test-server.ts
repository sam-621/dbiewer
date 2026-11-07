import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { makeSignature } from 'better-auth/crypto';

import { createApp } from '@/app';
import type { AppContext } from '@/context';
import { createAppContext } from '@/context';
import { createDatabase } from '@/persistence/database';
import type { Auth } from '@/services/auth';
import { createAuth } from '@/services/auth';

type TestServerOptions = {
  headers?: Record<string, string>;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

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
  private readonly appContext: AppContext;
  private readonly auth: Auth;

  constructor(options: TestServerOptions = {}) {
    this.headers = options.headers ?? {};
    this.appContext = createAppContext({ app: this.database.db, admin: this.adminDatabase.db });
    this.auth = createAuth(this.appContext);
    this.server = createApp(this.appContext).listen(0);
  }

  async signIn(email: string) {
    const ctx = await this.auth.$context;
    const found = await ctx.internalAdapter.findUserByEmail(email);
    const user =
      found?.user ??
      (await ctx.internalAdapter.createUser({ email, name: '', emailVerified: true }));
    const session = await ctx.internalAdapter.createSession(user.id);
    const signature = await makeSignature(session.token, ctx.secret);

    return {
      cookie: `${ctx.authCookies.sessionToken.name}=${encodeURIComponent(`${session.token}.${signature}`)}`
    };
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
