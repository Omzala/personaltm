/* AuthScreen — split hero + sign in/up panel (src/pages/AuthPage.jsx) */
const { useState: useStateAuth } = React;

function AuthScreen({ theme, onToggleTheme, onAuthed }) {
  const [mode, setMode] = useStateAuth('signin');
  const [signin, setSignin] = useStateAuth({ email: '', password: '' });
  const [signup, setSignup] = useStateAuth({
    name: '', email: '', password: '',
    role: '', department: '', seniority: '', professionalQuestion: '',
    keyResponsibility: '', tools: '', managerExpectations: '', reportTone: ''
  });
  const [busy, setBusy] = useStateAuth(false);
  const isSignup = mode === 'signup';

  function setSignupField(k, v) { setSignup(s => ({ ...s, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (isSignup) onAuthed({ kind: 'signup', profile: signup });
      else onAuthed({ kind: 'signin' });
    }, 650);
  }

  return (
    <main className="auth-page">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} fixed />

      <section className="auth-copy">
        <div className="brand-icon" style={{ width: 52, height: 52, borderRadius: 14 }}>
          <Icon name="briefcase-business" size={24} />
        </div>
        <h1>Role-aware daily reports in minutes</h1>
        <p>
          Enter simple time and task rows, then generate a polished report matched to your role,
          seniority, tools, and manager expectations.
        </p>
        <div className="tag-row">
          {['AI-powered','Role-aware','Export to CSV','5 min setup'].map(t =>
            <span className="tag" key={t}>{t}</span>)}
        </div>
      </section>

      <section className="auth-panel glow-card">
        <div className="segmented">
          <button className={!isSignup ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
          <button className={isSignup ? 'active' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>

        <form onSubmit={submit} className="form-grid">
          {isSignup ? (
            <>
              <label>Name
                <input value={signup.name} onChange={(e) => setSignupField('name', e.target.value)} placeholder="Your full name" required />
              </label>
              <label>Email
                <input type="email" value={signup.email} onChange={(e) => setSignupField('email', e.target.value)} placeholder="you@company.com" required />
              </label>
              <label>Password
                <input type="password" minLength="8" value={signup.password} onChange={(e) => setSignupField('password', e.target.value)} placeholder="Min 8 characters" required />
              </label>
              <ProfileFields form={signup} set={setSignupField} />
            </>
          ) : (
            <>
              <label>Email
                <input type="email" value={signin.email} onChange={(e) => setSignin({ ...signin, email: e.target.value })} placeholder="you@company.com" required />
              </label>
              <label>Password
                <input type="password" value={signin.password} onChange={(e) => setSignin({ ...signin, password: e.target.value })} placeholder="Your password" required />
              </label>
            </>
          )}

          <button className="primary-button" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            <Icon name="arrow-right" size={17} />
          </button>
        </form>

        <div className="divider"><span>or</span></div>
        <button className="ghost-button" style={{ width: '100%' }} onClick={() => onAuthed({ kind: 'signin' })}>
          <Icon name="briefcase-business" size={16} /> Continue with Google
        </button>
      </section>
    </main>
  );
}
window.AuthScreen = AuthScreen;
