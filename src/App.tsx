import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GlobePage from './pages/GlobePage';
import CityDashboardPage from './pages/CityDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-screen overflow-hidden font-sans">
        <Routes>
          <Route path="/" element={<GlobePage />} />
          <Route path="/city/:id" element={<CityDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
