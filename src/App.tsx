import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { MainShellLayout } from './layouts/MainShellLayout';
import { HomeHub } from './pages/HomeHub';
import { RaceCalendarPage } from './pages/RaceCalendarPage';
import { AstonMartinBrandPage } from './pages/AstonMartinBrandPage';
import { FerrariBrandPage } from './pages/FerrariBrandPage';
import { GenerationsPage } from './pages/GenerationsPage';
import { TeamCarHistoryPage } from './pages/TeamCarHistoryPage';
import { F1DataApp } from './F1DataApp';

function RedirectGenerationsTeamToCars() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  return <Navigate to={`/cars/team/${teamSlug}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainShellLayout />}>
        <Route path="/" element={<HomeHub />} />
        <Route path="/calendar" element={<RaceCalendarPage />} />
        <Route path="/cars/aston-martin" element={<AstonMartinBrandPage />} />
        <Route path="/cars/ferrari" element={<FerrariBrandPage />} />
        <Route path="/cars" element={<GenerationsPage />} />
        <Route path="/generations" element={<Navigate to="/cars" replace />} />
        <Route path="/data" element={<F1DataApp />} />
      </Route>
      <Route path="/cars/team/:teamSlug" element={<TeamCarHistoryPage />} />
      <Route path="/generations/team/:teamSlug" element={<RedirectGenerationsTeamToCars />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
