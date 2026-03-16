const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// import routes
const usersRouter = require('./routes/users');
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});