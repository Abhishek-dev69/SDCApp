// routes/admin/lectures.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path to your pg pool
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');




// =============================== ADMIN ROUTES ==============================================================



// GET /admin/lectures — all lectures with batch name

router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { from, to } = req.query;

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
    const result = await pool.query(
      `SELECT l.*, b.name AS batch_name, b.location
       FROM lectures l
       JOIN batches b ON l.batch_id = b.id
       WHERE l.scheduled_at >= $1::timestamptz AND l.scheduled_at < $2::timestamptz
       ORDER BY l.scheduled_at ASC`,
      [fromDate, toDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /admin/lectures:', err);
    res.status(500).json({ error: 'Failed to fetch lectures' });
  }
});






// POST /admin/lectures — create a new lecture

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { batch_id, subject, topic, teacher_name, scheduled_at, duration_mins } = req.body;
  const created_by = req.user.sdcId;

  if (!batch_id || !subject || !scheduled_at || !duration_mins) {
    return res.status(400).json({ error: 'batch_id, subject, scheduled_at, and duration_mins are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO lectures (batch_id, subject, topic, teacher_name, scheduled_at, duration_mins, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [batch_id, subject, topic, teacher_name, scheduled_at, duration_mins, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /admin/lectures:', err);
    res.status(500).json({ error: 'Failed to create lecture' });
  }
});




// PATCH /admin/lectures/:id — edit a scheduled lecture

router.patch('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { subject, topic, teacher_name, scheduled_at, duration_mins } = req.body;

  try {
    const check = await pool.query('SELECT status FROM lectures WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Lecture not found' });
    if (check.rows[0].status !== 'scheduled') {
      return res.status(400).json({ error: 'Only scheduled lectures can be edited' });
    }

    const result = await pool.query(
      `UPDATE lectures
       SET subject = COALESCE($1, subject),
           topic = COALESCE($2, topic),
           teacher_name = COALESCE($3, teacher_name),
           scheduled_at = COALESCE($4, scheduled_at),
           duration_mins = COALESCE($5, duration_mins),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [subject, topic, teacher_name, scheduled_at, duration_mins, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /admin/lectures/:id:', err);
    res.status(500).json({ error: 'Failed to update lecture' });
  }
});



// PATCH /admin/lectures/:id/start

router.patch('/:id/start', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE lectures
       SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'scheduled'
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Lecture not found or not in scheduled state' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /admin/lectures/:id/start:', err);
    res.status(500).json({ error: 'Failed to start lecture' });
  }
});



// PATCH /admin/lectures/:id/complete

router.patch('/:id/complete', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE lectures
       SET status = 'conducted', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Lecture not found or not in progress' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /admin/lectures/:id/complete:', err);
    res.status(500).json({ error: 'Failed to complete lecture' });
  }
});



// PATCH /admin/lectures/:id/cancel — cancel + notification fan-out

router.patch('/:id/cancel', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lectureResult = await client.query(
      `UPDATE lectures
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status IN ('scheduled', 'in_progress')
       RETURNING *`,
      [id]
    );

    if (lectureResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Lecture not found or cannot be cancelled' });
    }

    const lecture = lectureResult.rows[0];

    // // Notification fan-out 
    // try {
    //   const students = await client.query(
    //     `SELECT sdc_id FROM student_batches WHERE batch_id = $1`,
    //     [lecture.batch_id]
    //   );

    //   if (students.rows.length > 0) {
    //     const notifValues = students.rows.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
    //     const notifParams = students.rows.flatMap(({ sdc_id }) => [
    //       sdc_id,
    //       'lecture_cancelled',
    //       `Your ${lecture.subject} lecture scheduled for ${new Date(lecture.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} has been cancelled.`
    //     ]);

    //     await client.query(
    //       `INSERT INTO notifications (sdc_id, type, message) VALUES ${notifValues}`,
    //       notifParams
    //     );
    //   }
    // } catch (notifErr) {
    //   // notifications table may not exist yet — log and continue
    //   console.warn('Notification fan-out skipped:', notifErr.message);
    // }

    await client.query('COMMIT');
    res.json(lecture);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /admin/lectures/:id/cancel:', err);
    res.status(500).json({ error: 'Failed to cancel lecture' });
  } finally {
    client.release();
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
    res.json(result.rows);
  } catch (err) {
    console.error('GET /lectures/my:', err);
    res.status(500).json({ error: 'Failed to fetch lectures' });
  }
});



module.exports = router;