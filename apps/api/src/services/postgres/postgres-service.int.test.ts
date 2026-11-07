import { destroyDatabase, testDatabase } from '@tests/utils/database';
import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

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

  describe('readDiagram', () => {
    const findRelation = async (id: string) => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      return diagram.relations.find(relation => relation.id === id);
    };

    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create schema sales;
          create table information_schema.dbiewer_regions (id integer primary key);
          create table library.authors (
            id integer primary key,
            name varchar(100) not null,
            status text not null default 'active',
            joined_at timestamp with time zone default now()
          );
          create table library.books (
            id integer primary key,
            author_id integer references library.authors (id),
            title text not null
          );
          create table library.author_profiles (
            author_id integer primary key references library.authors (id)
          );
          create table library.passports (
            id integer primary key,
            author_id integer unique references library.authors (id)
          );
          create table library.badges (
            id integer primary key,
            author_id integer references library.authors (id)
          );
          create unique index badges_author_id_idx on library.badges (author_id);
          create table library.memberships (
            id integer primary key,
            author_id integer references library.authors (id),
            is_active boolean not null
          );
          create unique index memberships_author_id_idx on library.memberships (author_id)
            where is_active;
          create table library.lockers (
            id integer primary key,
            code integer not null,
            author_id integer references library.authors (id),
            unique (author_id) include (code)
          );
          create table library.tags (id integer primary key);
          create table library.book_tags (
            book_id integer references library.books (id),
            tag_id integer references library.tags (id),
            primary key (book_id, tag_id)
          );
          create table library.editions (
            book_id integer references library.books (id),
            number integer,
            primary key (book_id, number)
          );
          create table library.prints (
            id integer primary key,
            edition_number integer,
            edition_book_id integer,
            foreign key (edition_number, edition_book_id)
              references library.editions (number, book_id)
          );
          create table library.covers (
            id integer primary key,
            edition_book_id integer,
            edition_number integer,
            unique (edition_number, edition_book_id),
            foreign key (edition_book_id, edition_number)
              references library.editions (book_id, number)
          );
          create table library.stores (
            id integer primary key,
            region_id integer references information_schema.dbiewer_regions (id)
          );
          create table library.events (id integer, happened_on date)
            partition by range (happened_on);
          create view library.book_titles as select id, title from library.books;
          create function library.book_count() returns bigint
            language sql as 'select count(*) from library.books';
          create table sales.orders (
            id integer primary key,
            book_id integer,
            constraint book_fk foreign key (book_id) references library.books (id)
          );
          create table sales.refunds (
            id integer primary key,
            book_id integer,
            constraint book_fk foreign key (book_id) references library.books (id)
          );
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          drop schema library cascade;
          drop schema sales cascade;
          drop table information_schema.dbiewer_regions;
        `)
      );
    });

    test('returns the tables of every schema without views or functions', async () => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      expect(
        diagram.entities
          .filter(entity => ['library', 'sales'].includes(entity.schema))
          .map(entity => entity.id)
      ).toEqual([
        'library.author_profiles',
        'library.authors',
        'library.badges',
        'library.book_tags',
        'library.books',
        'library.covers',
        'library.editions',
        'library.events',
        'library.lockers',
        'library.memberships',
        'library.passports',
        'library.prints',
        'library.stores',
        'library.tags',
        'sales.orders',
        'sales.refunds'
      ]);
    });

    test('returns the properties of a table', async () => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      expect(diagram.entities.find(entity => entity.id === 'library.authors')).toEqual({
        id: 'library.authors',
        schema: 'library',
        name: 'authors',
        properties: [
          {
            name: 'id',
            type: 'integer',
            default: null,
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false
          },
          {
            name: 'name',
            type: 'character varying(100)',
            default: null,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false
          },
          {
            name: 'status',
            type: 'text',
            default: "'active'::text",
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false
          },
          {
            name: 'joined_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false
          }
        ]
      });
    });

    test('marks the properties that belong to a foreign key', async () => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      expect(diagram.entities.find(entity => entity.id === 'library.book_tags')).toEqual({
        id: 'library.book_tags',
        schema: 'library',
        name: 'book_tags',
        properties: [
          {
            name: 'book_id',
            type: 'integer',
            default: null,
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: true
          },
          {
            name: 'tag_id',
            type: 'integer',
            default: null,
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: true
          }
        ]
      });
    });

    test('returns MANY_TO_ONE from the table that has the foreign key', async () => {
      expect(await findRelation('library.books.books_author_id_fkey')).toEqual({
        id: 'library.books.books_author_id_fkey',
        type: 'MANY_TO_ONE',
        fromEntityId: 'library.books',
        fromProperties: ['author_id'],
        toEntityId: 'library.authors',
        toProperties: ['id']
      });
    });

    test('returns ONE_TO_ONE when the foreign key is the primary key', async () => {
      expect(await findRelation('library.author_profiles.author_profiles_author_id_fkey')).toEqual({
        id: 'library.author_profiles.author_profiles_author_id_fkey',
        type: 'ONE_TO_ONE',
        fromEntityId: 'library.author_profiles',
        fromProperties: ['author_id'],
        toEntityId: 'library.authors',
        toProperties: ['id']
      });
    });

    test('returns ONE_TO_ONE when the foreign key has a unique constraint', async () => {
      const relation = await findRelation('library.passports.passports_author_id_fkey');

      expect(relation?.type).toBe('ONE_TO_ONE');
    });

    test('returns ONE_TO_ONE when the foreign key has a unique index', async () => {
      const relation = await findRelation('library.badges.badges_author_id_fkey');

      expect(relation?.type).toBe('ONE_TO_ONE');
    });

    test('returns ONE_TO_ONE when the unique index includes other columns', async () => {
      const relation = await findRelation('library.lockers.lockers_author_id_fkey');

      expect(relation?.type).toBe('ONE_TO_ONE');
    });

    test('returns MANY_TO_ONE when the unique index is partial', async () => {
      const relation = await findRelation('library.memberships.memberships_author_id_fkey');

      expect(relation?.type).toBe('MANY_TO_ONE');
    });

    test('returns two MANY_TO_ONE for an intermediate table', async () => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      expect(
        diagram.relations.filter(relation => relation.fromEntityId === 'library.book_tags')
      ).toEqual([
        {
          id: 'library.book_tags.book_tags_book_id_fkey',
          type: 'MANY_TO_ONE',
          fromEntityId: 'library.book_tags',
          fromProperties: ['book_id'],
          toEntityId: 'library.books',
          toProperties: ['id']
        },
        {
          id: 'library.book_tags.book_tags_tag_id_fkey',
          type: 'MANY_TO_ONE',
          fromEntityId: 'library.book_tags',
          fromProperties: ['tag_id'],
          toEntityId: 'library.tags',
          toProperties: ['id']
        }
      ]);
    });

    test('returns the properties of a composite foreign key in the same order', async () => {
      expect(
        await findRelation('library.prints.prints_edition_number_edition_book_id_fkey')
      ).toEqual({
        id: 'library.prints.prints_edition_number_edition_book_id_fkey',
        type: 'MANY_TO_ONE',
        fromEntityId: 'library.prints',
        fromProperties: ['edition_number', 'edition_book_id'],
        toEntityId: 'library.editions',
        toProperties: ['number', 'book_id']
      });
    });

    test('returns ONE_TO_ONE when a unique constraint has the columns of a composite foreign key in another order', async () => {
      expect(
        await findRelation('library.covers.covers_edition_book_id_edition_number_fkey')
      ).toEqual({
        id: 'library.covers.covers_edition_book_id_edition_number_fkey',
        type: 'ONE_TO_ONE',
        fromEntityId: 'library.covers',
        fromProperties: ['edition_book_id', 'edition_number'],
        toEntityId: 'library.editions',
        toProperties: ['book_id', 'number']
      });
    });

    test('returns the relations between tables of different schemas', async () => {
      expect(await findRelation('sales.orders.book_fk')).toEqual({
        id: 'sales.orders.book_fk',
        type: 'MANY_TO_ONE',
        fromEntityId: 'sales.orders',
        fromProperties: ['book_id'],
        toEntityId: 'library.books',
        toProperties: ['id']
      });
    });

    test('returns a relation per table when they share the name of the constraint', async () => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      expect(
        diagram.relations
          .filter(relation => relation.id.endsWith('.book_fk'))
          .map(relation => relation.id)
      ).toEqual(['sales.orders.book_fk', 'sales.refunds.book_fk']);
    });

    test('does not return the relations to a table outside the diagram', async () => {
      const diagram = await postgresService.readDiagram(getTestConnection());

      expect(
        diagram.relations.filter(relation => relation.fromEntityId === 'library.stores')
      ).toEqual([]);
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

  describe('readPrimaryKeyColumns, saveTableChanges and deleteTableRows', () => {
    const readRows = async (table: string) => {
      const result = await testDatabase.execute(sql.raw(`select * from ${table} as t order by t`));

      return result.rows;
    };

    beforeEach(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create table library.books (
            id integer generated by default as identity primary key,
            title text not null,
            price numeric(10, 2),
            status text not null default 'draft'
          );
          create table library.editions (
            book_id integer,
            number integer,
            label text,
            primary key (book_id, number)
          );
          create table library.loans (
            id integer primary key,
            book_id integer not null references library.books (id)
          );
          create table library.notes (body text);
          create view library.cheap_books as select id, title from library.books where price < 10;
          insert into library.books (id, title, price, status) overriding system value values
            (1, 'Notes on the Analytical Engine', 12.50, 'published'),
            (2, 'COBOL Manual', 8.00, 'published'),
            (3, 'Compilers', 30.00, 'published');
          select setval(pg_get_serial_sequence('library.books', 'id'), 3);
          insert into library.editions values (1, 1, 'First'), (1, 2, 'Second'), (2, 1, 'First');
          insert into library.loans values (1, 3);
          insert into library.notes values ('Return on Friday');
          grant usage on schema library to "${getTestConnection().username}";
          grant select, insert, update, delete on all tables in schema library to "${getTestConnection().username}";
          grant usage on all sequences in schema library to "${getTestConnection().username}";
        `)
      );
    });

    afterEach(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the columns of a composite primary key in their order', async () => {
      const primaryKeyColumns = await postgresService.readPrimaryKeyColumns(getTestConnection(), {
        schema: 'library',
        name: 'editions'
      });

      expect(primaryKeyColumns).toEqual(['book_id', 'number']);
    });

    test('returns no columns for a table without primary key', async () => {
      const primaryKeyColumns = await postgresService.readPrimaryKeyColumns(getTestConnection(), {
        schema: 'library',
        name: 'notes'
      });

      expect(primaryKeyColumns).toEqual([]);
    });

    test('returns null for a view', async () => {
      const primaryKeyColumns = await postgresService.readPrimaryKeyColumns(getTestConnection(), {
        schema: 'library',
        name: 'cheap_books'
      });

      expect(primaryKeyColumns).toBeNull();
    });

    test('returns null when the table does not exist', async () => {
      const primaryKeyColumns = await postgresService.readPrimaryKeyColumns(getTestConnection(), {
        schema: 'library',
        name: 'missing_table'
      });

      expect(primaryKeyColumns).toBeNull();
    });

    test('updates and inserts the rows in the same transaction', async () => {
      await postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'books',
        updates: [
          {
            key: [{ column: 'id', value: '1' }],
            values: [
              { column: 'title', value: 'Sketch of the Analytical Engine' },
              { column: 'price', value: '15' }
            ]
          },
          { key: [{ column: 'id', value: '2' }], values: [{ column: 'status', value: 'archived' }] }
        ],
        inserts: [{ values: [{ column: 'title', value: 'SQL Primer' }] }]
      });

      expect(await readRows('library.books')).toEqual([
        { id: 1, title: 'Sketch of the Analytical Engine', price: '15.00', status: 'published' },
        { id: 2, title: 'COBOL Manual', price: '8.00', status: 'archived' },
        { id: 3, title: 'Compilers', price: '30.00', status: 'published' },
        { id: 4, title: 'SQL Primer', price: null, status: 'draft' }
      ]);
    });

    test('updates the row that matches every column of a composite primary key', async () => {
      await postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'editions',
        updates: [
          {
            key: [
              { column: 'number', value: '2' },
              { column: 'book_id', value: '1' }
            ],
            values: [{ column: 'label', value: 'Revised' }]
          }
        ],
        inserts: []
      });

      expect(await readRows('library.editions')).toEqual([
        { book_id: 1, number: 1, label: 'First' },
        { book_id: 1, number: 2, label: 'Revised' },
        { book_id: 2, number: 1, label: 'First' }
      ]);
    });

    test('updates a column of the primary key locating the row by its original value', async () => {
      await postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'books',
        updates: [{ key: [{ column: 'id', value: '2' }], values: [{ column: 'id', value: '20' }] }],
        inserts: []
      });

      expect((await readRows('library.books')).map(row => row.id)).toEqual([1, 3, 20]);
    });

    test('inserts a row with default values when it has no values', async () => {
      await postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'notes',
        updates: [],
        inserts: [{ values: [] }]
      });

      expect(await readRows('library.notes')).toEqual([
        { body: 'Return on Friday' },
        { body: null }
      ]);
    });

    test('sets NULL when the value is null', async () => {
      await postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'books',
        updates: [
          { key: [{ column: 'id', value: '1' }], values: [{ column: 'price', value: null }] }
        ],
        inserts: [
          {
            values: [
              { column: 'title', value: 'SQL Primer' },
              { column: 'price', value: null }
            ]
          }
        ]
      });

      expect(await readRows('library.books')).toEqual([
        { id: 1, title: 'Notes on the Analytical Engine', price: null, status: 'published' },
        { id: 2, title: 'COBOL Manual', price: '8.00', status: 'published' },
        { id: 3, title: 'Compilers', price: '30.00', status: 'published' },
        { id: 4, title: 'SQL Primer', price: null, status: 'draft' }
      ]);
    });

    test('inserts rows in a table without primary key', async () => {
      await postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'notes',
        updates: [],
        inserts: [{ values: [{ column: 'body', value: 'Renew the loan' }] }]
      });

      expect(await readRows('library.notes')).toEqual([
        { body: 'Renew the loan' },
        { body: 'Return on Friday' }
      ]);
    });

    test('deletes the rows of the keys and returns how many were deleted', async () => {
      const deletedRows = await postgresService.deleteTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        keys: [
          [{ column: 'id', value: '1' }],
          [{ column: 'id', value: '2' }],
          [{ column: 'id', value: '99' }]
        ]
      });

      expect(deletedRows).toBe(2);
      expect((await readRows('library.books')).map(row => row.id)).toEqual([3]);
    });

    test('deletes the row that matches every column of a composite primary key', async () => {
      const deletedRows = await postgresService.deleteTableRows(getTestConnection(), {
        schema: 'library',
        name: 'editions',
        keys: [
          [
            { column: 'book_id', value: '1' },
            { column: 'number', value: '2' }
          ]
        ]
      });

      expect(deletedRows).toBe(1);
      expect(await readRows('library.editions')).toEqual([
        { book_id: 1, number: 1, label: 'First' },
        { book_id: 2, number: 1, label: 'First' }
      ]);
    });

    test('does not apply any change when a statement fails', async () => {
      const save = postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'books',
        updates: [
          { key: [{ column: 'id', value: '1' }], values: [{ column: 'price', value: '1' }] }
        ],
        inserts: [{ values: [{ column: 'price', value: '5' }] }]
      });

      await expect(save).rejects.toThrow(PostgresQueryFailedError);
      await expect(save).rejects.toThrow(
        'null value in column "title" of relation "books" violates not-null constraint'
      );
      expect(await readRows('library.books')).toEqual([
        { id: 1, title: 'Notes on the Analytical Engine', price: '12.50', status: 'published' },
        { id: 2, title: 'COBOL Manual', price: '8.00', status: 'published' },
        { id: 3, title: 'Compilers', price: '30.00', status: 'published' }
      ]);
    });

    test('throws PostgresQueryFailedError when the value cannot be converted to the type of the column', async () => {
      const save = postgresService.saveTableChanges(getTestConnection(), {
        schema: 'library',
        name: 'books',
        updates: [
          { key: [{ column: 'id', value: '1' }], values: [{ column: 'price', value: 'cheap' }] }
        ],
        inserts: []
      });

      await expect(save).rejects.toThrow('invalid input syntax for type numeric: "cheap"');
    });

    test('does not delete any row when a deletion fails', async () => {
      const deletion = postgresService.deleteTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        keys: [[{ column: 'id', value: '1' }], [{ column: 'id', value: '3' }]]
      });

      await expect(deletion).rejects.toThrow(PostgresQueryFailedError);
      await expect(deletion).rejects.toThrow(
        'update or delete on table "books" violates foreign key constraint "loans_book_id_fkey" on table "loans"'
      );
      expect((await readRows('library.books')).map(row => row.id)).toEqual([1, 2, 3]);
    });

    test('throws PostgresConnectionFailedError when it cannot connect', async () => {
      const save = postgresService.saveTableChanges(
        { ...getTestConnection(), password: 'wrong-password' },
        {
          schema: 'library',
          name: 'notes',
          updates: [],
          inserts: [{ values: [{ column: 'body', value: 'Renew the loan' }] }]
        }
      );

      await expect(save).rejects.toThrow(PostgresConnectionFailedError);
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
