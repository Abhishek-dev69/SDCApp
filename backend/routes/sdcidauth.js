const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);

// SETUP NEW PASSWORD ROUTE

router.post('/setup-password', async (req, res) => {
  const { sdcId, contact, password } = req.body;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/;
  if (!sdcId || !contact) {
    return res.status(400).json({ error: 'SDC ID and registered phone or email are required' });
  }
  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be 8+ characters with one capital, one number, and one special character' });
  }

  try {
    const userResult = await pool.query(
      `SELECT *
       FROM auth
       WHERE sdc_id = $1
         AND (
           LOWER(COALESCE(email, '')) = LOWER($2)
           OR regexp_replace(COALESCE(phone_number, ''), '\\D', '', 'g')
              = NULLIF(regexp_replace($2, '\\D', '', 'g'), '')
         )
       LIMIT 1`,
      [String(sdcId).trim(), String(contact).trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'SDC ID and registered contact do not match' });
    }
    const user = userResult.rows[0];

    if (user.password_hash) {
      return res.status(400).json({ message: 'Password already set for this ID' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE auth SET password_hash = $1 WHERE sdc_id = $2',
      [password_hash, sdcId]
    );

    let location = null;
    if (user.role === 'admin') {
      const adminRow = await pool.query(
        'SELECT location FROM admins WHERE sdc_id = $1',
        [user.sdc_id]
      );
      if (adminRow.rows.length > 0) location = adminRow.rows[0].location;
    }

    const token = jwt.sign(
      {
        authId: user.id,
        sdcId: user.sdc_id,
        role: user.role,
        name: user.name,
        location,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );


    res.status(200).json({
      message: 'Password set successfully',
      token,
      role: user.role,
      name: user.name,
      google_linked: user.google_linked
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
















// SIGNIN ROUTE
router.post('/signin', async (req, res) => {
  const { sdcId, password } = req.body;
  if (!sdcId || !password) {
    return res.status(400).json({ message: 'SDC ID and password are required' });
  }
  try {
    const result = await pool.query(
  'SELECT * FROM auth WHERE sdc_id = $1',
  [sdcId]
);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'SDC-ID not found' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(409).json({
        message: 'This account has no password yet. Use Create Account to activate it first.',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

// const token = jwt.sign(
//   { authId: user.id, sdcId: user.sdc_id, role: user.role, name: user.name },
//   process.env.JWT_SECRET,
//   { expiresIn: '7d' }
// );
let location = null;
if (user.role === 'admin') {
  const adminRow = await pool.query(
    'SELECT location FROM admins WHERE sdc_id = $1',
    [user.sdc_id]
  );
  if (adminRow.rows.length > 0) location = adminRow.rows[0].location;
}

const token = jwt.sign(
  {
    authId: user.id,
    sdcId: user.sdc_id,
    role: user.role,
    name: user.name,
    location,
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

res.status(200).json({ token, name: user.name, role: user.role, google_linked: user.google_linked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});










// LINK GOOGLE ROUTE
router.post('/link-google',verifyToken, async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_ANDROID_CLIENT_ID
    });

    const payload = ticket.getPayload();

    await pool.query(
      'UPDATE auth SET google_id = $1, email = $2, google_linked = TRUE WHERE id = $3',
      [payload.sub, payload.email, req.user.authId]
    );

    res.status(200).json({ message: 'Google account linked successfully' });
  } catch (err) {
    console.error('Link Google error:', err.message);
    res.status(400).json({ error: 'Failed to link Google account' });
  }
});

















module.exports = router;
