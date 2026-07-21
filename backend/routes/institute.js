const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  inferStream,
  inferTextbookSources,
  normalizeBatch,
  tableExists,
} = require('../utils/dbIntrospection');

const canManageInstitute = requireRole('admin', 'owner', 'teacher');

function formatStudent(row) {
  return {
    id: String(row.id),
    name: row.student_name || row.name,
    rollNo: row.serial_number ? String(row.serial_number) : row.roll_no || '',
    currentClass: row.student_std || row.current_class || '',
    batch: row.sdc_batch || row.batch || 'Unassigned',
    branch: row.sdc_branch || row.branch || '',
    program: row.sdc_course_opted || row.program || '',
    phone: row.student_whatsapp_number || row.phone || '',
    email: row.email_address || row.email || '',
    status: row.status || 'Active',
  };
}

function formatTeacher(row) {
  return {
    id: String(row.id),
    name: row.name,
    subject: row.subject || '',
    experience: row.experience || '',
    phone: row.phone || '',
    batch: row.batch_code || row.batch || 'Unassigned',
    status: row.status || 'Active',
  };
}

async function listBatches() {
  if (await tableExists('batches')) {
    const result = await pool.query(
      `SELECT id, name, location AS branch, standard AS program, is_active AS active
       FROM batches
       WHERE COALESCE(is_active, true) = true
       ORDER BY name ASC`
    );
    return result.rows.map(normalizeBatch);
  }

  if (!(await tableExists('students'))) {
    return [];
  }

  const result = await pool.query(
    `SELECT
       sdc_batch AS code,
       COALESCE(sdc_branch, 'Main') AS branch,
       COALESCE(sdc_course_opted, '') AS program,
       COUNT(*)::int AS student_count
     FROM students
     WHERE sdc_batch IS NOT NULL AND TRIM(sdc_batch) <> ''
     GROUP BY sdc_batch, sdc_branch, sdc_course_opted
     ORDER BY branch ASC, code ASC`
  );

  return result.rows.map(normalizeBatch);
}

async function hydrateBatchCounts(batch) {
  const [studentCountResult, teacherTableExists] = await Promise.all([
    tableExists('students')
      ? pool.query('SELECT COUNT(*)::int AS count FROM students WHERE sdc_batch = $1', [batch.label])
      : Promise.resolve({ rows: [{ count: 0 }] }),
    tableExists('teachers'),
  ]);

  let teacherCount = 0;
  if (teacherTableExists && (await tableExists('batch_teachers'))) {
    const teacherCountResult = await pool.query(
      `SELECT COUNT(DISTINCT bt.teacher_id)::int AS count
       FROM batch_teachers bt
       JOIN batches b ON b.id = bt.batch_id
       WHERE b.id::text = $1 OR b.code = $2`,
      [batch.id, batch.label]
    );
    teacherCount = teacherCountResult.rows[0]?.count || 0;
  }

  let pendingAmount = 0;
  if (await tableExists('student_fees')) {
    const feesResult = await pool.query(
      `SELECT 
         COALESCE(SUM(sf.expected_amount), 0)::int AS expected,
         COALESCE(SUM(sf.collected_amount), 0)::int AS collected
       FROM students s
       JOIN student_fees sf ON s.id = sf.student_id
       WHERE s.sdc_batch = $1 AND s.is_active = true`,
      [batch.label]
    );
    pendingAmount = Math.max((feesResult.rows[0]?.expected || 0) - (feesResult.rows[0]?.collected || 0), 0);
  }

  return {
    ...batch,
    studentCount: studentCountResult.rows[0]?.count || batch.studentCount || 0,
    teacherCount,
    pendingAmount,
  };
}

async function getBatchByIdOrCode(idOrCode) {
  const batches = await listBatches();
  return batches.find((batch) => batch.id === String(idOrCode) || batch.label === String(idOrCode)) || null;
}

function generateSdcId(batchCode, serialNumber) {
  const cleanBatch = String(batchCode || 'SDC').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const paddedSerial = String(serialNumber || Date.now()).slice(-5).padStart(5, '0');
  return `${cleanBatch}${paddedSerial}`;
}

