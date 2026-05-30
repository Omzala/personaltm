import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FolderKanban,
  Inbox,
  MailCheck,
  Plus,
  Repeat,
  Save,
  Upload
} from 'lucide-react';
import { Select } from '../components/Select.jsx';

const templateSeed = [
  {
    id: 'standup',
    name: 'Daily standup',
    entries: [{
      title: 'Daily standup and planning',
      task: 'Shared progress, aligned priorities, and confirmed the next work items.',
      time: '15 min',
      status: 'Done',
      priority: 'Medium',
      category: 'Meeting',
      impact: 'Kept daily execution aligned with team expectations.',
      blocker: '',
      nextStep: '',
      dueDate: '',
      subtasks: []
    }]
  },
  {
    id: 'follow-up',
    name: 'Follow-up task',
    entries: [{
      title: 'Follow up on open item',
      task: 'Reviewed the pending item and prepared the next action.',
      time: '30 min',
      status: 'In progress',
      priority: 'Medium',
      category: 'Follow-up',
      impact: '',
      blocker: '',
      nextStep: 'Continue and close the pending item.',
      dueDate: '',
      subtasks: []
    }]
  }
];

export const featureCards = [
  {
    id: 'summary',
    accent: 'var(--pink)',
    title: 'Weekly summaries',
    description: 'Generate weekly or monthly progress from saved reports.',
    label: 'Reports'
  },
  {
    id: 'projects',
    accent: 'var(--teal)',
    title: 'Project tracking',
    description: 'Group report history by project, client, or goal.',
    label: 'Goals'
  },
  {
    id: 'quality',
    accent: 'var(--purple)',
    title: 'Report quality check',
    description: 'Find vague rows, missing outcomes, and weak blockers.',
    label: 'Review'
  },
  {
    id: 'templates',
    accent: 'var(--yellow)',
    title: 'Recurring templates',
    description: 'Save common task sets and insert them into any day.',
    label: 'Templates'
  },
  {
    id: 'sharing',
    accent: 'var(--lime)',
    title: 'Manager submission',
    description: 'Prepare a tracked report handoff for your manager.',
    label: 'Share'
  },
  {
    id: 'imports',
    accent: 'var(--teal)',
    title: 'Tool imports',
    description: 'Paste calendar, ticket, or commit lines into task rows.',
    label: 'Import'
  }
];

