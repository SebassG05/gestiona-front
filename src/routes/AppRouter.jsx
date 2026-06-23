import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/components/LoginPage.jsx';
import CreatePortalPage from '../features/dashboard/components/CreatePortalPage.jsx';
import DashboardPage from '../features/dashboard/components/DashboardPage.jsx';
import MyPortalsPage from '../features/dashboard/components/MyPortalsPage.jsx';
import PortalWorkspacePage from '../features/dashboard/components/PortalWorkspacePage.jsx';
import CookieBanner from '../features/legal/components/CookieBanner.jsx';
import LegalPage from '../features/legal/components/LegalPage.jsx';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/create" element={<CreatePortalPage />} />
        <Route path="/dashboard/portals" element={<MyPortalsPage />} />
        <Route path="/dashboard/portal/:portalId" element={<PortalWorkspacePage />} />
        <Route path="/aviso-legal" element={<LegalPage />} />
        <Route path="/politica-privacidad" element={<LegalPage />} />
        <Route path="/politica-cookies" element={<LegalPage />} />
      </Routes>
      <CookieBanner />
    </BrowserRouter>
  );
};

export default AppRouter;
