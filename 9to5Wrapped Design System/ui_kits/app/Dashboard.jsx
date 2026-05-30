/* Dashboard — the "Task report studio" (src/pages/DashboardPage.jsx) */
const REPORT_COLUMNS = [
  { key: 'title', label: 'Title' }, { key: 'task', label: 'Task' },
  { key: 'time', label: 'Time Worked' }, { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' }, { key: 'category', label: 'Category' },
  { key: 'impact', label: 'Outcome' }, { key: 'blocker', label: 'Blocker' },
  { key: 'nextStep', label: 'Next Step' }
];
const ALL_KEYS = REPORT_COLUMNS.map(c => c.key);

const EMPTY_ENTRY = {
  title: '', time: '', task: '', status: 'Not started', priority: '', category: '',
  impact: '', blocker: '', nextStep: '', subtasks: [], dueDate: ''
};

function csvCell(v) { return `"${String(v || '').replace(/"/g, '""')}"`; }
function buildCsv(entries, keys) {
  const header = keys.map(k => REPORT_COLUMNS.find(c => c.key === k)?.label || k).map(csvCell).join(',');
  const rows = entries.map(e => keys.map(k => csvCell(e[k])).join(','));
  return [header, ...rows].join('\n');
}

function Dashboard({ user }) {
  const [entries, setEntries] = React.useState(user.seedEntries || [{ ...EMPTY_ENTRY }]);
  const [reportDate, setReportDate] = React.useState(user.seedDate || '');
  const [keys, setKeys] = React.useState(ALL_KEYS);
  const [report, setReport] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');
  const [reports, setReports] = React.useState(user.seedReports || []);
  const [selectedId, setSelectedId] = React.useState('');
  const [preview, setPreview] = React.useState(null);

  const filled = entries.filter(e => (e.title || e.task).trim()).length;
  const done = entries.filter(e => e.status === 'Done' && (e.title || e.task).trim()).length;
  const blocked = entries.filter(e => ['Blocked','Waiting'].includes(e.status) && (e.title || e.task).trim()).length;
  const subCount = entries.reduce((n, e) => n + e.subtasks.filter(s => s.title).length, 0);
  const score = filled ? Math.round((done / filled) * 100) : 0;

  function changeEntry(i, next) { setEntries(entries.map((e, x) => x === i ? next : e)); }
  function removeEntry(i) { setEntries(entries.filter((_, x) => x !== i)); }
  function addEntry() { setEntries([...entries, { ...EMPTY_ENTRY }]); }

  function cleanEntries() {
    return entries.map(e => ({
      title: e.title.trim(), time: e.time.trim() || 'Not logged', task: e.task.trim() || e.title.trim(),
      status: e.status, priority: e.priority || 'Medium', category: e.category || 'Execution',
      impact: e.impact.trim(), blocker: e.blocker.trim(), nextStep: e.nextStep.trim(), subtasks: e.subtasks
    })).filter(e => e.title || e.task);
  }

  function toggleColumn(k) {
    setKeys(cur => cur.includes(k) ? (cur.length === 1 ? cur : cur.filter(x => x !== k)) : [...cur, k]);
    setReport('');
  }

  function rolePlan() {
    const resp = [user.keyResponsibility, ...(user.overallTasks || [])].filter(Boolean).slice(0, 4);
    setEntries((resp.length ? resp : ['Daily execution']).map((r, i) => ({
      ...EMPTY_ENTRY, title: r, task: r, priority: i === 0 ? 'High' : 'Medium',
      category: i === 0 ? 'Execution' : 'Follow-up', dueDate: reportDate
    })));
    setReport(''); setSelectedId(''); setError('');
  }

  function carryOver() {
    const rows = entries.filter(e => (e.title || e.task).trim() && !['Done','Skipped'].includes(e.status))
      .map(e => ({ ...e, time: '', status: 'Carried over', nextStep: e.nextStep || 'Continue this item tomorrow' }));
    if (!rows.length) { setError('No unfinished task is available to carry forward.'); return; }
    setEntries(rows); setReport(''); setSelectedId(''); setError('');
  }

  function newReport() { setEntries([{ ...EMPTY_ENTRY }]); setReportDate(''); setReport(''); setSelectedId(''); setError(''); }

  function generate() {
    if (!filled) return;
    setBusy(true); setError('');
    setTimeout(() => {
      const clean = cleanEntries();
      const csv = buildCsv(clean, keys);
      const id = 'r' + Date.now();
      const rec = { _id: id, reportDate: reportDate || new Date().toISOString().slice(0,10), entries: clean, generatedReport: csv, columns: keys };
      setReport(csv); setSelectedId(id);
      setReports([rec, ...reports]);
      setBusy(false);
    }, 900);
  }

  function copyReport() {
    navigator.clipboard?.writeText(report);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="dashboard">
      <section className="workspace glow-card">
        <div className="dashboard-hero">
          <div className="section-heading">
            <span>{user.seniority} {user.role}</span>
            <h1>Task report studio</h1>
          </div>
          <div className="score-ring" style={{ '--score': `${score}%` }}>
            <strong>{score}%</strong><span>done</span>
          </div>
        </div>

        <div className="profile-context">
          <div><span>Focus question</span><strong>{user.professionalQuestion || 'What progress mattered most today?'}</strong></div>
          <div><span>Key responsibility</span><strong>{user.keyResponsibility || 'Daily execution'}</strong></div>
        </div>

        <div className="automation-strip">
          <button className="secondary-button" onClick={rolePlan} disabled={busy}><Icon name="wand-sparkles" size={17} /> Role plan</button>
          <button className="secondary-button" onClick={carryOver} disabled={busy}><Icon name="rotate-ccw" size={17} /> Carry over</button>
          <button className="ghost-button" onClick={newReport} disabled={busy}><Icon name="file-plus-2" size={17} /> New</button>
        </div>

        <div className="report-meta">
          <label>Report date<input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} /></label>
          <div className="metric glow-card"><Icon name="list-checks" size={18} /><strong>{filled}</strong><span>tasks</span></div>
          <div className="metric glow-card"><Icon name="sparkles" size={18} /><strong>{done}</strong><span>finished</span></div>
          <div className="metric glow-card"><Icon name="alarm-clock" size={18} /><strong>{blocked}</strong><span>blocked</span></div>
          <div className="metric glow-card"><Icon name="list-tree" size={18} /><strong>{subCount}</strong><span>subtasks</span></div>
        </div>

        <div className="todo-board">
          {entries.map((e, i) => <TaskCard key={i} entry={e} index={i} onChange={changeEntry} onRemove={removeEntry} />)}
        </div>

        <section className="column-picker glow-card" aria-label="Excel columns">
          <div className="column-picker-heading">
            <div><strong>Excel columns</strong><span>{keys.length} selected</span></div>
            <button className="ghost-button" onClick={() => { setKeys(ALL_KEYS); setReport(''); }}><Icon name="columns-3" size={17} /> All columns</button>
          </div>
          <div className="column-chip-grid">
            {REPORT_COLUMNS.map(c => (
              <label className={`column-chip ${keys.includes(c.key) ? 'active' : ''}`} key={c.key}>
                <input type="checkbox" checked={keys.includes(c.key)} onChange={() => toggleColumn(c.key)} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="button-row">
          <button className="secondary-button" onClick={addEntry}><Icon name="plus" size={17} /> Add task</button>
          <button className="secondary-button" disabled={busy || !selectedId || !filled}><Icon name="save" size={17} /> Save</button>
          <button className="secondary-button" disabled={busy || !filled} onClick={() => setReport(buildCsv(cleanEntries(), keys))}><Icon name="file-down" size={17} /> Raw CSV</button>
          <button className="primary-button" onClick={generate} disabled={busy || !filled}>
            <Icon name="sparkles" size={17} /> {busy ? 'Working…' : 'Generate AI report'}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </section>

      <aside className="result-panel glow-card">
        <div className="result-heading">
          <div><span>Spreadsheet export</span><h2>Daily report</h2></div>
          <div className="result-actions">
            <button className="icon-button" onClick={copyReport} disabled={!report} aria-label="Copy report">
              <Icon name={copied ? 'check' : 'copy'} size={17} />
            </button>
            <button className="icon-button" disabled={!report} aria-label="Download"><Icon name="download" size={17} /></button>
          </div>
        </div>
        <pre className="report-output">{report || buildCsv([], keys)}</pre>

        <div className="history-list">
          <h3>Saved reports</h3>
          {reports.slice(0, 6).map(r => (
            <div className={`history-item ${selectedId === r._id ? 'active' : ''}`} key={r._id}>
              <button className="history-open" onClick={() => setPreview(r)}>
                <strong>{r.reportDate}</strong><span>{r.entries.length} tasks</span>
              </button>
              <button className="icon-button danger" onClick={() => setReports(reports.filter(x => x._id !== r._id))} aria-label="Delete">
                <Icon name="trash-2" size={17} />
              </button>
            </div>
          ))}
          {!reports.length && <p className="t-meta" style={{ margin: 0 }}>Generate a report to see it saved here.</p>}
        </div>
      </aside>

      {preview && (
        <div className="modal-backdrop" onMouseDown={() => setPreview(null)}>
          <section className="report-modal glow-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="result-heading">
              <div><span>{preview.reportDate}</span><h2>Saved report details</h2></div>
              <button className="icon-button" onClick={() => setPreview(null)} aria-label="Close"><Icon name="x" size={17} /></button>
            </div>
            <div className="modal-summary">
              <div className="metric glow-card"><Icon name="list-checks" size={18} /><strong>{preview.entries.length}</strong><span>tasks</span></div>
              <div className="metric glow-card"><Icon name="sparkles" size={18} /><strong>{preview.entries.filter(e => e.status === 'Done').length}</strong><span>done</span></div>
            </div>
            <div className="modal-task-list">
              {preview.entries.slice(0, 3).map((e, i) => (
                <article className="modal-task" key={i}><strong>{e.task}</strong><span>{e.time || 'Not logged'} · {e.status}</span></article>
              ))}
            </div>
            <div className="button-row">
              <button className="ghost-button" onClick={() => setPreview(null)}>Close</button>
              <button className="primary-button" onClick={() => { setEntries(preview.entries.map(e => ({ ...EMPTY_ENTRY, ...e }))); setReport(preview.generatedReport); setSelectedId(preview._id); setReportDate(preview.reportDate); setKeys(preview.columns); setPreview(null); }}>
                <Icon name="eye" size={17} /> View full report
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
window.Dashboard = Dashboard;
window.__EMPTY = EMPTY_ENTRY;
window.__ALLKEYS = ALL_KEYS;
