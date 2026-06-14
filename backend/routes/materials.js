const express = require('express');
const { Storage } = require('@google-cloud/storage');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { canAccessBatch, getVisibleBatchIds } = require('../utils/batchAccess');

const router = express.Router();
const storage = new Storage();
const BUCKET = process.env.STUDY_MATERIALS_BUCKET || 'sdc-study-materials';
const canManageMaterials = requireRole('admin', 'owner', 'teacher');

function parseGcsLocation(value) {
  if (!value) return null;

  if (value.startsWith('gs://')) {
    const withoutPrefix = value.slice(5);
    const slashIndex = withoutPrefix.indexOf('/');
    if (slashIndex === -1) return null;
    return {
      bucket: withoutPrefix.slice(0, slashIndex),
      filePath: withoutPrefix.slice(slashIndex + 1),
    };
  }

  return { bucket: BUCKET, filePath: value.replace(/^\/+/, '') };
}

async function signGcsUrl(gcsPath, expiresInMs = 15 * 60 * 1000) {
  const location = parseGcsLocation(gcsPath);
  if (!location) return null;

  const [url] = await storage
    .bucket(location.bucket)
    .file(location.filePath)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
  return url;
}

router.post('/upload-url', verifyToken, canManageMaterials, async (req, res) => {
  const {
    filename,
    contentType = 'application/pdf',
    subject = 'general',
    batchId = 'global',
  } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }

  try {
    if (req.user.role === 'teacher') {
      if (batchId === 'global' || !(await canAccessBatch(pool, req.user, batchId))) {
        return res.status(403).json({ error: 'Teachers must upload to an assigned batch' });
      }
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const safeSubject = String(subject).replace(/[^a-zA-Z0-9_-]/g, '-');
    const gcsPath = `${batchId}/${safeSubject}/${Date.now()}-${safeFilename}`;
    const [uploadUrl] = await storage.bucket(BUCKET).file(gcsPath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    res.json({ uploadUrl, gcsPath, bucket: BUCKET });
  } catch (err) {
    console.error('Material upload URL error:', err.message);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

router.post('/', verifyToken, canManageMaterials, async (req, res) => {
  const {
    title,
    subject,
    board,
    standard,
    batchId,
    gcsPath,
    fileSizeKb,
  } = req.body;

  if (!title || !subject || !board || !standard || !gcsPath) {
    return res.status(400).json({
      error: 'title, subject, board, standard, and gcsPath are required',
    });
  }

  if (batchId && !/^\d+$/.test(String(batchId))) {
    return res.status(400).json({ error: 'batchId must be an integer' });
  }

  try {
    if (req.user.role === 'teacher' && !batchId) {
      return res.status(403).json({ error: 'Teachers must upload to an assigned batch' });
    }
    if (batchId && !(await canAccessBatch(pool, req.user, batchId))) {
      return res.status(403).json({ error: 'This batch is not assigned to your account' });
    }

    const result = await pool.query(
      `INSERT INTO study_materials
        (title, subject, board, standard, batch_id, gcs_path, file_size_kb, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, title, subject, board, standard, batch_id, gcs_path,
                 file_size_kb, uploaded_by, uploaded_at`,
      [
        String(title).trim(),
        String(subject).trim(),
        String(board).trim(),
        String(standard).trim(),
        batchId ? Number(batchId) : null,
        gcsPath,
        fileSizeKb ? Number(fileSizeKb) : null,
        req.user.authId,
      ]
    );

    res.status(201).json({
      id: result.rows[0].id,
      title: result.rows[0].title,
      subject: result.rows[0].subject,
      board: result.rows[0].board,
      standard: result.rows[0].standard,
      batchId: result.rows[0].batch_id,
      fileSizeKb: result.rows[0].file_size_kb,
      uploadedAt: result.rows[0].uploaded_at,
    });
  } catch (err) {
    console.error('Material create error:', err.message);
    const status = err.code === '23503' ? 400 : 500;
    res.status(status).json({
      error: status === 400 ? 'The selected batch or uploader does not exist' : 'Failed to create material',
    });
  }
});

// Static PYQ paths stay before the dynamic material ID route.
router.get('/pyq', verifyToken, async (req, res) => {
  const { exam, year, month, subject } = req.query;
  const conditions = [];
  const values = [];

  if (exam) {
    values.push(exam);
    conditions.push(`exam ILIKE $${values.length}`);
  }
  if (year) {
    values.push(Number(year));
    conditions.push(`year = $${values.length}`);
  }
  if (month) {
    values.push(Number(month));
    conditions.push(`month = $${values.length}`);
  }
  if (subject) {
    values.push(subject);
    conditions.push(`subject ILIKE $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, exam, subject, year, month, paper_number
       FROM pyq_papers
       ${where}
       ORDER BY year DESC, month ASC NULLS LAST, paper_number ASC NULLS LAST`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('PYQ fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

router.get('/pyq/:id/url', verifyToken, async (req, res) => {
  const { type } = req.query;

  if (!['paper', 'solution'].includes(type)) {
    return res.status(400).json({ error: 'type must be "paper" or "solution"' });
  }

  const column = type === 'paper' ? 'paper_url' : 'solution_url';

  try {
    const result = await pool.query(
      `SELECT ${column} FROM pyq_papers WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const gcsPath = result.rows[0][column];
    if (!gcsPath) {
      return res.status(404).json({ error: `${type} file is not available` });
    }

    res.json({ url: await signGcsUrl(gcsPath) });
  } catch (err) {
    console.error('PYQ URL signing error:', err.message);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const { subject, board, standard, batch_id: batchId, batch } = req.query;
  const conditions = [];
  const values = [];

  if (batchId) {
    if (!/^\d+$/.test(String(batchId))) {
      return res.status(400).json({ error: 'batch_id must be an integer' });
    }
    values.push(Number(batchId));
    conditions.push(`sm.batch_id = $${values.length}`);
  } else if (batch) {
    values.push(batch);
    conditions.push(`LOWER(b.name) = LOWER($${values.length})`);
  }

  if (subject) {
    const normalizedSubject = String(subject).toLowerCase() === 'mathematics' ? 'Math' : subject;
    values.push(normalizedSubject);
    conditions.push(`LOWER(sm.subject) = LOWER($${values.length})`);
  }
  if (board) {
    values.push(board);
    conditions.push(`LOWER(sm.board) = LOWER($${values.length})`);
  }
  if (standard) {
    values.push(standard);
    conditions.push(`LOWER(sm.standard) = LOWER($${values.length})`);
  }

  try {
    const visibleBatchIds = await getVisibleBatchIds(pool, req.user);
    if (
      batchId
      && Array.isArray(visibleBatchIds)
      && !visibleBatchIds.includes(Number(batchId))
    ) {
      return res.status(403).json({ error: 'This batch is not visible to your account' });
    }
    if (Array.isArray(visibleBatchIds)) {
      values.push(visibleBatchIds);
      conditions.push(`(sm.batch_id IS NULL OR sm.batch_id = ANY($${values.length}::int[]))`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT sm.id, sm.title, sm.subject, sm.board, sm.standard, sm.batch_id,
              sm.file_size_kb, sm.uploaded_at, b.name AS batch_name
       FROM study_materials sm
       LEFT JOIN batches b ON b.id = sm.batch_id
       ${where}
       ORDER BY sm.uploaded_at DESC NULLS LAST, sm.id DESC`,
      values
    );

    res.json(result.rows.map((item) => ({
      id: item.id,
      title: item.title,
      subject: item.subject,
      board: item.board,
      standard: item.standard,
      batchId: item.batch_id,
      batch: item.batch_name,
      fileSizeKb: item.file_size_kb,
      uploadedAt: item.uploaded_at,
    })));
  } catch (err) {
    console.error('Materials fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT title, gcs_path, batch_id FROM study_materials WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    if (
      result.rows[0].batch_id
      && !(await canAccessBatch(pool, req.user, result.rows[0].batch_id))
    ) {
      return res.status(403).json({ error: 'This material is not assigned to your batch' });
    }

    res.json({
      url: await signGcsUrl(result.rows[0].gcs_path),
      title: result.rows[0].title,
    });
  } catch (err) {
    console.error('Material URL signing error:', err.message);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

module.exports = router;
