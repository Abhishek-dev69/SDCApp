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
      `SELECT id, code, name, branch, stream, program, capacity, timing, start_date, textbook_sources
       FROM batches
       WHERE COALESCE(active, true) = true
       ORDER BY branch ASC, code ASC`
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

  return {
    ...batch,
    studentCount: studentCountResult.rows[0]?.count || batch.studentCount || 0,
    teacherCount,
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
    where = `WHERE name ILIKE $1 OR subject ILIKE $1`;
  }

  try {
    const result = await pool.query(
      `SELECT id, name, subject, experience, phone, status
       FROM teachers
       ${where}
       ORDER BY name ASC
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

  try {
    const result = await pool.query(
      `INSERT INTO teachers (name, subject, experience, phone, email, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, subject, experience, phone, status`,
      [fullName, subject, experience || null, phone, email || null, req.user.authId]
    );

    res.status(201).json(formatTeacher(result.rows[0]));
  } catch (err) {
    console.error('Teacher create error:', err.message);
    res.status(500).json({ error: 'Failed to create teacher' });
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

module.exports = router;
