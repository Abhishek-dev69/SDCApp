const path = require('path');
const fs = require('fs');
const dotenvPath = fs.existsSync(path.join(__dirname, '.env')) 
  ? path.join(__dirname, '.env') 
  : path.join(__dirname, '../env');
require('dotenv').config({ path: dotenvPath });

const pool = require('./db');
const bcrypt = require('bcrypt');

async function reset() {
  try {
    const hash = await bcrypt.hash('Teacher123#', 10);
    await pool.query(
      `UPDATE auth SET password_hash = $1, google_linked = $2 WHERE sdc_id = $3`,
      [hash, true, '26300001']
    );
    const check = await bcrypt.compare('Teacher123#', hash);
    console.log('Password set successfully. Verification:', check);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

reset();
