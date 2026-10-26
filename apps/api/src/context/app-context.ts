import { config } from '@/config';
import type { Database } from '@/persistence/database';
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
};

export const createAppContext = (databases: AppContext['databases']): AppContext => ({
  databases,
  services: {
    emailSender: getEmailSender(config.emailSender)
  }
});
