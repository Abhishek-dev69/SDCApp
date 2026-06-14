const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { tableExists } = require('../utils/dbIntrospection');
const { canAccessBatch, getVisibleBatchIds } = require('../utils/batchAccess');

const canManageAcademics = requireRole('admin', 'owner', 'teacher');
const canManageFees = requireRole('admin', 'owner');

function requireTables(...tableNames) {
  return async (_req, res, next) => {
    const availability = await Promise.all(tableNames.map(tableExists));
    const missing = tableNames.filter((_name, index) => !availability[index]);
    if (missing.length > 0) {
      return res.status(501).json({
        error: `Database migration required. Missing tables: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

async function getVisibleStudents(user) {
  if (user.role === 'student') return [user.authId];

  if (user.role === 'parent') {
    const result = await pool.query(
      'SELECT student_auth_id FROM student_parents WHERE parent_auth_id = $1',
      [user.authId]
    );
    return result.rows.map((row) => row.student_auth_id);
  }

  return null;
}

router.get(
  '/attendance',
  verifyToken,
  requireTables('attendance_sessions', 'attendance_records'),
  async (req, res) => {
    try {
      const visibleStudents = await getVisibleStudents(req.user);
      const visibleBatchIds = await getVisibleBatchIds(pool, req.user);
      const values = [];
      const conditions = [];

      if (Array.isArray(visibleStudents)) {
        values.push(visibleStudents);
        conditions.push(`ar.student_auth_id = ANY($${values.length}::int[])`);
      }
      if (Array.isArray(visibleBatchIds)) {
        values.push(visibleBatchIds);
        conditions.push(`ats.batch_id = ANY($${values.length}::int[])`);
      }
      if (req.query.student_auth_id) {
        const requested = Number(req.query.student_auth_id);
        if (Array.isArray(visibleStudents) && !visibleStudents.includes(requested)) {
          return res.status(403).json({ error: 'This student is not visible to your account' });
        }
        values.push(requested);
        conditions.push(`ar.student_auth_id = $${values.length}`);
      }
      if (req.query.batch_id) {
        values.push(Number(req.query.batch_id));
        conditions.push(`ats.batch_id = $${values.length}`);
      }
      if (req.query.lecture_id) {
        values.push(Number(req.query.lecture_id));
        conditions.push(`ats.lecture_id = $${values.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const result = await pool.query(
        `SELECT ar.id, ar.student_auth_id, ar.status, ar.marked_at,
                ats.id AS session_id, ats.subject, ats.session_date,
                ats.batch_id, b.name AS batch_name
         FROM attendance_records ar
         JOIN attendance_sessions ats ON ats.id = ar.session_id
         JOIN batches b ON b.id = ats.batch_id
         ${where}
         ORDER BY ats.session_date DESC, ar.id DESC
         LIMIT 500`,
        values
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Attendance fetch error:', err.message);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }
);

router.post(
  '/attendance/sessions',
  verifyToken,
  canManageAcademics,
  requireTables('attendance_sessions'),
  async (req, res) => {
    const { lectureId, batchId, subject, sessionDate } = req.body;
    if (!batchId || !subject || !sessionDate) {
      return res.status(400).json({ error: 'batchId, subject, and sessionDate are required' });
    }

    try {
      if (!(await canAccessBatch(pool, req.user, batchId))) {
        return res.status(403).json({ error: 'This batch is not assigned to your account' });
      }

      const result = await pool.query(
        `INSERT INTO attendance_sessions (lecture_id, batch_id, subject, session_date, created_by)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (lecture_id)
         DO UPDATE SET
           batch_id = EXCLUDED.batch_id,
           subject = EXCLUDED.subject,
           session_date = EXCLUDED.session_date
         RETURNING *`,
        [lectureId || null, Number(batchId), subject, sessionDate, req.user.authId]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Attendance session create error:', err.message);
      res.status(500).json({ error: 'Failed to create attendance session' });
    }
  }
);

router.put(
  '/attendance/sessions/:id/records',
  verifyToken,
  canManageAcademics,
  requireTables('attendance_records'),
  async (req, res) => {
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    if (records.length === 0) {
      return res.status(400).json({ error: 'records must contain at least one attendance record' });
    }

    const client = await pool.connect();
    try {
      const session = await client.query(
        'SELECT batch_id FROM attendance_sessions WHERE id = $1',
        [req.params.id]
      );
      if (!session.rows[0]) return res.status(404).json({ error: 'Attendance session not found' });
      if (!(await canAccessBatch(client, req.user, session.rows[0].batch_id))) {
        return res.status(403).json({ error: 'This batch is not assigned to your account' });
      }

      const studentAuthIds = [...new Set(records.map((record) => Number(record.studentAuthId)))];
      const eligibleStudents = await client.query(
        `SELECT COUNT(DISTINCT s.auth_id)::int AS count
         FROM students s
         JOIN batches b ON b.name = s.sdc_batch
         WHERE b.id = $1 AND s.auth_id = ANY($2::int[])`,
        [session.rows[0].batch_id, studentAuthIds]
      );
      if (eligibleStudents.rows[0].count !== studentAuthIds.length) {
        return res.status(400).json({ error: 'Every attendance record must belong to the session batch' });
      }

      await client.query('BEGIN');
      for (const record of records) {
        await client.query(
          `INSERT INTO attendance_records (session_id, student_auth_id, status, marked_by)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (session_id, student_auth_id)
           DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, marked_at = NOW()`,
          [req.params.id, record.studentAuthId, record.status, req.user.authId]
        );
      }
      await client.query('COMMIT');
      res.json({ message: 'Attendance saved', records: records.length });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Attendance save error:', err.message);
      res.status(500).json({ error: 'Failed to save attendance' });
    } finally {
      client.release();
    }
  }
);

router.get('/tests', verifyToken, requireTables('tests'), async (req, res) => {
  try {
    const batchIds = await getVisibleBatchIds(pool, req.user);
    const conditions = [];
    const values = [];

    if (Array.isArray(batchIds)) {
      values.push(batchIds);
      conditions.push(`t.batch_id = ANY($${values.length}::int[])`);
      conditions.push(`t.status <> 'draft'`);
    }
    if (req.query.batch_id) {
      values.push(Number(req.query.batch_id));
      conditions.push(`t.batch_id = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT t.*, b.name AS batch_name
       FROM tests t
       JOIN batches b ON b.id = t.batch_id
       ${where}
       ORDER BY t.scheduled_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Tests fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

router.post('/tests', verifyToken, canManageAcademics, requireTables('tests'), async (req, res) => {
  const { batchId, title, subject, scheduledAt, durationMins, totalMarks, status = 'draft' } = req.body;
  if (!batchId || !title || !subject || !scheduledAt || !durationMins || !totalMarks) {
    return res.status(400).json({
      error: 'batchId, title, subject, scheduledAt, durationMins, and totalMarks are required',
    });
  }

  try {
    if (!(await canAccessBatch(pool, req.user, batchId))) {
      return res.status(403).json({ error: 'This batch is not assigned to your account' });
    }

    const result = await pool.query(
      `INSERT INTO tests (
         batch_id, title, subject, scheduled_at, duration_mins,
         total_marks, status, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [batchId, title, subject, scheduledAt, durationMins, totalMarks, status, req.user.authId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Test create error:', err.message);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

router.patch('/tests/:id', verifyToken, canManageAcademics, requireTables('tests'), async (req, res) => {
  const allowed = {
    title: 'title',
    subject: 'subject',
    scheduledAt: 'scheduled_at',
    durationMins: 'duration_mins',
    totalMarks: 'total_marks',
    status: 'status',
  };
  const values = [];
  const updates = [];
  for (const [field, column] of Object.entries(allowed)) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      values.push(req.body[field]);
      updates.push(`${column} = $${values.length}`);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No supported fields provided' });
  try {
    if (req.user.role === 'teacher') {
      const test = await pool.query('SELECT batch_id FROM tests WHERE id = $1', [req.params.id]);
      if (!test.rows[0]) return res.status(404).json({ error: 'Test not found' });
      if (!(await canAccessBatch(pool, req.user, test.rows[0].batch_id))) {
        return res.status(403).json({ error: 'This batch is not assigned to your account' });
      }
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE tests SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Test not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Test update error:', err.message);
    res.status(500).json({ error: 'Failed to update test' });
  }
});

router.get(
  '/results',
  verifyToken,
  requireTables('tests', 'test_results'),
  async (req, res) => {
    try {
      const visibleStudents = await getVisibleStudents(req.user);
      const visibleBatchIds = await getVisibleBatchIds(pool, req.user);
      const conditions = [];
      const values = [];

      if (Array.isArray(visibleStudents)) {
        values.push(visibleStudents);
        conditions.push(`tr.student_auth_id = ANY($${values.length}::int[])`);
      }
      if (Array.isArray(visibleBatchIds)) {
        values.push(visibleBatchIds);
        conditions.push(`t.batch_id = ANY($${values.length}::int[])`);
      }
      if (req.query.student_auth_id) {
        const requested = Number(req.query.student_auth_id);
        if (Array.isArray(visibleStudents) && !visibleStudents.includes(requested)) {
          return res.status(403).json({ error: 'This student is not visible to your account' });
        }
        values.push(requested);
        conditions.push(`tr.student_auth_id = $${values.length}`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const result = await pool.query(
        `SELECT tr.*, t.title, t.subject, t.total_marks, t.scheduled_at, t.batch_id,
                b.name AS batch_name
         FROM test_results tr
         JOIN tests t ON t.id = tr.test_id
         JOIN batches b ON b.id = t.batch_id
         ${where}
         ORDER BY t.scheduled_at DESC`,
        values
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Results fetch error:', err.message);
      res.status(500).json({ error: 'Failed to fetch results' });
    }
  }
);

router.put(
  '/tests/:testId/results',
  verifyToken,
  canManageAcademics,
  requireTables('test_results'),
  async (req, res) => {
    const results = Array.isArray(req.body.results) ? req.body.results : [];
    if (results.length === 0) {
      return res.status(400).json({ error: 'results must contain at least one result' });
    }

    const client = await pool.connect();
    try {
      const test = await client.query('SELECT batch_id FROM tests WHERE id = $1', [req.params.testId]);
      if (!test.rows[0]) return res.status(404).json({ error: 'Test not found' });
      if (!(await canAccessBatch(client, req.user, test.rows[0].batch_id))) {
        return res.status(403).json({ error: 'This batch is not assigned to your account' });
      }

      const studentAuthIds = [...new Set(results.map((result) => Number(result.studentAuthId)))];
      const eligibleStudents = await client.query(
        `SELECT COUNT(DISTINCT s.auth_id)::int AS count
         FROM students s
         JOIN batches b ON b.name = s.sdc_batch
         WHERE b.id = $1 AND s.auth_id = ANY($2::int[])`,
        [test.rows[0].batch_id, studentAuthIds]
      );
      if (eligibleStudents.rows[0].count !== studentAuthIds.length) {
        return res.status(400).json({ error: 'Every result must belong to a student in the test batch' });
      }

      await client.query('BEGIN');
      for (const result of results) {
        await client.query(
          `INSERT INTO test_results (
             test_id, student_auth_id, marks, rank, remarks, published_at
           ) VALUES ($1,$2,$3,$4,$5,NOW())
           ON CONFLICT (test_id, student_auth_id)
           DO UPDATE SET marks = EXCLUDED.marks, rank = EXCLUDED.rank,
                         remarks = EXCLUDED.remarks, published_at = NOW()`,
          [
            req.params.testId,
            result.studentAuthId,
            result.marks,
            result.rank || null,
            result.remarks || null,
          ]
        );
      }
      await client.query('UPDATE tests SET status = $1, updated_at = NOW() WHERE id = $2', [
        'published',
        req.params.testId,
      ]);
      await client.query('COMMIT');
      res.json({ message: 'Results published', results: results.length });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Results publish error:', err.message);
      res.status(500).json({ error: 'Failed to publish results' });
    } finally {
      client.release();
    }
  }
);

router.get('/homework', verifyToken, requireTables('homework', 'homework_submissions'), async (req, res) => {
  try {
    const batchIds = await getVisibleBatchIds(pool, req.user);
    const conditions = [];
    const values = [];
    if (Array.isArray(batchIds)) {
      values.push(batchIds);
      conditions.push(`h.batch_id = ANY($${values.length}::int[])`);
    }
    if (req.query.batch_id) {
      values.push(Number(req.query.batch_id));
      conditions.push(`h.batch_id = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT h.*, b.name AS batch_name,
              hs.id AS submission_id, hs.status AS submission_status,
              hs.submission_url, hs.submitted_at, hs.score, hs.feedback
       FROM homework h
       JOIN batches b ON b.id = h.batch_id
       LEFT JOIN homework_submissions hs
         ON hs.homework_id = h.id
        AND hs.student_auth_id = $${values.length + 1}
       ${where}
       ORDER BY h.due_at ASC`,
      [...values, req.user.role === 'student' ? req.user.authId : -1]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Homework fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

router.post('/homework', verifyToken, canManageAcademics, requireTables('homework'), async (req, res) => {
  const { batchId, title, subject, description, dueAt } = req.body;
  if (!batchId || !title || !subject || !dueAt) {
    return res.status(400).json({ error: 'batchId, title, subject, and dueAt are required' });
  }
  try {
    if (!(await canAccessBatch(pool, req.user, batchId))) {
      return res.status(403).json({ error: 'This batch is not assigned to your account' });
    }

    const result = await pool.query(
      `INSERT INTO homework (batch_id, title, subject, description, due_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [batchId, title, subject, description || null, dueAt, req.user.authId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Homework create error:', err.message);
    res.status(500).json({ error: 'Failed to create homework' });
  }
});

router.post(
  '/homework/:id/submission',
  verifyToken,
  requireRole('student'),
  requireTables('homework_submissions'),
  async (req, res) => {
    try {
      const homework = await pool.query('SELECT batch_id FROM homework WHERE id = $1', [req.params.id]);
      if (!homework.rows[0]) return res.status(404).json({ error: 'Homework not found' });
      if (!(await canAccessBatch(pool, req.user, homework.rows[0].batch_id))) {
        return res.status(403).json({ error: 'This homework is not assigned to your batch' });
      }

      const result = await pool.query(
        `INSERT INTO homework_submissions (
           homework_id, student_auth_id, status, submission_url, submitted_at
         ) VALUES ($1,$2,'submitted',$3,NOW())
         ON CONFLICT (homework_id, student_auth_id)
         DO UPDATE SET status = 'submitted', submission_url = EXCLUDED.submission_url, submitted_at = NOW()
         RETURNING *`,
        [req.params.id, req.user.authId, req.body.submissionUrl || null]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Homework submission error:', err.message);
      res.status(500).json({ error: 'Failed to submit homework' });
    }
  }
);

router.patch(
  '/homework/submissions/:id',
  verifyToken,
  canManageAcademics,
  requireTables('homework_submissions'),
  async (req, res) => {
    const { status = 'reviewed', score, feedback } = req.body;
    try {
      if (req.user.role === 'teacher') {
        const submission = await pool.query(
          `SELECT h.batch_id
           FROM homework_submissions hs
           JOIN homework h ON h.id = hs.homework_id
           WHERE hs.id = $1`,
          [req.params.id]
        );
        if (!submission.rows[0]) return res.status(404).json({ error: 'Submission not found' });
        if (!(await canAccessBatch(pool, req.user, submission.rows[0].batch_id))) {
          return res.status(403).json({ error: 'This batch is not assigned to your account' });
        }
      }

      const result = await pool.query(
        `UPDATE homework_submissions
         SET status = $1, score = $2, feedback = $3
         WHERE id = $4
         RETURNING *`,
        [status, score ?? null, feedback || null, req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Submission not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Homework review error:', err.message);
      res.status(500).json({ error: 'Failed to review homework' });
    }
  }
);

router.get('/fees', verifyToken, requireTables('fee_invoices'), async (req, res) => {
  try {
    const visibleStudents = await getVisibleStudents(req.user);
    const conditions = [];
    const values = [];
    if (Array.isArray(visibleStudents)) {
      values.push(visibleStudents);
      conditions.push(`fi.student_auth_id = ANY($${values.length}::int[])`);
    }
    if (req.query.student_auth_id) {
      const requested = Number(req.query.student_auth_id);
      if (Array.isArray(visibleStudents) && !visibleStudents.includes(requested)) {
        return res.status(403).json({ error: 'This student is not visible to your account' });
      }
      values.push(requested);
      conditions.push(`fi.student_auth_id = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT fi.*, a.name AS student_name, a.sdc_id AS student_sdc_id,
              s.sdc_batch AS batch_name, b.id AS batch_id, b.location AS batch_location
       FROM fee_invoices fi
       JOIN auth a ON a.id = fi.student_auth_id
       LEFT JOIN students s ON s.auth_id = fi.student_auth_id
       LEFT JOIN batches b ON b.name = s.sdc_batch
       ${where}
       ORDER BY fi.due_date DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fees fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

router.post('/fees', verifyToken, canManageFees, requireTables('fee_invoices'), async (req, res) => {
  const { studentAuthId, description, amount, dueDate } = req.body;
  if (!studentAuthId || !description || amount === undefined || !dueDate) {
    return res.status(400).json({ error: 'studentAuthId, description, amount, and dueDate are required' });
  }
  try {
    const student = await pool.query(
      `SELECT 1
       FROM students
       WHERE auth_id = $1
       LIMIT 1`,
      [studentAuthId]
    );
    if (!student.rows[0]) {
      return res.status(400).json({ error: 'studentAuthId must belong to a student profile' });
    }

    const result = await pool.query(
      `INSERT INTO fee_invoices (student_auth_id, description, amount, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [studentAuthId, description, amount, dueDate, req.user.authId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Fee invoice create error:', err.message);
    res.status(500).json({ error: 'Failed to create fee invoice' });
  }
});

router.patch('/fees/:id', verifyToken, canManageFees, requireTables('fee_invoices'), async (req, res) => {
  const { amountPaid, status, paymentReference } = req.body;
  if (amountPaid === undefined && !status && paymentReference === undefined) {
    return res.status(400).json({ error: 'No payment fields were provided' });
  }
  try {
    const result = await pool.query(
      `UPDATE fee_invoices
       SET amount_paid = COALESCE($1, amount_paid),
           status = COALESCE($2, status),
           payment_reference = COALESCE($3, payment_reference),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [amountPaid ?? null, status || null, paymentReference ?? null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Fee invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fee invoice update error:', err.message);
    res.status(500).json({ error: 'Failed to update fee invoice' });
  }
});

router.get('/doubts', verifyToken, requireTables('doubts'), async (req, res) => {
  try {
    const visibleStudents = await getVisibleStudents(req.user);
    const visibleBatchIds = await getVisibleBatchIds(pool, req.user);
    const values = [];
    const conditions = [];
    if (Array.isArray(visibleStudents)) {
      values.push(visibleStudents);
      conditions.push(`d.student_auth_id = ANY($${values.length}::int[])`);
    }
    if (Array.isArray(visibleBatchIds)) {
      values.push(visibleBatchIds);
      conditions.push(`d.batch_id = ANY($${values.length}::int[])`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT d.*, a.name AS student_name, t.name AS teacher_name
       FROM doubts d
       JOIN auth a ON a.id = d.student_auth_id
       LEFT JOIN teachers t ON t.id = d.assigned_teacher_id
       ${where}
       ORDER BY d.updated_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Doubts fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

router.post(
  '/doubts',
  verifyToken,
  requireRole('student'),
  requireTables('doubts'),
  async (req, res) => {
    const { subject, title, description } = req.body;
    if (!subject || !title || !description) {
      return res.status(400).json({ error: 'subject, title, and description are required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO doubts (student_auth_id, batch_id, subject, title, description)
         SELECT $1, b.id, $2, $3, $4
         FROM students s
         LEFT JOIN batches b ON b.name = s.sdc_batch
         WHERE s.auth_id = $1
         RETURNING *`,
        [req.user.authId, subject, title, description]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Student profile is not linked to this account' });
      }
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Doubt create error:', err.message);
      res.status(500).json({ error: 'Failed to create doubt' });
    }
  }
);

router.patch(
  '/doubts/:id',
  verifyToken,
  canManageAcademics,
  requireTables('doubts'),
  async (req, res) => {
    const { status, assignedTeacherId } = req.body;
    if (!status && assignedTeacherId === undefined) {
      return res.status(400).json({ error: 'status or assignedTeacherId is required' });
    }
    try {
      if (req.user.role === 'teacher') {
        const doubtResult = await pool.query(
          `SELECT d.batch_id, d.assigned_teacher_id,
                  assigned.auth_id AS assigned_teacher_auth_id,
                  current_teacher.id AS current_teacher_id
           FROM doubts d
           LEFT JOIN teachers assigned ON assigned.id = d.assigned_teacher_id
           LEFT JOIN teachers current_teacher ON current_teacher.auth_id = $2
           WHERE d.id = $1`,
          [req.params.id, req.user.authId]
        );
        const doubt = doubtResult.rows[0];
        if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
        if (!(await canAccessBatch(pool, req.user, doubt.batch_id))) {
          return res.status(403).json({ error: 'This batch is not assigned to your account' });
        }
        if (
          doubt.assigned_teacher_id
          && doubt.assigned_teacher_auth_id !== req.user.authId
        ) {
          return res.status(403).json({ error: 'This doubt is assigned to another teacher' });
        }
        if (
          assignedTeacherId !== undefined
          && Number(assignedTeacherId) !== doubt.current_teacher_id
        ) {
          return res.status(403).json({ error: 'Teachers can only assign a doubt to themselves' });
        }
      }

      const result = await pool.query(
        `UPDATE doubts
         SET status = COALESCE($1, status),
             assigned_teacher_id = COALESCE($2, assigned_teacher_id),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status || null, assignedTeacherId ?? null, req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Doubt not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Doubt update error:', err.message);
      res.status(500).json({ error: 'Failed to update doubt' });
    }
  }
);

router.get(
  '/doubts/:id/messages',
  verifyToken,
  requireTables('doubts', 'doubt_messages'),
  async (req, res) => {
    try {
      const access = await pool.query(
        `SELECT d.student_auth_id, t.auth_id AS teacher_auth_id,
                EXISTS (
                  SELECT 1 FROM student_parents sp
                  WHERE sp.student_auth_id = d.student_auth_id
                    AND sp.parent_auth_id = $2
                ) AS is_linked_parent
         FROM doubts d
         LEFT JOIN teachers t ON t.id = d.assigned_teacher_id
         WHERE d.id = $1`,
        [req.params.id, req.user.authId]
      );
      const doubt = access.rows[0];
      const canView = doubt && (
        ['admin', 'owner'].includes(req.user.role)
        || doubt.student_auth_id === req.user.authId
        || doubt.teacher_auth_id === req.user.authId
        || doubt.is_linked_parent
      );
      if (!canView) return res.status(403).json({ error: 'You cannot access this doubt' });

      const result = await pool.query(
        `SELECT dm.id, dm.message, dm.created_at, dm.sender_auth_id, a.name AS sender_name
         FROM doubt_messages dm
         JOIN auth a ON a.id = dm.sender_auth_id
         WHERE dm.doubt_id = $1
         ORDER BY dm.created_at ASC, dm.id ASC`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Doubt messages fetch error:', err.message);
      res.status(500).json({ error: 'Failed to fetch doubt messages' });
    }
  }
);

router.post(
  '/doubts/:id/messages',
  verifyToken,
  requireTables('doubts', 'doubt_messages'),
  async (req, res) => {
    if (!req.body.message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    try {
      const access = await pool.query(
        `SELECT d.student_auth_id, t.auth_id AS teacher_auth_id,
                EXISTS (
                  SELECT 1
                  FROM student_parents sp
                  WHERE sp.student_auth_id = d.student_auth_id
                    AND sp.parent_auth_id = $2
                ) AS is_linked_parent
         FROM doubts d
         LEFT JOIN teachers t ON t.id = d.assigned_teacher_id
         WHERE d.id = $1`,
        [req.params.id, req.user.authId]
      );
      const doubt = access.rows[0];
      const canReply = doubt && (
        ['admin', 'owner'].includes(req.user.role)
        || doubt.student_auth_id === req.user.authId
        || doubt.teacher_auth_id === req.user.authId
        || doubt.is_linked_parent
      );
      if (!canReply) {
        return res.status(403).json({ error: 'You cannot access this doubt' });
      }

      const result = await pool.query(
        `INSERT INTO doubt_messages (doubt_id, sender_auth_id, message)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [req.params.id, req.user.authId, req.body.message.trim()]
      );
      await pool.query('UPDATE doubts SET updated_at = NOW() WHERE id = $1', [req.params.id]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Doubt message error:', err.message);
      res.status(500).json({ error: 'Failed to send doubt message' });
    }
  }
);

module.exports = router;
