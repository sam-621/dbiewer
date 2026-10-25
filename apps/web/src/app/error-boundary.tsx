import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import { Logger } from '@/shared/utils/logger';

const ErrorFallback = () => {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t('Something went wrong')}</h1>
      <Button onClick={() => window.location.reload()}>{t('Reload')}</Button>
    </main>
  );
};

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    Logger.error(error, info.componentStack);
  }

  override render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
