/* Topbar — app shell header (src/App.jsx) */
function Topbar({ user, theme, onToggleTheme, onSignout }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon"><Icon name="file-text" size={18} /></div>
        <div>
          <strong>9to5Wrapped</strong>
          <span>{user.seniority} {user.role}</span>
        </div>
      </div>
      <div className="topbar-right">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button className="ghost-button" onClick={onSignout}>Sign out</button>
      </div>
    </header>
  );
}
window.Topbar = Topbar;
