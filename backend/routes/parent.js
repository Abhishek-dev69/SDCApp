const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

// Helper middleware to verify parent is authorized to view the child
async function verifyChildOwnership(req, res, next) {
  const { studentSdcId } = req.params;
  const parentAuthId = req.user.authId;

  try {
    const parentQuery = await pool.query(
      `SELECT id FROM parents WHERE auth_id = $1`,
      [parentAuthId]
    );

    if (parentQuery.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: Not a registered parent account' });
    }

    const parentId = parentQuery.rows[0].id;

    const childQuery = await pool.query(
      `SELECT s.id, s.student_name, s.sdc_batch
       FROM students s
       JOIN auth sa ON s.auth_id = sa.id
       WHERE s.parent_id = $1 AND sa.sdc_id = $2 AND s.is_active = true`,
      [parentId, studentSdcId]
    );

    if (childQuery.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: Student is not linked to this parent' });
    }

    req.child = childQuery.rows[0]; // cache child details
    next();
  } catch (err) {
    console.error('Child ownership verification error:', err.message);
    res.status(500).json({ error: 'Server error verifying child link' });
  }
}

// GET /parent/children - Fetch all active children linked to the parent
router.get('/children', verifyToken, requireRole('parent'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.student_name, s.sdc_batch, s.sdc_branch, s.student_std, sa.sdc_id AS student_sdc_id
       FROM students s
       JOIN parents p ON s.parent_id = p.id
       JOIN auth sa ON s.auth_id = sa.id
       WHERE p.auth_id = $1 AND s.is_active = true`,
      [req.user.authId]
    );
    res.json({ children: result.rows });
  } catch (err) {
    console.error('GET /parent/children:', err.message);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// GET /parent/child/:studentSdcId/attendance - Fetch attendance stats for a child
router.get('/child/:studentSdcId/attendance', verifyToken, requireRole('parent'), verifyChildOwnership, async (req, res) => {
  const { studentSdcId } = req.params;

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
      [studentSdcId]
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

    const absentCount = totalClasses - totalAttended;

    // --- Recent absences (last 10) ---
    const recentAbsences = rows
      .filter(r => r.was_absent)
      .slice(-10)
      .reverse()
      .map(r => ({ subject: r.subject, topic: r.topic, date: r.scheduled_at }));

    res.json({
      overall,
      totalClasses,
      totalAttended,
      absentCount,
      subjects,
      recentAbsences
    });
  } catch (err) {
    console.error('GET /parent/child/attendance:', err);
    res.status(500).json({ error: 'Failed to fetch child attendance' });
  }
});

// GET /parent/child/:studentSdcId/performance - Fetch test scores and rankings for a child
router.get('/child/:studentSdcId/performance', verifyToken, requireRole('parent'), verifyChildOwnership, async (req, res) => {
  const { studentSdcId } = req.params;

  try {
    // 1. Get student's batch ID
    const batchRes = await pool.query(
      `SELECT batch_id FROM student_batches WHERE sdc_id = $1`,
      [studentSdcId]
    );

    if (batchRes.rows.length === 0) {
      return res.json({ averageScore: 0, classRank: 'N/A', tests: [], subjects: [], insight: 'No performance data available. Batch not assigned.' });
    }

    const batchId = batchRes.rows[0].batch_id;

    // 2. Fetch all tests for the batch and left join with student's submissions
    const testsRes = await pool.query(
      `SELECT
         t.id, t.type, t.title, t.subject, t.total_marks, t.due_at, t.status,
         s.answer_gcs_path, s.submitted_at, s.score, s.remarks, s.graded_at, s.released_at
       FROM tests t
       JOIN test_batches tb ON tb.test_id = t.id
       LEFT JOIN submissions s ON s.test_id = t.id AND s.student_sdc_id = $1
       WHERE tb.batch_id = $2 AND t.status = 'published'
       ORDER BY t.due_at DESC`,
      [studentSdcId, batchId]
    );

    const tests = testsRes.rows;

    // 3. For each graded test, calculate the student's rank
    const testsWithRank = [];
    let overallTotalMarks = 0;
    let overallScoredMarks = 0;
    let gradedCount = 0;
    const subjectScores = {};

    for (const test of tests) {
      let rank = 'N/A';
      if (test.released_at && test.score !== null) {
        // Query to find how many scores are higher in the class
        const rankRes = await pool.query(
          `SELECT COUNT(DISTINCT score) + 1 AS rank
           FROM submissions
           WHERE test_id = $1 AND score > $2 AND released_at IS NOT NULL`,
          [test.id, test.score]
        );
        rank = rankRes.rows[0]?.rank || 1;

        overallTotalMarks += Number(test.total_marks || 0);
        overallScoredMarks += Number(test.score || 0);
        gradedCount++;

        // Subject aggregation
        const subj = test.subject || 'General';
        if (!subjectScores[subj]) subjectScores[subj] = { total: 0, scored: 0, count: 0 };
        subjectScores[subj].total += Number(test.total_marks || 0);
        subjectScores[subj].scored += Number(test.score || 0);
        subjectScores[subj].count++;
      }

      testsWithRank.push({
        id: test.id,
        title: test.title,
        subject: test.subject || 'General',
        total_marks: test.total_marks,
        score: test.score,
        rank: rank,
        due_at: test.due_at,
        released_at: test.released_at,
        remarks: test.remarks
      });
    }

    const averageScore = gradedCount === 0 ? 0 : Math.round((overallScoredMarks / overallTotalMarks) * 100);

    // Compute subject breakdowns
    const subjects = Object.entries(subjectScores).map(([name, data]) => ({
      subject: name,
      percentage: data.total === 0 ? 0 : Math.round((data.scored / data.total) * 100),
      count: data.count
    }));

    // Find class average rank or generic overall rank across all graded tests
    let overallClassRank = 'N/A';
    if (gradedCount > 0) {
      const allStudentsRank = await pool.query(
        `SELECT sub.student_sdc_id, AVG(sub.score * 100.0 / NULLIF(t.total_marks, 0)) AS avg_pct
         FROM submissions sub
         JOIN tests t ON t.id = sub.test_id
         JOIN test_batches tb ON tb.test_id = t.id
         WHERE tb.batch_id = $1 AND sub.released_at IS NOT NULL
         GROUP BY sub.student_sdc_id
         ORDER BY avg_pct DESC`,
        [batchId]
      );
      const index = allStudentsRank.rows.findIndex(r => r.student_sdc_id === studentSdcId);
      if (index !== -1) {
        overallClassRank = `#${index + 1}`;
      }
    }

    // Dynamic data-driven insights:
    let insight = 'No academic feedback available yet.';
    if (gradedCount > 0) {
      // Fetch attendance to check if low attendance corresponds to marks
      const attRes = await pool.query(
        `SELECT
           COUNT(l.id) AS total,
           COUNT(l.id) - COUNT(CASE WHEN la.absent_ids IS NOT NULL AND $1 = ANY(la.absent_ids) THEN 1 END) AS attended
         FROM lectures l
         JOIN student_batches sb ON sb.batch_id = l.batch_id
         LEFT JOIN lecture_attendance la ON la.lecture_id = l.id
         WHERE sb.sdc_id = $1 AND l.status = 'conducted'`,
        [studentSdcId]
      );

      const totalLectures = Number(attRes.rows[0]?.total || 0);
      const attendedLectures = Number(attRes.rows[0]?.attended || 0);
      const attendancePct = totalLectures === 0 ? 100 : (attendedLectures / totalLectures) * 100;

      if (attendancePct < 85 && averageScore < 70) {
        insight = `${req.child.student_name}'s average test score is ${averageScore}%. There is a clear correlation with attendance, which is currently at ${Math.round(attendancePct)}%. Improved class attendance will help improve performance.`;
      } else {
        // Highlight strongest and weakest subjects
        const sortedSubjects = [...subjects].sort((a, b) => b.percentage - a.percentage);
        if (sortedSubjects.length > 0) {
          const strong = sortedSubjects[0];
          const weak = sortedSubjects[sortedSubjects.length - 1];

          if (strong.subject === weak.subject) {
            insight = `${req.child.student_name} is maintaining a steady performance average of ${averageScore}% in ${strong.subject}. Keep it up!`;
          } else {
            insight = `${req.child.student_name} is performing well in ${strong.subject} (${strong.percentage}%). However, additional study is recommended in ${weak.subject} where the current average is ${weak.percentage}%.`;
          }
        }
      }
    }

    res.json({
      averageScore,
      classRank: overallClassRank,
      tests: testsWithRank,
      subjects,
      insight
    });
  } catch (err) {
    console.error('GET /parent/child/performance:', err);
    res.status(500).json({ error: 'Failed to fetch child performance' });
  }
});

