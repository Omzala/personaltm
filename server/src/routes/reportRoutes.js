import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Report } from '../models/Report.js';
import { generateAiReport, normalizeReportColumns, normalizeReportEntries } from '../utils/aiReport.js';

const router = express.Router();

router.use(requireAuth);

router.get('/draft', async (req, res, next) => {
  try {
    res.json({
      draft: req.user.reportDraft || {},
      columns: normalizeReportColumns(req.user.reportColumns)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/draft', async (req, res, next) => {
  try {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const columns = normalizeReportColumns(req.body.columns);

    req.user.reportColumns = columns;
    req.user.reportDraft = {
      reportDate: String(req.body.reportDate || '').trim(),
      entries: entries.map((entry) => ({
        title: String(entry.title || '').trim(),
        time: String(entry.time || '').trim(),
        task: String(entry.task || '').trim(),
        status: String(entry.status || 'Not started').trim(),
        priority: String(entry.priority || '').trim(),
        category: String(entry.category || '').trim(),
        impact: String(entry.impact || '').trim(),
        blocker: String(entry.blocker || '').trim(),
        nextStep: String(entry.nextStep || '').trim(),
        subtasks: Array.isArray(entry.subtasks)
          ? entry.subtasks
            .map((subtask) => ({
              title: String(subtask?.title || '').trim(),
              done: Boolean(subtask?.done)
            }))
            .filter((subtask) => subtask.title)
          : [],
        dueDate: String(entry.dueDate || '').trim()
      })),
      generatedReport: String(req.body.generatedReport || ''),
      selectedReportId: String(req.body.selectedReportId || '').trim()
    };

    await req.user.save();

    res.json({
      draft: req.user.reportDraft,
      columns
    });
  } catch (error) {
    next(error);
  }
});

router.get('/carryover', async (req, res, next) => {
  try {
    const reportDate = String(req.query.date || '').trim();

    if (!reportDate) {
      return res.json({ entries: [] });
    }

    const previousReports = await Report.find({
      user: req.user._id,
      reportDate: { $lt: reportDate }
    })
      .sort({ reportDate: -1, createdAt: -1 })
      .limit(20);
    const seen = new Set();
    const entries = [];

    for (const report of previousReports) {
      for (const entry of report.entries) {
        const status = String(entry.status || 'Not started');
        const isComplete = status === 'Done' || status === 'Skipped';
        const hasOpenSubtasks = Array.isArray(entry.subtasks) && entry.subtasks.some((subtask) => !subtask.done);
        const key = String(entry.title || entry.task || '').trim().toLowerCase();

        if (!key || seen.has(key)) continue;
        seen.add(key);

        if (isComplete && !hasOpenSubtasks) continue;

        entries.push({
          title: entry.title || entry.task,
          task: entry.task || entry.title,
          time: '',
          status: 'Carried over',
          priority: entry.priority || '',
          category: entry.category || '',
          impact: entry.impact || '',
          blocker: entry.blocker || '',
          nextStep: entry.nextStep || 'Continue this task',
          subtasks: Array.isArray(entry.subtasks)
            ? entry.subtasks.map((subtask) => ({
              title: subtask.title,
              done: Boolean(subtask.done)
            }))
            : [],
          dueDate: ''
        });
      }
    }

    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const reportDate = req.body.reportDate || new Date().toISOString().slice(0, 10);
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const columns = normalizeReportColumns(req.body.columns);
    const cleanEntries = normalizeReportEntries(entries);
    const generatedReport = await generateAiReport({
      user: req.user,
      reportDate,
      entries: cleanEntries,
      columns
    });

    const report = await Report.create({
      user: req.user._id,
      reportDate,
      entries: cleanEntries,
      generatedReport,
      columns
    });

    req.user.reportColumns = columns;
    req.user.reportDraft = {
      reportDate,
      entries: cleanEntries,
      generatedReport,
      selectedReportId: report._id.toString()
    };
    await req.user.save();

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const columns = normalizeReportColumns(req.body.columns);
    const cleanEntries = normalizeReportEntries(entries);
    const reportDate = req.body.reportDate || report.reportDate;
    const generatedReport = await generateAiReport({
      user: req.user,
      reportDate,
      entries: cleanEntries,
      columns
    });

    report.reportDate = reportDate;
    report.entries = cleanEntries;
    report.generatedReport = generatedReport;
    report.columns = columns;

    await report.save();

    req.user.reportColumns = columns;
    req.user.reportDraft = {
      reportDate,
      entries: cleanEntries,
      generatedReport,
      selectedReportId: report._id.toString()
    };
    await req.user.save();

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
