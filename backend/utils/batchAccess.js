const { tableExists } = require('./dbIntrospection');

async function getVisibleBatchIds(pool, user) {
  if (['admin', 'owner'].includes(user.role)) return null;

  if (user.role === 'teacher') {
    if (
      !(await tableExists('teachers'))
      || !(await tableExists('teacher_batch_assignments'))
    ) {
      return [];
    }
    const result = await pool.query(
      `SELECT tba.batch_id
       FROM teachers t
       JOIN teacher_batch_assignments tba ON tba.teacher_id = t.id
       WHERE t.auth_id = $1`,
      [user.authId]
    );
    return result.rows.map((row) => row.batch_id);
  }

  if (user.role === 'student') {
    const result = await pool.query(
      `SELECT DISTINCT b.id
       FROM students s
       JOIN batches b ON b.name = s.sdc_batch
       WHERE s.auth_id = $1`,
      [user.authId]
    );
    return result.rows.map((row) => row.id);
  }

  if (user.role === 'parent') {
    const result = await pool.query(
      `SELECT DISTINCT b.id
       FROM student_parents sp
       JOIN students s ON s.auth_id = sp.student_auth_id
       JOIN batches b ON b.name = s.sdc_batch
       WHERE sp.parent_auth_id = $1`,
      [user.authId]
    );
    return result.rows.map((row) => row.id);
  }

  return [];
}

async function canAccessBatch(pool, user, batchId) {
  const visibleBatchIds = await getVisibleBatchIds(pool, user);
  return visibleBatchIds === null || visibleBatchIds.includes(Number(batchId));
}

module.exports = {
  canAccessBatch,
  getVisibleBatchIds,
};
