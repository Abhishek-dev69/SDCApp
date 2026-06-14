require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// import routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const announcementRoutes = require('./routes/announcements');
const pdfviewRoutes = require('./routes/pdfview');
const sdcAuthRoutes = require('./routes/sdcidauth');
const instituteRoutes = require('./routes/institute');
const materialRoutes = require('./routes/materials');
const lectureRoutes = require('./routes/lectures');
const dashboardRoutes = require('./routes/dashboards');
const operationRoutes = require('./routes/operations');

app.use('/auth/sdc', sdcAuthRoutes);
app.use('/pdfview', pdfviewRoutes);
app.use('/materials', materialRoutes);
app.use('/lectures', lectureRoutes);
app.use('/admin/lectures', lectureRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/operations', operationRoutes);
app.use('/', instituteRoutes);
app.use('/announcements', announcementRoutes);
app.use('/auth/email', emailRoutes);
app.use('/auth', authRoutes);  

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
