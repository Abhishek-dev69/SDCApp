const pool = require('../db');

async function tableExists(tableName) {
  const result = await pool.query('SELECT to_regclass($1) IS NOT NULL AS exists', [`public.${tableName}`]);
  return result.rows[0]?.exists === true;
}

function inferStream(program = '') {
  const value = String(program).toUpperCase();

  if (value.includes('PCMB')) return 'PCMB';
  if (value.includes('NEET') || value.includes('PCB')) return 'PCB';
  return 'PCM';
}

function inferTextbookSources(program = '') {
  const value = String(program).toUpperCase();
  const sources = new Set();

  if (value.includes('NEET')) sources.add('ncert');
  if (value.includes('JEE') || value.includes('CET') || value.includes('MHT')) sources.add('maharashtra');
  if (sources.size === 0) sources.add('maharashtra');

  return Array.from(sources);
}

function normalizeTextbookSources(value, program) {
  if (Array.isArray(value) && value.length > 0) return value;
  if (typeof value === 'string' && value.trim()) {
    return value
      .replace(/[{}]/g, '')
      .split(',')
      .map((item) => item.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  }

  return inferTextbookSources(program);
}

function normalizeBatch(row) {
  const label = row.label || row.code || row.sdc_batch || row.batch || row.name;
  const program = row.program || row.sdc_course_opted || row.course || '';

  return {
    id: String(row.id || label),
    label: String(label || '').trim(),
    name: row.name || `${label} Batch`,
    branch: row.branch || row.sdc_branch || 'Main',
    stream: row.stream || inferStream(program),
    program: program || inferStream(program),
    capacity: Number(row.capacity || row.total_capacity || 0),
    studentCount: Number(row.student_count || row.studentCount || 0),
    teacherCount: Number(row.teacher_count || row.teacherCount || 0),
    timing: row.timing || row.schedule || '',
    startDate: row.start_date || row.startDate || null,
    textbookSources: normalizeTextbookSources(row.textbook_sources || row.textbookSources, program),
  };
}

module.exports = {
  inferStream,
  inferTextbookSources,
  normalizeBatch,
  normalizeTextbookSources,
  tableExists,
};
