import { config } from '@/config';
import type { Database } from '@/persistence/database';
import { MagicLinkRequestRepository } from '@/persistence/repositories/magic-link-request';
import { VerificationRepository } from '@/persistence/repositories/verification';
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
    magicLinkRequest: MagicLinkRequestRepository;
    verification: VerificationRepository;
  };
};

export const createAppContext = (databases: AppContext['databases']): AppContext => ({
  databases,
  services: {
    emailSender: getEmailSender(config.emailSender)
  },
  repositories: {
    magicLinkRequest: new MagicLinkRequestRepository(databases.admin),
    verification: new VerificationRepository(databases.admin)
  }
});
