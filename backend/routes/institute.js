const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  inferStream,
  inferTextbookSources,
  tableExists,
} = require('../utils/dbIntrospection');
const { canAccessBatch, getVisibleBatchIds } = require('../utils/batchAccess');

const canViewInstitute = requireRole('admin', 'owner', 'teacher');
const canManageInstitute = requireRole('admin', 'owner');

function formatStudent(row) {
  return {
    id: String(row.id),
    authId: row.auth_id || null,
    name: row.student_name || row.name,
    rollNo: row.serial_number ? String(row.serial_number) : '',
    currentClass: row.student_std || '',
    batch: row.sdc_batch || 'Unassigned',
    branch: row.sdc_branch || '',
    program: row.sdc_course_opted || '',
    phone: row.student_whatsapp_number || '',
    email: row.email_address || '',
    status: row.status || 'Active',
  };
}

function formatTeacher(row) {
  const subjects = Array.isArray(row.subjects)
    ? row.subjects.filter(Boolean)
    : row.subject
      ? [row.subject]
      : [];

  return {
    id: String(row.id),
    name: row.name,
    subject: subjects.join(', '),
    subjects,
    experience: row.experience || '',
    phone: row.phone || '',
    email: row.email || '',
    batch: row.batch_name || row.batch || 'Unassigned',
    status: row.status || 'Active',
  };
}

function formatBatch(row) {
  const streams = Array.isArray(row.streams) ? row.streams.filter(Boolean) : [];
  const subjects = Array.isArray(row.subjects) ? row.subjects.filter(Boolean) : [];
  const program = streams.join(' + ');

  return {
    id: String(row.id),
    label: row.name,
    name: `${row.name} Batch`,
    branch: row.location || 'Main',
    location: row.location || 'Main',
    standard: row.standard || '',
    academicYear: row.academic_year || '',
    active: row.is_active !== false,
    streams,
    subjects,
    stream: streams.join(', ') || inferStream(subjects.join(' ')),
    program: program || inferStream(subjects.join(' ')),
    studentCount: Number(row.student_count || 0),
    teacherCount: Number(row.teacher_count || 0),
    timing: '',
    startDate: row.created_at || null,
    textbookSources: inferTextbookSources(program),
  };
}

