const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { tableExists } = require('../utils/dbIntrospection');

router.get('/parent', verifyToken, requireRole('parent'), async (req, res) => {
  try {
    const [parentResult, childrenResult] = await Promise.all([
      pool.query(
        `SELECT a.name, a.email, a.phone_number AS phone
         FROM auth a
         WHERE a.id = $1`,
        [req.user.authId]
      ),
      pool.query(
        `SELECT s.id, s.auth_id, s.student_name, s.student_std, s.sdc_batch,
                s.sdc_branch, b.id AS batch_id
         FROM student_parents sp
         JOIN students s ON s.auth_id = sp.student_auth_id
         LEFT JOIN batches b ON b.name = s.sdc_batch
         WHERE sp.parent_auth_id = $1
         ORDER BY s.student_name`,
        [req.user.authId]
      ),
    ]);

    const children = childrenResult.rows;
    const selectedStudentAuthId = req.query.student_auth_id
      ? Number(req.query.student_auth_id)
      : children[0]?.auth_id;

    if (selectedStudentAuthId && !children.some((child) => child.auth_id === selectedStudentAuthId)) {
      return res.status(403).json({ error: 'This student is not linked to your parent account' });
    }

    const dashboard = {
      parent: parentResult.rows[0] || null,
      children,
      selectedStudentAuthId: selectedStudentAuthId || null,
      metrics: {
        attendancePercent: null,
        upcomingTests: null,
        feeStatus: null,
        performancePercent: null,
      },
      recentResults: [],
    };

    if (!selectedStudentAuthId) {
      return res.json(dashboard);
    }

    if (await tableExists('attendance_records')) {
      const attendance = await pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status IN ('present', 'late'))::int AS attended
         FROM attendance_records
         WHERE student_auth_id = $1`,
        [selectedStudentAuthId]
      );
      const { total, attended } = attendance.rows[0];
      dashboard.metrics.attendancePercent = total > 0 ? Math.round((attended / total) * 100) : null;
    }

    if (await tableExists('tests')) {
      const tests = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM tests t
         JOIN students s ON s.auth_id = $1
         JOIN batches b ON b.name = s.sdc_batch AND b.id = t.batch_id
         WHERE t.scheduled_at >= NOW()
           AND t.status IN ('scheduled', 'published')`,
        [selectedStudentAuthId]
      );
      dashboard.metrics.upcomingTests = tests.rows[0].count;
    }

    if (await tableExists('fee_invoices')) {
      const fees = await pool.query(
        `SELECT
           COALESCE(SUM(amount - amount_paid) FILTER (WHERE status <> 'paid'), 0)::numeric AS due,
           BOOL_OR(status IN ('due', 'overdue', 'partially_paid')) AS has_due
         FROM fee_invoices
         WHERE student_auth_id = $1`,
        [selectedStudentAuthId]
      );
      dashboard.metrics.feeStatus = {
        label: fees.rows[0].has_due ? 'Due' : 'Paid',
        amountDue: Number(fees.rows[0].due || 0),
      };
    }

    if ((await tableExists('test_results')) && (await tableExists('tests'))) {
      const results = await pool.query(
        `SELECT tr.id, t.title, t.subject, t.scheduled_at,
                tr.marks, t.total_marks, tr.rank,
                CASE WHEN t.total_marks > 0
                  THEN ROUND((tr.marks / t.total_marks) * 100, 1)
                  ELSE NULL
                END AS percentage
         FROM test_results tr
         JOIN tests t ON t.id = tr.test_id
         WHERE tr.student_auth_id = $1
         ORDER BY t.scheduled_at DESC
         LIMIT 5`,
        [selectedStudentAuthId]
      );
      dashboard.recentResults = results.rows;

      const percentages = results.rows
        .map((row) => Number(row.percentage))
        .filter(Number.isFinite);
      dashboard.metrics.performancePercent = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : null;
    }

    res.json(dashboard);
  } catch (err) {
    console.error('Parent dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load parent dashboard' });
  }
});

router.get('/owner', verifyToken, requireRole('owner', 'admin'), async (_req, res) => {
  try {
    const [students, parents, batches, materials, lectures] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM students'),
      pool.query('SELECT COUNT(*)::int AS count FROM parents'),
      pool.query('SELECT COUNT(*)::int AS count FROM batches WHERE COALESCE(is_active, true) = true'),
      pool.query('SELECT COUNT(*)::int AS count FROM study_materials'),
      pool.query('SELECT COUNT(*)::int AS count FROM lectures'),
    ]);

    const branchResult = await pool.query(
      `SELECT b.location AS branch,
              COUNT(DISTINCT b.id)::int AS batches,
              COUNT(s.id)::int AS students
       FROM batches b
       LEFT JOIN students s ON s.sdc_batch = b.name
       WHERE COALESCE(b.is_active, true) = true
       GROUP BY b.location
       ORDER BY b.location`
    );

    const overview = {
      totalStudents: students.rows[0].count,
      totalParents: parents.rows[0].count,
      activeBatches: batches.rows[0].count,
      studyMaterials: materials.rows[0].count,
      lectures: lectures.rows[0].count,
      totalTeachers: 0,
      branches: branchResult.rows,
      attendancePercent: null,
      fees: null,
      testAverage: null,
    };

    if (await tableExists('teachers')) {
      overview.totalTeachers = (await pool.query('SELECT COUNT(*)::int AS count FROM teachers')).rows[0].count;
    }

    if (await tableExists('attendance_records')) {
      const attendance = await pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status IN ('present', 'late'))::int AS attended
         FROM attendance_records`
      );
      const { total, attended } = attendance.rows[0];
      overview.attendancePercent = total > 0 ? Math.round((attended / total) * 100) : null;
    }

    if (await tableExists('fee_invoices')) {
      const fees = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::numeric AS billed,
                COALESCE(SUM(amount_paid), 0)::numeric AS collected,
                COALESCE(SUM(amount - amount_paid), 0)::numeric AS pending
         FROM fee_invoices`
      );
      overview.fees = {
        billed: Number(fees.rows[0].billed),
        collected: Number(fees.rows[0].collected),
        pending: Number(fees.rows[0].pending),
      };
    }

    if ((await tableExists('test_results')) && (await tableExists('tests'))) {
      const performance = await pool.query(
        `SELECT ROUND(AVG((tr.marks / NULLIF(t.total_marks, 0)) * 100), 1) AS average
         FROM test_results tr
         JOIN tests t ON t.id = tr.test_id`
      );
      overview.testAverage = performance.rows[0].average === null
        ? null
        : Number(performance.rows[0].average);
    }

    res.json(overview);
  } catch (err) {
    console.error('Owner dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load owner dashboard' });
  }
});

module.exports = router;
