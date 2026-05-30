import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { ProfileFields, initialProfile } from './ProfileFields.jsx';

function profileToForm(user) {
  return {
    ...initialProfile,
    role: user.role || '',
    department: user.department || '',
    seniority: user.seniority || '',
    overallTasks: Array.isArray(user.overallTasks) && user.overallTasks.length
      ? user.overallTasks.join('\n')
      : '',
    professionalQuestion: user.professionalQuestion || '',
    keyResponsibility: user.keyResponsibility || '',
    tools: Array.isArray(user.tools) && user.tools.length ? user.tools.join(', ') : '',
    managerExpectations: user.managerExpectations || '',
    reportTone: user.reportTone || ''
  };
}

export function OnboardingPage({ theme, toggleTheme }) {
  const { user, updateProfile, signout } = useAuth();
  const [form, setForm] = useState(profileToForm(user));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await updateProfile(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="onboarding-page">
      {toggleTheme && (
        <ThemeToggle theme={theme} onToggle={toggleTheme} className="theme-switch-floating" />
      )}

      <section className="onboarding-panel glow-card">
        <div className="section-heading" style={{ marginBottom: 22 }}>
          <span>Profile setup</span>
          <h1>Tell the AI how your work should be understood</h1>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <ProfileFields form={form} setForm={setForm} />
          {error && <p className="error-text">{error}</p>}
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={signout}>Sign out</button>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving...' : 'Save profile'}
              <Check size={17} />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
