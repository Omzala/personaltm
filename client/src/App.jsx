import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { ThemeToggle } from './components/ThemeToggle.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
// import GridScan from './components/GridScan.jsx';

// function GridScanBackground({ theme }) {
//   const dark = theme === 'dark';
//   return (
//     <div className="gridscan-bg" aria-hidden="true">
//       <GridScan
//         sensitivity={0.55}
//         lineThickness={1}
//         linesColor={dark ? '#524b6b' : '#a59fc0'}
//         gridScale={0.1}
//         scanColor={dark ? '#FF9FFC' : '#ff4d6d'}
//         scanOpacity={dark ? 0.45 : 0.4}
//         enablePost
//         bloomIntensity={dark ? 0.6 : 0.4}
//         chromaticAberration={0.002}
//         noiseIntensity={0.01}
//         lineJitter={0.1}
//         scanGlow={0.5}
//         scanSoftness={2}
//         enableWebcam={false}
//         showPreview={false}
//       />
//     </div>
//   );
// }

function hasReportContext(user) {
  return Boolean(
    user?.isOnboarded &&
    user?.role &&
    user?.professionalQuestion &&
    user?.keyResponsibility
  );
}

export default function App() {
  const { user, loading, signout } = useAuth();
  const [authMode, setAuthMode] = useState('signin');
  const [showAuth, setShowAuth] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  }

  if (loading) {
    return <div className="screen-center">Loading...</div>;
  }

  if (!user) {
    if (!showAuth) {
      return (
        <LandingPage
          theme={theme}
          toggleTheme={toggleTheme}
          onStart={(mode) => {
            setAuthMode(mode);
            setShowAuth(true);
          }}
        />
      );
    }

    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  if (!hasReportContext(user)) {
    return <OnboardingPage theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <FileText size={18} />
          </div>
          <div>
            <strong>9to5Wrapped</strong>
            <span>{user.seniority} {user.role}</span>
          </div>
        </div>
        <div className="topbar-right">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="ghost-button" onClick={signout}>Sign out</button>
        </div>
      </header>
      <DashboardPage />
    </div>
  );
}
