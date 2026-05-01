import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GlobePage from './pages/GlobePage';
import CityDashboardPage from './pages/CityDashboardPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-screen overflow-hidden font-sans">
        <Routes>
          <Route path="/" element={<GlobePage />} />
          <Route path="/city/:id" element={<CityDashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
