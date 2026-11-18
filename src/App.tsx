import { HashRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useMe } from './lib/store';
import { Icon } from './components/Icon';
import { ToastHost } from './components/ui';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { ArenaScreen } from './screens/ArenaScreen';
import { CareerScreen } from './screens/CareerScreen';
import { TrainingSetupScreen } from './screens/TrainingSetupScreen';
import { MatchmakingScreen } from './screens/MatchmakingScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultScreen } from './screens/ResultScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DuelScreen } from './screens/DuelScreen';
import { ShopScreen } from './screens/ShopScreen';
import { PlansScreen } from './screens/PlansScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { TeamBattleScreen } from './screens/TeamBattleScreen';
import { TeamResultScreen } from './screens/TeamResultScreen';
import { TeamLinkScreen } from './screens/TeamLinkScreen';
import { MonsterGallery } from './screens/MonsterGallery';
import { OnlineLobbyScreen } from './screens/OnlineLobbyScreen';
import { OnlineBattleScreen } from './screens/OnlineBattleScreen';

const NAV = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/map', label: 'Pfad', icon: 'map' },
  { to: '/arena', label: 'Arena', icon: 'bolt' },
  { to: '/career', label: 'Karriere', icon: 'user' },
];
const FULLSCREEN = ['/battle', '/matchmaking', '/result', '/training', '/settings', '/workout', '/shop', '/plans', '/friends', '/teambattle', '/teamresult', '/team', '/online', '/onlinebattle'];

function Shell() {
  const me = useMe();
  const loc = useLocation();
  const nav = useNavigate();
  if (!me) {
    // Duell-Links merken, bis eingeloggt
    if (loc.pathname === '/duel' || loc.pathname === '/team' || loc.pathname === '/online') sessionStorage.setItem('pendingDuel', loc.pathname + loc.search);
    return <AuthScreen />;
  }
  if (me.onboarded === false) return <OnboardingScreen />;
  const pending = sessionStorage.getItem('pendingDuel');
  if (pending && loc.pathname !== '/duel' && loc.pathname !== '/team' && loc.pathname !== '/online') {
    sessionStorage.removeItem('pendingDuel');
    // ältere Einträge enthielten nur den Suchteil
    return <Navigate to={pending.startsWith('/') ? pending : `/duel${pending}`} replace />;
  }
  const full = FULLSCREEN.includes(loc.pathname);
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/arena" element={<ArenaScreen />} />
        <Route path="/career" element={<CareerScreen />} />
        <Route path="/training" element={<TrainingSetupScreen />} />
        <Route path="/matchmaking" element={<MatchmakingScreen />} />
        <Route path="/battle" element={<BattleScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/duel" element={<DuelScreen />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/friends" element={<FriendsScreen />} />
        <Route path="/teambattle" element={<TeamBattleScreen />} />
        <Route path="/teamresult" element={<TeamResultScreen />} />
        <Route path="/team" element={<TeamLinkScreen />} />
        <Route path="/monsters" element={<MonsterGallery />} />
        <Route path="/online" element={<OnlineLobbyScreen />} />
        <Route path="/onlinebattle" element={<OnlineBattleScreen />} />
        <Route path="/plans" element={<PlansScreen />} />
        <Route path="/workout" element={<WorkoutScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!full && (
        <>
          <nav className="bottom-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon name={n.icon} size={26} />
                <span>{n.label.toUpperCase()}</span>
              </NavLink>
            ))}
          </nav>
          <button className="fab" onClick={() => nav('/settings')} aria-label="Einstellungen">
            <Icon name="gear" size={30} />
          </button>
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
      <ToastHost />
    </HashRouter>
  );
}
