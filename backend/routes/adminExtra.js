const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

// 1. DISCIPLINARY LOGS
// GET /admin/disciplinary
router.get('/disciplinary', verifyToken, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, student_sdc_id, student_name, batch, incident_type, description, action_taken, logged_by, incident_date, created_at 
       FROM disciplinary_records 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Disciplinary fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch disciplinary records' });
  }
});

// POST /admin/disciplinary
router.post('/disciplinary', verifyToken, requireRole('admin', 'owner'), async (req, res) => {
  const { student_name, student_sdc_id, batch, incident_type, description, action_taken } = req.body;
  if (!student_name || !incident_type || !description) {
    return res.status(400).json({ error: 'Student name, incident type, and description are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO disciplinary_records (student_sdc_id, student_name, batch, incident_type, description, action_taken, logged_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        student_sdc_id || null,
        student_name,
        batch || 'Unassigned',
        incident_type,
        description,
        action_taken || 'Logged',
        req.user.name || 'Admin',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Disciplinary create error:', err.message);
    res.status(500).json({ error: 'Failed to log disciplinary incident' });
  }
});

// 2. PORTION TRACKER
// GET /admin/portions
router.get('/portions', verifyToken, requireRole('admin', 'owner', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, batch_name, subject, topic, percentage, logged_by, updated_at 
       FROM portion_progress 
       ORDER BY updated_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Portions fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch portion progress' });
  }
});

// POST /admin/portions
router.post('/portions', verifyToken, requireRole('admin', 'owner', 'teacher'), async (req, res) => {
  const { batch, subject, topic, percentage } = req.body;
  if (!batch || !subject || !topic) {
    return res.status(400).json({ error: 'Batch, subject, and topic are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO portion_progress (batch_name, subject, topic, percentage, logged_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        batch,
        subject,
        topic,
        Number(percentage) || 0,
        req.user.name || 'Admin',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Portion update error:', err.message);
    res.status(500).json({ error: 'Failed to update portion progress' });
  }
});

// 3. ANONYMOUS / GENERAL FEEDBACK
// GET /admin/feedback
router.get('/feedback', verifyToken, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_role, feedback_text, category, created_at 
       FROM anonymous_feedback 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Feedback fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// POST /admin/feedback (and public/student submission)
router.post('/feedback', verifyToken, async (req, res) => {
  const { feedback_text, category } = req.body;
  if (!feedback_text) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO anonymous_feedback (user_role, feedback_text, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        req.user?.role || 'anonymous',
        feedback_text,
        category || 'General',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Feedback submission error:', err.message);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// 4. SMS / WHATSAPP BROADCAST LOGS
// GET /admin/broadcast
router.get('/broadcast', verifyToken, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, batch_name, channel, template, message, sent_by, recipient_count, created_at 
       FROM broadcast_logs 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Broadcast fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch broadcast logs' });
  }
});

// POST /admin/broadcast
router.post('/broadcast', verifyToken, requireRole('admin', 'owner'), async (req, res) => {
  const { batchName, channel, template, message } = req.body;
  if (!batchName || !channel || !message) {
    return res.status(400).json({ error: 'Batch name, channel, and message are required' });
  }

  try {
    // Estimate recipient count from student list in batch
    const studentCountRes = await pool.query(
      `SELECT COUNT(*) FROM students WHERE sdc_batch = $1`,
      [batchName]
    );
    const recipientCount = parseInt(studentCountRes.rows[0]?.count || '35', 10);

    const result = await pool.query(
      `INSERT INTO broadcast_logs (batch_name, channel, template, message, sent_by, recipient_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        batchName,
        channel || 'WhatsApp',
        template || 'General',
        message,
        req.user.name || 'SDC Admin',
        recipientCount,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Broadcast create error:', err.message);
    res.status(500).json({ error: 'Failed to record broadcast' });
  }
});

module.exports = router;
