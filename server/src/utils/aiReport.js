import { GoogleGenAI } from '@google/genai';

export const reportColumns = [
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
const columnKeySet = new Set(defaultColumnKeys);

function escapeCsvValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function cleanSentence(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.]+$/g, '');
}

function sameText(left, right) {
  return cleanSentence(left).toLowerCase() === cleanSentence(right).toLowerCase();
}

function buildWorkItemContext(entry) {
  const title = cleanSentence(entry.title);
  const task = cleanSentence(entry.task);
  const subtasks = Array.isArray(entry.subtasks)
    ? entry.subtasks
      .map((subtask) => ({
        title: cleanSentence(subtask?.title),
        done: Boolean(subtask?.done)
      }))
      .filter((subtask) => subtask.title)
    : [];

  return {
    summary: [title, task]
      .filter(Boolean)
      .filter((part, index, parts) => index === 0 || !sameText(part, parts[0]))
      .join(' - '),
    subtasks
  };
}

export function normalizeReportColumns(columns) {
  if (!Array.isArray(columns)) {
    return defaultColumnKeys;
  }

  const cleanColumns = columns
    .map((column) => String(column || '').trim())
    .filter((column) => columnKeySet.has(column));

  return cleanColumns.length ? [...new Set(cleanColumns)] : defaultColumnKeys;
}

export function normalizeReportEntries(entries) {
  return entries
    .map((entry) => {
      const title = String(entry.title || '').trim();
      const task = String(entry.task || title).trim();
      const subtasks = Array.isArray(entry.subtasks)
        ? entry.subtasks
          .map((subtask) => ({
            title: String(subtask?.title || '').trim(),
            done: Boolean(subtask?.done)
          }))
          .filter((subtask) => subtask.title)
        : [];

      return {
        title,
        time: String(entry.time || 'Not logged').trim(),
        task,
        status: String(entry.status || 'Not started').trim(),
        priority: String(entry.priority || 'Medium').trim(),
        category: String(entry.category || 'Execution').trim(),
        impact: String(entry.impact || '').trim(),
        blocker: String(entry.blocker || '').trim(),
        nextStep: String(entry.nextStep || '').trim(),
        subtasks,
        workItem: buildWorkItemContext({ title, task, subtasks }),
        dueDate: String(entry.dueDate || '').trim()
      };
    })
    .filter((entry) => entry.title || entry.task);
}

export function buildExcelReport({ entries, columns }) {
  const selectedColumns = normalizeReportColumns(columns);
  const header = selectedColumns
    .map((columnKey) => reportColumns.find((column) => column.key === columnKey)?.label || columnKey)
    .map(escapeCsvValue)
    .join(',');
  const rows = entries.map((entry) => selectedColumns
    .map((columnKey) => escapeCsvValue(entry[columnKey] || ''))
    .join(','));

  return [header, ...rows].join('\n');
}

function buildImprovePrompt({ entries, reportDate, user }) {
  return `
Turn these raw to-do items into a polished Excel daily work report.

Rules:
- Return only valid JSON.
- Return an array with the same number of items and the same order.
- Each item must have "title", "time", "task", "status", "priority", "category", "impact", "blocker", "nextStep", and "dueDate".
- Keep each "time" value exactly unchanged.
- Keep status, priority, category, and dueDate unchanged unless they are empty.
- Treat "title", "task", and "subtasks" as one combined work item. Do not improve them independently.
- Use the "workItem" object as the source of truth for the combined work item.
- The returned "title" should be a short label for the combined work item, not a separate accomplishment.
- The returned "task" should be one polished sentence that blends the title, task description, and meaningful subtasks together.
- Do not repeat the title separately inside the task if it says the same thing.
- If the entry has subtasks, weave completed or in-progress subtasks naturally into the "task" and "impact" fields to show depth and scope - do NOT list subtasks separately; make them feel like part of one cohesive achievement.
- Treat completed subtasks as proof of work: fold them into the impact statement as concrete outcomes.
- Improve task, impact, blocker, and nextStep text when the input supports it.
- Use layman language: simple words, clear sentence, no technical jargon unless the user wrote it.
- Make the work sound valuable, confident, and manager-ready without lying.
- Match the user's role, key responsibility, professional focus question, tools, and manager expectations.
- Translate vague lines like "worked on feature" into clearer progress based on available row and user context.
- Make each task clear enough to justify the time spent and show work value.
- Do not invent tools, meetings, blockers, tickets, metrics, or outcomes unless implied by the input.
- Keep each task to one strong, rich sentence, ideally 10 to 22 words when subtasks add scope.
- Write outcomes as plain benefits, not buzzwords.
- If a blocker or next step is empty, keep it empty unless the status clearly requires one.

User context:
${JSON.stringify({
    reportDate,
    role: user?.role,
    seniority: user?.seniority,
    department: user?.department,
    keyResponsibility: user?.keyResponsibility,
    professionalQuestion: user?.professionalQuestion,
    recurringResponsibilities: user?.overallTasks,
    tools: user?.tools,
    managerExpectations: user?.managerExpectations,
    reportTone: user?.reportTone
  }, null, 2)}

Input:
${JSON.stringify(entries, null, 2)}
`.trim();
}

