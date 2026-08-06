const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// GET /operations/dpp - List DPP modules
router.get('/', verifyToken, async (req, res) => {
  const { exam_category, subject } = req.query;
  const conditions = [];
  const params = [];

  if (exam_category && exam_category !== 'All') {
    params.push(exam_category);
    conditions.push(`exam_category = $${params.length}`);
  }
  if (subject && subject !== 'All') {
    params.push(subject);
    conditions.push(`subject = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const queryText = `SELECT id, title, exam_category, subject, chapter, total_questions, duration_mins, created_at 
                     FROM dpp_modules ${whereClause} ORDER BY id DESC`;

  try {
    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('DPP list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch DPP modules' });
  }
});

// GET /operations/dpp/:id - Fetch DPP details and question list
router.get('/:id', verifyToken, async (req, res) => {
  const dppId = parseInt(req.params.id, 10);
  if (isNaN(dppId)) return res.status(400).json({ error: 'Invalid DPP ID' });

  try {
    const moduleRes = await pool.query('SELECT * FROM dpp_modules WHERE id = $1', [dppId]);
    if (moduleRes.rows.length === 0) {
      return res.status(404).json({ error: 'DPP module not found' });
    }

    const questionsRes = await pool.query(
      `SELECT id, dpp_id, question_number, question_text, option_a, option_b, option_c, option_d 
       FROM dpp_questions WHERE dpp_id = $1 ORDER BY question_number ASC`,
      [dppId]
    );

    res.json({
      module: moduleRes.rows[0],
      questions: questionsRes.rows,
    });
  } catch (err) {
    console.error('DPP details error:', err.message);
    res.status(500).json({ error: 'Failed to fetch DPP questions' });
  }
});

// POST /operations/dpp/:id/submit - Evaluate practice submission
router.post('/:id/submit', verifyToken, async (req, res) => {
  const dppId = parseInt(req.params.id, 10);
  const { answers = {} } = req.body; // Map of question_id -> selected_option ('A', 'B', 'C', 'D')

  if (isNaN(dppId)) return res.status(400).json({ error: 'Invalid DPP ID' });

  try {
    const questionsRes = await pool.query(
      `SELECT id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation 
       FROM dpp_questions WHERE dpp_id = $1 ORDER BY question_number ASC`,
      [dppId]
    );

    if (questionsRes.rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this DPP' });
    }

    const questions = questionsRes.rows;
    let score = 0;
    const results = questions.map((q) => {
      const selected = answers[q.id] || null;
      const isCorrect = selected && selected.toUpperCase() === q.correct_option.toUpperCase();
      if (isCorrect) score += 1;

      return {
        questionId: q.id,
        questionNumber: q.question_number,
        questionText: q.question_text,
        options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
        selectedOption: selected,
        correctOption: q.correct_option,
        isCorrect,
        explanation: q.explanation,
      };
    });

    // Log attempt in dpp_submissions
    await pool.query(
      `INSERT INTO dpp_submissions (dpp_id, student_auth_id, student_name, score, total_questions, answers)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        dppId,
        req.user.authId || null,
        req.user.name || 'Student',
        score,
        questions.length,
        JSON.stringify(answers),
      ]
    );

    res.json({
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      results,
    });
  } catch (err) {
    console.error('DPP submission error:', err.message);
    res.status(500).json({ error: 'Failed to evaluate DPP submission' });
  }
});

module.exports = router;
