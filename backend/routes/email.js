const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Resend } = require('resend');
const pool = require('../db');

const resend = new Resend(process.env.RESEND_API_KEY);

const jwt = require('jsonwebtoken');










// POST /auth/email/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

 

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
  return res.status(401).json({ error: 'No account found with this email.' });
    }

    const user = result.rows[0];
    // Then check provider
    if (user.auth_provider !== 'email') {
      return res.status(401).json({ error: 'This account uses Google login. Please sign in with Google instead.' });
    }
    // Check email is verified
    if (!user.email_verified) {
      
      return res.status(403).json({ error: 'Please verify your email before signing in' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pool.query(
      'UPDATE auth SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const jwtToken = jwt.sign(
      {
        authId: user.id,
        studentId: user.student_id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Email signin successful for ${email}`);
    res.json({ jwt: jwtToken, role: user.role, is_temp_password: user.is_temp_password });

  } catch (err) {
    console.error('Email signin error:', err.message);
    res.status(500).json({ error: 'Signin failed' });
  }
});


















// POST /auth/email/signup
router.post('/signup', async (req, res) => {
  const { email, password , role, name} = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Check if student exists with this email
    const student = await pool.query(
      'SELECT * FROM students WHERE email_address = $1',
      [email]
    );
    const studentId = student.rows.length > 0 ? student.rows[0].id : null;

    // Insert into auth table
    await pool.query(
   
    `INSERT INTO auth 
        (student_id, email, name, auth_provider, role, password_hash, email_verified, verification_token, verification_token_expires_at)
    VALUES 
        ($1, $2, $3, $4, $5, $6, false, $7, $8)`,
    [studentId, email, name, 'email', role, passwordHash, verificationToken, tokenExpiry]
    );
    // Send verification email
    const emailResult = await resend.emails.send({
      from: 'SDCApp <noreply@sureshdaniclasses.com>', // swap with noreply@ksneducation.in later
      to: email,
      subject: 'Verify your SDCApp email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2b58ed;">Welcome to SDCApp!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="https://sdcapp-backend-456970553309.asia-south1.run.app/auth/email/verify?token=${verificationToken}"
             style="background-color: #2b58ed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #666;">This link expires in 24 hours.</p>
          <p style="color: #666;">If you didn't create an account, ignore this email.</p>
        </div>
      `
    });
    
    res.status(201).json({ message: JSON.stringify(emailResult) });

  } catch (err) {
    console.error('Email signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});


















// GET /auth/email/verify?token=xxx
router.get('/verify', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Invalid verification link');
  }

  try {
    const result = await pool.query(
      'SELECT * FROM auth WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Invalid or expired verification link');
    }

    const user = result.rows[0];

    // Check token expiry
    if (new Date() > new Date(user.verification_token_expires_at)) {
      return res.status(410).send('Verification link has expired. Please sign up again.');
    }

    // Mark as verified and clear token
    await pool.query(
      `UPDATE auth 
       SET email_verified = true, verification_token = null, verification_token_expires_at = null 
       WHERE id = $1`,
      [user.id]
    );

    // Show success page
    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 60px 20px;">
        <h2 style="color: #2b58ed;">Email Verified!</h2>
        <p>Your account has been verified. You can now sign in to SDCApp.</p>
      </div>
    `);

  } catch (err) {
    console.error('Email verification error:', err.message);
    res.status(500).send('Verification failed');
  }
});











// Forgot password

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );

    
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'If this email exists, a temporary password has been sent.' });
    }

    if (result.rows[0].auth_provider !== 'email') {
      return res.status(200).json({ 
        error: 'This account uses Google login. Please sign in with Google instead.' 
      });
    }

    // Generate 8 char temp password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // e.g. "a3f8c2d1"
    const tempHash = await bcrypt.hash(tempPassword, 10);

    // Store it and mark as temp
    await pool.query(
      'UPDATE auth SET password_hash = $1, is_temp_password = TRUE WHERE email = $2',
      [tempHash, email]
    );

    // Send email
    await resend.emails.send({
      from: 'SDCApp <noreply@sureshdaniclasses.com>',
      to: email,
      subject: 'Your temporary SDCApp password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2b58ed;">Password Reset</h2>
          <p>Here is your temporary password for SDCApp:</p>
          <div style="background-color: #f4f4f4; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 16px 0;">
            ${tempPassword}
          </div>
          <p>Use this to log in, you will be asked to set a new password immediately.</p>
          <p style="color: #666;">This password can only be used once.</p>
          <p style="color: #666;">If you didn't request this, please contact your admin.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'If this email exists, a temporary password has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});


module.exports = router;