function sentenceCase(value) {
  const cleanValue = cleanSentence(value);
  return cleanValue ? `${cleanValue.charAt(0).toUpperCase()}${cleanValue.slice(1)}` : '';
}

function lowerFirst(value) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : '';
}

function buildResponsibilityText(user) {
  return cleanSentence(user?.keyResponsibility || user?.overallTasks?.[0] || user?.role || 'assigned work').toLowerCase();
}

function joinNatural(items) {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function buildLocalWorkText(entry) {
  const workItem = entry.workItem || buildWorkItemContext(entry);
  const parts = [];

  if (workItem.summary) {
    parts.push(workItem.summary);
  }

  const completedSubtasks = workItem.subtasks
    .filter((subtask) => subtask.done)
    .map((subtask) => subtask.title);
  const openSubtasks = workItem.subtasks
    .filter((subtask) => !subtask.done)
    .map((subtask) => subtask.title);

  if (completedSubtasks.length) {
    parts.push(`completed ${joinNatural(completedSubtasks)}`);
  }

  if (openSubtasks.length && entry.status !== 'Done') {
    parts.push(`continued ${joinNatural(openSubtasks)}`);
  }

  return sentenceCase(parts.join('; ') || entry.task || entry.title);
}

function buildLocalTitle(entry) {
  const title = cleanSentence(entry.title);
  if (title) return sentenceCase(title);

  return buildLocalWorkText(entry)
    .split(/\s+/)
    .slice(0, 8)
    .join(' ');
}

function enhanceEntriesLocally({ entries, user }) {
  const responsibility = buildResponsibilityText(user);

  return entries.map((entry) => {
    const task = buildLocalWorkText(entry);
    const impact = sentenceCase(entry.impact);
    const blocker = sentenceCase(entry.blocker);
    const nextStep = sentenceCase(entry.nextStep);
    const completedSubtasks = (entry.workItem?.subtasks || [])
      .filter((subtask) => subtask.done)
      .map((subtask) => subtask.title);
    const taskSuffix = responsibility && !task.toLowerCase().includes(responsibility)
      ? ` to support ${responsibility}`
      : '';
    const defaultImpact = completedSubtasks.length
      ? `Completed ${joinNatural(completedSubtasks)} as proof of progress.`
      : `Helped move ${responsibility} forward.`;

    return {
      ...entry,
      title: buildLocalTitle(entry),
      task: entry.status === 'Done'
        ? `Completed ${lowerFirst(task)}${taskSuffix}.`
        : `${task}${taskSuffix}.`,
      impact: impact ? `${impact}.` : (entry.status === 'Done' ? defaultImpact : ''),
      blocker: blocker ? `${blocker}.` : '',
      nextStep: nextStep ? `${nextStep}.` : ''
    };
  });
}

function parseImprovedEntries(text, fallbackEntries) {
  const trimmed = String(text || '').trim();
  const unwrappedText = trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const firstBracket = unwrappedText.indexOf('[');
  const lastBracket = unwrappedText.lastIndexOf(']');
  const jsonText = firstBracket >= 0 && lastBracket > firstBracket
    ? unwrappedText.slice(firstBracket, lastBracket + 1)
    : unwrappedText;

  try {
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed) || parsed.length !== fallbackEntries.length) {
      return fallbackEntries;
    }

    return fallbackEntries.map((entry, index) => ({
      ...entry,
      title: String(parsed[index]?.title || entry.title || '').trim(),
      task: String(parsed[index]?.task || entry.task || '').trim(),
      impact: String(parsed[index]?.impact || entry.impact || '').trim(),
      blocker: String(parsed[index]?.blocker || entry.blocker || '').trim(),
      nextStep: String(parsed[index]?.nextStep || entry.nextStep || '').trim()
    }));
  } catch {
    return fallbackEntries;
  }
}

async function improveEntriesWithAi({ entries, reportDate, user }) {
  if (!process.env.GEMINI_API_KEY) {
    return enhanceEntriesLocally({ entries, user });
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const modelCandidates = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ].filter(Boolean);

  for (const model of [...new Set(modelCandidates)]) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: buildImprovePrompt({ entries, reportDate, user }),
        config: {
          temperature: 0.55,
          systemInstruction: 'You improve raw employee task logs into truthful, polished, simple, manager-ready Excel report rows.'
        }
      });

      return parseImprovedEntries(response.text, entries);
    } catch {
      // Try the next known model before falling back to local enhancement.
    }
  }

  return enhanceEntriesLocally({ entries, user });
}

function requireEntries(entries) {
  const cleanEntries = normalizeReportEntries(entries);

  if (!cleanEntries.length) {
    const error = new Error('At least one task entry is required');
    error.status = 400;
    throw error;
  }

  return cleanEntries;
}

export function buildRawReport({ entries, columns }) {
  return buildExcelReport({
    entries: requireEntries(entries),
    columns
  });
}

export async function generateAiReport({ entries, reportDate, user, columns }) {
  const cleanEntries = requireEntries(entries);
  const reportEntries = await improveEntriesWithAi({ entries: cleanEntries, reportDate, user });

  return buildExcelReport({ entries: reportEntries, columns });
}
