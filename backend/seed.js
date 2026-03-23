require('dotenv').config();
const pool = require('./db.js');  // ← just use this, nothing else needed
const fs = require('fs');

const CSV_PATH = "C:/Users/Admin/Documents/Suresh_Dani's_Classes/students_cleaned.csv";

async function seed() {
  console.log('Starting seed...');

  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || null);
    return obj;
  });

  console.log(`Found ${rows.length} rows to insert`);

  const client = await pool.connect();  // ← grab a client from the pool for the transaction

  try {
    await client.query('BEGIN');
    let successCount = 0;

    for (const row of rows) {
      const parentResult = await client.query(
        `INSERT INTO parents (father_name, mother_name, father_whatsapp_number, mother_whatsapp_number)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [row.father_name, row.mother_name, row.father_whatsapp_number, row.mother_whatsapp_number]
      );

      const parentId = parentResult.rows[0].id;

      await client.query(
        `INSERT INTO students (
          parent_id, serial_number, email_address, student_name,
          student_whatsapp_number, student_std, sdc_branch, sdc_batch,
          sdc_course_opted, tenth_std_school, student_address,
          school_board, tenth_std_percentage
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          parentId,
          row.serial_number ? parseInt(row.serial_number) : null,
          row.email_address,
          row.student_name,
          row.student_whatsapp_number,
          row.student_std,
          row.sdc_branch,
          row.sdc_batch,
          row.sdc_course_opted,
          row.tenth_std_school,
          row.student_address,
          row.school_board,
          row.tenth_std_percentage ? parseFloat(row.tenth_std_percentage) : null
        ]
      );

      successCount++;
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully inserted ${successCount} students and ${successCount} parent records`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed, rolled back:', err.message);
  } finally {
    client.release();  // ← release back to pool, not disconnect
  }
}

seed();