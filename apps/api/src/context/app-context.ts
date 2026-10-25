import { config } from '@/config';
import type { Database } from '@/persistence/database';
import { VerificationRepository } from '@/persistence/repositories/verification-repository';
import type { EmailSender } from '@/services/emails/senders/email-sender';
import { getEmailSender } from '@/services/emails/senders/email-sender';

export type AppContext = {
  databases: {
    app: Database;
    admin: Database;
  };
  services: {
    emailSender: EmailSender;
  };
  repositories: {
    verification: VerificationRepository;
  };
};

export const createAppContext = (databases: AppContext['databases']): AppContext => ({
  databases,
  services: {
    emailSender: getEmailSender(config.emailSender)
  },
  repositories: {
    verification: new VerificationRepository(databases.admin)
  }
});
