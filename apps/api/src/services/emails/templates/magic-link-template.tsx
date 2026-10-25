import {
  Body,
  Container,
  Head,
  Html,
  pixelBasedPreset,
  Preview,
  render,
  Tailwind
} from '@react-email/components';

import type { Locale } from '@/shared/utils/locale';

import { EmailSubjects } from '../locales/email-subjects';
import { MagicLinkMessages } from '../locales/magic-link-messages';

import { EmailFooter } from './shared/footer';
import {
  EmailHeader,
  EmailHeaderButton,
  EmailHeaderSubtitle,
  EmailHeaderTitle
} from './shared/header';

const Component = ({ url, locale }: MagicLinkTemplateInput) => {
  const messages = MagicLinkMessages[locale];
  const subject = EmailSubjects[locale].magicLink;

  return (
    <Html lang={locale}>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="mx-auto my-auto bg-white p-[32px] font-sans">
          <Preview>{subject}</Preview>
          <Container className="mx-auto w-full max-w-[500px]">
            <EmailHeader>
              <EmailHeaderTitle>{subject}</EmailHeaderTitle>
              <EmailHeaderSubtitle>{messages.intro}</EmailHeaderSubtitle>
              <EmailHeaderButton href={url}>{messages.action}</EmailHeaderButton>
              <EmailHeaderSubtitle className="!mt-4 !text-[12px] !text-[#737373]">
                {messages.expiry}
              </EmailHeaderSubtitle>
            </EmailHeader>
            <EmailFooter>{messages.ignore}</EmailFooter>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export type MagicLinkTemplateInput = {
  url: string;
  locale: Locale;
};

Component.PreviewProps = {
  url: 'http://localhost:4000/api/auth/magic-link/verify?token=abc123def456',
  locale: 'en'
} satisfies MagicLinkTemplateInput;

export default Component;

export const createMagicLinkEmail = async (input: MagicLinkTemplateInput) => ({
  html: await render(<Component {...input} />),
  text: await render(<Component {...input} />, { plainText: true })
});
