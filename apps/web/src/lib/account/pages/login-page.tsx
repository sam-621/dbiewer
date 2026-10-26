import { Brand } from '@/shared/components/brand';

import { LoginForm } from '../components/login/login-form';

export const LoginPage = () => (
  <main className="flex min-h-svh items-center justify-center p-6">
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Brand />
      <LoginForm />
    </div>
  </main>
);
