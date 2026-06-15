const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');




// GET /admin/attendance/:lectureId
// Returns lecture info, full student list, and absent_ids
router.get('/:lectureId', verifyToken, requireRole('admin'), async (req, res) => {
  const { lectureId } = req.params;

  try {
    // Get lecture + batch_id
    const lectureResult = await pool.query(
      `SELECT id, batch_id, status, subject, topic, scheduled_at FROM lectures WHERE id = $1`,
      [lectureId]
    );

    if (lectureResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const lecture = lectureResult.rows[0];

    // Get all students in the batch
    const studentsResult = await pool.query(
    `SELECT sb.sdc_id, s.student_name as name
    FROM student_batches sb
    JOIN auth a ON a.sdc_id = sb.sdc_id
    JOIN students s ON s.auth_id = a.id
    WHERE sb.batch_id = $1`,
    [lecture.batch_id]
    );

    // Get existing attendance record if any
    const attendanceResult = await pool.query(
      `SELECT absent_ids, marked_by, marked_at FROM lecture_attendance WHERE lecture_id = $1`,
      [lectureId]
    );

    const attendance = attendanceResult.rows[0] || null;

    res.json({
      lecture,
      students: studentsResult.rows,
      absent_ids: attendance?.absent_ids || [],
      marked_by: attendance?.marked_by || null,
      marked_at: attendance?.marked_at || null,
    });
  } catch (err) {
    console.error('Attendance fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});






















// PATCH /admin/attendance/:lectureId
// Upsert absent_ids — locked once lecture is conducted/cancelled
router.patch('/:lectureId', verifyToken,requireRole('admin'), async (req, res) => {
  const { lectureId } = req.params;
  const { absent_ids } = req.body;
  const markedBy = req.user.sdcId;

  if (!Array.isArray(absent_ids)) {
    return res.status(400).json({ error: 'absent_ids must be an array' });
  }

  try {
    // Check lecture exists and is not locked
    const lectureResult = await pool.query(
      `SELECT status FROM lectures WHERE id = $1`,
      [lectureId]
    );

    if (lectureResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const { status } = lectureResult.rows[0];

    if (status === 'conducted' || status === 'cancelled') {
      return res.status(403).json({ error: `Attendance is locked for ${status} lectures` });
    }

    // Upsert
    const result = await pool.query(
      `INSERT INTO lecture_attendance (lecture_id, absent_ids, marked_by, marked_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (lecture_id)
       DO UPDATE SET absent_ids = $2, marked_by = $3, marked_at = NOW()
       RETURNING *`,
      [lectureId, absent_ids, markedBy]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Attendance update error:', err.message);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});










module.exports = router;