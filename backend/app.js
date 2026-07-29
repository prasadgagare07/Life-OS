const fs = require('fs');
const path = require('path');

const app = require('./app');
const config = require('./config/config');
const pool = require('./database/db');

async function startServer() {
  try {
    // Read schema.sql
    const schema = fs.readFileSync(
      path.join(__dirname, 'database', 'schema.sql'),
      'utf8'
    );

    // Create tables if they don't exist
    await pool.query(schema);

    console.log('✅ Database initialized');

    app.listen(config.port, () => {
      console.log(`🚀 LifeOS server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
}

startServer();
