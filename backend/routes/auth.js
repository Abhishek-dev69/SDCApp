const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const googleClient = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);
const bcrypt = require('bcrypt');

// Google Sign-In route

router.post('/google', async (req, res) => {

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_ANDROID_CLIENT_ID
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
  return res.status(403).json({ error: 'No SDC account linked to this Google account. Please sign in with your SDC ID first.' });
}

    await pool.query(
      'UPDATE auth SET last_login = NOW() WHERE id = $1',
      [authUser.id]
    );

    const jwtToken = jwt.sign(
      {
        authId: authUser.id,
        sdcId: authUser.sdc_id,
        role: authUser.role,
        name: authUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  
    );

    console.log('Login successful, sending JWT...');
    res.json({ jwt: jwtToken, forceChangePassword: authUser.is_temp_password });

  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});







// To check if the password is temporary or not

router.get('/is-temp-password', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT is_temp_password FROM auth WHERE id = $1',
      [req.user.authId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ is_temp_password: result.rows[0].is_temp_password });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check password status' });
  }
});




// Changing password Route 
router.post('/change-password', verifyToken, async (req, res) => {
  const { newPassword } = req.body;

  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/;
if (!newPassword || !passwordRegex.test(newPassword)) {
  return res.status(400).json({ 
    error: 'Password must be 8+ characters with one capital letter, one number, and one special character' 
  });
}

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE auth SET password_hash = $1, is_temp_password = FALSE WHERE id = $2',
      [hash, req.user.authId]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
});






// USER PROFILE ROUTE

router.get('/user/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.sdc_id, a.email, a.phone, a.role, a.google_linked,
              s.student_name, s.sdc_batch, s.sdc_branch, s.student_std
       FROM auth a
       LEFT JOIN students s ON s.auth_id = a.id
       WHERE a.id = $1`,
      [req.user.authId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;