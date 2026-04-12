const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

app.use('/pdfview', pdfviewRoutes);
app.use('/announcements', announcementRoutes);
app.use('/auth/email', emailRoutes);
app.use('/auth', authRoutes);  
app.use('/users', usersRouter);

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