const express = require('express');
const { Storage } = require('@google-cloud/storage');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const storage = new Storage();
const BUCKET = process.env.STUDY_MATERIALS_BUCKET || 'sdc-study-materials';

const canManageTests = requireRole('admin', 'owner', 'teacher');
const isStudent = requireRole('student');

const sign = (path, action, contentType) =>
  storage.bucket(BUCKET).file(path).getSignedUrl({
    version: 'v4',
    action,
    expires: Date.now() + (action === 'write' ? 15 : 60) * 60 * 1000,
    ...(contentType ? { contentType } : {}),
  });

// ---------- UPLOAD URLS ----------

router.post('/upload-url', verifyToken, canManageTests, async (req, res) => {
  const { filename, contentType = 'application/pdf' } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename is required' });

  try {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const gcsPath = `tests/questions/${Date.now()}-${safeFilename}`;
    const [uploadUrl] = await sign(gcsPath, 'write', contentType);
    res.json({ uploadUrl, gcsPath });
  } catch (err) {
    console.error('Test upload-url error:', err.message);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

router.post('/:id/submissions/upload-url', verifyToken, isStudent, async (req, res) => {
  const { id } = req.params;
  const { filename, contentType = 'application/pdf' } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename is required' });

  try {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const gcsPath = `tests/submissions/${id}/${req.user.sdcId}-${Date.now()}-${safeFilename}`;
    const [uploadUrl] = await sign(gcsPath, 'write', contentType);
    res.json({ uploadUrl, gcsPath });
  } catch (err) {
    console.error('Submission upload-url error:', err.message);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// ---------- TESTS ----------

router.post('/', verifyToken, canManageTests, async (req, res) => {
  const { type = 'test', title, subject, totalMarks, dueAt, questionGcsPath, batchIds } = req.body;

  if (!title || !questionGcsPath || !Array.isArray(batchIds) || batchIds.length === 0) {
    return res.status(400).json({ error: 'title, questionGcsPath, and batchIds[] are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const testResult = await client.query(
      `INSERT INTO tests (type, title, subject, total_marks, due_at, question_gcs_path, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7)
       RETURNING *`,
      [type, title, subject || null, totalMarks || null, dueAt || null, questionGcsPath, req.user.sdcId]
    );
    const test = testResult.rows[0];

    for (const batchId of batchIds) {
      await client.query(`INSERT INTO test_batches (test_id, batch_id) VALUES ($1, $2)`, [test.id, batchId]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...test, batchIds });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Test create error:', err.message);
    res.status(500).json({ error: 'Failed to create test' });
  } finally {
    client.release();
  }
});

router.patch('/:id', verifyToken, canManageTests, async (req, res) => {
  const { id } = req.params;
  const { title, subject, totalMarks, dueAt, questionGcsPath, batchIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const check = await client.query(`SELECT status FROM tests WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Test not found' });
    }
    if (check.rows[0].status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only draft tests can be edited' });
    }

    await client.query(
      `UPDATE tests SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        total_marks = COALESCE($3, total_marks),
        due_at = COALESCE($4, due_at),
        question_gcs_path = COALESCE($5, question_gcs_path),
        updated_at = now()
       WHERE id = $6`,
      [title, subject, totalMarks, dueAt, questionGcsPath, id]
    );

    if (Array.isArray(batchIds)) {
      await client.query(`DELETE FROM test_batches WHERE test_id = $1`, [id]);
      for (const batchId of batchIds) {
        await client.query(`INSERT INTO test_batches (test_id, batch_id) VALUES ($1, $2)`, [id, batchId]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Test update error:', err.message);
    res.status(500).json({ error: 'Failed to update test' });
  } finally {
    client.release();
  }
});

router.patch('/:id/publish', verifyToken, canManageTests, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE tests SET status = 'published', updated_at = now() WHERE id = $1 AND status = 'draft' RETURNING id, status`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Test not found or not in draft state' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Test publish error:', err.message);
    res.status(500).json({ error: 'Failed to publish test' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const { batchId } = req.query;

  try {
    let query, values;
    if (req.user.role === 'student') {
      query = `
        SELECT t.*, s.answer_gcs_path, s.score, s.released_at, s.submitted_at
        FROM tests t
        JOIN test_batches tb ON tb.test_id = t.id
        LEFT JOIN submissions s ON s.test_id = t.id AND s.student_sdc_id = $1
        WHERE tb.batch_id = $2 AND t.status = 'published'
        ORDER BY t.due_at ASC`;
      values = [req.user.sdcId, batchId];
    } else {
      query = `SELECT t.* FROM tests t WHERE t.created_by = $1 ORDER BY t.created_at DESC`;
      values = [req.user.sdcId];
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Test list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});














// Student: create or overwrite their submission for a test
router.post('/:id/submissions', verifyToken, isStudent, async (req, res) => {
  const { id } = req.params;
  const { answerGcsPath } = req.body;

  if (!answerGcsPath) {
    return res.status(400).json({ error: 'answerGcsPath is required' });
  }

  try {
    // confirm the test exists and is actually published
    const testCheck = await pool.query(
      `SELECT status, due_at FROM tests WHERE id = $1`,
      [id]
    );
    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    if (testCheck.rows[0].status !== 'published') {
      return res.status(400).json({ error: 'This test is not open for submissions' });
    }

    const result = await pool.query(
      `INSERT INTO submissions (test_id, student_sdc_id, answer_gcs_path, submitted_at, score, remarks, graded_at, released_at)
       VALUES ($1, $2, $3, now(), NULL, NULL, NULL, NULL)
       ON CONFLICT (test_id, student_sdc_id)
       DO UPDATE SET
         answer_gcs_path = EXCLUDED.answer_gcs_path,
         submitted_at = now(),
         score = NULL,
         remarks = NULL,
         graded_at = NULL,
         released_at = NULL
       RETURNING *`,
      [id, req.user.sdcId, answerGcsPath]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Submission create error:', err.message);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Student: view their own submission for a test
router.get('/:id/submissions/me', verifyToken, isStudent, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM submissions WHERE test_id = $1 AND student_sdc_id = $2`,
      [id, req.user.sdcId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No submission found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Submission fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});










module.exports = router;