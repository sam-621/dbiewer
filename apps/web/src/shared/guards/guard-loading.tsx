import { Spinner } from '@/shared/components/ui/spinner';

export const GuardLoading = () => (
  <main className="flex min-h-svh items-center justify-center">
    <Spinner className="size-6 text-muted-foreground" />
  </main>
);
