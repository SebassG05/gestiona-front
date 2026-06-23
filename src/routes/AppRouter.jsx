import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/components/LoginPage.jsx';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div className="p-8 text-gray-800 text-xl font-medium">Dashboard (próximamente)</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