router.get('/batches', verifyToken, async (_req, res) => {
  try {
    const batches = await listBatches();
    const hydrated = await Promise.all(batches.map(hydrateBatchCounts));
    res.json(hydrated);
  } catch (err) {
    console.error('Batch list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.get('/admin/batches', verifyToken, canManageInstitute, async (_req, res) => {
  try {
    const batches = await listBatches();
    const hydrated = await Promise.all(batches.map(hydrateBatchCounts));
    res.json(hydrated);
  } catch (err) {
    console.error('Admin batch list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch admin batches' });
  }
});

router.post('/admin/batches', verifyToken, canManageInstitute, async (req, res) => {
  if (!(await tableExists('batches'))) {
    return res.status(501).json({ error: 'Batches table is not available. Run backend/migrations/001_core_institute.sql first.' });
  }

  const {
    batchName,
    code,
    branch,
    stream,
    program,
    capacity,
    timing,
    startDate,
    selectedSubjects,
    textbookSources,
  } = req.body;
  const batchCode = String(code || batchName || '').trim().toUpperCase();

  if (!batchCode) {
    return res.status(400).json({ error: 'Batch name/code is required' });
  }

  try {
    const normalizedProgram = program || (selectedSubjects || []).join(' + ') || inferStream(stream);
    const result = await pool.query(
      `INSERT INTO batches (code, name, branch, stream, program, capacity, timing, start_date, textbook_sources, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, code, name, branch, stream, program, capacity, timing, start_date, textbook_sources`,
      [
        batchCode,
        `${batchCode} Batch`,
        branch || 'Main',
        stream || inferStream(normalizedProgram),
        normalizedProgram,
        capacity ? Number(capacity) : null,
        timing || null,
        startDate || null,
        textbookSources || inferTextbookSources(normalizedProgram),
        req.user.authId,
      ]
    );

    res.status(201).json(normalizeBatch(result.rows[0]));
  } catch (err) {
    console.error('Batch create error:', err.message);
    const status = err.code === '23505' ? 409 : 500;
    res.status(status).json({ error: status === 409 ? 'Batch already exists' : 'Failed to create batch' });
  }
});

router.get('/admin/batches/:id/people', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const batch = await getBatchByIdOrCode(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const students = await tableExists('students')
      ? pool.query(
          `SELECT id, serial_number, student_name, student_whatsapp_number, student_std, sdc_branch, sdc_batch, sdc_course_opted, email_address
           FROM students
           WHERE sdc_batch = $1
           ORDER BY student_name ASC`,
          [batch.label]
        )
      : { rows: [] };

    let teachers = { rows: [] };
    if ((await tableExists('teachers')) && (await tableExists('batch_teachers')) && (await tableExists('batches'))) {
      teachers = await pool.query(
        `SELECT t.id, t.name, t.subject, t.experience, t.phone, t.status, b.code AS batch_code
         FROM teachers t
         JOIN batch_teachers bt ON bt.teacher_id = t.id
         JOIN batches b ON b.id = bt.batch_id
         WHERE b.id::text = $1 OR b.code = $2
         ORDER BY t.name ASC`,
        [batch.id, batch.label]
      );
    }

    res.json({
      batch,
      students: students.rows.map(formatStudent),
      teachers: teachers.rows.map(formatTeacher),
    });
  } catch (err) {
    console.error('Batch people fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batch people' });
  }
});

// router.get('/admin/students', verifyToken, canManageInstitute, async (req, res) => {
//   if (!(await tableExists('students'))) return res.json([]);

//   const { batch, q } = req.query;
//   const conditions = [];
//   const values = [];

//   if (batch) {
//     values.push(batch);
//     conditions.push(`sdc_batch = $${values.length}`);
//   }

//   if (q) {
//     values.push(`%${q}%`);
//     conditions.push(`student_name ILIKE $${values.length}`);
//   }

//   const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

//   try {
//     const result = await pool.query(
//       `SELECT id, serial_number, student_name, student_whatsapp_number, student_std, sdc_branch, sdc_batch, sdc_course_opted, email_address
//        FROM students
//        ${where}
//        ORDER BY student_name ASC
//        LIMIT 200`,
//       values
//     );

//     res.json(result.rows.map(formatStudent));
//   } catch (err) {
//     console.error('Student list error:', err.message);
//     res.status(500).json({ error: 'Failed to fetch students' });
//   }
// });

