import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { MainShellLayout } from './layouts/MainShellLayout';
import { HomeHub } from './pages/HomeHub';
import { RaceCalendarPage } from './pages/RaceCalendarPage';
import { AstonMartinBrandPage } from './pages/AstonMartinBrandPage';
import { FerrariBrandPage } from './pages/FerrariBrandPage';
import { CadillacBrandPage } from './pages/CadillacBrandPage';
import { CadillacCarsShowcasePage } from './pages/CadillacCarsShowcasePage';
import { AlpineBrandPage } from './pages/AlpineBrandPage';
import { RacingBullsBrandPage } from './pages/RacingBullsBrandPage';
import { AudiBrandPage } from './pages/AudiBrandPage';
import { AudiCarsShowcasePage } from './pages/AudiCarsShowcasePage';
import { AudiDriverPage } from './pages/AudiDriverPage';
import { MercedesBrandPage } from './pages/MercedesBrandPage';
import { MercedesCarsShowcasePage } from './pages/MercedesCarsShowcasePage';
import { MercedesDriverPage } from './pages/MercedesDriverPage';
import { HaasBrandPage } from './pages/HaasBrandPage';
import { WilliamsBrandPage } from './pages/WilliamsBrandPage';
import { McLarenBrandPage } from './pages/McLarenBrandPage';
import { RedBullBrandPage } from './pages/RedBullBrandPage';
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
        <Route path="/cars/cadillac/showcase" element={<CadillacCarsShowcasePage />} />
        <Route path="/cars/cadillac" element={<CadillacBrandPage />} />
        <Route path="/cars/alpine" element={<AlpineBrandPage />} />
        <Route path="/cars/racing-bulls" element={<RacingBullsBrandPage />} />
        <Route path="/cars/audi/showcase" element={<AudiCarsShowcasePage />} />
        <Route path="/cars/audi/drivers/:driverSlug" element={<AudiDriverPage />} />
        <Route path="/cars/audi" element={<AudiBrandPage />} />
        <Route path="/cars/mercedes/showcase" element={<MercedesCarsShowcasePage />} />
        <Route path="/cars/mercedes" element={<MercedesBrandPage />} />
        <Route path="/cars/mercedes/drivers/:driverSlug" element={<MercedesDriverPage />} />
        <Route path="/cars/haas" element={<HaasBrandPage />} />
        <Route path="/cars/williams" element={<WilliamsBrandPage />} />
        <Route path="/cars/mclaren" element={<McLarenBrandPage />} />
        <Route path="/cars/red-bull" element={<RedBullBrandPage />} />
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
