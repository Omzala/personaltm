import React, { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  Check,
  Columns3,
  Copy,
  Download,
  Eye,
  FileDown,
  FilePlus2,
  ListChecks,
  ListTree,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  WandSparkles,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Select } from '../components/Select.jsx';
import MagicBento from '../components/MagicBento.jsx';
import { FeatureModules, featureCards } from './FeatureModules.jsx';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const statusOptions = ['Not started', 'Planned', 'In progress', 'Done', 'Blocked', 'Waiting', 'Carried over', 'Skipped'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
const categoryOptions = ['Planning', 'Execution', 'Review', 'Meeting', 'Research', 'Support', 'Admin', 'Learning', 'Bug fix', 'Follow-up'];
const hourOptions = Array.from({ length: 13 }, (_item, index) => index);
const minuteOptions = Array.from({ length: 12 }, (_item, index) => index * 5);
const reportColumns = [
  { key: 'title', label: 'Title' },
  { key: 'task', label: 'Task' },
  { key: 'time', label: 'Time Worked' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'category', label: 'Category' },
  { key: 'impact', label: 'Outcome' },
  { key: 'blocker', label: 'Blocker' },
  { key: 'nextStep', label: 'Next Step' }
];
const defaultColumnKeys = reportColumns.map((column) => column.key);

const emptyEntry = {
  title: '',
  time: '',
  task: '',
  status: 'Not started',
  priority: '',
  category: '',
  impact: '',
  blocker: '',
  nextStep: '',
  subtasks: [],
  dueDate: ''
};

const starterRows = [{ ...emptyEntry }];

function statusSlug(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function normalizeEntry(entry = {}) {
  return {
    ...emptyEntry,
    ...entry,
    title: entry.title || '',
    status: entry.status || emptyEntry.status,
    priority: entry.priority || '',
    category: entry.category || '',
    subtasks: Array.isArray(entry.subtasks)
      ? entry.subtasks.map((subtask) => ({
        title: subtask?.title || '',
        done: Boolean(subtask?.done)
      }))
      : []
  };
}

function parseDuration(value) {
  const cleanValue = String(value || '').toLowerCase();
  const hours = Number(cleanValue.match(/(\d+)\s*(?:hr|hour|hours|h)/)?.[1] || 0);
  const minutes = Number(cleanValue.match(/(\d+)\s*(?:min|minute|minutes|m)/)?.[1] || 0);

  return {
    hours: Number.isFinite(hours) ? Math.min(hours, 12) : 0,
    minutes: Number.isFinite(minutes) ? Math.min(Math.round(minutes / 5) * 5, 55) : 0
  };
}

function formatDuration(hours, minutes) {
  const cleanHours = Number(hours) || 0;
  const cleanMinutes = Number(minutes) || 0;
  const parts = [];

  if (cleanHours) parts.push(`${cleanHours} hr`);
  if (cleanMinutes) parts.push(`${cleanMinutes} min`);

  return parts.join(' ');
}

function escapeCsvValue(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function buildCsvReport(entries, selectedColumnKeys) {
  const header = selectedColumnKeys
    .map((columnKey) => reportColumns.find((column) => column.key === columnKey)?.label || columnKey)
    .map(escapeCsvValue)
    .join(',');
  const rows = entries.map((entry) => selectedColumnKeys
    .map((columnKey) => escapeCsvValue(entry[columnKey]))
    .join(','));

  return [header, ...rows].join('\n');
}

function normalizeColumnKeys(columns) {
  const allowedKeys = new Set(defaultColumnKeys);
  const cleanColumns = Array.isArray(columns)
    ? columns.filter((columnKey) => allowedKeys.has(columnKey))
    : [];

  return cleanColumns.length ? [...new Set(cleanColumns)] : defaultColumnKeys;
}

function downloadCsv({ csv, reportDate, suffix }) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `daily-report-${suffix}-${reportDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildProfileRows(user) {
  const responsibilities = [
    user.keyResponsibility,
    ...(Array.isArray(user.overallTasks) ? user.overallTasks : [])
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  const uniqueResponsibilities = [...new Set(responsibilities)].slice(0, 5);
  if (!uniqueResponsibilities.length) {
    return [{ ...emptyEntry }];
  }

  return uniqueResponsibilities.map((responsibility, index) => ({
    ...emptyEntry,
    time: '',
    title: responsibility,
    task: responsibility,
    priority: index === 0 ? 'High' : 'Medium',
    category: index === 0 ? 'Execution' : 'Follow-up',
    impact: index === 0 ? 'Advanced the key responsibility' : '',
    dueDate: today()
  }));
}

export function DashboardPage() {
  const { user } = useAuth();
  const [reportDate, setReportDate] = useState('');
  const [entries, setEntries] = useState(starterRows);
  const [generatedReport, setGeneratedReport] = useState('');
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [previewReport, setPreviewReport] = useState(null);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState(defaultColumnKeys);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeFeature, setActiveFeature] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        const [reportsData, draftData] = await Promise.all([
          apiRequest('/reports'),
          apiRequest('/reports/draft')
        ]);

        if (ignore) return;

        setReports(reportsData.reports);
        setSelectedColumnKeys(normalizeColumnKeys(draftData.columns));

        if (draftData.draft?.entries?.length) {
          setEntries(draftData.draft.entries.map(normalizeEntry));
        }

        setReportDate(draftData.draft?.reportDate || '');
        setGeneratedReport(draftData.draft?.generatedReport || '');
        setSelectedReportId(draftData.draft?.selectedReportId || '');
      } catch {
        if (!ignore) setDraftLoaded(true);
        return;
      }

      if (!ignore) setDraftLoaded(true);
    }

    loadDashboardData();

    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!draftLoaded) return undefined;

    const timeoutId = window.setTimeout(() => {
      apiRequest('/reports/draft', {
        method: 'PUT',
        body: JSON.stringify({
          reportDate,
          entries,
          generatedReport,
          selectedReportId,
          columns: selectedColumnKeys
        })
      }).catch(() => {});
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [draftLoaded, reportDate, entries, generatedReport, selectedReportId, selectedColumnKeys]);

  useEffect(() => {
    if (!draftLoaded || !reportDate) return undefined;

    let ignore = false;

    async function loadCarryoverTasks() {
      try {
        const data = await apiRequest(`/reports/carryover?date=${encodeURIComponent(reportDate)}`);
        if (ignore || !data.entries?.length) return;

        setEntries((currentEntries) => {
          const existingKeys = new Set(currentEntries
            .map((entry) => String(entry.title || entry.task || '').trim().toLowerCase())
            .filter(Boolean));
          const carryoverEntries = data.entries
            .map(normalizeEntry)
            .filter((entry) => {
              const key = String(entry.title || entry.task || '').trim().toLowerCase();
              return key && !existingKeys.has(key);
            });

          if (!carryoverEntries.length) return currentEntries;

          const emptyRows = currentEntries.filter((entry) => String(entry.title || entry.task || '').trim());
          return [...emptyRows, ...carryoverEntries];
        });
      } catch {
        // Carry-forward should never block daily reporting.
      }
    }

    loadCarryoverTasks();

    return () => { ignore = true; };
  }, [draftLoaded, reportDate]);

  const filledRows = useMemo(
    () => entries.filter((entry) => (entry.title || entry.task).trim()).length,
    [entries]
  );

  const doneRows = useMemo(
    () => entries.filter((entry) => entry.status === 'Done' && (entry.title || entry.task).trim()).length,
    [entries]
  );

  const blockedRows = useMemo(
    () => entries.filter((entry) => ['Blocked', 'Waiting'].includes(entry.status) && (entry.title || entry.task).trim()).length,
    [entries]
  );

  const completionScore = filledRows ? Math.round((doneRows / filledRows) * 100) : 0;

  const selectedReport = useMemo(
    () => reports.find((report) => report._id === selectedReportId),
    [reports, selectedReportId]
  );

  function cleanEntriesForSave() {
    return entries
      .map((entry) => ({
        title: entry.title.trim(),
        time: entry.time.trim() || 'Not logged',
        task: entry.task.trim() || entry.title.trim(),
        status: entry.status,
        priority: entry.priority || 'Medium',
        category: entry.category || 'Execution',
        impact: entry.impact.trim(),
        blocker: entry.blocker.trim(),
        nextStep: entry.nextStep.trim(),
        subtasks: entry.subtasks
          .map((subtask) => ({ title: subtask.title.trim(), done: subtask.done }))
          .filter((subtask) => subtask.title),
        dueDate: entry.dueDate
      }))
      .filter((entry) => entry.title || entry.task);
  }

  function updateEntry(index, field, value) {
    setEntries(entries.map((entry, currentIndex) => (
      currentIndex === index ? { ...entry, [field]: value } : entry
    )));
  }

  function updateDuration(index, field, value) {
    const currentDuration = parseDuration(entries[index]?.time);
    const nextDuration = { ...currentDuration, [field]: Number(value) };
    updateEntry(index, 'time', formatDuration(nextDuration.hours, nextDuration.minutes));
  }

  function addEntry(entry = emptyEntry) {
    setEntries([...entries, normalizeEntry(entry)]);
  }

  function insertFeatureEntries(nextEntries) {
    const cleanEntries = nextEntries.map(normalizeEntry);

    if (!cleanEntries.length) return;

    setEntries((currentEntries) => {
      const filledCurrentEntries = currentEntries.filter((entry) => String(entry.title || entry.task || '').trim());
      return [...filledCurrentEntries, ...cleanEntries];
    });
    setGeneratedReport('');
    setError('');
  }

  function replaceFeatureEntries(nextEntries) {
    setEntries(nextEntries.map(normalizeEntry));
    setGeneratedReport('');
    setError('');
  }

  function removeEntry(index) {
    setEntries(entries.filter((_entry, currentIndex) => currentIndex !== index));
  }

  function updateSubtask(entryIndex, subtaskIndex, field, value) {
    setEntries(entries.map((entry, currentIndex) => {
      if (currentIndex !== entryIndex) return entry;

      return {
        ...entry,
        subtasks: entry.subtasks.map((subtask, currentSubtaskIndex) => (
          currentSubtaskIndex === subtaskIndex ? { ...subtask, [field]: value } : subtask
        ))
      };
    }));
  }

  function addSubtask(entryIndex) {
    setEntries(entries.map((entry, currentIndex) => (
      currentIndex === entryIndex
        ? { ...entry, subtasks: [...entry.subtasks, { title: '', done: false }] }
        : entry
    )));
  }

  function removeSubtask(entryIndex, subtaskIndex) {
    setEntries(entries.map((entry, currentIndex) => (
      currentIndex === entryIndex
        ? { ...entry, subtasks: entry.subtasks.filter((_subtask, currentSubtaskIndex) => currentSubtaskIndex !== subtaskIndex) }
        : entry
    )));
  }

  function toggleColumn(columnKey) {
    setSelectedColumnKeys((currentColumns) => {
      if (currentColumns.includes(columnKey)) {
        return currentColumns.length === 1
          ? currentColumns
          : currentColumns.filter((currentColumn) => currentColumn !== columnKey);
      }

      return [...currentColumns, columnKey];
    });
    setGeneratedReport('');
  }

  function selectAllColumns() {
    setSelectedColumnKeys(defaultColumnKeys);
    setGeneratedReport('');
  }

  function startNewReport() {
    setSelectedReportId('');
    setReportDate('');
    setEntries(starterRows);
    setGeneratedReport('');
    setError('');
  }

  function createRolePlan() {
    setSelectedReportId('');
    setReportDate('');
    setEntries(buildProfileRows(user));
    setGeneratedReport('');
    setError('');
  }

  function carryUnfinished() {
    const nextReportDate = reportDate ? addDays(reportDate, 1) : '';
    const unfinishedRows = entries
      .filter((entry) => (entry.title || entry.task).trim() && !['Done', 'Skipped'].includes(entry.status))
      .map((entry) => ({
        ...normalizeEntry(entry),
        time: '',
        status: 'Carried over',
        dueDate: nextReportDate,
        nextStep: entry.nextStep || 'Continue this item tomorrow'
      }));

    if (!unfinishedRows.length) {
      setError('No unfinished task is available to carry forward.');
      return;
    }

    setSelectedReportId('');
    setReportDate(nextReportDate);
    setEntries(unfinishedRows);
    setGeneratedReport('');
    setError('');
  }

  async function openReport(reportId) {
    setBusy(true);
    setError('');

    try {
      const data = await apiRequest(`/reports/${reportId}`);
      setSelectedReportId(data.report._id);
      setReportDate(data.report.reportDate);
      setEntries(data.report.entries.length ? data.report.entries.map(normalizeEntry) : starterRows);
      setGeneratedReport(data.report.generatedReport);
      setSelectedColumnKeys(normalizeColumnKeys(data.report.columns));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function previewSavedReport(reportId) {
    setBusy(true);
    setError('');

    try {
      const data = await apiRequest(`/reports/${reportId}`);
      setPreviewReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function viewFullReport(report) {
    setSelectedReportId(report._id);
    setReportDate(report.reportDate);
    setEntries(report.entries.length ? report.entries.map(normalizeEntry) : starterRows);
    setGeneratedReport(report.generatedReport);
    setSelectedColumnKeys(normalizeColumnKeys(report.columns));
    setPreviewReport(null);
  }

  async function handleGenerateReport() {
    setBusy(true);
    setError('');

    try {
      const cleanEntries = cleanEntriesForSave();
      const data = await apiRequest('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ reportDate, entries: cleanEntries, columns: selectedColumnKeys })
      });
      setSelectedReportId(data.report._id);
      setReportDate(data.report.reportDate);
      setGeneratedReport(data.report.generatedReport);
      setReports([data.report, ...reports.filter((report) => report._id !== data.report._id)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveReport() {
    if (!selectedReportId) return;

    setBusy(true);
    setError('');

    try {
      const cleanEntries = cleanEntriesForSave();
      const data = await apiRequest(`/reports/${selectedReportId}`, {
        method: 'PUT',
        body: JSON.stringify({ reportDate, entries: cleanEntries, columns: selectedColumnKeys })
      });
      setReportDate(data.report.reportDate);
      setGeneratedReport(data.report.generatedReport);
      setEntries(data.report.entries.map(normalizeEntry));
      setReports(reports.map((report) => (
        report._id === data.report._id ? data.report : report
      )));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReport(reportId) {
    if (!window.confirm('Delete this saved report?')) return;

    setBusy(true);
    setError('');

    try {
      await apiRequest(`/reports/${reportId}`, { method: 'DELETE' });
      setReports(reports.filter((report) => report._id !== reportId));

      if (selectedReportId === reportId) startNewReport();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(generatedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadReport() {
    downloadCsv({ csv: generatedReport, reportDate: reportDate || today(), suffix: 'ai' });
  }

  function openFeature(card) {
    setActiveFeature(card.id);
    window.setTimeout(() => {
      document.querySelector('.feature-module')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function downloadRawReport() {
    const rawEntries = cleanEntriesForSave();

    if (!rawEntries.length) {
      setError('Add at least one task before downloading a raw report.');
      return;
    }

    setError('');
    downloadCsv({
      csv: buildCsvReport(rawEntries, selectedColumnKeys),
      reportDate: reportDate || today(),
      suffix: 'raw'
    });
  }

  return (
    <main className="dashboard">
      <section className="workspace glow-card">
        <div className="dashboard-hero">
          <div className="section-heading">
            <span>{selectedReport ? `Editing ${selectedReport.reportDate}` : `${user.seniority} ${user.role}`}</span>
            <h1>Task report studio</h1>
          </div>
          <div className="score-ring" style={{ '--score': `${completionScore}%` }}>
            <strong>{completionScore}%</strong>
            <span>done</span>
          </div>
        </div>

        <div className="profile-context">
          <div>
            <span>Focus question</span>
            <strong>{user.professionalQuestion || 'What progress mattered most today?'}</strong>
          </div>
          <div>
            <span>Key responsibility</span>
            <strong>{user.keyResponsibility || user.overallTasks?.[0] || 'Daily execution'}</strong>
          </div>
        </div>

        <div className="automation-strip">
          <button className="secondary-button" onClick={createRolePlan} disabled={busy}>
            <WandSparkles size={17} />
            Role plan
          </button>
          <button className="secondary-button" onClick={carryUnfinished} disabled={busy}>
            <RotateCcw size={17} />
            Carry over
          </button>
          <button className="ghost-button" onClick={startNewReport} disabled={busy}>
            <FilePlus2 size={17} />
            New
          </button>
        </div>

        <div className="report-meta">
          <label>
            Report date
            <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
          </label>
          <div className="metric glow-card">
            <ListChecks size={18} />
            <strong>{filledRows}</strong>
            <span>tasks</span>
          </div>
          <div className="metric glow-card">
            <Sparkles size={18} />
            <strong>{doneRows}</strong>
            <span>finished</span>
          </div>
          <div className="metric glow-card">
            <AlarmClock size={18} />
            <strong>{blockedRows}</strong>
            <span>blocked</span>
          </div>
          <div className="metric glow-card">
            <ListTree size={18} />
            <strong>{entries.reduce((count, entry) => count + entry.subtasks.filter((subtask) => subtask.title).length, 0)}</strong>
            <span>subtasks</span>
          </div>
        </div>

        <div className="todo-board">
          {entries.map((entry, index) => (
            <article
              className={`todo-card glow-card status-${statusSlug(entry.status)}`}
              key={index}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="todo-card-main">
                <div className="todo-topline">
                  <Select
                    ariaLabel="Task status"
                    triggerClassName={`status-select s-${statusSlug(entry.status)}`}
                    value={entry.status}
                    options={statusOptions}
                    onChange={(value) => updateEntry(index, 'status', value)}
                  />
                  <Select
                    ariaLabel="Task priority"
                    placeholder="Priority"
                    value={entry.priority}
                    options={priorityOptions}
                    onChange={(value) => updateEntry(index, 'priority', value)}
                  />
                  <Select
                    ariaLabel="Task category"
                    placeholder="Category"
                    value={entry.category}
                    options={categoryOptions}
                    onChange={(value) => updateEntry(index, 'category', value)}
                  />
                </div>
                <input value={entry.title} onChange={(event) => updateEntry(index, 'title', event.target.value)} placeholder="Task title" />
                <textarea value={entry.task} onChange={(event) => updateEntry(index, 'task', event.target.value)} placeholder="Task description" rows="2" />
                <div className="subtask-section">
                  {entry.subtasks.length > 0 && (
                    <div className="subtask-tree">
                      {entry.subtasks.map((subtask, subtaskIndex) => (
                        <div className={`subtask-row${subtask.done ? ' subtask-row-done' : ''}`} key={subtaskIndex}>
                          <input
                            type="checkbox"
                            checked={subtask.done}
                            onChange={(event) => updateSubtask(index, subtaskIndex, 'done', event.target.checked)}
                            aria-label="Mark subtask complete"
                          />
                          <input
                            value={subtask.title}
                            onChange={(event) => updateSubtask(index, subtaskIndex, 'title', event.target.value)}
                            placeholder="Subtask"
                          />
                          <button className="icon-button danger" onClick={() => removeSubtask(index, subtaskIndex)} aria-label="Remove subtask">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="ghost-button subtask-add" onClick={() => addSubtask(index)} type="button">
                    <Plus size={15} />
                    Add subtask
                  </button>
                </div>
                <textarea value={entry.impact} onChange={(event) => updateEntry(index, 'impact', event.target.value)} placeholder="Outcome or proof of value" rows="2" />
              </div>

              <div className="todo-card-side">
                <div className="duration-picker" aria-label="Time worked">
                  <span>Worked</span>
                  <Select
                    ariaLabel="Hours worked"
                    value={parseDuration(entry.time).hours}
                    options={hourOptions.map((hour) => ({ value: hour, label: `${hour} hr` }))}
                    onChange={(value) => updateDuration(index, 'hours', value)}
                  />
                  <Select
                    ariaLabel="Minutes worked"
                    value={parseDuration(entry.time).minutes}
                    options={minuteOptions.map((minute) => ({ value: minute, label: `${minute} min` }))}
                    onChange={(value) => updateDuration(index, 'minutes', value)}
                  />
                </div>
                <label>
                  Due date
                  <input
                    type="date"
                    value={entry.dueDate}
                    onChange={(event) => updateEntry(index, 'dueDate', event.target.value)}
                    aria-label="Due date"
                  />
                </label>
                <textarea value={entry.blocker} onChange={(event) => updateEntry(index, 'blocker', event.target.value)} placeholder="Blocker (if any)" rows="2" />
                <textarea value={entry.nextStep} onChange={(event) => updateEntry(index, 'nextStep', event.target.value)} placeholder="Next step" rows="2" />
                <button className="icon-button danger" onClick={() => removeEntry(index)} aria-label="Remove task">
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <section className="column-picker glow-card" aria-label="Excel columns">
          <div className="column-picker-heading">
            <div>
              <strong>Excel columns</strong>
              <span>{selectedColumnKeys.length} selected</span>
            </div>
            <button className="ghost-button" onClick={selectAllColumns} type="button">
              <Columns3 size={17} />
              All columns
            </button>
          </div>
          <div className="column-chip-grid">
            {reportColumns.map((column) => (
              <label className={`column-chip ${selectedColumnKeys.includes(column.key) ? 'active' : ''}`} key={column.key}>
                <input
                  type="checkbox"
                  checked={selectedColumnKeys.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="button-row">
          <button className="secondary-button" onClick={() => addEntry()}>
            <Plus size={17} />
            Add task
          </button>
          <button className="secondary-button" onClick={handleSaveReport} disabled={busy || !selectedReportId || !filledRows}>
            <Save size={17} />
            Save
          </button>
          <button className="secondary-button" onClick={downloadRawReport} disabled={busy || !filledRows}>
            <FileDown size={17} />
            Raw CSV
          </button>
          <button className="primary-button" onClick={handleGenerateReport} disabled={busy || !filledRows}>
            <Sparkles size={17} />
            {busy ? 'Working...' : 'Generate AI report'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
      </section>

      <aside className="result-panel glow-card">
        <div className="result-heading">
          <div>
            <span>Spreadsheet export</span>
            <h2>Daily report</h2>
          </div>
          <div className="result-actions">
            <button className="icon-button" onClick={copyReport} disabled={!generatedReport} aria-label="Copy report">
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
            <button className="icon-button" onClick={downloadReport} disabled={!generatedReport} aria-label="Download AI CSV">
              <Download size={17} />
            </button>
          </div>
        </div>
        <pre className="report-output">{generatedReport || buildCsvReport([], selectedColumnKeys)}</pre>

        <div className="history-list">
          <h3>Saved reports</h3>
          {reports.slice(0, 6).map((report) => (
            <div className={`history-item ${selectedReportId === report._id ? 'active' : ''}`} key={report._id}>
              <button className="history-open" onClick={() => previewSavedReport(report._id)} disabled={busy}>
                <strong>{report.reportDate}</strong>
                <span>{report.entries.length} tasks</span>
              </button>
              <button className="icon-button danger" onClick={() => deleteReport(report._id)} disabled={busy} aria-label="Delete saved report">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="bento-showcase">
        <div className="section-heading" style={{ marginBottom: 12 }}>
          <span>Feature modules</span>
          <h2>Open the next layer</h2>
        </div>
        <MagicBento
          cards={featureCards}
          onCardSelect={openFeature}
          textAutoHide
          enableStars
          enableSpotlight
          enableBorderGlow
          enableTilt
          enableMagnetism
          clickEffect
          spotlightRadius={320}
          particleCount={12}
        />
      </section>

      {activeFeature && (
        <FeatureModules
          activeFeature={activeFeature}
          onBack={() => setActiveFeature('')}
          reports={reports}
          entries={entries}
          setEntries={replaceFeatureEntries}
          generatedReport={generatedReport}
          reportDate={reportDate}
          onInsertEntries={insertFeatureEntries}
        />
      )}

      {previewReport && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPreviewReport(null)}>
          <section className="report-modal glow-card" role="dialog" aria-modal="true" aria-labelledby="report-preview-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="result-heading">
              <div>
                <span>{previewReport.reportDate}</span>
                <h2 id="report-preview-title">Saved report details</h2>
              </div>
              <button className="icon-button" onClick={() => setPreviewReport(null)} aria-label="Close report preview">
                <X size={17} />
              </button>
            </div>
            <div className="modal-summary">
              <div className="metric glow-card">
                <ListChecks size={18} />
                <strong>{previewReport.entries.length}</strong>
                <span>tasks</span>
              </div>
              <div className="metric glow-card">
                <Sparkles size={18} />
                <strong>{previewReport.entries.filter((entry) => entry.status === 'Done').length}</strong>
                <span>done</span>
              </div>
            </div>
            <div className="modal-task-list">
              {previewReport.entries.slice(0, 3).map((entry, index) => (
                <article className="modal-task" key={`${entry.task}-${index}`}>
                  <strong>{entry.task}</strong>
                  <span>{entry.time || 'Not logged'} · {entry.status || 'Not started'}</span>
                </article>
              ))}
            </div>
            <div className="button-row">
              <button className="ghost-button" onClick={() => setPreviewReport(null)}>Close</button>
              <button className="primary-button" onClick={() => viewFullReport(previewReport)}>
                <Eye size={17} />
                View full report
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
