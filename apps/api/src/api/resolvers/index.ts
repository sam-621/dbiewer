import { AccountResolver } from './account-resolver';
import { ConnectionResolver } from './connection-resolver';
import { DatabaseSchemaResolver } from './database-schema-resolver';
import { FileResolver } from './file-resolver';
import { QueryResolver } from './query-resolver';
import { SystemResolver } from './system-resolver';

export const resolvers = [
  SystemResolver,
  AccountResolver,
  ConnectionResolver,
  DatabaseSchemaResolver,
  QueryResolver,
  FileResolver
];
