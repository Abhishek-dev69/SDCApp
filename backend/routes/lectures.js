const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { canAccessBatch, getVisibleBatchIds } = require('../utils/batchAccess');

const canManageLectures = requireRole('teacher', 'admin', 'owner');
const REQUEST_TO_DB_STATUS = {
  scheduled: 'scheduled',
  live: 'in_progress',
  in_progress: 'in_progress',
  completed: 'conducted',
  conducted: 'conducted',
  cancelled: 'cancelled',
};
const DB_TO_CLIENT_STATUS = {
  in_progress: 'live',
  conducted: 'completed',
};

function formatLecture(row) {
  const status = DB_TO_CLIENT_STATUS[row.status] || row.status;
  return {
    id: row.id,
    batchId: row.batch_id,
    batch: row.batch_name,
    batchName: row.batch_name,
    location: row.location,
    subject: row.subject,
    topic: row.topic,
    teacherName: row.teacher_name,
    scheduledAt: row.scheduled_at,
    durationMins: row.duration_mins,
    status,
    databaseStatus: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Compatibility fields for the timetable added on main.
    batch_id: row.batch_id,
    batch_name: row.batch_name,
    teacher_name: row.teacher_name,
    scheduled_at: row.scheduled_at,
    duration_mins: row.duration_mins,
  };
}

async function requireLectureAccess(req, res, lectureId, requestedBatchId = null) {
  const result = await pool.query(
    'SELECT batch_id FROM lectures WHERE id = $1',
    [lectureId]
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Lecture not found' });
    return null;




// =============================== ADMIN ROUTES ==============================================================



// GET /admin/lectures — all lectures with batch name

router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query params are required' });
  }

  const batchId = requestedBatchId || result.rows[0].batch_id;
  if (!(await canAccessBatch(pool, req.user, batchId))) {
    res.status(403).json({ error: 'This batch is not assigned to your account' });
    return null;
  }
  return result.rows[0];
}

