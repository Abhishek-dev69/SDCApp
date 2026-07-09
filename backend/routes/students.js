// routes/admin/students.js
// Admin routes for: list+filter students, get single student (edit-prefill),
// create student+parent, update student+parent, soft-delete student.

const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path to your pg pool
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

function hasContact(email, phone) {
  return Boolean(email) || Boolean(phone);
}


// ---------------------------------------------------------------------------
// GET /admin/students
// List + filter (branch, batch, search) — all combine with AND, all optional
// ---------------------------------------------------------------------------
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { branch, batch, search } = req.query;
  console.log('DEBUG received query params:', req.query);
  try {
    const conditions = ['s.is_active = true'];
    const values = [];
    let paramIndex = 1;

    if (branch) {
      conditions.push(`s.sdc_branch = $${paramIndex}`);
      values.push(branch);
      paramIndex++;
    }

    if (batch) {
      conditions.push(`s.sdc_batch = $${paramIndex}`);
      values.push(batch);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(s.student_name ILIKE $${paramIndex} OR a.sdc_id ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT
         s.id,
         a.sdc_id,
         s.student_name,
         s.sdc_branch,
         s.sdc_batch,
         s.student_std,
         s.student_whatsapp_number
       FROM students s
       JOIN auth a ON a.id = s.auth_id
       ${whereClause}
       ORDER BY s.student_name ASC`,
      values
    );

    res.json({ students: result.rows });
  } catch (err) {
    console.error('Student list fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/students/branches
// Distinct branches for the filter dropdown
// ---------------------------------------------------------------------------
router.get('/branches', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT sdc_branch
       FROM students
       WHERE sdc_branch IS NOT NULL AND is_active = true
       ORDER BY sdc_branch ASC`
    );
    res.json({ branches: result.rows.map(r => r.sdc_branch) });
  } catch (err) {
    console.error('Branch list fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/students/batches
// Active batches for the filter dropdown (and for the create/edit form)
// ---------------------------------------------------------------------------
router.get('/batches', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, standard, academic_year, location
       FROM batches
       WHERE is_active = true
       ORDER BY name ASC`
    );
    res.json({ batches: result.rows });
  } catch (err) {
    console.error('Batch list fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/students/:id
// Single student + parent details, for edit-screen prefill
// ---------------------------------------------------------------------------
router.get('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.parent_id,
         s.serial_number,
         s.email_address,
         s.student_name,
         s.student_whatsapp_number,
         s.date_of_birth,
         s.student_std,
         s.sdc_branch,
         s.sdc_batch,
         s.sdc_course_opted,
         s.tenth_std_school,
         s.student_address,
         s.school_board,
         s.tenth_std_percentage,
         s.data_verified,
         s.is_active,
         student_auth.sdc_id AS student_sdc_id,

         p.father_name,
         p.mother_name,
         p.father_whatsapp_number,
         p.mother_whatsapp_number,
         parent_auth.sdc_id AS parent_sdc_id,

         sb.batch_id AS current_batch_id

       FROM students s
       JOIN auth student_auth ON student_auth.id = s.auth_id
       LEFT JOIN parents p ON p.id = s.parent_id
       LEFT JOIN auth parent_auth ON parent_auth.id = p.auth_id
       LEFT JOIN student_batches sb ON sb.sdc_id = student_auth.sdc_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error('Student fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// ---------------------------------------------------------------------------
// POST /admin/students
// Create new student + parent. 5 inserts in one transaction:
// auth(student) -> auth(parent) -> parents -> students -> student_batches
// ---------------------------------------------------------------------------
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const {
    // student fields
    student_name,
    email_address,
    student_whatsapp_number,
    date_of_birth,
    student_std,
    sdc_branch,
    sdc_batch, // batch name (text, kept in sync with student_batches)
    batch_id,  // FK for student_batches
    sdc_course_opted,
    tenth_std_school,
    student_address,
    school_board,
    tenth_std_percentage,
    serial_number,

    // parent fields
    father_name,
    mother_name,
    father_whatsapp_number,
    mother_whatsapp_number,
    parent_phone_number, // used for the parent's auth row
  } = req.body;

  // Validate NOT NULL / CHECK constraints before touching the DB
  if (!student_name) {
    return res.status(400).json({ error: 'Student name is required' });
  }
  if (!hasContact(email_address, student_whatsapp_number)) {
    return res.status(400).json({ error: 'Student must have an email or phone number' });
  }
  if (!father_name && !mother_name) {
    return res.status(400).json({ error: 'At least one parent name is required' });
  }
  if (!hasContact(null, father_whatsapp_number) && !hasContact(null, mother_whatsapp_number) && !hasContact(null, parent_phone_number)) {
    return res.status(400).json({ error: 'Parent must have at least one phone number' });
  }



  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. auth row for student
    const studentAuthResult = await client.query(
      `INSERT INTO auth (name, email, phone_number, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING id, sdc_id`,
      [student_name, email_address, student_whatsapp_number]
    );
    const studentAuth = studentAuthResult.rows[0];

    // 2. Check if this parent already has an auth account (sibling case)
    const parentContactPhone = parent_phone_number || father_whatsapp_number || mother_whatsapp_number;
    const parentContactEmail = null; // parents table has no email column currently

    let parentAuth;
    let newParentId;

    const existingParentAuth = await client.query(
      `SELECT id, sdc_id FROM auth WHERE phone_number = $1 AND role = 'parent'`,
      [parentContactPhone]
    );

    if (existingParentAuth.rows.length > 0) {
      // Reuse existing parent auth + parents row instead of inserting a duplicate
      parentAuth = existingParentAuth.rows[0];

      const existingParentsRow = await client.query(
        `SELECT id FROM parents WHERE auth_id = $1`,
        [parentAuth.id]
      );
      newParentId = existingParentsRow.rows[0].id;
    } else {
      // New parent — auth row first
      const parentAuthResult = await client.query(
        `INSERT INTO auth (name, phone_number, role)
         VALUES ($1, $2, 'parent')
         RETURNING id, sdc_id`,
        [father_name || mother_name, parentContactPhone]
      );
      parentAuth = parentAuthResult.rows[0];

      // then parents row
      const parentsResult = await client.query(
        `INSERT INTO parents (father_name, mother_name, father_whatsapp_number, mother_whatsapp_number, auth_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [father_name, mother_name, father_whatsapp_number, mother_whatsapp_number, parentAuth.id]
      );
      newParentId = parentsResult.rows[0].id;
    }
    // 4. students row
    const studentsResult = await client.query(
      `INSERT INTO students (
         parent_id, serial_number, email_address, student_name,
         student_whatsapp_number, date_of_birth, student_std,
         sdc_branch, sdc_batch, sdc_course_opted, tenth_std_school,
         student_address, school_board, tenth_std_percentage,
         auth_id, is_active
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, true)
       RETURNING id`,
      [
        newParentId, serial_number, email_address, student_name,
        student_whatsapp_number, date_of_birth, student_std,
        sdc_branch, sdc_batch, sdc_course_opted, tenth_std_school,
        student_address, school_board, tenth_std_percentage,
        studentAuth.id,
      ]
    );
    const newStudentId = studentsResult.rows[0].id;

    // 5. student_batches row (only if a batch was actually selected)
    if (batch_id) {
      await client.query(
        `INSERT INTO student_batches (batch_id, sdc_id)
         VALUES ($1, $2)`,
        [batch_id, studentAuth.sdc_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Student created successfully',
      student_id: newStudentId,
      student_sdc_id: studentAuth.sdc_id,
      parent_sdc_id: parentAuth.sdc_id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Student creation error:', err.message);
    res.status(500).json({ error: 'Failed to create student' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// PUT /admin/students/:id
// Update existing student + parent + batch. No new auth rows.
// ---------------------------------------------------------------------------
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const {
    // student fields
    student_name,
    email_address,
    student_whatsapp_number,
    date_of_birth,
    student_std,
    sdc_branch,
    sdc_batch,
    batch_id,
    sdc_course_opted,
    tenth_std_school,
    student_address,
    school_board,
    tenth_std_percentage,
    serial_number,
    data_verified,

    // parent fields
    parent_id, // students.parent_id, needed to know which parents row to update
    father_name,
    mother_name,
    father_whatsapp_number,
    mother_whatsapp_number,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Need the student's sdc_id to update student_batches
    const authLookup = await client.query(
      `SELECT a.sdc_id
       FROM students s
       JOIN auth a ON a.id = s.auth_id
       WHERE s.id = $1`,
      [id]
    );

    if (authLookup.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentSdcId = authLookup.rows[0].sdc_id;

    // Update students row
    await client.query(
      `UPDATE students SET
         serial_number = $1,
         email_address = $2,
         student_name = $3,
         student_whatsapp_number = $4,
         date_of_birth = $5,
         student_std = $6,
         sdc_branch = $7,
         sdc_batch = $8,
         sdc_course_opted = $9,
         tenth_std_school = $10,
         student_address = $11,
         school_board = $12,
         tenth_std_percentage = $13,
         data_verified = $14
       WHERE id = $15`,
      [
        serial_number, email_address, student_name, student_whatsapp_number,
        date_of_birth, student_std, sdc_branch, sdc_batch, sdc_course_opted,
        tenth_std_school, student_address, school_board, tenth_std_percentage,
        data_verified, id,
      ]
    );

// Update parents row, if linked
    if (parent_id) {
      await client.query(
        `UPDATE parents SET
           father_name = $1,
           mother_name = $2,
           father_whatsapp_number = $3,
           mother_whatsapp_number = $4
         WHERE id = $5`,
        [father_name, mother_name, father_whatsapp_number, mother_whatsapp_number, parent_id]
      );

      // Keep parent's auth.phone_number in sync: prefer father's number, fall back to mother's
      const newParentContactNumber = father_whatsapp_number || mother_whatsapp_number;

      if (newParentContactNumber) {
        await client.query(
          `UPDATE auth SET phone_number = $1
           WHERE id = (SELECT auth_id FROM parents WHERE id = $2)`,
          [newParentContactNumber, parent_id]
        );
      }
    }

    // Update or insert student_batches row, if a batch was provided
    if (batch_id) {
      const existingBatchRow = await client.query(
        `SELECT id FROM student_batches WHERE sdc_id = $1`,
        [studentSdcId]
      );

      if (existingBatchRow.rows.length > 0) {
        await client.query(
          `UPDATE student_batches SET batch_id = $1 WHERE sdc_id = $2`,
          [batch_id, studentSdcId]
        );
      } else {
        await client.query(
          `INSERT INTO student_batches (batch_id, sdc_id) VALUES ($1, $2)`,
          [batch_id, studentSdcId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Student update error:', err.message);

    if (err.code === '23505') {
      // Unique violation — most likely phone_number or email collision
      return res.status(409).json({ error: 'This phone number or email is already in use by another account' });
    }

    res.status(500).json({ error: 'Failed to update student' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// PATCH /admin/students/:id/deactivate
// Soft delete
// ---------------------------------------------------------------------------
router.patch('/:id/deactivate', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE students SET is_active = false WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deactivated successfully' });
  } catch (err) {
    console.error('Student deactivation error:', err.message);
    res.status(500).json({ error: 'Failed to deactivate student' });
  }
});

module.exports = router;
