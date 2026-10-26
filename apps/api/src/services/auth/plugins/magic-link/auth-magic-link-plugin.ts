import { magicLink } from 'better-auth/plugins/magic-link';

import type { AppContext } from '@/context';
import { resolveLocale } from '@/shared/utils/locale';

import { sendMagicLink } from './send-magic-link';

const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

export const authMagicLinkPlugin = (appContext: AppContext) =>
  magicLink({
    expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
    sendMagicLink: ({ email, url }, ctx) =>
      sendMagicLink(appContext.services.emailSender, {
        email,
        url,
        locale: resolveLocale(ctx?.headers?.get('accept-language') ?? null)
      })
  });
