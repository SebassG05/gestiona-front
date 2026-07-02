import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from '../features/auth/components/LoginPage.jsx';
import CreateProposalPage from '../features/dashboard/components/CreateProposalPage.jsx';
import CreatePortalPage from '../features/dashboard/components/CreatePortalPage.jsx';
import DashboardPage from '../features/dashboard/components/DashboardPage.jsx';
import JoinPortalPage from '../features/dashboard/components/JoinPortalPage.jsx';
import MyPortalsPage from '../features/dashboard/components/MyPortalsPage.jsx';
import PortalOpportunitiesPage from '../features/dashboard/components/PortalOpportunitiesPage.jsx';
import PortalProjectsPage from '../features/dashboard/components/PortalProjectsPage.jsx';
import PortalSettingsPage from '../features/dashboard/components/PortalSettingsPage.jsx';
import ProposalContactsPage from '../features/dashboard/components/ProposalContactsPage.jsx';
import PortalProposalsPage from '../features/dashboard/components/PortalProposalsPage.jsx';
import PortalWorkspacePage from '../features/dashboard/components/PortalWorkspacePage.jsx';
import CookieBanner from '../features/legal/components/CookieBanner.jsx';
import LegalPage from '../features/legal/components/LegalPage.jsx';

const hasSession = () => Boolean(localStorage.getItem('token'));

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const location = useLocation();
  const inviteCode = new URLSearchParams(location.search).get('invite');

  if (hasSession()) {
    const destination = inviteCode
      ? `/dashboard/join?code=${encodeURIComponent(inviteCode)}`
      : '/dashboard';

    return <Navigate to={destination} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={hasSession() ? '/dashboard' : '/login'} replace />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/create"
          element={
            <ProtectedRoute>
              <CreatePortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/join"
          element={
            <ProtectedRoute>
              <JoinPortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portals"
          element={
            <ProtectedRoute>
              <MyPortalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId"
          element={
            <ProtectedRoute>
              <PortalWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/projects"
          element={
            <ProtectedRoute>
              <PortalProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/proposals"
          element={
            <ProtectedRoute>
              <PortalProposalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/opportunities"
          element={
            <ProtectedRoute>
              <PortalOpportunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/contacts"
          element={
            <ProtectedRoute>
              <PortalOpportunitiesPage libraryType="contacts" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/settings"
          element={
            <ProtectedRoute>
              <PortalSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/proposals/create"
          element={
            <ProtectedRoute>
              <CreateProposalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/proposals/:proposalId/edit"
          element={
            <ProtectedRoute>
              <CreateProposalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/portal/:portalId/proposals/:proposalId/contacts"
          element={
            <ProtectedRoute>
              <ProposalContactsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/aviso-legal" element={<LegalPage />} />
        <Route path="/politica-privacidad" element={<LegalPage />} />
        <Route path="/politica-cookies" element={<LegalPage />} />
      </Routes>
      <CookieBanner />
    </BrowserRouter>
  );
};

export default AppRouter;
