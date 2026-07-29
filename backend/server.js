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
