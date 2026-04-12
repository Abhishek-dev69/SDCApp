const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, async (req, res) => {
  const { exam, year, month, subject } = req.query;

  // Build query dynamically based on what filters are provided
  const conditions = [];
  const values = [];
  let i = 1;

  if (exam)    { conditions.push(`exam = $${i++}`);    values.push(exam); }
  if (year)    { conditions.push(`year = $${i++}`);    values.push(year); }
  if (month)   { conditions.push(`month = $${i++}`);   values.push(month); }
  if (subject) { conditions.push(`subject = $${i++}`); values.push(subject); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT * FROM pyq_papers ${where} ORDER BY year DESC, month ASC, paper_number ASC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('PYQ fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

module.exports = router;