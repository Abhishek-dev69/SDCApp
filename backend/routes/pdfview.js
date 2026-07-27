
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

const signGcsUrl = async (gsUri) => {
  if (!gsUri) return null;
  const withoutPrefix = gsUri.replace(/^gs:\/\//, '');
  const slashIndex = withoutPrefix.indexOf('/');
  if (slashIndex === -1) return null;
  const bucket = withoutPrefix.slice(0, slashIndex);
  const filePath = withoutPrefix.slice(slashIndex + 1);
  const [url] = await storage.bucket(bucket).file(filePath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  });
  return url;
};

// Route 1: List papers with filters, no signing
router.get('/', verifyToken, async (req, res) => {
  const { exam, year, month, subject } = req.query;

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
      `SELECT id, exam, subject, year, month, paper_number FROM pyq_papers ${where} ORDER BY year DESC, month ASC, paper_number ASC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('PYQ fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

// Route 2: Sign and return a single URL on demand
router.get('/:id/url', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'paper' or 'solution'

  if (!['paper', 'solution'].includes(type)) {
    return res.status(400).json({ error: 'type must be "paper" or "solution"' });
  }

  const column = type === 'paper' ? 'paper_url' : 'solution_url';

  try {
    const result = await pool.query(
      `SELECT ${column} FROM pyq_papers WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const gsUri = result.rows[0][column];
    const signedUrl = await signGcsUrl(gsUri);

    res.json({ url: signedUrl });
  } catch (err) {
    console.error('URL signing error:', err.message);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

module.exports = router;
