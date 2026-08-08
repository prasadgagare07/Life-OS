const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = require('./app');
const config = require('./config/config');
const pool = require('./config/db');

async function start() {
  if (!config.jwtSecret) {
    console.error(
      '❌ JWT_SECRET is not set. Set it as an environment variable before starting the server.'
    );
    process.exit(1);
  }

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

    const authMigration = fs.readFileSync(
      path.join(__dirname, 'database', '002_auth_settings.sql'),
      'utf8'
    );

    await pool.query(authMigration);

    // Move auth_settings from one shared passcode to one row per page.
    const pageAuthMigration = fs.readFileSync(
      path.join(__dirname, 'database', '008_page_auth_settings.sql'),
      'utf8'
    );

    await pool.query(pageAuthMigration);

    // Every page gets its own passcode, seeded with a known default word so
    // it can be logged into for the first time. Change each one from
    // Settings — Settings' own default passcode is "control".
    const DEFAULT_PAGE_PASSCODES = {
      dashboard: 'horizon',
      'daily-standards': 'discipline',
      standards: 'consistency',
      finance: 'abundance',
      'financial-time-explorer': 'foresight',
      'time-explorer': 'patience',
      fitness: 'strength',
      vision: 'purpose',
      trading: 'courage',
      settings: 'control',
    };

    const { rows: existingPages } = await pool.query(
      `SELECT page FROM auth_settings`
    );
    const existingPageSet = new Set(existingPages.map((row) => row.page));
    const seededPages = [];

    for (const [page, defaultPasscode] of Object.entries(DEFAULT_PAGE_PASSCODES)) {
      if (existingPageSet.has(page)) continue;

      const hash = await bcrypt.hash(defaultPasscode, 10);
      await pool.query(
        `INSERT INTO auth_settings (page, passcode_hash) VALUES ($1, $2)`,
        [page, hash]
      );
      seededPages.push(`${page} → "${defaultPasscode}"`);
    }

    if (seededPages.length > 0) {
      console.warn(
        '⚠️  Seeded default passcodes for these pages:\n' +
        seededPages.map((line) => `   ${line}`).join('\n') +
        '\n   Log into each one and change it from Settings → Change Passcode.'
      );
    }

    const visionSeed = fs.readFileSync(
  path.join(__dirname, 'database', 'seed_vision.sql'),
  'utf8'
);

await pool.query(visionSeed);

// Financial Time Explorer Migration
const timeExplorerMigration = fs.readFileSync(
  path.join(__dirname, 'database', '003_time_explorer.sql'),
  'utf8'
);

await pool.query(timeExplorerMigration);

// Trade Guardian Migration — creates trading_entries, without which every
// /api/trading/* request fails because the table doesn't exist.
const tradingMigration = fs.readFileSync(
  path.join(__dirname, 'database', '004_trading.sql'),
  'utf8'
);

await pool.query(tradingMigration);

// Fitness Migration — adds steps/water/protein/sleep/rules/lock columns
// plus a photos table, so nothing fitness.js tracks lives only in the browser.
const fitnessMigration = fs.readFileSync(
  path.join(__dirname, 'database', '006_fitness_full.sql'),
  'utf8'
);

await pool.query(fitnessMigration);

// Trade Guardian account details (UPI / bank) — was localStorage-only.
const tradingAccountMigration = fs.readFileSync(
  path.join(__dirname, 'database', '007_trading_account.sql'),
  'utf8'
);

await pool.query(tradingAccountMigration);

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
