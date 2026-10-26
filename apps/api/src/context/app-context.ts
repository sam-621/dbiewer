import { config } from '@/config';
import type { Database } from '@/persistence/database';
import type { EmailSender } from '@/services/emails/senders/email-sender';
import { getEmailSender } from '@/services/emails/senders/email-sender';
import { EncryptionService } from '@/services/encryption';
import { PostgresService } from '@/services/postgres';

export type AppContext = {
  databases: {
    app: Database;
    admin: Database;
  };
  services: {
    emailSender: EmailSender;
    encryptionService: EncryptionService;
    postgresService: PostgresService;
  };
};

export const createAppContext = (databases: AppContext['databases']): AppContext => ({
  databases,
  services: {
    emailSender: getEmailSender(config.emailSender),
    encryptionService: new EncryptionService(config.encryption.connectionsKey),
    postgresService: new PostgresService()
  }
});