// GET /parent/child/:studentSdcId/fees - Fetch mock fee info for a child
router.get('/child/:studentSdcId/fees', verifyToken, requireRole('parent'), verifyChildOwnership, async (req, res) => {
  const batchCode = req.child.sdc_batch || '';

  try {
    let totalFees = 40000;
    let feeHistory = [];

    const normalizedBatch = batchCode.toUpperCase();
    if (normalizedBatch.includes('JEE') || normalizedBatch.includes('IIT')) {
      totalFees = 50000;
    } else if (normalizedBatch.includes('NEET') || normalizedBatch.includes('PCB')) {
      totalFees = 60000;
    } else if (normalizedBatch.includes('CET')) {
      totalFees = 45000;
    }

    const studentUuid = req.child.id;
    // Generate deterministic transaction info based on student UUID
    const charSum = studentUuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const paidPercentage = charSum % 2 === 0 ? 0.9 : 0.75;
    const paidFees = totalFees * paidPercentage;
    const pendingFees = totalFees - paidFees;
    
    const installmentCount = paidPercentage === 0.9 ? 3 : 2;
    const installmentAmt = 15000;
    
    if (installmentCount >= 1) {
      feeHistory.push({
        date: 'Jul 05, 2025',
        amount: `₹ ${installmentAmt.toLocaleString('en-IN')}`,
        status: 'Success',
        refNo: `TXN_${charSum}104`
      });
    }
    if (installmentCount >= 2) {
      feeHistory.push({
        date: 'Oct 10, 2025',
        amount: `₹ ${installmentAmt.toLocaleString('en-IN')}`,
        status: 'Success',
        refNo: `TXN_${charSum + 10}145`
      });
    }
    if (installmentCount >= 3) {
      const thirdAmt = paidFees - (installmentAmt * 2);
      feeHistory.push({
        date: 'Jan 15, 2026',
        amount: `₹ ${thirdAmt.toLocaleString('en-IN')}`,
        status: 'Success',
        refNo: `TXN_${charSum + 20}274`
      });
    }

    res.json({
      totalFees,
      paidFees,
      pendingFees,
      paidPercentage: Math.round(paidPercentage * 100),
      history: feeHistory
    });
  } catch (err) {
    console.error('GET /parent/child/fees:', err);
    res.status(500).json({ error: 'Failed to fetch child fees' });
  }
});

module.exports = router;
