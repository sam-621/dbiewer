import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createApp } from '@/app';
import { createAppContext } from '@/context';
import { createDatabase } from '@/persistence/database';

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

  constructor(options: TestServerOptions = {}) {
    this.headers = options.headers ?? {};
    this.server = createApp(
      createAppContext({ app: this.database.db, admin: this.adminDatabase.db })
    ).listen(0);
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    headers?: Record<string, string>
  ) {
    const { port } = this.server.address() as AddressInfo;

    const response = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...this.headers, ...headers },
      body: JSON.stringify({ query, variables })
    });

    return (await response.json()) as GraphQLResponse<T>;
  }

  async teardown() {
    await new Promise<void>((resolve, reject) =>
      this.server.close(error => (error ? reject(error) : resolve()))
    );
    await this.database.pool.end();
    await this.adminDatabase.pool.end();
  }
}
