const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env') });
delete process.env.INSTANCE_UNIX_SOCKET;

const pool = require('./db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/002_razorpay_payments.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Migration 002_razorpay_payments completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

run();