function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function update(nextValue) {
    setValue(nextValue);
    localStorage.setItem(key, JSON.stringify(nextValue));
  }

  return [value, update];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function parseMinutes(value) {
  const text = String(value || '').toLowerCase();
  const hours = Number(text.match(/(\d+)\s*(?:hr|hour|hours|h)/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*(?:min|minute|minutes|m)/)?.[1] || 0);
  return (hours * 60) + minutes;
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours} hr ${rest} min`;
  if (hours) return `${hours} hr`;
  return `${rest} min`;
}

function cleanText(value) {
  return String(value || '').trim();
}

function flattenReports(reports) {
  return reports.flatMap((report) => (
    (report.entries || []).map((entry) => ({
      ...entry,
      reportDate: report.reportDate,
      reportId: report._id
    }))
  ));
}

function buildEntry({ title, task, category = 'Execution', status = 'Planned' }) {
  return {
    title,
    task,
    time: '',
    status,
    priority: 'Medium',
    category,
    impact: '',
    blocker: '',
    nextStep: '',
    dueDate: today(),
    subtasks: []
  };
}

function ModuleShell({ card, onBack, children }) {
  return (
    <section className="feature-module glow-card">
      <div className="feature-module-heading">
        <button className="ghost-button" onClick={onBack} type="button">
          <ArrowLeft size={17} />
          Back to cards
        </button>
        <div>
          <span>{card.label}</span>
          <h2>{card.title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function WeeklySummary({ reports }) {
  const [range, setRange] = useState('week');
  const [copied, setCopied] = useState(false);
  const since = range === 'week' ? daysAgo(7) : daysAgo(30);
  const scopedReports = reports.filter((report) => report.reportDate >= since);
  const rows = flattenReports(scopedReports);
  const done = rows.filter((entry) => entry.status === 'Done').length;
  const blocked = rows.filter((entry) => ['Blocked', 'Waiting'].includes(entry.status)).length;
  const totalMinutes = rows.reduce((sum, entry) => sum + parseMinutes(entry.time), 0);
  const categoryCounts = rows.reduce((counts, entry) => {
    const key = entry.category || 'Uncategorized';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const summary = [
    `${range === 'week' ? 'Weekly' : 'Monthly'} summary`,
    `Reports reviewed: ${scopedReports.length}`,
    `Tasks logged: ${rows.length}`,
    `Completed: ${done}`,
    `Blocked or waiting: ${blocked}`,
    `Time captured: ${formatMinutes(totalMinutes)}`,
    topCategories.length ? `Main work areas: ${topCategories.map(([name, count]) => `${name} (${count})`).join(', ')}` : 'Main work areas: none yet'
  ].join('\n');

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="feature-grid two-pane">
      <div className="feature-panel">
        <div className="segmented compact">
          <button className={range === 'week' ? 'active' : ''} onClick={() => setRange('week')} type="button">Week</button>
          <button className={range === 'month' ? 'active' : ''} onClick={() => setRange('month')} type="button">Month</button>
        </div>
        <div className="feature-metrics">
          <div className="metric glow-card"><CalendarRange size={18} /><strong>{scopedReports.length}</strong><span>reports</span></div>
          <div className="metric glow-card"><ClipboardCheck size={18} /><strong>{rows.length}</strong><span>tasks</span></div>
          <div className="metric glow-card"><CheckCircle2 size={18} /><strong>{done}</strong><span>done</span></div>
          <div className="metric glow-card"><AlertTriangle size={18} /><strong>{blocked}</strong><span>blocked</span></div>
        </div>
      </div>
      <div className="feature-panel">
        <div className="feature-panel-heading">
          <strong>Generated summary</strong>
          <button className="icon-button" onClick={copySummary} aria-label="Copy summary">
            {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
          </button>
        </div>
        <pre className="mini-output">{summary}</pre>
      </div>
    </div>
  );
}

function ProjectTracker({ reports }) {
  const [projects, setProjects] = useLocalState('personaltm-projects', [
    { id: 'core-work', name: 'Core work', keyword: 'execution', goal: 'Keep high-priority work moving daily.' }
  ]);
  const [draft, setDraft] = useState({ name: '', keyword: '', goal: '' });
  const rows = flattenReports(reports);

  function addProject() {
    if (!cleanText(draft.name)) return;
    setProjects([
      ...projects,
      {
        id: `${Date.now()}`,
        name: cleanText(draft.name),
        keyword: cleanText(draft.keyword || draft.name).toLowerCase(),
        goal: cleanText(draft.goal)
      }
    ]);
    setDraft({ name: '', keyword: '', goal: '' });
  }

  function removeProject(id) {
    setProjects(projects.filter((project) => project.id !== id));
  }

  return (
    <div className="feature-grid">
      <div className="feature-panel feature-form">
        <label>Project or goal name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Mobile app launch" /></label>
        <label>Match keyword<input value={draft.keyword} onChange={(event) => setDraft({ ...draft, keyword: event.target.value })} placeholder="launch, mobile, client name" /></label>
        <label>Goal<textarea value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} rows="3" placeholder="What progress should this project show?" /></label>
        <button className="primary-button" onClick={addProject} type="button"><Plus size={17} />Add project</button>
      </div>
      <div className="feature-list">
        {projects.map((project) => {
          const keyword = project.keyword.toLowerCase();
          const matches = rows.filter((entry) => (
            `${entry.title} ${entry.task} ${entry.category}`.toLowerCase().includes(keyword)
          ));
          const done = matches.filter((entry) => entry.status === 'Done').length;
          const progress = matches.length ? Math.round((done / matches.length) * 100) : 0;

          return (
            <article className="feature-item glow-card" key={project.id}>
              <div>
                <span>{project.keyword}</span>
                <strong>{project.name}</strong>
                <p>{project.goal || 'Track matching tasks from saved reports.'}</p>
              </div>
              <div className="feature-progress">
                <strong>{progress}%</strong>
                <span>{matches.length} matching tasks</span>
              </div>
              <button className="ghost-button" onClick={() => removeProject(project.id)} type="button">Remove</button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function QualityCheck({ entries, onReplaceEntries }) {
  const issues = useMemo(() => entries.flatMap((entry, index) => {
    const row = index + 1;
    const task = cleanText(entry.task || entry.title);
    const result = [];

    if (!task || task.length < 12) result.push({ row, level: 'High', text: 'Task is too vague to explain the work clearly.' });
    if (!cleanText(entry.time)) result.push({ row, level: 'Medium', text: 'Time worked is empty.' });
    if (entry.status === 'Done' && !cleanText(entry.impact)) result.push({ row, level: 'High', text: 'Completed task has no outcome or proof of value.' });
    if (['Blocked', 'Waiting'].includes(entry.status) && !cleanText(entry.blocker)) result.push({ row, level: 'High', text: 'Blocked task needs a clear blocker.' });
    if (['Blocked', 'Waiting', 'In progress'].includes(entry.status) && !cleanText(entry.nextStep)) result.push({ row, level: 'Medium', text: 'Open task should name the next step.' });

    return result;
  }), [entries]);

  function applyQuickFixes() {
    onReplaceEntries(entries.map((entry) => ({
      ...entry,
      impact: entry.status === 'Done' && !cleanText(entry.impact)
        ? 'Completed the planned work and moved the responsibility forward.'
        : entry.impact,
      nextStep: ['Blocked', 'Waiting', 'In progress'].includes(entry.status) && !cleanText(entry.nextStep)
        ? 'Confirm the next action and continue the task.'
        : entry.nextStep
    })));
  }

  return (
    <div className="feature-grid two-pane">
      <div className="feature-panel">
        <div className="quality-score">
          <BarChart3 size={28} />
          <strong>{issues.length ? Math.max(0, 100 - issues.length * 12) : 100}%</strong>
          <span>report readiness</span>
        </div>
        <button className="primary-button" onClick={applyQuickFixes} disabled={!issues.length} type="button">
          <Save size={17} />
          Apply quick fixes
        </button>
      </div>
      <div className="feature-list">
        {issues.length ? issues.map((issue, index) => (
          <article className="feature-item compact-item" key={`${issue.row}-${index}`}>
            <span>Row {issue.row} - {issue.level}</span>
            <strong>{issue.text}</strong>
          </article>
        )) : (
          <article className="feature-item compact-item">
            <span>Ready</span>
            <strong>No quality issues found in the current draft.</strong>
          </article>
        )}
      </div>
    </div>
  );
}

function Templates({ entries, onInsertEntries }) {
  const [templates, setTemplates] = useLocalState('personaltm-templates', templateSeed);
  const [name, setName] = useState('');

  function saveCurrent() {
    const cleanEntries = entries.filter((entry) => cleanText(entry.title || entry.task));
    if (!cleanText(name) || !cleanEntries.length) return;
    setTemplates([...templates, { id: `${Date.now()}`, name: cleanText(name), entries: cleanEntries }]);
    setName('');
  }

  function removeTemplate(id) {
    setTemplates(templates.filter((template) => template.id !== id));
  }

  return (
    <div className="feature-grid">
      <div className="feature-panel feature-form">
        <label>Template name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Release day checklist" /></label>
        <button className="primary-button" onClick={saveCurrent} type="button"><Save size={17} />Save current draft</button>
      </div>
      <div className="feature-list">
        {templates.map((template) => (
          <article className="feature-item glow-card" key={template.id}>
            <div>
              <span>{template.entries.length} rows</span>
              <strong>{template.name}</strong>
              <p>{template.entries.map((entry) => entry.title || entry.task).slice(0, 2).join(', ')}</p>
            </div>
            <button className="secondary-button" onClick={() => onInsertEntries(template.entries)} type="button"><Plus size={17} />Insert</button>
            <button className="ghost-button" onClick={() => removeTemplate(template.id)} type="button">Remove</button>
          </article>
        ))}
      </div>
    </div>
  );
}

function ManagerSharing({ generatedReport, entries, reportDate }) {
  const [submissions, setSubmissions] = useLocalState('personaltm-submissions', []);
  const [form, setForm] = useState({ email: '', channel: 'Email', note: '' });
  const taskCount = entries.filter((entry) => cleanText(entry.title || entry.task)).length;
  const body = generatedReport || entries
    .filter((entry) => cleanText(entry.title || entry.task))
    .map((entry) => `- ${entry.title || entry.task}: ${entry.status || 'Planned'}`)
    .join('\n');
  const mailto = `mailto:${encodeURIComponent(form.email)}?subject=${encodeURIComponent(`Daily report - ${reportDate || today()}`)}&body=${encodeURIComponent(`${form.note}\n\n${body}`.trim())}`;

  function submit() {
    if (!cleanText(form.email)) return;
    setSubmissions([
      {
        id: `${Date.now()}`,
        email: form.email,
        channel: form.channel,
        note: form.note,
        reportDate: reportDate || today(),
        taskCount,
        submittedAt: new Date().toISOString()
      },
      ...submissions
    ]);
  }

  return (
    <div className="feature-grid">
      <div className="feature-panel feature-form">
        <label>Manager email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="manager@company.com" /></label>
        <label>Channel<Select ariaLabel="Channel" value={form.channel} options={['Email', 'Slack', 'Teams', 'Manual handoff']} onChange={(value) => setForm({ ...form, channel: value })} /></label>
        <label>Submission note<textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} rows="4" placeholder="Short context for this report" /></label>
        <div className="button-row no-margin">
          <a className="secondary-button link-button" href={form.email ? mailto : undefined}><MailCheck size={17} />Open email</a>
          <button className="primary-button" onClick={submit} type="button"><CheckCircle2 size={17} />Mark submitted</button>
        </div>
      </div>
      <div className="feature-list">
        {submissions.slice(0, 6).map((submission) => (
          <article className="feature-item compact-item" key={submission.id}>
            <span>{submission.reportDate} - {submission.channel}</span>
            <strong>{submission.email}</strong>
            <p>{submission.taskCount} tasks submitted</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ToolImports({ onInsertEntries }) {
  const [source, setSource] = useState('Calendar');
  const [text, setText] = useState('');
  const preview = useMemo(() => text
    .split('\n')
    .map((line) => cleanText(line))
    .filter(Boolean)
    .map((line) => {
      const category = source === 'Calendar' ? 'Meeting' : source === 'GitHub' ? 'Execution' : 'Follow-up';
      const status = /done|closed|merged|completed/i.test(line) ? 'Done' : 'Planned';
      return buildEntry({ title: line.replace(/^[-*\d.:\s]+/, ''), task: line, category, status });
    }), [source, text]);

  return (
    <div className="feature-grid two-pane">
      <div className="feature-panel feature-form">
        <label>Source<Select ariaLabel="Source" value={source} options={['Calendar', 'Jira', 'GitHub', 'Slack']} onChange={(value) => setSource(value)} /></label>
        <label>Paste lines<textarea value={text} onChange={(event) => setText(event.target.value)} rows="9" placeholder="10:00 Standup&#10;JIRA-123 Fix login validation&#10;Merged PR dashboard filters" /></label>
        <button className="primary-button" onClick={() => onInsertEntries(preview)} disabled={!preview.length} type="button"><Upload size={17} />Import rows</button>
      </div>
      <div className="feature-list">
        {preview.map((entry, index) => (
          <article className="feature-item compact-item" key={`${entry.title}-${index}`}>
            <span>{entry.category} - {entry.status}</span>
            <strong>{entry.title}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

export function FeatureModules({
  activeFeature,
  onBack,
  reports,
  entries,
  setEntries,
  generatedReport,
  reportDate,
  onInsertEntries
}) {
  const card = featureCards.find((item) => item.id === activeFeature) || featureCards[0];

  return (
    <ModuleShell card={card} onBack={onBack}>
      {card.id === 'summary' && <WeeklySummary reports={reports} />}
      {card.id === 'projects' && <ProjectTracker reports={reports} />}
      {card.id === 'quality' && <QualityCheck entries={entries} onReplaceEntries={setEntries} />}
      {card.id === 'templates' && <Templates entries={entries} onInsertEntries={onInsertEntries} />}
      {card.id === 'sharing' && <ManagerSharing generatedReport={generatedReport} entries={entries} reportDate={reportDate} />}
      {card.id === 'imports' && <ToolImports onInsertEntries={onInsertEntries} />}
    </ModuleShell>
  );
}
