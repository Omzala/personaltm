/* TaskCard — a single editable task row (from DashboardPage todo-card) */
const STATUS = ['Not started','Planned','In progress','Done','Blocked','Waiting','Carried over','Skipped'];
const PRIORITY = ['Low','Medium','High','Urgent'];
const CATEGORY = ['Planning','Execution','Review','Meeting','Research','Support','Admin','Learning','Bug fix','Follow-up'];
const HOURS = Array.from({ length: 13 }, (_, i) => i);
const MINS = Array.from({ length: 12 }, (_, i) => i * 5);

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

function parseDuration(v) {
  const s = String(v || '').toLowerCase();
  const h = Number((s.match(/(\d+)\s*(?:hr|h)/) || [])[1] || 0);
  const m = Number((s.match(/(\d+)\s*(?:min|m)/) || [])[1] || 0);
  return { hours: h, minutes: m };
}
function fmtDuration(h, m) {
  const p = [];
  if (h) p.push(`${h} hr`);
  if (m) p.push(`${m} min`);
  return p.join(' ');
}

function TaskCard({ entry, index, onChange, onRemove }) {
  function up(field, value) { onChange(index, { ...entry, [field]: value }); }
  function dur(field, value) {
    const d = { ...parseDuration(entry.time), [field]: Number(value) };
    up('time', fmtDuration(d.hours, d.minutes));
  }
  function subUp(i, field, value) {
    up('subtasks', entry.subtasks.map((s, si) => si === i ? { ...s, [field]: value } : s));
  }
  const d = parseDuration(entry.time);

  return (
    <article className={`todo-card glow-card status-${slug(entry.status)}`} style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="todo-card-main">
        <div className="todo-topline">
          <select className={`status-select s-${slug(entry.status)}`} value={entry.status} onChange={(e) => up('status', e.target.value)} aria-label="Status">
            {STATUS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={entry.priority} onChange={(e) => up('priority', e.target.value)} aria-label="Priority">
            <option value="">Priority</option>{PRIORITY.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={entry.category} onChange={(e) => up('category', e.target.value)} aria-label="Category">
            <option value="">Category</option>{CATEGORY.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <input value={entry.title} onChange={(e) => up('title', e.target.value)} placeholder="Task title" />
        <textarea value={entry.task} onChange={(e) => up('task', e.target.value)} placeholder="Task description" rows="2" />
        <div className="subtask-section">
          {entry.subtasks.length > 0 && (
            <div className="subtask-tree">
              {entry.subtasks.map((s, si) => (
                <div className={`subtask-row${s.done ? ' subtask-row-done' : ''}`} key={si}>
                  <input type="checkbox" checked={s.done} onChange={(e) => subUp(si, 'done', e.target.checked)} aria-label="Done" />
                  <input value={s.title} onChange={(e) => subUp(si, 'title', e.target.value)} placeholder="Subtask" />
                  <button className="icon-button danger" onClick={() => up('subtasks', entry.subtasks.filter((_, x) => x !== si))} aria-label="Remove subtask">
                    <Icon name="trash-2" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="ghost-button subtask-add" type="button" onClick={() => up('subtasks', [...entry.subtasks, { title: '', done: false }])}>
            <Icon name="plus" size={15} /> Add subtask
          </button>
        </div>
        <textarea value={entry.impact} onChange={(e) => up('impact', e.target.value)} placeholder="Outcome or proof of value" rows="2" />
      </div>

      <div className="todo-card-side">
        <div className="duration-picker" aria-label="Time worked">
          <span>Worked</span>
          <select value={d.hours} onChange={(e) => dur('hours', e.target.value)} aria-label="Hours">
            {HOURS.map(h => <option key={h} value={h}>{h} hr</option>)}
          </select>
          <select value={d.minutes} onChange={(e) => dur('minutes', e.target.value)} aria-label="Minutes">
            {MINS.map(m => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <label>Due date
          <input type="date" value={entry.dueDate} onChange={(e) => up('dueDate', e.target.value)} />
        </label>
        <textarea value={entry.blocker} onChange={(e) => up('blocker', e.target.value)} placeholder="Blocker (if any)" rows="2" />
        <textarea value={entry.nextStep} onChange={(e) => up('nextStep', e.target.value)} placeholder="Next step" rows="2" />
        <button className="icon-button danger" onClick={() => onRemove(index)} aria-label="Remove task">
          <Icon name="trash-2" size={17} />
        </button>
      </div>
    </article>
  );
}

Object.assign(window, { TaskCard, STATUS, PRIORITY, CATEGORY, slug, parseDuration, fmtDuration });
