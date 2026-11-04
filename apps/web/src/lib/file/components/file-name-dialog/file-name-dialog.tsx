import type { ComponentProps } from 'react';

import { Dialog, DialogHeader, DialogPopup, DialogTitle } from '@/shared/components/ui/dialog';

import { FileNameForm } from '../file-name-form/file-name-form';

type Props = ComponentProps<typeof FileNameForm> & {
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export const FileNameDialog = ({ title, isOpen, onOpenChange, ...formProps }: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogPopup>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <FileNameForm {...formProps} />
    </DialogPopup>
  </Dialog>
);
