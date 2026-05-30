/* OnboardingScreen — profile setup (src/pages/OnboardingPage.jsx) */
function OnboardingScreen({ theme, onToggleTheme, initial, onSave, onSignout }) {
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => { setBusy(false); onSave(form); }, 600);
  }

  return (
    <main className="onboarding-page">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} fixed />
      <section className="onboarding-panel glow-card">
        <div className="section-heading" style={{ marginBottom: 22 }}>
          <span>Profile setup</span>
          <h1>Tell the AI how your work should be understood</h1>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <ProfileFields form={form} set={set} />
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={onSignout}>Sign out</button>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
              <Icon name="check" size={17} />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
window.OnboardingScreen = OnboardingScreen;
