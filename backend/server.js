const fs = require('fs');
const path = require('path');

const app = require('./app');
const config = require('./config/config');
const pool = require('./config/db');

async function start() {
  try {
    const schema = fs.readFileSync(
      path.join(__dirname, 'database', 'schema.sql'),
      'utf8'
    );

    await pool.query(schema);

    await pool.query(`
ALTER TABLE finance_snapshot
ADD COLUMN IF NOT EXISTS wealth_engine NUMERIC(14,2) NOT NULL DEFAULT 0;
`);

    const dailyEntriesMigration = fs.readFileSync(
      path.join(__dirname, 'database', '001_daily_entries.sql'),
      'utf8'
    );

    await pool.query(dailyEntriesMigration);

    const visionSeed = fs.readFileSync(
      path.join(__dirname, 'database', 'seed_vision.sql'),
      'utf8'
    );

    await pool.query(visionSeed);

    console.log('✅ Database initialized');

    app.listen(config.port, () => {
      console.log(`🚀 LifeOS server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

start();
