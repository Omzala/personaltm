/* Root app — screen state machine + theme (src/App.jsx) */
const DEMO_USER = {
  name: 'Ava Chen', role: 'Product Engineer', department: 'Platform', seniority: 'Senior',
  professionalQuestion: 'What progress moved the v2 launch forward?',
  keyResponsibility: 'Own the reporting pipeline end to end',
  overallTasks: ['Ship the auth rebuild', 'Reduce report generation latency', 'Mentor two juniors'],
  tools: 'React, Node, Postgres, Figma', managerExpectations: 'Crisp, outcome-first updates', reportTone: 'Impact-focused',
  seedDate: '2026-05-30',
  seedEntries: [
    { ...window.__EMPTY, title: 'Ship the new auth flow', time: '3 hr',
      task: 'Wire Google OAuth + email fallback and QA the carryover edge cases before release.',
      status: 'Done', priority: 'High', category: 'Execution', impact: 'Unblocked the v2 release',
      blocker: '', nextStep: 'Announce in #launch', dueDate: '2026-05-30',
      subtasks: [{ title: 'OAuth handshake', done: true }, { title: 'Email fallback', done: true }, { title: 'QA carryover', done: false }] },
    { ...window.__EMPTY, title: 'Fix carryover bug', time: '45 min',
      task: 'Reports were duplicating carried-over tasks across days.', status: 'In progress',
      priority: 'Urgent', category: 'Bug fix', impact: 'Found the root cause in the dedupe key',
      blocker: 'Waiting on staging data refresh', nextStep: 'Patch + add a regression test', dueDate: '2026-05-31', subtasks: [] },
    { ...window.__EMPTY, title: 'Sprint planning', time: '1 hr',
      task: 'Scoped the next two weeks with the team.', status: 'Done', priority: 'Medium',
      category: 'Planning', impact: 'Locked the v2.1 scope', blocker: '', nextStep: '', dueDate: '2026-05-30', subtasks: [] }
  ],
  seedReports: [
    { _id: 'r-prev1', reportDate: '2026-05-29', entries: [
      { ...window.__EMPTY, task: 'Latency profiling', time: '2 hr', status: 'Done' },
      { ...window.__EMPTY, task: 'Design review', time: '30 min', status: 'Done' } ],
      generatedReport: '"Title","Status"\n"Latency profiling","Done"', columns: window.__ALLKEYS || ['title','status'] },
    { _id: 'r-prev2', reportDate: '2026-05-28', entries: [
      { ...window.__EMPTY, task: 'Onboarding docs', time: '1 hr', status: 'In progress' } ],
      generatedReport: '"Title","Status"\n"Onboarding docs","In progress"', columns: window.__ALLKEYS || ['title','status'] }
  ]
};

const EMPTY_PROFILE = {
  role: '', department: '', seniority: '', professionalQuestion: '',
  keyResponsibility: '', tools: '', managerExpectations: '', reportTone: ''
};

function AutoPilotApp() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('ptm-theme') || 'light');
  const [screen, setScreen] = React.useState('auth');
  const [user, setUser] = React.useState(DEMO_USER);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ptm-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  function onAuthed(result) {
    if (result.kind === 'signup') {
      setUser({ ...DEMO_USER, ...result.profile });
      setScreen('onboarding');
    } else {
      setUser(DEMO_USER);
      setScreen('dashboard');
    }
  }

  if (screen === 'auth') return <AuthScreen theme={theme} onToggleTheme={toggleTheme} onAuthed={onAuthed} />;
  if (screen === 'onboarding') return (
    <OnboardingScreen theme={theme} onToggleTheme={toggleTheme}
      initial={{ ...EMPTY_PROFILE, role: user.role, department: user.department, seniority: user.seniority,
        professionalQuestion: user.professionalQuestion, keyResponsibility: user.keyResponsibility,
        tools: user.tools, managerExpectations: user.managerExpectations, reportTone: user.reportTone }}
      onSave={(form) => { setUser({ ...DEMO_USER, ...form }); setScreen('dashboard'); }}
      onSignout={() => setScreen('auth')} />
  );
  return (
    <div className="app-shell surface-grid">
      <Topbar user={user} theme={theme} onToggleTheme={toggleTheme} onSignout={() => setScreen('auth')} />
      <Dashboard user={user} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AutoPilotApp />);
