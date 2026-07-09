const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');



// GET /attendance — STUDENT ROUTE
router.get('/', verifyToken, requireRole('student'), async (req, res) => {
  const sdcId = req.user.sdcId;

  try {
    const result = await pool.query(
      `SELECT
         l.subject,
         l.topic,
         l.scheduled_at,
         l.status,
         (la.absent_ids IS NOT NULL AND $1 = ANY(la.absent_ids)) AS was_absent
       FROM lectures l
       JOIN student_batches sb ON sb.batch_id = l.batch_id
       LEFT JOIN lecture_attendance la ON la.lecture_id = l.id
       WHERE sb.sdc_id = $1
         AND l.status = 'conducted'
       ORDER BY l.scheduled_at ASC`,
      [sdcId]
    );

    const rows = result.rows;

    // --- Per subject ---
    const subjectMap = {};
    for (const r of rows) {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, attended: 0 };
      subjectMap[r.subject].total++;
      if (!r.was_absent) subjectMap[r.subject].attended++;
    }
    const subjects = Object.entries(subjectMap).map(([subject, v]) => ({ subject, ...v }));

    // --- Overall ---
    const totalClasses = rows.length;
    const totalAttended = rows.filter(r => !r.was_absent).length;
    const overall = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

    // --- Monthly trend ---
    const monthMap = {};
    for (const r of rows) {
      const key = new Date(r.scheduled_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { total: 0, attended: 0 };
      monthMap[key].total++;
      if (!r.was_absent) monthMap[key].attended++;
    }
    const monthly = Object.entries(monthMap).map(([month, v]) => ({
      month,
      pct: Math.round((v.attended / v.total) * 100)
    }));

    // --- Recent absences (last 10) ---
    const recentAbsences = rows
      .filter(r => r.was_absent)
      .slice(-10)
      .reverse()
      .map(r => ({ subject: r.subject, topic: r.topic, date: r.scheduled_at }));

    res.json({ overall, subjects, monthly, recentAbsences });
  } catch (err) {
    console.error('GET /attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});


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