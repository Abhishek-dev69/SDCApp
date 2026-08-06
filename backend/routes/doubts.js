const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Helper to check and ensure doubts table exists
async function ensureDoubtsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS doubts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id text NOT NULL,
      student_name text DEFAULT 'Student',
      question text NOT NULL,
      subject text NOT NULL,
      batch_code text DEFAULT 'General',
      attachment_url text,
      status text NOT NULL DEFAULT 'pending',
      answer text,
      answered_by text,
      answered_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error('Failed to create doubts table:', err.message);
  }
}

// Ensure table exists on route init
ensureDoubtsTable();

// POST /doubts — Create a student doubt
router.post('/', verifyToken, async (req, res) => {
  const { question, subject, batchCode, attachmentUrl, fileSize } = req.body;

  if (!question || !subject) {
    return res.status(400).json({ error: 'Question and subject are required' });
  }

  // Max 15MB file size limit check
  if (fileSize && fileSize > 15 * 1024 * 1024) {
    return res.status(400).json({ error: 'Attachment exceeds maximum limit of 15MB' });
  }

  try {
    await ensureDoubtsTable();
    const studentId = req.user.sdcId || req.user.authId || 'student';
    const studentName = req.user.name || 'Student';

    const result = await pool.query(
      `INSERT INTO doubts (student_id, student_name, question, subject, batch_code, attachment_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [studentId, studentName, question, subject, batchCode || 'General', attachmentUrl || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /doubts error:', err.message);
    res.status(500).json({ error: 'Failed to submit doubt' });
  }
});

// GET /doubts — List doubts with filtering
router.get('/', verifyToken, async (req, res) => {
  const { subject, batchCode, status, mine } = req.query;

  try {
    await ensureDoubtsTable();
    let query = `SELECT * FROM doubts WHERE 1=1`;
    const params = [];

    if (subject && subject !== 'All') {
      params.push(subject);
      query += ` AND LOWER(subject) = LOWER($${params.length})`;
    }

    if (batchCode && batchCode !== 'All') {
      params.push(batchCode);
      query += ` AND LOWER(batch_code) = LOWER($${params.length})`;
    }

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (mine === 'true') {
      const studentId = req.user.sdcId || req.user.authId;
      if (studentId) {
        params.push(studentId);
        query += ` AND student_id = $${params.length}`;
      }
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /doubts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// POST /doubts/:id/answer — Teacher/Admin answers a doubt
router.post('/:id/answer', verifyToken, requireRole('teacher', 'admin', 'owner'), async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: 'Answer content is required' });
  }

  try {
    await ensureDoubtsTable();
    const teacherName = req.user.name || req.user.sdcId || 'Teacher';

    const result = await pool.query(
      `UPDATE doubts
       SET answer = $1, answered_by = $2, answered_at = NOW(), status = 'resolved'
       WHERE id = $3
       RETURNING *`,
      [answer.trim(), teacherName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /doubts/:id/answer error:', err.message);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

module.exports = router;
