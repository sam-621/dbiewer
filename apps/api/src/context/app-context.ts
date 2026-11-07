import { config } from '@/config';
import type { Database } from '@/persistence/database';
import { EncryptionService } from '@/services/encryption';
import { PostgresService } from '@/services/postgres';

export type AppContext = {
  databases: {
    app: Database;
    admin: Database;
  };
  services: {
    encryptionService: EncryptionService;
    postgresService: PostgresService;
  };
};

export const createAppContext = (databases: AppContext['databases']): AppContext => ({
  databases,
  services: {
    encryptionService: new EncryptionService(config.encryption.connectionsKey),
    postgresService: new PostgresService(config.postgres)
  }
});
