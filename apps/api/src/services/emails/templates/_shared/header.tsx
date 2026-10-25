import { Button, Heading, Section, Text } from '@react-email/components';
import type { ComponentProps } from 'react';

type EmailHeaderProps = ComponentProps<typeof Section>;

export const EmailHeader = ({ ...props }: EmailHeaderProps) => {
  return <Section {...props} />;
};

type EmailHeaderTitleProps = ComponentProps<typeof Heading>;

export const EmailHeaderTitle = ({ className = '', ...props }: EmailHeaderTitleProps) => {
  return <Heading {...props} className={'!mb-0 text-[24px] font-normal text-black ' + className} />;
};

type EmailHeaderSubtitleProps = ComponentProps<typeof Text>;

export const EmailHeaderSubtitle = ({ className = '', ...props }: EmailHeaderSubtitleProps) => {
  return <Text {...props} className={'text-[14px] leading-[24px] text-black ' + className} />;
};

type EmailHeaderButtonProps = ComponentProps<typeof Button>;

export const EmailHeaderButton = ({ className = '', ...props }: EmailHeaderButtonProps) => {
  return (
    <Button
      {...props}
      className={
        'bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline ' +
        className
      }
    />
  );
};
