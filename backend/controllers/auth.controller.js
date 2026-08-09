const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const config = require('../config/config');

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Every page LifeOS serves (dashboard, finance, fitness, ...) has its own
// row in auth_settings and its own passcode. Knowing one page's passcode
// never unlocks another page.
const VALID_PAGES = [
  'dashboard',
  'daily-standards',
  'standards',
  'finance',
  'financial-time-explorer',
  'time-explorer',
  'fitness',
  'vision',
  'trading',
  'settings',
  'reactor',   // ← check if this line is actually there
];

// In-memory brute-force tracker, keyed by "purpose:page:ip".
// Resets on server restart — fine for a single-user personal app.
const attempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0].trim() : null) || req.socket.remoteAddress;
}

function checkLockout(key) {
  const record = attempts.get(key);
  if (record && record.lockedUntil && record.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return `Too many attempts. Try again in ${minutesLeft} minute(s).`;
  }
  return null;
}

function recordFailure(key) {
  const current = attempts.get(key) || { count: 0 };
  current.count += 1;

  if (current.count >= MAX_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_MS;
    current.count = 0;
  }

  attempts.set(key, current);
}

function clearAttempts(key) {
  attempts.delete(key);
}

async function getPasscodeHash(page) {
  const { rows } = await pool.query(
    `SELECT passcode_hash FROM auth_settings WHERE page = $1`,
    [page]
  );
  return rows[0]?.passcode_hash || null;
}

async function login(req, res) {
  const { page, passcode } = req.body;

  if (!page || !VALID_PAGES.includes(page)) {
    return res.status(400).json({ error: 'Unknown page' });
  }

  const key = `login:${page}:${getClientIp(req)}`;

  const lockoutMessage = checkLockout(key);
  if (lockoutMessage) {
    return res.status(429).json({ error: lockoutMessage });
  }

  if (!passcode) {
    return res.status(400).json({ error: 'Passcode is required' });
  }

  const hash = await getPasscodeHash(page);

  // TEMPORARY DEBUG — remove after we find the issue
  console.log('🔍 LOGIN DEBUG', {
    page,
    passcodeLength: passcode.length,
    passcodeReceived: JSON.stringify(passcode),
    hashFound: !!hash,
    hashPrefix: hash ? hash.slice(0, 15) : null,
  });

  const valid = hash ? await bcrypt.compare(passcode, hash) : false;

  console.log('🔍 LOGIN DEBUG result:', valid);

  if (!valid) {
    recordFailure(key);
    return res.status(401).json({ error: 'Incorrect passcode' });
  }

  clearAttempts(key);

  const token = jwt.sign(
    { page, authorized: true },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({ token, page });
}

// Changing a page's passcode requires being logged into Settings *and*
// knowing that page's current passcode — req.authPage is guaranteed to be
// 'settings' by the requireAuth(['settings']) middleware on this route.
async function changePasscode(req, res) {
  const { page, currentPasscode, newPasscode } = req.body;

  if (!page || !VALID_PAGES.includes(page)) {
    return res.status(400).json({ error: 'Unknown page' });
  }

  const key = `change:${page}:${getClientIp(req)}`;

  const lockoutMessage = checkLockout(key);
  if (lockoutMessage) {
    return res.status(429).json({ error: lockoutMessage });
  }

  if (!currentPasscode || !newPasscode) {
    return res.status(400).json({ error: 'Current and new passcode are required' });
  }

  if (newPasscode.length < 4) {
    return res.status(400).json({ error: 'New passcode must be at least 4 characters' });
  }

  const hash = await getPasscodeHash(page);
  const valid = hash ? await bcrypt.compare(currentPasscode, hash) : false;

  if (!valid) {
    recordFailure(key);
    return res.status(401).json({ error: 'Current passcode is incorrect' });
  }

  clearAttempts(key);

  const newHash = await bcrypt.hash(newPasscode, 10);

  await pool.query(
    `UPDATE auth_settings SET passcode_hash = $1, updated_at = now() WHERE page = $2`,
    [newHash, page]
  );

  res.json({ success: true });
}

module.exports = { login, changePasscode, VALID_PAGES };
