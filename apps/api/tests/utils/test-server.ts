import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createApp } from '@/app';
import { createDatabase } from '@/persistence/database';

type TestServerOptions = {
  headers?: Record<string, string>;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;

  if (!url) throw new Error('DATABASE_URL is required for e2e tests');

  return url;
};

export class TestServer {
  private readonly headers: Record<string, string>;
  private readonly database = createDatabase(getDatabaseUrl());
  private readonly server: Server;

  constructor(options: TestServerOptions = {}) {
    this.headers = options.headers ?? {};
    this.server = createApp(this.database.db).listen(0);
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
  }
}
