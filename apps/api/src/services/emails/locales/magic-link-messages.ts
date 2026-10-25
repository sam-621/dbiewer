import type { Locale } from '@/shared/utils/locale';

type MagicLinkMessages = {
  intro: string;
  action: string;
  expiry: string;
  ignore: string;
};

export const MagicLinkMessages: Record<Locale, MagicLinkMessages> = {
  en: {
    intro: 'Use this link to sign in to dbiewer:',
    action: 'Sign in to dbiewer',
    expiry: 'The link expires in 15 minutes and can only be used once.',
    ignore: "If you didn't request it, you can ignore this email."
  },
  es: {
    intro: 'Usa este link para entrar a dbiewer:',
    action: 'Entrar a dbiewer',
    expiry: 'El link vence en 15 minutos y sirve una sola vez.',
    ignore: 'Si no lo pediste, puedes ignorar este correo.'
  }
};
