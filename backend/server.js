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
    // ==========================================
    // BASE DATABASE SCHEMA
    // ==========================================

    const schema = fs.readFileSync(
      path.join(__dirname, 'database', 'schema.sql'),
      'utf8'
    );

    await pool.query(schema);

    // ==========================================
    // FINANCE WEALTH ENGINE
    // ==========================================

    await pool.query(`
      ALTER TABLE finance_snapshot
      ADD COLUMN IF NOT EXISTS wealth_engine
      NUMERIC(14,2) NOT NULL DEFAULT 0;
    `);

    // ==========================================
    // DAILY ENTRIES
    // ==========================================

    const dailyEntriesMigration = fs.readFileSync(
      path.join(__dirname, 'database', '001_daily_entries.sql'),
      'utf8'
    );

    await pool.query(dailyEntriesMigration);

    // ==========================================
    // AUTH
    // ==========================================

    const authMigration = fs.readFileSync(
      path.join(__dirname, 'database', '002_auth_settings.sql'),
      'utf8'
    );

    await pool.query(authMigration);

    // ==========================================
    // PAGE AUTH SETTINGS
    // ==========================================

    const pageAuthMigration = fs.readFileSync(
      path.join(__dirname, 'database', '008_page_auth_settings.sql'),
      'utf8'
    );

    await pool.query(pageAuthMigration);

    // ==========================================
    // REACTOR
    // ==========================================

    const reactorMigration = fs.readFileSync(
      path.join(__dirname, 'database', '009_reactor.sql'),
      'utf8'
    );

    await pool.query(reactorMigration);

    // TEMPORARY — force Weekly Withdrawal passcode to "confirmed"
    const wdForceHash = await bcrypt.hash('confirmed', 10);

    await pool.query(
      `INSERT INTO auth_settings (page, passcode_hash)
       VALUES ('weekly-withdrawal', $1)
       ON CONFLICT (page)
       DO UPDATE SET
         passcode_hash = $1,
         updated_at = now()`,
      [wdForceHash]
    );

    console.log('🔧 Weekly Withdrawal passcode force-reset to "confirmed"');

    // ==========================================
    // FINANCIAL TIME EXPLORER
    // ==========================================

    // TEMPORARY — force Financial Time Explorer passcode
    const fteHash = await bcrypt.hash('917283', 10);

    await pool.query(
      `INSERT INTO auth_settings (page, passcode_hash)
       VALUES ('financial-time-explorer', $1)
       ON CONFLICT (page)
       DO UPDATE SET
         passcode_hash = $1,
         updated_at = now()`,
      [fteHash]
    );

    console.log(
      '🔧 Financial Time Explorer passcode force-reset to "917283"'
    );

    // ==========================================
    // DEFAULT PAGE PASSCODES
    // ==========================================

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
      'weekly-withdrawal': 'confirmed',
      betterme: 'growth',
    };

    const { rows: existingPages } = await pool.query(
      `SELECT page FROM auth_settings`
    );

    const existingPageSet = new Set(
      existingPages.map((row) => row.page)
    );

    const seededPages = [];

    for (const [page, defaultPasscode] of Object.entries(
      DEFAULT_PAGE_PASSCODES
    )) {
      if (existingPageSet.has(page)) continue;

      const hash = await bcrypt.hash(defaultPasscode, 10);

      await pool.query(
        `INSERT INTO auth_settings (page, passcode_hash)
         VALUES ($1, $2)`,
        [page, hash]
      );

      seededPages.push(`${page} → "${defaultPasscode}"`);
    }

    if (seededPages.length > 0) {
      console.warn(
        '⚠️ Seeded default passcodes for these pages:\n' +
          seededPages
            .map((line) => `   ${line}`)
            .join('\n') +
          '\n   Log into each one and change it from Settings → Change Passcode.'
      );
    }

    // ==========================================
    // VISION
    // ==========================================

    const visionSeed = fs.readFileSync(
      path.join(__dirname, 'database', 'seed_vision.sql'),
      'utf8'
    );

    await pool.query(visionSeed);

    // ==========================================
    // FINANCIAL TIME EXPLORER MIGRATION
    // ==========================================

    const timeExplorerMigration = fs.readFileSync(
      path.join(__dirname, 'database', '003_time_explorer.sql'),
      'utf8'
    );

    await pool.query(timeExplorerMigration);

    // ==========================================
    // TRADING
    // ==========================================

    const tradingMigration = fs.readFileSync(
      path.join(__dirname, 'database', '004_trading.sql'),
      'utf8'
    );

    await pool.query(tradingMigration);

    // ==========================================
    // FITNESS
    // ==========================================

    const fitnessMigration = fs.readFileSync(
      path.join(__dirname, 'database', '006_fitness_full.sql'),
      'utf8'
    );

    await pool.query(fitnessMigration);

    // ==========================================
    // TRADING ACCOUNT
    // ==========================================

    const tradingAccountMigration = fs.readFileSync(
      path.join(__dirname, 'database', '007_trading_account.sql'),
      'utf8'
    );

    await pool.query(tradingAccountMigration);

    // ==========================================
    // WEEKLY WITHDRAWAL
    // ==========================================

    // Use the latest Weekly Withdrawal migration.
    const weeklyWithdrawalMigration = fs.readFileSync(
  path.join(__dirname, 'database', '013_weekly_withdrawal.sql'),
  'utf8'
);

