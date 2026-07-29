const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const standardsRoutes = require('./routes/standards.routes');
const financeRoutes = require('./routes/finance.routes');
const fitnessRoutes = require('./routes/fitness.routes');
const visionRoutes = require('./routes/vision.routes');

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/standards', standardsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/vision', visionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve the frontend as static files, so the whole app runs from one
// server/URL (simplest path for Render). If you deploy the frontend
// separately (e.g. Render Static Site), you can remove this block.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Basic error handler so a thrown error doesn't crash the process
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