router.get('/batches', verifyToken, canManageLectures, async (req, res) => {
  try {
    const visibleBatchIds = await getVisibleBatchIds(pool, req.user);
    const values = [];
    const conditions = ['COALESCE(is_active, true) = true'];
    if (Array.isArray(visibleBatchIds)) {
      values.push(visibleBatchIds);
      conditions.push(`id = ANY($${values.length}::int[])`);
    }

    const result = await pool.query(
      `SELECT id, name, location, standard, academic_year
       FROM batches
       WHERE ${conditions.join(' AND ')}
       ORDER BY location, name`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Lecture batch list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const { batch_id: requestedBatchId, subject, status, from, to } = req.query;
  const conditions = [];
  const values = [];

  if (requestedBatchId && !/^\d+$/.test(String(requestedBatchId))) {
    return res.status(400).json({ error: 'batch_id must be an integer' });
  }
  if (status && !REQUEST_TO_DB_STATUS[status]) {
    return res.status(400).json({
      error: `status must be one of: ${Object.keys(REQUEST_TO_DB_STATUS).join(', ')}`,
    });
  }
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const rangeDays = (toDate - fromDate) / 86400000;
    if (!Number.isFinite(rangeDays) || rangeDays < 0 || rangeDays > 31) {
      return res.status(400).json({ error: 'Invalid date range. Maximum range is 31 days.' });
    }




// POST /admin/lectures — create a new lecture

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { batch_id, subject, topic, teacher_name, scheduled_at, duration_mins } = req.body;
  const created_by = req.user.sdcId;

  if (!batch_id || !subject || !scheduled_at || !duration_mins) {
    return res.status(400).json({ error: 'batch_id, subject, scheduled_at, and duration_mins are required' });
  }

  try {
    const allowedBatchIds = await getVisibleBatchIds(pool, req.user);
    if (Array.isArray(allowedBatchIds)) {
      values.push(allowedBatchIds);
      conditions.push(`l.batch_id = ANY($${values.length}::int[])`);
    }
    if (requestedBatchId) {
      values.push(Number(requestedBatchId));
      conditions.push(`l.batch_id = $${values.length}`);
    }
    if (subject) {
      values.push(subject);
      conditions.push(`l.subject ILIKE $${values.length}`);
    }
    if (status) {
      values.push(REQUEST_TO_DB_STATUS[status]);
      conditions.push(`l.status = $${values.length}`);
    }
    if (from) {
      values.push(from);
      conditions.push(`l.scheduled_at >= $${values.length}::timestamptz`);
    }
    if (to) {
      values.push(to);
      conditions.push(`l.scheduled_at < $${values.length}::timestamptz`);
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    values.push(limit);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT l.*, b.name AS batch_name, b.location
       FROM lectures l
       LEFT JOIN batches b ON b.id = l.batch_id
       ${where}
       ORDER BY l.scheduled_at ASC, l.id ASC
       LIMIT $${values.length}`,
      values
    );
    res.json(result.rows.map(formatLecture));
  } catch (err) {
    console.error('Lecture list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lectures' });
  }
});

router.post('/', verifyToken, canManageLectures, async (req, res) => {
  const batchId = req.body.batchId || req.body.batch_id;
  const subject = req.body.subject;
  const topic = req.body.topic;
  const teacherName = req.body.teacherName || req.body.teacher_name;
  const scheduledAt = req.body.scheduledAt || req.body.scheduled_at;
  const durationMins = req.body.durationMins || req.body.duration_mins;
  const notes = req.body.notes;

  if (!batchId || !subject || !scheduledAt || !durationMins) {
    return res.status(400).json({
      error: 'batchId, subject, scheduledAt, and durationMins are required',
    });
  }



// PATCH /admin/lectures/:id — edit a scheduled lecture

router.patch('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { subject, topic, teacher_name, scheduled_at, duration_mins } = req.body;

  try {
    if (!(await canAccessBatch(pool, req.user, batchId))) {
      return res.status(403).json({ error: 'This batch is not assigned to your account' });
    }
    const result = await pool.query(
      `INSERT INTO lectures (
         batch_id, subject, topic, teacher_name, scheduled_at,
         duration_mins, status, notes, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,'scheduled',$7,$8)
       RETURNING *`,
      [
        Number(batchId),
        String(subject).trim(),
        topic ? String(topic).trim() : null,
        teacherName ? String(teacherName).trim() : req.user.name || null,
        scheduledAt,
        Number(durationMins),
        notes || null,
        req.user.sdcId,
      ]
    );
    res.status(201).json(formatLecture(result.rows[0]));
  } catch (err) {
    console.error('Lecture create error:', err.message);
    const statusCode = ['23503', '23514', '22P02'].includes(err.code) ? 400 : 500;
    res.status(statusCode).json({
      error: statusCode === 400 ? 'Invalid batch, status, date, or duration' : 'Failed to create lecture',
    });
  }
});



// PATCH /admin/lectures/:id/start

router.patch('/:id/start', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    if (!(await requireLectureAccess(req, res, req.params.id))) return;
    const result = await pool.query(
      `UPDATE lectures
       SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'scheduled'
       RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Lecture is not in the scheduled state' });
    }
    res.json(formatLecture(result.rows[0]));
  } catch (err) {
    console.error('Lecture start error:', err.message);
    res.status(500).json({ error: 'Failed to start lecture' });
  }
});



// PATCH /admin/lectures/:id/complete

router.patch('/:id/complete', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    if (!(await requireLectureAccess(req, res, req.params.id))) return;
    const result = await pool.query(
      `UPDATE lectures
       SET status = 'conducted', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Lecture is not currently in progress' });
    }
    res.json(formatLecture(result.rows[0]));
  } catch (err) {
    console.error('Lecture completion error:', err.message);
    res.status(500).json({ error: 'Failed to complete lecture' });
  }
});



// PATCH /admin/lectures/:id/cancel — cancel + notification fan-out

router.patch('/:id/cancel', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    if (!(await requireLectureAccess(req, res, req.params.id))) return;
    const result = await pool.query(
      `UPDATE lectures
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status IN ('scheduled', 'in_progress')
       RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Lecture cannot be cancelled in its current state' });
    }
    res.json(formatLecture(result.rows[0]));
  } catch (err) {
    console.error('Lecture cancellation error:', err.message);
    res.status(500).json({ error: 'Failed to cancel lecture' });
  }
});

// GET /admin/batches — for dropdowns in lecture forms

router.get('/batches', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, location FROM batches WHERE is_active = true ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /admin/batches:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});




// ============================== STUDENT ROUTES ==============================================================

// GET /lectures/my — student's own batch lectures

router.get('/my', verifyToken, requireRole('student'), async (req, res) => {
  const { from, to } = req.query;
  const sdcId = req.user.sdcId;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query params are required' });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = (toDate - fromDate) / (1000 * 60 * 60 * 24);

  if (isNaN(diffDays) || diffDays < 0 || diffDays > 31) {
    return res.status(400).json({ error: 'Invalid date range. Max range is 31 days.' });
  }

  try {
    const targetBatchId = req.body.batchId || req.body.batch_id;
    const lecture = await requireLectureAccess(req, res, req.params.id, targetBatchId);
    if (!lecture) return;
    values.push(req.params.id);
    const result = await pool.query(
      `SELECT l.id, l.subject, l.topic, l.teacher_name, l.scheduled_at, l.duration_mins, l.status
       FROM lectures l
       JOIN student_batches sb ON sb.batch_id = l.batch_id
       WHERE sb.sdc_id = $1
       AND l.scheduled_at >= $2::timestamptz
       AND l.scheduled_at < $3::timestamptz
       ORDER BY l.scheduled_at ASC`,
      [sdcId, fromDate, toDate]
    );
    res.json(formatLecture(result.rows[0]));
  } catch (err) {
    console.error('GET /lectures/my:', err);
    res.status(500).json({ error: 'Failed to fetch lectures' });
  }
});

router.delete('/:id', verifyToken, canManageLectures, async (req, res) => {
  try {
    if (!(await requireLectureAccess(req, res, req.params.id))) return;
    const result = await pool.query(
      'DELETE FROM lectures WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    res.json({ message: 'Lecture deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Lecture delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete lecture' });
  }
});


module.exports = router;