// router.post('/admin/students', verifyToken, canManageInstitute, async (req, res) => {
//   if (!(await tableExists('students'))) {
//     return res.status(501).json({ error: 'Students table is not available.' });
//   }

//   const { fullName, parentName, phone, batch, email, studentClass, branch, program, sdcId } = req.body;

//   if (!fullName || !phone || !batch) {
//     return res.status(400).json({ error: 'Student name, phone, and batch are required' });
//   }

//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     const batchInfo = await getBatchByIdOrCode(batch);
//     const resolvedBatch = batchInfo?.label || batch;
//     const resolvedBranch = branch || batchInfo?.branch || null;
//     const resolvedProgram = program || batchInfo?.program || null;

//     let parentId = null;
//     if (await tableExists('parents')) {
//       const parentResult = await client.query(
//         `INSERT INTO parents (father_name, father_whatsapp_number)
//          VALUES ($1, $2)
//          RETURNING id`,
//         [parentName || null, phone]
//       );
//       parentId = parentResult.rows[0]?.id || null;
//     }

//     const serialResult = await client.query('SELECT COALESCE(MAX(serial_number), 0) + 1 AS serial FROM students');
//     const serialNumber = serialResult.rows[0]?.serial;
//     const generatedSdcId = sdcId || generateSdcId(resolvedBatch, serialNumber);

//     const studentResult = await client.query(
//       `INSERT INTO students (
//         parent_id, serial_number, email_address, student_name, student_whatsapp_number,
//         student_std, sdc_branch, sdc_batch, sdc_course_opted
//       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
//       RETURNING id, serial_number, student_name, student_whatsapp_number, student_std, sdc_branch, sdc_batch, sdc_course_opted, email_address`,
//       [
//         parentId,
//         serialNumber,
//         email || null,
//         fullName,
//         phone,
//         studentClass || null,
//         resolvedBranch,
//         resolvedBatch,
//         resolvedProgram,
//       ]
//     );

//     if (await tableExists('auth')) {
//       await client.query(
//         `INSERT INTO auth (sdc_id, name, role, email, auth_provider, google_linked)
//          VALUES ($1, $2, 'student', $3, 'sdc', false)`,
//         [generatedSdcId, fullName, email || null]
//       );
//     }

//     await client.query('COMMIT');

//     res.status(201).json({
//       ...formatStudent(studentResult.rows[0]),
//       sdcId: generatedSdcId,
//     });
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error('Student create error:', err.message);
//     res.status(500).json({ error: 'Failed to create student' });
//   } finally {
//     client.release();
//   }
// });

