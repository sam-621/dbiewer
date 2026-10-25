import { Route, Routes } from 'react-router';

import { HomePage } from '@/lib/system/pages/home-page';
import { NotFound } from '@/shared/components/not-found';

export const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
