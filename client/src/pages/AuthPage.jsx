import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft, ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Hyperspeed from '../components/Hyperspeed.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { getHyperspeedOptions } from '../components/hyperspeedOptions.js';
import { ProfileFields, initialProfile } from './ProfileFields.jsx';

const initialSignup = {
  name: '',
  email: '',
  password: '',
  ...initialProfile
};

export function AuthPage({ mode, setMode, theme, toggleTheme, onBack }) {
  const { signin, signup, signinWithGoogle } = useAuth();
  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (isSignup) {
        await signup(signupForm);
      } else {
        await signin(signinForm);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSuccess(response) {
    setError('');
    try {
      await signinWithGoogle(response.credential);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-hyperspeed">
        <Hyperspeed effectOptions={getHyperspeedOptions(theme)} />
      </div>
      {toggleTheme && (
        <ThemeToggle theme={theme} onToggle={toggleTheme} className="theme-switch-floating" />
      )}

      <section className="auth-copy">
        {onBack && (
          <button className="ghost-button auth-back" onClick={onBack} type="button">
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <div className="brand-icon" style={{ width: 52, height: 52, borderRadius: 14 }}>
          <BriefcaseBusiness size={24} />
        </div>
        <h1>9to5Wrapped reports in minutes</h1>
        <p>
          Enter simple time and task rows, then generate a polished report matched to your role,
          seniority, tools, and manager expectations.
        </p>
        <div className="tag-row">
          <span className="tag">AI-powered</span>
          <span className="tag">Role-aware</span>
          <span className="tag">Export to CSV</span>
          <span className="tag">5 min setup</span>
        </div>
      </section>

      <section className="auth-panel glow-card">
        <div className="segmented">
          <button className={!isSignup ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
          <button className={isSignup ? 'active' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {isSignup ? (
            <>
              <label>
                Name
                <input value={signupForm.name} onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })} placeholder="Your full name" required />
              </label>
              <label>
                Email
                <input type="email" value={signupForm.email} onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })} placeholder="you@company.com" required />
              </label>
              <label>
                Password
                <input type="password" minLength="8" value={signupForm.password} onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })} placeholder="Min 8 characters" required />
              </label>
              <ProfileFields form={signupForm} setForm={setSignupForm} />
            </>
          ) : (
            <>
              <label>
                Email
                <input type="email" value={signinForm.email} onChange={(event) => setSigninForm({ ...signinForm, email: event.target.value })} placeholder="you@company.com" required />
              </label>
              <label>
                Password
                <input type="password" value={signinForm.password} onChange={(event) => setSigninForm({ ...signinForm, password: event.target.value })} placeholder="Your password" required />
              </label>
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="primary-button" disabled={busy}>
            {busy ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="divider"><span>or</span></div>
        {googleConfigured ? (
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in failed')} />
        ) : (
          <p className="config-note">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
        )}
      </section>
    </main>
  );
}
