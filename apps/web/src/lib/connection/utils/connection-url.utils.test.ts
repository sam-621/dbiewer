import { describe, expect, test } from 'vitest';

import { parseConnectionUrl } from './connection-url.utils';

describe('parseConnectionUrl', () => {
  test('returns every part of a postgres url', () => {
    expect(
      parseConnectionUrl('postgres://ana:secret@db.acme.dev:5432/acme_prod?sslmode=require')
    ).toEqual({
      username: 'ana',
      password: 'secret',
      host: 'db.acme.dev',
      port: 5432,
      database: 'acme_prod',
      sslMode: 'require'
    });
  });

  test('accepts the postgresql protocol', () => {
    expect(parseConnectionUrl('postgresql://ana@db.acme.dev/acme_prod')).toMatchObject({
      username: 'ana',
      host: 'db.acme.dev',
      database: 'acme_prod'
    });
  });

  test('decodes the encoded parts', () => {
    expect(
      parseConnectionUrl('postgres://ana%40acme:p%40ss%2Fw%3Ard@db.acme.dev/acme%20prod')
    ).toMatchObject({
      username: 'ana@acme',
      password: 'p@ss/w:rd',
      database: 'acme prod'
    });
  });

  test('leaves out the parts the url does not have', () => {
    expect(parseConnectionUrl('postgres://db.acme.dev')).toEqual({
      username: undefined,
      password: undefined,
      host: 'db.acme.dev',
      port: undefined,
      database: undefined,
      sslMode: undefined
    });
  });

  test.each(['disable', 'require', 'verify-full'])('returns the %s ssl mode', sslMode => {
    expect(parseConnectionUrl(`postgres://db.acme.dev/acme_prod?sslmode=${sslMode}`)).toMatchObject(
      {
        sslMode
      }
    );
  });

  test('ignores an unknown ssl mode', () => {
    expect(parseConnectionUrl('postgres://db.acme.dev?sslmode=prefer')?.sslMode).toBeUndefined();
  });

  test.each([
    '',
    'db.acme.dev',
    'mysql://ana@db.acme.dev/acme_prod',
    'postgres://',
    'postgres://db.acme.dev:99999/acme_prod',
    'postgres://ana:%E0%A4%A@db.acme.dev'
  ])('returns null for %j', url => {
    expect(parseConnectionUrl(url)).toBeNull();
  });
});
