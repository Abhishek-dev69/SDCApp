const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

// GET /announcements - students and parents view announcements
router.get('/', verifyToken, async (req, res) => {
  const { batch_id } = req.query;

  try {
    // Return global announcements + batch specific ones
    const result = await pool.query(
      `SELECT a.*, auth.name as posted_by_name 
       FROM announcements a
       JOIN auth ON a.posted_by = auth.id
       WHERE a.batch_id IS NULL 
       OR a.batch_id = $1
       ORDER BY a.created_at DESC`,
      [batch_id || null]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Announcements fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /announcements - teachers only
router.post('/', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  const { title, content, batch_id } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, batch_id, posted_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, batch_id || null, req.user.authId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Announcement post error:', err.message);
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// DELETE /announcements/:id - teachers and admins only
router.delete('/:id', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM announcements WHERE id = $1 AND posted_by = $2',
      [req.params.id, req.user.authId]
    );
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Announcement delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;