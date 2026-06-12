const express = require('express');
const { Storage } = require('@google-cloud/storage');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const storage = new Storage();
const BUCKET = process.env.STUDY_MATERIALS_BUCKET || 'sdc-study-materials';
const canManageMaterials = requireRole('admin', 'owner', 'teacher');


const signGcsUrl = async (gsUri) => {
  if (!gsUri) return null;
  const withoutPrefix = gsUri.replace('gs://', '');
  const slashIndex = withoutPrefix.indexOf('/');
  const bucket = withoutPrefix.slice(0, slashIndex);
  const filePath = withoutPrefix.slice(slashIndex + 1);
  const [url] = await storage.bucket(bucket).file(filePath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  });
  return url;
};





router.post('/upload-url', verifyToken, canManageMaterials, async (req, res) => {
  const { filename, contentType = 'application/pdf', subject = 'general', batchCode = 'global' } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }

  try {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const gcsPath = `${batchCode}/${subject}/${Date.now()}-${safeFilename}`;
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
    chapter,
    type,
    source,
    classLevel,
    batchId,
    batchCode,
    gcsPath,
  } = req.body;

  if (!title || !subject || !type || !gcsPath) {
    return res.status(400).json({ error: 'title, subject, type, and gcsPath are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO study_materials
        (title, subject, chapter, type, source, class_level, batch_id, batch_code, gcs_path, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, title, subject, chapter, type, source, class_level, batch_id, batch_code, uploaded_at`,
      [
        title,
        subject,
        chapter || null,
        type,
        source || null,
        classLevel || null,
        batchId || null,
        batchCode || null,
        gcsPath,
        String(req.user.authId),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Material create error:', err.message);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// GET /materials - list materials with optional filters
router.get('/', verifyToken, async (req, res) => {
  const { subject, board, standard, batch_id, batch } = req.query;

  try {
    let query = 'SELECT * FROM study_materials WHERE 1=1';
    const params = [];

    if (batch_id || batch) {
      params.push(batch_id || batch);
      query += ` AND (batch_id::text = $${params.length}`;
    }
    if (subject) {
      params.push(subject);
      query += ` AND subject = $${params.length}`;
    }
    if (board) {
      params.push(board);
      query += ` AND board = $${params.length}`;
    }
    if (standard) {
      params.push(standard);
      query += ` AND standard = $${params.length}`;
    }

    query += ' ORDER BY uploaded_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows.map((item) => ({
      id: item.id,
      title: item.title,
      subject: item.subject,
      board: item.board,
      standard: item.standard,
      batchId: item.batch_id,
      uploadedAt: item.uploaded_at,
    })));
  } catch (err) {
    console.error('Materials fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});



// GET /materials/:id/download - get signed URL
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM study_materials WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const material = result.rows[0];
    const file = storage.bucket(BUCKET).file(material.gcs_path);
    
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    res.json({ url: signedUrl, title: material.title });
  } catch (err) {
    console.error('Signed URL error:', err.message);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});


// GET /materials/pyq - list PYQ papers with filters
router.get('/pyq', verifyToken, async (req, res) => {
  const { exam, year, month, subject } = req.query;

  const conditions = [];
  const values = [];
  let i = 1;

  if (exam)    { conditions.push(`exam = $${i++}`);    values.push(exam); }
  if (year)    { conditions.push(`year = $${i++}`);    values.push(year); }
  if (month)   { conditions.push(`month = $${i++}`);   values.push(month); }
  if (subject) { conditions.push(`subject = $${i++}`); values.push(subject); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, exam, subject, year, month, paper_number FROM pyq_papers ${where} ORDER BY year DESC, month ASC, paper_number ASC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('PYQ fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

// GET /materials/pyq/:id/url - sign and return a single PYQ URL
router.get('/pyq/:id/url', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  if (!['paper', 'solution'].includes(type)) {
    return res.status(400).json({ error: 'type must be "paper" or "solution"' });
  }

  const column = type === 'paper' ? 'paper_url' : 'solution_url';

  try {
    const result = await pool.query(
      `SELECT ${column} FROM pyq_papers WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const gsUri = result.rows[0][column];
    const signedUrl = await signGcsUrl(gsUri);
    res.json({ url: signedUrl });
  } catch (err) {
    console.error('URL signing error:', err.message);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});







module.exports = router;