await pool.query(weeklyWithdrawalMigration);

const weeklyWithdrawalV2Migration = fs.readFileSync(
  path.join(__dirname, 'database', '014_weekly_withdrawal_v2.sql'),
  'utf8'
);

await pool.query(weeklyWithdrawalV2Migration);

const weeklyWithdrawalMethodsMigration = fs.readFileSync(
  path.join(__dirname, 'database', '015_weekly_withdrawal_methods.sql'),
  'utf8'
);

await pool.query(weeklyWithdrawalMethodsMigration);

console.log('✅ Weekly Withdrawal database initialized');

    // ==========================================
    // SESSIONS
    // ==========================================

    const sessionsMigration = fs.readFileSync(
      path.join(__dirname, 'database', '010_sessions.sql'),
      'utf8'
    );

    await pool.query(sessionsMigration);

    // ==========================================
    // REACTOR RACE
    // ==========================================

    const reactorRaceMigration = fs.readFileSync(
      path.join(__dirname, 'database', '011_reactor_race.sql'),
      'utf8'
    );

    await pool.query(reactorRaceMigration);

    // ==========================================
    // REACTOR CUSTOM WEIGHT
    // ==========================================
// ==========================================
    // BETTERME
    // ==========================================

    const betterMeMigration = fs.readFileSync(
      path.join(__dirname, 'database', '016_betterme.sql'),
      'utf8'
    );

    await pool.query(betterMeMigration);

    console.log('✅ BetterMe database initialized');
    

    const reactorWeightMigration = fs.readFileSync(
      path.join(
        __dirname,
        'database',
        '012_reactor_custom_weight.sql'
      ),
      'utf8'
    );

    await pool.query(reactorWeightMigration);

    // ==========================================
    // TEMPORARY REACTOR RESET
    // ==========================================

    await pool.query(`DELETE FROM reactor_entries;`);

    await pool.query(`DELETE FROM reactor_races;`);

    await pool.query(`
      INSERT INTO reactor_races
        (race_number, started_at)
      VALUES
        (1, now());
    `);

    console.log(
      '🔧 Reactor data reset to zero — remove this block from server.js now.'
    );

    // ==========================================
    // START SERVER
    // ==========================================

    console.log('✅ Database initialized');

    app.listen(config.port, '0.0.0.0', () => {
  console.log(
    `🚀 LifeOS server running on port ${config.port}`
  );
});

  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

start();
