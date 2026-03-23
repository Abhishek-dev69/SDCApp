const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    console.log(`Google verified user: ${name} (${email})`);

    const existingUser = await pool.query(
      'SELECT * FROM auth WHERE google_id = $1',
      [googleId]
    );

    let authUser;

    if (existingUser.rows.length > 0) {
      console.log('Existing user found, logging in...');
      authUser = existingUser.rows[0];

    } else {
      console.log('New user, creating auth record...');
      const student = await pool.query(
        'SELECT * FROM students WHERE email_address = $1',
        [email]
      );
      const studentId = student.rows.length > 0 ? student.rows[0].id : null;

      const newUser = await pool.query(
        `INSERT INTO auth 
          (student_id, name, email, google_id, auth_provider, role)
         VALUES 
          ($1, $2, $3, $4, 'google', 'student')
         RETURNING *`,
        [studentId, name, email, googleId]
      );
      authUser = newUser.rows[0];
    }

    await pool.query(
      'UPDATE auth SET last_login = NOW() WHERE id = $1',
      [authUser.id]
    );

    const jwtToken = jwt.sign(
      {
        authId: authUser.id,
        studentId: authUser.student_id,
        role: authUser.role,
        name: authUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  
    );

    console.log('Login successful, sending JWT...');
    res.json({ jwt: jwtToken });

  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

module.exports = router;