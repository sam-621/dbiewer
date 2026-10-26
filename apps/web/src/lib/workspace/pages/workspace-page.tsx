import { useGetMe } from '@/lib/account/hooks/use-get-me';
import { Brand } from '@/shared/components/brand';

export const WorkspacePage = () => {
  const { me } = useGetMe();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <Brand />
      {me?.workspace && <h1 className="text-xl font-semibold">{me.workspace.name}</h1>}
    </main>
  );
};
