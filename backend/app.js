const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const standardsRoutes = require('./routes/standards.routes');
const financeRoutes = require('./routes/finance.routes');
const fitnessRoutes = require('./routes/fitness.routes');
const visionRoutes = require('./routes/vision.routes');
const financialEngineRoutes = require('./routes/financialEngine.routes');
const timeExplorerRoutes = require('./routes/timeExplorer.routes');
const tradingRoutes = require('./routes/trading.routes');
const weeklyWithdrawalRoutes = require('./routes/WeeklyWithdrawal.routes');
const reactorRoutes = require('./routes/reactor.routes');
const betterMeRoutes = require('./routes/betterme.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/standards', standardsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/financial-engine', financialEngineRoutes);
app.use('/api/time-explorer', timeExplorerRoutes);
app.use('/api/trading', tradingRoutes);

app.use(
  '/api/weekly-withdrawal',
  weeklyWithdrawalRoutes
);

app.use('/api/reactor', reactorRoutes);
app.use('/api/betterme', betterMeRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

app.use(
  express.static(path.join(__dirname, '..', 'frontend'), {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      if (
        filePath.endsWith('.html') ||
        filePath.endsWith('.js') ||
        filePath.endsWith('.css')
      ) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

module.exports = app;
