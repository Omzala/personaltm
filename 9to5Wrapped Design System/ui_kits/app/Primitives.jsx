/* Shared primitives for the 9to5Wrapped UI kit.
   Exposes Icon + small helpers on window for the Babel-transpiled scripts. */

function Icon({ name, size = 17, className, style, color }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host || !window.lucide) return;
    host.innerHTML = `<i data-lucide="${name}"></i>`;
    window.lucide.createIcons();
    const svg = host.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      if (color) svg.style.color = color;
    }
  });
  return <span ref={ref} className={className} style={{ display: 'inline-flex', alignItems: 'center', ...style }} />;
}

/* Theme toggle button used on every surface */
function ThemeToggle({ theme, onToggle, fixed }) {
  const style = fixed ? { position: 'fixed', top: 18, right: 18, zIndex: 99 } : undefined;
  return (
    <button className="icon-button theme-toggle" onClick={onToggle} style={style}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
    </button>
  );
}

Object.assign(window, { Icon, ThemeToggle });
