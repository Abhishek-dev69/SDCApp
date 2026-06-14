const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { canAccessBatch, getVisibleBatchIds } = require('../utils/batchAccess');

const canPostAnnouncements = requireRole('teacher', 'admin', 'owner');

router.get('/', verifyToken, async (req, res) => {
  const requestedBatchId = req.query.batch_id;

  if (requestedBatchId && !/^\d+$/.test(String(requestedBatchId))) {
    return res.status(400).json({ error: 'batch_id must be an integer' });
  }

  try {
    const visibleBatchIds = await getVisibleBatchIds(pool, req.user);
    if (
      requestedBatchId
      && Array.isArray(visibleBatchIds)
      && !visibleBatchIds.includes(Number(requestedBatchId))
    ) {
      return res.status(403).json({ error: 'This batch is not visible to your account' });
    }

    const values = [];
    const conditions = [];

    if (Array.isArray(visibleBatchIds)) {
      values.push(visibleBatchIds);
      conditions.push(`(a.batch_id IS NULL OR a.batch_id = ANY($${values.length}::int[]))`);
    }
    if (requestedBatchId) {
      values.push(Number(requestedBatchId));
      conditions.push(`(a.batch_id IS NULL OR a.batch_id = $${values.length})`);
    }
    const visibility = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT a.id, a.title, a.content, a.batch_id, a.created_at, a.updated_at,
              au.name AS posted_by_name, b.name AS batch_name
       FROM announcements a
       JOIN auth au ON au.id = a.posted_by
       LEFT JOIN batches b ON b.id = a.batch_id
       ${visibility}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT 100`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Announcements fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/', verifyToken, canPostAnnouncements, async (req, res) => {
  const { title, content, batch_id: batchId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  if (batchId && !/^\d+$/.test(String(batchId))) {
    return res.status(400).json({ error: 'batch_id must be an integer' });
  }

  try {
    if (req.user.role === 'teacher' && !batchId) {
      return res.status(403).json({ error: 'Teachers must post announcements to an assigned batch' });
    }
    if (batchId && !(await canAccessBatch(pool, req.user, batchId))) {
      return res.status(403).json({ error: 'This batch is not assigned to your account' });
    }

    const result = await pool.query(
      `INSERT INTO announcements (title, content, batch_id, posted_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, batch_id, created_at, updated_at`,
      [
        String(title).trim(),
        String(content).trim(),
        batchId ? Number(batchId) : null,
        req.user.authId,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Announcement post error:', err.message);
    const status = err.code === '23503' ? 400 : 500;
    res.status(status).json({
      error: status === 400 ? 'The selected batch does not exist' : 'Failed to post announcement',
    });
  }
});

router.delete('/:id', verifyToken, canPostAnnouncements, async (req, res) => {
  try {
    const values = [req.params.id];
    const ownerCondition = req.user.role === 'admin' || req.user.role === 'owner'
      ? ''
      : 'AND posted_by = $2';

    if (ownerCondition) values.push(req.user.authId);

    const result = await pool.query(
      `DELETE FROM announcements
       WHERE id = $1 ${ownerCondition}
       RETURNING id`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or not owned by you' });
    }

    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Announcement delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
