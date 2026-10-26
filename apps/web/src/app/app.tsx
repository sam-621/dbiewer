import { Route, Routes } from 'react-router';

import { LoginPage } from '@/lib/account/pages/login-page';
import { OnboardingPage } from '@/lib/account/pages/onboarding-page';
import { WorkspacePage } from '@/lib/workspace/pages/workspace-page';
import { NotFound } from '@/shared/components/not-found';
import { Onboarding } from '@/shared/guards/onboarding';
import { Protect } from '@/shared/guards/protect';
import { Public } from '@/shared/guards/public';

export const App = () => (
  <Routes>
    <Route element={<Public />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>
    <Route element={<Onboarding />}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </Route>
    <Route element={<Protect />}>
      <Route path="/" element={<WorkspacePage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);