router.get('/admin/teachers', verifyToken, canManageInstitute, async (req, res) => {
  if (!(await tableExists('teachers'))) return res.json([]);

  const { q } = req.query;
  const values = [];
  let where = '';

  if (q) {
    values.push(`%${q}%`);
    where = `WHERE a.name ILIKE $1 OR ts.subject ILIKE $1`;
  }

  try {
    const result = await pool.query(
      `SELECT 
         t.id, 
         a.name, 
         COALESCE(a.phone, a.phone_number) AS phone, 
         COALESCE(string_agg(DISTINCT ts.subject, ', '), 'Subject') AS subject,
         'Active' AS status
       FROM teachers t
       JOIN auth a ON t.sdc_id = a.sdc_id
       LEFT JOIN teacher_subjects ts ON t.sdc_id = ts.sdc_id
       ${where}
       GROUP BY t.id, a.name, a.phone, a.phone_number
       ORDER BY a.name ASC
       LIMIT 200`,
      values
    );
    res.json(result.rows.map(formatTeacher));
  } catch (err) {
    console.error('Teacher list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

router.post('/admin/teachers', verifyToken, canManageInstitute, async (req, res) => {
  if (!(await tableExists('teachers'))) {
    return res.status(501).json({ error: 'Teachers table is not available. Run backend/migrations/001_core_institute.sql first.' });
  }

  const { fullName, subject, experience, phone, email } = req.body;

  if (!fullName || !subject || !phone) {
    return res.status(400).json({ error: 'Teacher name, subject, and phone are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert into auth table to generate sdc_id and store details
    const authResult = await client.query(
      `INSERT INTO auth (name, email, phone_number, phone, role)
       VALUES ($1, $2, $3, $3, 'teacher')
       RETURNING id, sdc_id, name, phone`,
      [fullName, email || null, phone]
    );
    const newAuth = authResult.rows[0];

    // 2. Insert into teachers table linking with sdc_id
    const location = req.user.location || 'Main';
    const teacherResult = await client.query(
      `INSERT INTO teachers (sdc_id, location)
       VALUES ($1, $2)
       RETURNING id`,
      [newAuth.sdc_id, location]
    );
    const newTeacher = teacherResult.rows[0];

    // 3. Find a batch to assign by default (satisfying NOT NULL constraint on batch_id)
    const batchResult = await client.query(
      `SELECT id FROM batches WHERE is_active = true LIMIT 1`
    );
    const defaultBatchId = batchResult.rows[0]?.id;
    if (!defaultBatchId) {
      throw new Error('Please create at least one active batch before registering a teacher.');
    }

    // 4. Insert subject into teacher_subjects with batch_id
    await client.query(
      `INSERT INTO teacher_subjects (sdc_id, subject, batch_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [newAuth.sdc_id, subject, defaultBatchId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: newTeacher.id,
      name: newAuth.name,
      phone: newAuth.phone,
      subject: subject,
      status: 'Active',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Teacher create error:', err.message);
    res.status(500).json({ error: 'Failed to create teacher' });
  } finally {
    client.release();
  }
});

router.post('/admin/assignments', verifyToken, canManageInstitute, async (req, res) => {
  const { personType, personId, batchId } = req.body;
  const batch = await getBatchByIdOrCode(batchId);

  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  try {
    if (personType === 'student') {
      await pool.query('UPDATE students SET sdc_batch = $1, sdc_branch = $2, sdc_course_opted = $3 WHERE id = $4', [
        batch.label,
        batch.branch,
        batch.program,
        personId,
      ]);
      return res.json({ message: 'Student assigned successfully' });
    }

    if (personType === 'teacher') {
      if (!(await tableExists('batch_teachers')) || !(await tableExists('batches'))) {
        return res.status(501).json({ error: 'Batch teacher assignment tables are not available.' });
      }

      await pool.query(
        `INSERT INTO batch_teachers (batch_id, teacher_id)
         SELECT id, $1 FROM batches WHERE id::text = $2 OR code = $3
         ON CONFLICT DO NOTHING`,
        [personId, batch.id, batch.label]
      );
      return res.json({ message: 'Teacher assigned successfully' });
    }

    res.status(400).json({ error: 'personType must be student or teacher' });
  } catch (err) {
    console.error('Assignment error:', err.message);
    res.status(500).json({ error: 'Failed to assign batch' });
  }
});

router.get('/admin/overview', verifyToken, canManageInstitute, async (_req, res) => {
  try {
    const batches = await Promise.all((await listBatches()).map(hydrateBatchCounts));
    const totalStudents = batches.reduce((sum, batch) => sum + (batch.studentCount || 0), 0);
    const totalTeachers = await tableExists('teachers')
      ? (await pool.query('SELECT COUNT(*)::int AS count FROM teachers')).rows[0]?.count || 0
      : 0;

    res.json({
      totalStudents,
      totalTeachers,
      activeBatches: batches.length,
      batches,
    });
  } catch (err) {
    console.error('Overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /admin/disciplinary - Retrieve all disciplinary records
router.get('/admin/disciplinary', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM disciplinary_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch disciplinary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch disciplinary records' });
  }
});

// POST /admin/disciplinary - Add a new disciplinary record
router.post('/admin/disciplinary', verifyToken, canManageInstitute, async (req, res) => {
  const { studentSdcId, studentName, incidentType, description, actionTaken } = req.body;
  if (!studentSdcId || !incidentType) {
    return res.status(400).json({ error: 'Student SDC ID and Incident Type are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO disciplinary_records (student_sdc_id, student_name, incident_type, description, action_taken)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentSdcId, studentName || null, incidentType, description || null, actionTaken || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create disciplinary error:', err.message);
    res.status(500).json({ error: 'Failed to log disciplinary record' });
  }
});

// GET /admin/portions - Retrieve portions completion logs
router.get('/admin/portions', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM portion_progress ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch portions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch portion progress' });
  }
});

// POST /admin/portions - Log a new portion progress update
router.post('/admin/portions', verifyToken, canManageInstitute, async (req, res) => {
  const { batchName, subject, topic, percentage, loggedBy } = req.body;
  if (!batchName || !subject || !topic || percentage === undefined) {
    return res.status(400).json({ error: 'Batch Name, Subject, Topic, and Percentage are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO portion_progress (batch_name, subject, topic, percentage, logged_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [batchName, subject, topic, parseInt(percentage, 10), loggedBy || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Log portion error:', err.message);
    res.status(500).json({ error: 'Failed to log portion progress' });
  }
});

// GET /admin/feedback - Retrieve anonymous feedback logs
router.get('/admin/feedback', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anonymous_feedback ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch feedback error:', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback logs' });
  }
});

// POST /feedback - Log a new anonymous feedback (open to verified users)
router.post('/feedback', verifyToken, async (req, res) => {
  const { feedbackText, category } = req.body;
  if (!feedbackText) {
    return res.status(400).json({ error: 'Feedback text is required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO anonymous_feedback (user_role, feedback_text, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.role || 'anonymous', feedbackText, category || 'General']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create feedback error:', err.message);
    res.status(500).json({ error: 'Failed to submit anonymous feedback' });
  }
});

// GET /admin/broadcast - Retrieve all broadcasts
router.get('/admin/broadcast', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM broadcasts ORDER BY sent_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch broadcasts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch broadcast logs' });
  }
});

// POST /admin/broadcast - Log a new broadcast
router.post('/admin/broadcast', verifyToken, canManageInstitute, async (req, res) => {
  const { batchName, channel, template, message } = req.body;
  if (!batchName || !channel || !template || !message) {
    return res.status(400).json({ error: 'Batch Name, Channel, Template, and Message are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO broadcasts (batch_name, channel, template, message, status)
       VALUES ($1, $2, $3, $4, 'Sent')
       RETURNING *`,
      [batchName, channel, template, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create broadcast error:', err.message);
    res.status(500).json({ error: 'Failed to log broadcast' });
  }
});

// GET /admin/finances/summary - Expected, collected, pending, due student aggregates
router.get('/admin/finances/summary', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const summaryQuery = await pool.query(`
      SELECT 
        COALESCE(SUM(expected_amount), 0)::int AS expected_amount,
        COALESCE(SUM(collected_amount), 0)::int AS collected_amount,
        COALESCE(SUM(expected_amount - collected_amount), 0)::int AS pending_amount,
        COUNT(CASE WHEN expected_amount > collected_amount THEN 1 END)::int AS due_students,
        COUNT(CASE WHEN expected_amount > collected_amount AND due_date < NOW() THEN 1 END)::int AS overdue_students
      FROM student_fees
    `);
    
    const summary = summaryQuery.rows[0];
    const expected = summary.expected_amount || 0;
    const collected = summary.collected_amount || 0;
    summary.collection_rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
    
    res.json(summary);
  } catch (err) {
    console.error('Finances summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// GET /admin/finances/batches - Fee collection details grouped by batch
router.get('/admin/finances/batches', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.sdc_batch AS batch_name,
        COUNT(s.id)::int AS student_count,
        COALESCE(SUM(sf.expected_amount), 0)::int AS expected_amount,
        COALESCE(SUM(sf.collected_amount), 0)::int AS collected_amount,
        COALESCE(SUM(sf.expected_amount - sf.collected_amount), 0)::int AS pending_amount,
        COUNT(CASE WHEN sf.expected_amount > sf.collected_amount THEN 1 END)::int AS due_students,
        COUNT(CASE WHEN sf.expected_amount > sf.collected_amount AND sf.due_date < NOW() THEN 1 END)::int AS overdue_students
      FROM students s
      JOIN student_fees sf ON s.id = sf.student_id
      WHERE s.is_active = true AND s.sdc_batch IS NOT NULL AND s.sdc_batch != ''
      GROUP BY s.sdc_batch
      ORDER BY s.sdc_batch ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Finances batches error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batch finances' });
  }
});

// GET /admin/finances/due-students - List of students with outstanding dues
router.get('/admin/finances/due-students', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.student_name AS name,
        s.sdc_batch AS batch_id,
        s.sdc_branch AS branch,
        s.student_whatsapp_number AS phone,
        (sf.expected_amount - sf.collected_amount)::int AS amount,
        sf.due_date AS due_date,
        CASE WHEN sf.due_date < NOW() THEN 'Overdue' ELSE 'Installment due' END AS status
      FROM students s
      JOIN student_fees sf ON s.id = sf.student_id
      WHERE s.is_active = true AND sf.expected_amount > sf.collected_amount
      ORDER BY sf.due_date ASC, s.student_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Due students error:', err.message);
    res.status(500).json({ error: 'Failed to fetch due students' });
  }
});

// GET /admin/analytics/overview - Attendance, test scores, occupancy, and attention batches
router.get('/admin/analytics/overview', verifyToken, canManageInstitute, async (req, res) => {
  try {
    // 1. Avg Attendance
    const attQuery = await pool.query(`
      SELECT COALESCE(ROUND(COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 90)::int AS avg_attendance
      FROM student_attendance
    `);
    
    // 2. Avg Test Score
    const scoreQuery = await pool.query(`
      SELECT COALESCE(ROUND(AVG(score)), 80)::int AS avg_score
      FROM test_scores
    `);

    // 3. Batch Occupancy Rate
    const occupancyQuery = await pool.query(`
      SELECT 
        COALESCE(ROUND(SUM(student_count) * 100.0 / NULLIF(SUM(capacity), 0)), 88)::int AS occupancy_rate
      FROM (
        SELECT 
          s.sdc_batch,
          COUNT(s.id) AS student_count,
          40 AS capacity
        FROM students s
        WHERE s.is_active = true AND s.sdc_batch IS NOT NULL AND s.sdc_batch != ''
        GROUP BY s.sdc_batch
      ) sub
    `);

    // 4. Attention Batches
    const attentionQuery = await pool.query(`
      WITH batch_attendance AS (
        SELECT 
          s.sdc_batch,
          ROUND(COUNT(CASE WHEN sa.status IN ('Present', 'Late') THEN 1 END) * 100.0 / COUNT(*))::int AS avg_att
        FROM students s
        JOIN student_attendance sa ON s.id = sa.student_id
        WHERE s.is_active = true
        GROUP BY s.sdc_batch
      ),
      batch_scores AS (
        SELECT 
          s.sdc_batch,
          ROUND(AVG(ts.score))::int AS avg_score
        FROM students s
        JOIN test_scores ts ON s.id = ts.student_id
        WHERE s.is_active = true
        GROUP BY s.sdc_batch
      )
      SELECT 
        b.name,
        b.location AS branch,
        COALESCE(ba.avg_att, 90) AS attendance,
        COALESCE(bs.avg_score, 80) AS test_average
      FROM batches b
      LEFT JOIN batch_attendance ba ON b.name = ba.sdc_batch
      LEFT JOIN batch_scores bs ON b.name = bs.sdc_batch
      WHERE b.is_active = true AND (ba.avg_att < 92 OR bs.avg_score < 80)
    `);

    // 5. Total Pending Fees
    const pendingQuery = await pool.query(`
      SELECT COALESCE(SUM(expected_amount - collected_amount), 0)::int AS pending_amount
      FROM student_fees
    `);

    res.json({
      averageAttendance: attQuery.rows[0]?.avg_attendance || 90,
      averageScore: scoreQuery.rows[0]?.avg_score || 80,
      occupancyRate: occupancyQuery.rows[0]?.occupancy_rate || 88,
      attentionBatches: attentionQuery.rows,
      pendingAmount: pendingQuery.rows[0]?.pending_amount || 0,
    });
  } catch (err) {
    console.error('Analytics overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /admin/schedules - Fetch batch schedules (timetable)
router.get('/admin/schedules', verifyToken, canManageInstitute, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sch.id,
        b.name AS batch_name,
        sch.subject,
        a.name AS teacher_name,
        sch.day_of_week,
        sch.timing,
        sch.room
      FROM schedules sch
      JOIN batches b ON sch.batch_id = b.id
      LEFT JOIN teachers t ON sch.teacher_id = t.id
      LEFT JOIN auth a ON t.sdc_id = a.sdc_id
      ORDER BY 
        CASE sch.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        sch.timing
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Timetable schedules error:', err.message);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

module.exports = router;
