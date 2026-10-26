import { AccountResolver } from './account-resolver';
import { ConnectionResolver } from './connection-resolver';
import { SystemResolver } from './system-resolver';

export const resolvers = [SystemResolver, AccountResolver, ConnectionResolver];
