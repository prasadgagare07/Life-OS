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
  'reactor',
];

// In-memory brute-force tracker, keyed by "purpose:page:ip".
// Resets on server restart — fine for a single-user personal app.
const attempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0].trim() : null) || req.socket.remoteAddress;
}

// Turns a raw User-Agent string into something readable in a device list,
// e.g. "Safari on iPhone" instead of the full UA blob.
function describeDevice(userAgent) {
  if (!userAgent) return 'Unknown device';

  const ua = userAgent;
  let os = 'Unknown OS';
  if (/iphone/i.test(ua)) os = 'iPhone';
  else if (/ipad/i.test(ua)) os = 'iPad';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/mac os x/i.test(ua)) os = 'Mac';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome';
  else if (/crios\//i.test(ua)) browser = 'Chrome';
  else if (/fxios\//i.test(ua) || /firefox\//i.test(ua)) browser = 'Firefox';
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = 'Safari';

  return `${browser} on ${os}`;
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
  const valid = hash ? await bcrypt.compare(passcode, hash) : false;

  if (!valid) {
    recordFailure(key);
    return res.status(401).json({ error: 'Incorrect passcode' });
  }

  clearAttempts(key);

  // Create a session row for this device/login so it shows up in Settings
  // and can be individually revoked later.
  const userAgent = req.headers['user-agent'] || null;
  const ip = getClientIp(req);

  const { rows } = await pool.query(
    `INSERT INTO sessions (page, ip, user_agent) VALUES ($1, $2, $3) RETURNING id`,
    [page, ip, userAgent]
  );
  const sessionId = rows[0].id;

  // The session ID (sid) is what lets requireAuth check, on every request,
  // whether this specific login has been revoked — the JWT itself never
  // changes, so revocation has to be checked against the database.
  const token = jwt.sign(
    { page, authorized: true, sid: sessionId },
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

// Lists every active (non-revoked) session across ALL pages, most recently
// active first. Only reachable with the Settings passcode (see routes) —
// Settings already has authority over every other page's passcode, so it's
// the one place that can see the whole household of logins at once.
async function listSessions(req, res) {
  const { rows } = await pool.query(
    `SELECT id, page, ip, user_agent, created_at, last_seen_at
     FROM sessions
     WHERE revoked_at IS NULL
     ORDER BY last_seen_at DESC`
  );

  const sessions = rows.map((row) => ({
    id: row.id,
    page: row.page,
    device: describeDevice(row.user_agent),
    ip: row.ip,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    isCurrent: row.id === req.sessionId,
  }));

  res.json({ sessions });
}

// Revokes one session by id, regardless of which page it belongs to.
async function revokeSession(req, res) {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    `UPDATE sessions SET revoked_at = now()
     WHERE id = $1 AND revoked_at IS NULL`,
    [id]
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ success: true });
}

// Revokes every session on every page except the one making the request —
// "log out all other devices" without logging yourself out of Settings.
async function revokeOtherSessions(req, res) {
  const { rowCount } = await pool.query(
    `UPDATE sessions SET revoked_at = now()
     WHERE id != $1 AND revoked_at IS NULL`,
    [req.sessionId]
  );

  res.json({ success: true, revokedCount: rowCount });
}

module.exports = {
  login,
  changePasscode,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  VALID_PAGES,
};
