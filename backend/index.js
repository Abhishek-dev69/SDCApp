require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// import routes
const authRoutes = require('./routes/auth');
const usersRouter = require('./routes/users');
const emailRoutes = require('./routes/email');
const announcementRoutes = require('./routes/announcements');
const pdfviewRoutes = require('./routes/pdfview');
const sdcAuthRoutes = require('./routes/sdcidauth');
const instituteRoutes = require('./routes/institute');
const materialRoutes = require('./routes/materials');
const lecturesRoutes = require('./routes/lectures');
const attendanceRoutes = require('./routes/attendance');
const studentRoutes = require('./routes/students');


app.use('/auth/sdc', sdcAuthRoutes);
app.use('/pdfview', pdfviewRoutes);
app.use('/materials', materialRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/', instituteRoutes);
app.use('/announcements', announcementRoutes);
app.use('/auth/email', emailRoutes);
app.use('/auth', authRoutes);  
app.use('/users', usersRouter);
app.use('/admin/lectures', lecturesRoutes);
app.use('/admin/students', studentRoutes);

// test route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// database test route - checks if database connection works
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Database connected successfully',
      timestamp: result.rows[0].now 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