function parseStringList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (!value) return [];

  return [...new Set(
    String(value)
      .split(/[,+/]/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function currentAcademicYear() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

async function listBatches(user = null) {
  const hasTeacherAssignments = await tableExists('teacher_batch_assignments');

  const teacherSelect = hasTeacherAssignments
    ? `(SELECT COUNT(DISTINCT tba.teacher_id)::int
        FROM teacher_batch_assignments tba
        WHERE tba.batch_id = b.id) AS teacher_count`
    : '0::int AS teacher_count';

  const conditions = ['COALESCE(b.is_active, true) = true'];
  const values = [];
  if (user?.role === 'teacher') {
    if (!hasTeacherAssignments || !(await tableExists('teachers'))) return [];
    values.push(user.authId);
    conditions.push(
      `EXISTS (
         SELECT 1
         FROM teachers t
         JOIN teacher_batch_assignments tba ON tba.teacher_id = t.id
         WHERE t.auth_id = $${values.length}
           AND tba.batch_id = b.id
       )`
    );
  }

  const result = await pool.query(
    `SELECT
       b.id,
       b.name,
       b.standard,
       b.academic_year,
       b.location,
       b.is_active,
       b.created_at,
       COALESCE(
         ARRAY_AGG(DISTINCT bst.stream ORDER BY bst.stream)
           FILTER (WHERE bst.stream IS NOT NULL),
         ARRAY[]::varchar[]
       ) AS streams,
       COALESCE(
         ARRAY_AGG(DISTINCT bsu.subject ORDER BY bsu.subject)
           FILTER (WHERE bsu.subject IS NOT NULL),
         ARRAY[]::varchar[]
       ) AS subjects,
       (SELECT COUNT(*)::int FROM students s WHERE s.sdc_batch = b.name) AS student_count,
       ${teacherSelect}
     FROM batches b
     LEFT JOIN batch_streams bst ON bst.batch_id = b.id
     LEFT JOIN batch_subjects bsu ON bsu.batch_id = b.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY b.id, b.name, b.standard, b.academic_year, b.location, b.is_active, b.created_at
     ORDER BY b.location ASC, b.name ASC`,
    values
  );

  return result.rows.map(formatBatch);
}

async function getBatchByIdOrName(idOrName, client = pool) {
  const value = String(idOrName || '').trim();
  if (!value) return null;

  const isIntegerId = /^\d+$/.test(value);
  const result = await client.query(
    `SELECT id, name, standard, academic_year, location, is_active, created_at
     FROM batches
     WHERE ${isIntegerId ? 'id = $1' : 'LOWER(name) = LOWER($1)'}
     LIMIT 1`,
    [isIntegerId ? Number(value) : value]
  );

  if (!result.rows[0]) return null;

  const [streamsResult, subjectsResult] = await Promise.all([
    client.query('SELECT stream FROM batch_streams WHERE batch_id = $1 ORDER BY stream', [result.rows[0].id]),
    client.query('SELECT subject FROM batch_subjects WHERE batch_id = $1 ORDER BY subject', [result.rows[0].id]),
  ]);

  return formatBatch({
    ...result.rows[0],
    streams: streamsResult.rows.map((row) => row.stream),
    subjects: subjectsResult.rows.map((row) => row.subject),
  });
}

async function getDefaultLocation(user) {
  if (!user?.sdcId || !(await tableExists('admins'))) return 'Main';

  const result = await pool.query(
    'SELECT location FROM admins WHERE sdc_id = $1 LIMIT 1',
    [user.sdcId]
  );
  return result.rows[0]?.location || 'Main';
}

function generateSdcId(batchName, serialNumber) {
  const cleanBatch = String(batchName || 'SDC').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const paddedSerial = String(serialNumber || Date.now()).slice(-5).padStart(5, '0');
  return `${cleanBatch}${paddedSerial}`;
}

router.get('/batches', verifyToken, async (req, res) => {
  try {
    res.json(await listBatches(req.user));
  } catch (err) {
    console.error('Batch list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.get('/admin/batches', verifyToken, canViewInstitute, async (req, res) => {
  try {
    res.json(await listBatches(req.user));
  } catch (err) {
    console.error('Admin batch list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch admin batches' });
  }
});

router.post('/admin/batches', verifyToken, canManageInstitute, async (req, res) => {
  const batchName = String(req.body.batchName || req.body.name || req.body.code || '').trim().toUpperCase();
  const subjects = parseStringList(req.body.selectedSubjects || req.body.subjects);
  const streams = parseStringList(req.body.streams || req.body.stream || req.body.program);
  const standard = String(req.body.standard || '12').trim();
  const academicYear = String(req.body.academicYear || currentAcademicYear()).trim();
  const location = String(req.body.location || req.body.branch || await getDefaultLocation(req.user)).trim();

  if (!batchName) {
    return res.status(400).json({ error: 'Batch name is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const duplicate = await client.query(
      `SELECT id FROM batches
       WHERE LOWER(name) = LOWER($1)
         AND LOWER(location) = LOWER($2)
         AND academic_year = $3
       LIMIT 1`,
      [batchName, location, academicYear]
    );

    if (duplicate.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This batch already exists at the selected location' });
    }

    const batchResult = await client.query(
      `INSERT INTO batches (name, standard, academic_year, is_active, location)
       VALUES ($1, $2, $3, true, $4)
       RETURNING id, name, standard, academic_year, location, is_active, created_at`,
      [batchName, standard, academicYear, location]
    );
    const batch = batchResult.rows[0];

    for (const subject of subjects) {
      await client.query(
        `INSERT INTO batch_subjects (batch_id, subject)
         VALUES ($1, $2)
         ON CONFLICT (batch_id, subject) DO NOTHING`,
        [batch.id, subject]
      );
    }

    for (const stream of streams) {
      await client.query(
        'INSERT INTO batch_streams (batch_id, stream) VALUES ($1, $2)',
        [batch.id, stream]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(formatBatch({ ...batch, subjects, streams }));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Batch create error:', err.message);
    res.status(500).json({ error: 'Failed to create batch' });
  } finally {
    client.release();
  }
});

router.get('/admin/batches/:id/people', verifyToken, canViewInstitute, async (req, res) => {
  try {
    const batch = await getBatchByIdOrName(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    if (!(await canAccessBatch(pool, req.user, batch.id))) {
      return res.status(403).json({ error: 'This batch is not assigned to your account' });
    }

    const students = await pool.query(
      `SELECT id, auth_id, serial_number, student_name, student_whatsapp_number, student_std,
              sdc_branch, sdc_batch, sdc_course_opted, email_address
       FROM students
       WHERE sdc_batch = $1
       ORDER BY student_name ASC`,
      [batch.label]
    );

    let teachers = [];
    if ((await tableExists('teachers')) && (await tableExists('teacher_batch_assignments'))) {
      const teacherResult = await pool.query(
        `SELECT t.id, t.name, t.experience, t.phone, t.email, t.status,
                b.name AS batch_name,
                COALESCE(
                  ARRAY_AGG(DISTINCT ts.subject ORDER BY ts.subject)
                    FILTER (WHERE ts.subject IS NOT NULL),
                  ARRAY[]::varchar[]
                ) AS subjects
         FROM teachers t
         JOIN teacher_batch_assignments tba ON tba.teacher_id = t.id
         JOIN batches b ON b.id = tba.batch_id
         LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
         WHERE b.id = $1
         GROUP BY t.id, t.name, t.experience, t.phone, t.email, t.status, b.name
         ORDER BY t.name ASC`,
        [Number(batch.id)]
      );
      teachers = teacherResult.rows.map(formatTeacher);
    }

    res.json({
      batch,
      students: students.rows.map(formatStudent),
      teachers,
    });
  } catch (err) {
    console.error('Batch people fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batch people' });
  }
});

router.get('/admin/students', verifyToken, canViewInstitute, async (req, res) => {
  const { batch, q } = req.query;
  const conditions = [];
  const values = [];

  if (batch) {
    const batchInfo = await getBatchByIdOrName(batch);
    values.push(batchInfo?.label || batch);
    conditions.push(`s.sdc_batch = $${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);
    conditions.push(`(s.student_name ILIKE $${values.length} OR s.email_address ILIKE $${values.length})`);
  }
  if (req.user.role === 'teacher') {
    const batchIds = await getVisibleBatchIds(pool, req.user);
    values.push(batchIds);
    conditions.push(
      `EXISTS (
         SELECT 1
         FROM batches visible_batch
         WHERE visible_batch.id = ANY($${values.length}::int[])
           AND visible_batch.name = s.sdc_batch
       )`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT s.id, s.auth_id, s.serial_number, s.student_name, s.student_whatsapp_number,
              s.student_std, s.sdc_branch, s.sdc_batch, s.sdc_course_opted, s.email_address
       FROM students s
       ${where}
       ORDER BY s.student_name ASC
       LIMIT 200`,
      values
    );

    res.json(result.rows.map(formatStudent));
  } catch (err) {
    console.error('Student list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.post('/admin/students', verifyToken, canManageInstitute, async (req, res) => {
  const {
    fullName,
    parentName,
    studentPhone,
    parentPhone,
    parentEmail,
    batch,
    email,
    studentClass,
    sdcId,
  } = req.body;
  const phone = studentPhone || req.body.phone;

  if (!fullName || !phone || !batch) {
    return res.status(400).json({ error: 'Student name, phone, and batch are required' });
  }
  if (parentName && !parentPhone && !parentEmail) {
    return res.status(400).json({
      error: 'A parent phone number or email is required when a parent name is provided',
    });
  }

  const batchInfo = await getBatchByIdOrName(batch);
  if (!batchInfo) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const serialResult = await client.query(
      'SELECT COALESCE(MAX(serial_number), 0) + 1 AS serial FROM students'
    );
    const serialNumber = serialResult.rows[0].serial;
    const generatedSdcId = sdcId || generateSdcId(batchInfo.label, serialNumber);
    let parentId = null;
    let parentAuthId = null;
    let parentSdcId = null;

    if (parentName) {
      const existingParentAuth = await client.query(
        `SELECT id, sdc_id, role
         FROM auth
         WHERE ($1::varchar IS NOT NULL AND phone_number = $1)
            OR ($2::varchar IS NOT NULL AND LOWER(email) = LOWER($2))
         LIMIT 1`,
        [parentPhone || null, parentEmail || null]
      );

      if (existingParentAuth.rows[0] && existingParentAuth.rows[0].role !== 'parent') {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'The guardian phone or email is already used by a non-parent account',
        });
      }

      if (existingParentAuth.rows[0]) {
        parentAuthId = existingParentAuth.rows[0].id;
        parentSdcId = existingParentAuth.rows[0].sdc_id;
      } else {
        parentSdcId = `P-${generatedSdcId}`;
        const parentAuthResult = await client.query(
          `INSERT INTO auth (
             sdc_id, name, role, email, phone_number, auth_provider, google_linked
           ) VALUES ($1, $2, 'parent', $3, $4, 'sdc', false)
           RETURNING id`,
          [parentSdcId, parentName, parentEmail || null, parentPhone || null]
        );
        parentAuthId = parentAuthResult.rows[0].id;
      }

      const existingParent = await client.query(
        'SELECT id FROM parents WHERE auth_id = $1 LIMIT 1',
        [parentAuthId]
      );
      if (existingParent.rows[0]) {
        parentId = existingParent.rows[0].id;
      } else {
        const parentResult = await client.query(
          `INSERT INTO parents (father_name, father_whatsapp_number, auth_id)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [parentName, parentPhone || null, parentAuthId]
        );
        parentId = parentResult.rows[0].id;
      }
    }

    const authResult = await client.query(
      `INSERT INTO auth (sdc_id, name, role, email, phone_number, auth_provider, google_linked)
       VALUES ($1, $2, 'student', $3, $4, 'sdc', false)
       RETURNING id`,
      [generatedSdcId, fullName, email || null, phone]
    );

    const studentResult = await client.query(
      `INSERT INTO students (
        parent_id, serial_number, email_address, student_name, student_whatsapp_number,
        student_std, sdc_branch, sdc_batch, sdc_course_opted, auth_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, serial_number, student_name, student_whatsapp_number, student_std,
                sdc_branch, sdc_batch, sdc_course_opted, email_address`,
      [
        parentId,
        serialNumber,
        email || null,
        fullName,
        phone,
        studentClass || batchInfo.standard || null,
        batchInfo.branch,
        batchInfo.label,
        batchInfo.program,
        authResult.rows[0].id,
      ]
    );

    await client.query(
      `INSERT INTO student_batches (batch_id, sdc_id)
       VALUES ($1, $2)`,
      [Number(batchInfo.id), generatedSdcId]
    );
    if (parentAuthId) {
      await client.query(
        `INSERT INTO student_parents (student_auth_id, parent_auth_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [authResult.rows[0].id, parentAuthId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      ...formatStudent(studentResult.rows[0]),
      sdcId: generatedSdcId,
      parentSdcId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Student create error:', err.message);
    const status = err.code === '23505' ? 409 : 500;
    res.status(status).json({
      error: status === 409
        ? 'The SDC ID, email, or phone number already belongs to another account'
        : 'Failed to create student',
    });
  } finally {
    client.release();
  }
});

router.get('/admin/teachers', verifyToken, canViewInstitute, async (req, res) => {
  if (!(await tableExists('teachers'))) return res.json([]);

  const { q } = req.query;
  const values = [];
  let where = '';

  if (q) {
    values.push(`%${q}%`);
    where = `WHERE (t.name ILIKE $1 OR t.email ILIKE $1 OR ts.subject ILIKE $1)`;
  }
  if (req.user.role === 'teacher') {
    values.push(req.user.authId);
    where = `${where ? `${where} AND` : 'WHERE'} t.auth_id = $${values.length}`;
  }

  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.experience, t.phone, t.email, t.status,
              MIN(b.name) AS batch_name,
              COALESCE(
                ARRAY_AGG(DISTINCT ts.subject ORDER BY ts.subject)
                  FILTER (WHERE ts.subject IS NOT NULL),
                ARRAY[]::varchar[]
              ) AS subjects
       FROM teachers t
       LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
       LEFT JOIN teacher_batch_assignments tba ON tba.teacher_id = t.id
       LEFT JOIN batches b ON b.id = tba.batch_id
       ${where}
       GROUP BY t.id, t.name, t.experience, t.phone, t.email, t.status
       ORDER BY t.name ASC
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
    return res.status(501).json({
      error: 'Teacher tables are not installed. Apply backend/migrations/002_teachers.sql first.',
    });
  }

  const { fullName, experience, phone, email } = req.body;
  const subjects = parseStringList(req.body.subjects || req.body.subject);

  if (!fullName || subjects.length === 0 || !phone) {
    return res.status(400).json({ error: 'Teacher name, subject, and phone are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingAuth = await client.query(
      `SELECT id, sdc_id, role
       FROM auth
       WHERE phone_number = $1
          OR ($2::varchar IS NOT NULL AND LOWER(email) = LOWER($2))
       LIMIT 1`,
      [phone, email || null]
    );

    if (existingAuth.rows[0] && existingAuth.rows[0].role !== 'teacher') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'The teacher phone or email is already used by a non-teacher account',
      });
    }

    const result = await client.query(
      `INSERT INTO teachers (auth_id, name, experience, phone, email, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, experience, phone, email, status`,
      [
        existingAuth.rows[0]?.id || null,
        fullName,
        experience || null,
        phone,
        email || null,
        req.user.authId,
      ]
    );
    const teacher = result.rows[0];
    let teacherSdcId = existingAuth.rows[0]?.sdc_id || null;

    if (!existingAuth.rows[0]) {
      teacherSdcId = `TEA${String(teacher.id).padStart(6, '0')}`;
      const authResult = await client.query(
        `INSERT INTO auth (
           sdc_id, name, role, email, phone_number, auth_provider, google_linked
         ) VALUES ($1, $2, 'teacher', $3, $4, 'sdc', false)
         RETURNING id`,
        [teacherSdcId, fullName, email || null, phone]
      );
      await client.query(
        'UPDATE teachers SET auth_id = $1 WHERE id = $2',
        [authResult.rows[0].id, teacher.id]
      );
    }

    for (const subject of subjects) {
      await client.query(
        `INSERT INTO teacher_subjects (teacher_id, subject)
         VALUES ($1, $2)
         ON CONFLICT (teacher_id, subject) DO NOTHING`,
        [teacher.id, subject]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      ...formatTeacher({ ...teacher, subjects }),
      sdcId: teacherSdcId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Teacher create error:', err.message);
    const status = ['23505', '23514'].includes(err.code) ? 409 : 500;
    res.status(status).json({
      error: err.code === '23514'
        ? 'The auth role constraint does not allow teacher accounts yet. Inspect and update the auth role check before retrying.'
        : status === 409
          ? 'A teacher with this email or phone already exists'
          : 'Failed to create teacher',
    });
  } finally {
    client.release();
  }
});

router.post('/admin/assignments', verifyToken, canManageInstitute, async (req, res) => {
  const { personType, personId, batchId } = req.body;
  const batch = await getBatchByIdOrName(batchId);

  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (personType === 'student') {
      const studentResult = await client.query(
        `UPDATE students
         SET sdc_batch = $1, sdc_branch = $2, sdc_course_opted = $3
         WHERE id = $4
         RETURNING auth_id`,
        [batch.label, batch.branch, batch.program, personId]
      );

      if (studentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Student not found' });
      }

      const authResult = await client.query(
        'SELECT sdc_id FROM auth WHERE id = $1',
        [studentResult.rows[0].auth_id]
      );
      const studentSdcId = authResult.rows[0]?.sdc_id;

      if (studentSdcId) {
        await client.query('DELETE FROM student_batches WHERE sdc_id = $1', [studentSdcId]);
        await client.query(
          'INSERT INTO student_batches (batch_id, sdc_id) VALUES ($1, $2)',
          [Number(batch.id), studentSdcId]
        );
      }

      await client.query('COMMIT');
      return res.json({ message: 'Student assigned successfully' });
    }

    if (personType === 'teacher') {
      if (!(await tableExists('teacher_batch_assignments'))) {
        await client.query('ROLLBACK');
        return res.status(501).json({
          error: 'Teacher assignment tables are not installed. Apply backend/migrations/002_teachers.sql first.',
        });
      }

      await client.query(
        `INSERT INTO teacher_batch_assignments (batch_id, teacher_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (batch_id, teacher_id) DO NOTHING`,
        [Number(batch.id), Number(personId), req.user.authId]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Teacher assigned successfully' });
    }

    await client.query('ROLLBACK');
    res.status(400).json({ error: 'personType must be student or teacher' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Assignment error:', err.message);
    res.status(500).json({ error: 'Failed to assign batch' });
  } finally {
    client.release();
  }
});

router.get('/admin/overview', verifyToken, canViewInstitute, async (req, res) => {
  try {
    const batches = await listBatches(req.user);
    const batchNames = batches.map((batch) => batch.label);
    const totalStudents = req.user.role === 'teacher'
      ? (
        await pool.query(
          'SELECT COUNT(*)::int AS count FROM students WHERE sdc_batch = ANY($1::varchar[])',
          [batchNames]
        )
      ).rows[0].count
      : (await pool.query('SELECT COUNT(*)::int AS count FROM students')).rows[0].count;
    const totalTeachers = await tableExists('teachers')
      ? req.user.role === 'teacher'
        ? 1
        : (await pool.query('SELECT COUNT(*)::int AS count FROM teachers')).rows[0].count
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
