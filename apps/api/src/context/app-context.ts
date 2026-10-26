import { config } from '@/config';
import type { Database } from '@/persistence/database';
import type { EmailSender } from '@/services/emails/senders/email-sender';
import { getEmailSender } from '@/services/emails/senders/email-sender';
import { EncryptionService } from '@/services/encryption';

export type AppContext = {
  databases: {
    app: Database;
    admin: Database;
  };
  services: {
    emailSender: EmailSender;
    encryptionService: EncryptionService;
  };
};

export const createAppContext = (databases: AppContext['databases']): AppContext => ({
  databases,
  services: {
    emailSender: getEmailSender(config.emailSender),
    encryptionService: new EncryptionService(config.encryption.connectionsKey)
  }
});
