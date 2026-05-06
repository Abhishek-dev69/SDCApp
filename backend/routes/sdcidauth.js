const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);

// SETUP NEW PASSWORD ROUTE

router.post('/setup-password', async (req, res) => {
  const { student_id, password } = req.body;

  try {
    // Check student exists
    const student = await pool.query(
      'SELECT * FROM students WHERE student_id = $1',
      [student_id]
    );
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Student ID not found' });
    }

    // Check password not already set
    const existing = await pool.query(
      'SELECT * FROM auth WHERE student_id = $1',
      [student_id]
    );
    if (existing.rows.length > 0 && existing.rows[0].password_hash) {
      return res.status(400).json({ message: 'Password already set for this ID' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE auth SET password_hash = $1 WHERE student_id = $2',
      [password_hash, student_id]
    );

    res.status(200).json({ message: 'Password set successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
















// SIGNIN ROUTE
router.post('/signin', async (req, res) => {
  const { student_id, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT auth.*, students.student_name FROM auth JOIN students ON students.student_id = auth.student_id WHERE auth.student_id = $1',
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student ID not found' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ token, name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});










// LINK GOOGLE ROUTE
router.post('/link-google', async (req, res) => {
  const { token, student_id } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_ANDROID_CLIENT_ID
    });

    const payload = ticket.getPayload();

    await pool.query(
      'UPDATE auth SET google_id = $1, email = $2, google_linked = TRUE WHERE student_id = $3',
      [payload.sub, payload.email, student_id]
    );

    res.status(200).json({ message: 'Google account linked successfully' });
  } catch (err) {
    console.error('Link Google error:', err.message);
    res.status(401).json({ error: 'Failed to link Google account' });
  }
});

















module.exports = router;
