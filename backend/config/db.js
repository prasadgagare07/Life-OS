const { Pool } = require('pg');
require('dotenv').config();

// Render (and most hosts) give you a single DATABASE_URL. Locally, you can
// instead set DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD in .env.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});


(async () => {
  try {
    // Remove duplicate dates, keeping the newest row
    await pool.query(`
      DELETE FROM finance_history a
      USING finance_history b
      WHERE a.id < b.id
      AND a.recorded_on = b.recorded_on;
    `);

    // Create unique constraint
    await pool.query(`
      ALTER TABLE finance_history
      ADD CONSTRAINT finance_history_recorded_on_key
      UNIQUE (recorded_on);
    `);

    console.log("✅ finance_history fixed.");
  } catch (err) {
    console.error("❌ Database fix:", err.message);
  }
})();

module.exports = pool;
