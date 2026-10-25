import { Hr, Text } from '@react-email/components';
import type { ReactNode } from 'react';

export const EmailFooter = ({ children }: Props) => {
  return (
    <>
      <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
      <Text className="mb-4 text-center text-xs leading-[24px] text-[#6a737d]">{children}</Text>
    </>
  );
};

type Props = {
  children: ReactNode;
};
