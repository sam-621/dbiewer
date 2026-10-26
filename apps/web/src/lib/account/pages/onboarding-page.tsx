import { Brand } from '@/shared/components/brand';

import { OnboardingForm } from '../components/onboarding/onboarding-form';

export const OnboardingPage = () => (
  <main className="flex min-h-svh items-center justify-center p-6">
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Brand />
      <OnboardingForm />
    </div>
  </main>
);
