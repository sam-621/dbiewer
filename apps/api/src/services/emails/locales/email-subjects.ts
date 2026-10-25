import type { Locale } from '@/shared/utils/locale';

type EmailSubject = {
  magicLink: string;
};

export const EmailSubjects: Record<Locale, EmailSubject> = {
  en: {
    magicLink: 'Your dbiewer sign-in link'
  },
  es: {
    magicLink: 'Tu link para entrar a dbiewer'
  }
};
