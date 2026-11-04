import { destroyDatabase, testDatabase } from '@tests/utils/database';
import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { PostgresConnectionFailedError, PostgresQueryFailedError } from './postgres-errors';
import { PostgresService } from './postgres-service';

const getTestConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests');

  const url = new URL(databaseUrl);

  return {
    id: '00000000-0000-0000-0000-000000000001',
    host: url.hostname,
    port: Number(url.port),
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
    sslMode: 'disable' as const
  };
};

const BACKEND_PID_SQL = 'select pg_backend_pid() as pid';

describe('PostgresService', () => {
  const postgresService = new PostgresService();

  afterEach(async () => {
    await postgresService.closePools();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  test('returns the rows of a parameterized query', async () => {
    const result = await postgresService.query<{ value: string }>(
      getTestConnection(),
      'select $1::text as value',
      ['dbiewer']
    );

    expect(result.rows).toEqual([{ value: 'dbiewer' }]);
  });

  test('opens the clients with a statement timeout of 30 seconds', async () => {
    const result = await postgresService.query<{ statement_timeout: string }>(
      getTestConnection(),
      'show statement_timeout'
    );

    expect(result.rows).toEqual([{ statement_timeout: '30s' }]);
  });

  test('reuses the client of the connection pool', async () => {
    const first = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );
    const second = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    expect(second.rows[0]?.pid).toBe(first.rows[0]?.pid);
  });

  test('opens at most 3 clients per connection', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        postgresService.query<{ pid: number }>(
          getTestConnection(),
          'select pg_backend_pid() as pid, pg_sleep(0.2)'
        )
      )
    );

    expect(new Set(results.map(result => result.rows[0]?.pid)).size).toBe(3);
  });

  test('opens a new client after the pool is discarded', async () => {
    const first = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    await postgresService.discardPool(getTestConnection().id);

    const second = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    expect(second.rows[0]?.pid).not.toBe(first.rows[0]?.pid);
  });

  describe('readSchemas', () => {
    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create table library.authors (id integer primary key, name text not null);
          create table library.books (
            id integer primary key,
            author_id integer references library.authors (id),
            title varchar(200) not null
          );
          create view library.book_titles as select id, title from library.books;
          create function library.book_count(author integer) returns bigint
            language sql as 'select count(*) from library.books where author_id = author';
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the tables, views and functions of a schema', async () => {
      const schemas = await postgresService.readSchemas(getTestConnection());

      expect(schemas.find(schema => schema.name === 'library')).toEqual({
        name: 'library',
        tables: [
          {
            name: 'authors',
            estimatedRows: null,
            columns: [
              { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
              { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false }
            ]
          },
          {
            name: 'books',
            estimatedRows: null,
            columns: [
              { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
              { name: 'author_id', type: 'integer', isPrimaryKey: false, isForeignKey: true },
              {
                name: 'title',
                type: 'character varying(200)',
                isPrimaryKey: false,
                isForeignKey: false
              }
            ]
          }
        ],
        views: [
          {
            name: 'book_titles',
            columns: [
              { name: 'id', type: 'integer', isPrimaryKey: false, isForeignKey: false },
              {
                name: 'title',
                type: 'character varying(200)',
                isPrimaryKey: false,
                isForeignKey: false
              }
            ]
          }
        ],
        functions: [{ name: 'book_count', arguments: 'author integer', kind: 'function' }]
      });
    });
  });

  describe('readTableStructure and readTableRows', () => {
    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create table library.authors (id integer primary key, name text not null);
          create table library.books (
            id integer primary key,
            author_id integer references library.authors (id) on delete cascade,
            title varchar(200) not null,
            price numeric(10, 2),
            published_on date default current_date,
            constraint books_title_key unique (title)
          );
          create index books_author_id_idx on library.books (author_id);
          create view library.cheap_books as select id, title from library.books where price < 10;
          insert into library.authors values (1, 'Ada'), (2, 'Grace');
          insert into library.books values
            (1, 1, 'Notes on the Analytical Engine', 12.50, '1843-10-01'),
            (2, 2, 'COBOL Manual', 8.00, null),
            (3, 1, 'It''s; drop table library.books; --', 5.25, null);
          create table library.loans (id integer primary key, status text not null);
          insert into library.loans
            select id, case when id % 2 = 0 then 'open' else 'closed' end
            from generate_series(60, 1, -1) as id;
          grant usage on schema library to "${getTestConnection().username}";
          grant select on all tables in schema library to "${getTestConnection().username}";
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the structure of a table with its definition', async () => {
      const structure = await postgresService.readTableStructure(getTestConnection(), {
        schema: 'library',
        name: 'books'
      });

      expect(structure).toEqual({
        columns: [
          { name: 'id', type: 'integer', isNullable: false, default: null, isPrimaryKey: true },
          {
            name: 'author_id',
            type: 'integer',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'title',
            type: 'character varying(200)',
            isNullable: false,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'price',
            type: 'numeric(10,2)',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'published_on',
            type: 'date',
            isNullable: true,
            default: 'CURRENT_DATE',
            isPrimaryKey: false
          }
        ],
        indexes: [
          {
            name: 'books_author_id_idx',
            definition: 'CREATE INDEX books_author_id_idx ON library.books USING btree (author_id)',
            isUnique: false
          },
          {
            name: 'books_pkey',
            definition: 'CREATE UNIQUE INDEX books_pkey ON library.books USING btree (id)',
            isUnique: true
          },
          {
            name: 'books_title_key',
            definition: 'CREATE UNIQUE INDEX books_title_key ON library.books USING btree (title)',
            isUnique: true
          }
        ],
        foreignKeys: [
          {
            columns: ['author_id'],
            referencedSchema: 'library',
            referencedTable: 'authors',
            referencedColumns: ['id'],
            onDelete: 'CASCADE'
          }
        ],
        definition: [
          'CREATE TABLE "library"."books" (',
          '  "id" integer NOT NULL,',
          '  "author_id" integer,',
          '  "title" character varying(200) NOT NULL,',
          '  "price" numeric(10,2),',
          '  "published_on" date DEFAULT CURRENT_DATE,',
          '  CONSTRAINT "books_pkey" PRIMARY KEY (id),',
          '  CONSTRAINT "books_title_key" UNIQUE (title),',
          '  CONSTRAINT "books_author_id_fkey" FOREIGN KEY (author_id) REFERENCES library.authors(id) ON DELETE CASCADE',
          ');'
        ].join('\n')
      });
    });

    test('returns the structure of a view with its definition and no indexes or foreign keys', async () => {
      const structure = await postgresService.readTableStructure(getTestConnection(), {
        schema: 'library',
        name: 'cheap_books'
      });

      expect(structure).toEqual({
        columns: [
          { name: 'id', type: 'integer', isNullable: true, default: null, isPrimaryKey: false },
          {
            name: 'title',
            type: 'character varying(200)',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          }
        ],
        indexes: [],
        foreignKeys: [],
        definition: ' SELECT id,\n    title\n   FROM library.books\n  WHERE price < 10::numeric;'
      });
    });

    test('returns null when the table does not exist', async () => {
      const structure = await postgresService.readTableStructure(getTestConnection(), {
        schema: 'library',
        name: 'missing_table'
      });

      expect(structure).toBeNull();
    });

    test('returns the rows as text with the total of the table', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: null,
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01'],
          ['2', '2', 'COBOL Manual', '8.00', null],
          ['3', '1', "It's; drop table library.books; --", '5.25', null]
        ],
        totalRows: 3
      });
    });

    test('returns the rows ordered by the given expression', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: null,
        orderBy: 'author_id desc, lower(title)',
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['2', '2', 'COBOL Manual', '8.00', null],
          ['3', '1', "It's; drop table library.books; --", '5.25', null],
          ['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01']
        ],
        totalRows: 3
      });
    });

    test('returns the second page ordered by the primary key when there is no order', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'loans',
        where: null,
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 2
      });

      expect(tableRows).toEqual({
        rows: [
          ['51', 'closed'],
          ['52', 'open'],
          ['53', 'closed'],
          ['54', 'open'],
          ['55', 'closed'],
          ['56', 'open'],
          ['57', 'closed'],
          ['58', 'open'],
          ['59', 'closed'],
          ['60', 'open']
        ],
        totalRows: 60
      });
    });

    test('breaks ties of the given order by the primary key', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'loans',
        where: null,
        orderBy: 'status',
        primaryKeyColumns: ['id'],
        page: 2
      });

      expect(tableRows).toEqual({
        rows: [
          ['42', 'open'],
          ['44', 'open'],
          ['46', 'open'],
          ['48', 'open'],
          ['50', 'open'],
          ['52', 'open'],
          ['54', 'open'],
          ['56', 'open'],
          ['58', 'open'],
          ['60', 'open']
        ],
        totalRows: 60
      });
    });

    test('returns the rows when the order already uses the primary key', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: null,
        orderBy: 'id desc',
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['3', '1', "It's; drop table library.books; --", '5.25', null],
          ['2', '2', 'COBOL Manual', '8.00', null],
          ['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01']
        ],
        totalRows: 3
      });
    });

    test('returns the rows of a view without primary key', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'cheap_books',
        where: 'id = 2',
        orderBy: null,
        primaryKeyColumns: [],
        page: 1
      });

      expect(tableRows).toEqual({ rows: [['2', 'COBOL Manual']], totalRows: 1 });
    });

    test('returns the rows that match the condition with their total', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: 'author_id = 1 and price >= 10',
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01']],
        totalRows: 1
      });
    });

    test('counts every row of the condition and not only those of the page', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'loans',
        where: 'id > 5',
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 2
      });

      expect(tableRows).toEqual({
        rows: [
          ['56', 'open'],
          ['57', 'closed'],
          ['58', 'open'],
          ['59', 'closed'],
          ['60', 'open']
        ],
        totalRows: 55
      });
    });

    test('does not let a line comment swallow what follows the fragments', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: 'price > 6 -- not the cheapest',
        orderBy: 'price -- from cheap to expensive',
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['2', '2', 'COBOL Manual', '8.00', null],
          ['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01']
        ],
        totalRows: 2
      });
    });

    test('does not keep the session state of the fragments for the next query', async () => {
      await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: "set_config('search_path', 'library', false) is not null",
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      const result = await postgresService.query<{ searchPath: string }>(
        getTestConnection(),
        'select current_setting(\'search_path\') as "searchPath"'
      );

      expect(result.rows[0]?.searchPath).toBe('"$user", public');
    });

    test('throws PostgresQueryFailedError when the where fragment is invalid', async () => {
      const tableRows = postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: "id = 'abc'",
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      await expect(tableRows).rejects.toThrow(PostgresQueryFailedError);
      await expect(tableRows).rejects.toThrow('invalid input syntax for type integer: "abc"');
    });

    test('throws PostgresQueryFailedError when the order fragment is invalid', async () => {
      const tableRows = postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        where: null,
        orderBy: 'missing_column',
        primaryKeyColumns: ['id'],
        page: 1
      });

      await expect(tableRows).rejects.toThrow(PostgresQueryFailedError);
      await expect(tableRows).rejects.toThrow('column "missing_column" does not exist');
    });
  });

  describe('readFunctionDefinition', () => {
    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create function library.book_count() returns integer
            language sql as 'select 0';
          create function library.book_count(author integer) returns integer
            language sql as 'select 1';
          create function library.book_count(author text, shelf integer) returns integer
            language sql as 'select 2';
          create procedure library.archive_books(shelf integer)
            language sql as 'select 3';
          create aggregate library.total_price(numeric) (sfunc = numeric_add, stype = numeric);
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the definition of a function', async () => {
      const definition = await postgresService.readFunctionDefinition(getTestConnection(), {
        schema: 'library',
        name: 'book_count',
        arguments: 'author integer'
      });

      expect(definition).toBe(
        'CREATE OR REPLACE FUNCTION library.book_count(author integer)\n RETURNS integer\n LANGUAGE sql\nAS $function$select 1$function$\n'
      );
    });

    test('returns the definition of a procedure', async () => {
      const definition = await postgresService.readFunctionDefinition(getTestConnection(), {
        schema: 'library',
        name: 'archive_books',
        arguments: 'IN shelf integer'
      });

      expect(definition).toBe(
        'CREATE OR REPLACE PROCEDURE library.archive_books(IN shelf integer)\n LANGUAGE sql\nAS $procedure$select 3$procedure$\n'
      );
    });

    test('returns the overload that matches the arguments of readSchemas', async () => {
      const schemas = await postgresService.readSchemas(getTestConnection());
      const library = schemas.find(schema => schema.name === 'library');
      const overloads = library?.functions.filter(({ name }) => name === 'book_count') ?? [];

      const definitions = await Promise.all(
        overloads.map(overload =>
          postgresService.readFunctionDefinition(getTestConnection(), {
            schema: 'library',
            name: overload.name,
            arguments: overload.arguments
          })
        )
      );

      expect(definitions).toEqual([
        'CREATE OR REPLACE FUNCTION library.book_count()\n RETURNS integer\n LANGUAGE sql\nAS $function$select 0$function$\n',
        'CREATE OR REPLACE FUNCTION library.book_count(author integer)\n RETURNS integer\n LANGUAGE sql\nAS $function$select 1$function$\n',
        'CREATE OR REPLACE FUNCTION library.book_count(author text, shelf integer)\n RETURNS integer\n LANGUAGE sql\nAS $function$select 2$function$\n'
      ]);
    });

    test('returns null when the function does not exist', async () => {
      const definition = await postgresService.readFunctionDefinition(getTestConnection(), {
        schema: 'library',
        name: 'missing_function',
        arguments: ''
      });

      expect(definition).toBeNull();
    });

    test('returns null when no overload has the arguments', async () => {
      const definition = await postgresService.readFunctionDefinition(getTestConnection(), {
        schema: 'library',
        name: 'book_count',
        arguments: 'author boolean'
      });

      expect(definition).toBeNull();
    });

    test('returns null for an aggregate', async () => {
      const definition = await postgresService.readFunctionDefinition(getTestConnection(), {
        schema: 'library',
        name: 'total_price',
        arguments: 'numeric'
      });

      expect(definition).toBeNull();
    });
  });

  describe('runQuery', () => {
    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create table library.books (id integer primary key, title varchar(200), price numeric(10, 2));
          grant usage, create on schema library to "${getTestConnection().username}";
          grant select, insert, update on all tables in schema library to "${getTestConnection().username}";
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the rows of the last statement that returns rows', async () => {
      const execution = await postgresService.runQuery(
        getTestConnection(),
        `
          insert into library.books values (1, 'COBOL Manual', 8.00), (2, null, 12.50);
          select id, title, price from library.books order by id;
          update library.books set price = price + 1;
        `
      );

      expect(execution).toEqual({
        columns: [
          { name: 'id', type: 'integer' },
          { name: 'title', type: 'character varying(200)' },
          { name: 'price', type: 'numeric(10,2)' }
        ],
        rows: [
          ['1', 'COBOL Manual', '8.00'],
          ['2', null, '12.50']
        ],
        rowCount: 2,
        isTruncated: false,
        durationMs: expect.any(Number),
        command: 'SELECT 2'
      });
    });

    test('returns at most 1000 rows with the total returned by Postgres', async () => {
      const execution = await postgresService.runQuery(
        getTestConnection(),
        'select id from generate_series(1, 1500) as id'
      );

      expect(execution.rows).toHaveLength(1000);
      expect(execution.rows.at(-1)).toEqual(['1000']);
      expect(execution.rowCount).toBe(1500);
      expect(execution.isTruncated).toBe(true);
      expect(execution.command).toBe('SELECT 1500');
    });

    test('returns the command of the last statement when no statement returns rows', async () => {
      const execution = await postgresService.runQuery(
        getTestConnection(),
        `
          insert into library.books values (10, 'Notes', 5.00), (11, 'Manual', 6.00);
          update library.books set price = 7.00 where id in (10, 11);
        `
      );

      expect(execution).toEqual({
        columns: [],
        rows: [],
        rowCount: 0,
        isTruncated: false,
        durationMs: expect.any(Number),
        command: 'UPDATE 2'
      });
    });

    test('does not keep the session state of the query for the next query', async () => {
      await postgresService.runQuery(
        getTestConnection(),
        'begin; create table library.drafts (id integer); set search_path to library'
      );

      const execution = await postgresService.runQuery(
        getTestConnection(),
        "select current_setting('search_path'), to_regclass('library.drafts')::text, now() = statement_timestamp()"
      );

      expect(execution.rows).toEqual([['"$user", public', null, 't']]);
    });

    test('throws PostgresQueryFailedError with the message of Postgres when a statement fails', async () => {
      const execution = postgresService.runQuery(
        getTestConnection(),
        'select 1; select * from library.missing_table'
      );

      await expect(execution).rejects.toThrow(PostgresQueryFailedError);
      await expect(execution).rejects.toThrow('relation "library.missing_table" does not exist');
    });
  });

  test('throws PostgresConnectionFailedError when it cannot connect', async () => {
    const connection = { ...getTestConnection(), password: 'wrong-password' };

    await expect(postgresService.query(connection, 'select 1')).rejects.toThrow(
      PostgresConnectionFailedError
    );
  });

  test('throws PostgresQueryFailedError with the message of Postgres when the query fails', async () => {
    const query = postgresService.query(getTestConnection(), 'select * from missing_table');

    await expect(query).rejects.toThrow(PostgresQueryFailedError);
    await expect(query).rejects.toThrow('relation "missing_table" does not exist');
  });
});
