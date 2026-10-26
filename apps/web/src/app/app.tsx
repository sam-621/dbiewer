import { Route, Routes } from 'react-router';

import { LoginPage } from '@/lib/account/pages/login-page';
import { WorkspacePage } from '@/lib/workspace/pages/workspace-page';
import { NotFound } from '@/shared/components/not-found';
import { Protect } from '@/shared/guards/protect';
import { Public } from '@/shared/guards/public';

export const App = () => (
  <Routes>
    <Route element={<Public />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>
    <Route element={<Protect />}>
      <Route path="/" element={<WorkspacePage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);
