const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const config = require('../config/config');

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// In-memory brute-force tracker, keyed by IP.
// Resets on server restart — fine for a single-user personal app.
const attempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0].trim() : null) || req.socket.remoteAddress;
}

async function getPasscodeHash() {
  const { rows } = await pool.query(
    `SELECT passcode_hash FROM auth_settings ORDER BY id DESC LIMIT 1`
  );
  return rows[0]?.passcode_hash || null;
}

async function login(req, res) {
  const { passcode } = req.body;
  const ip = getClientIp(req);

  const record = attempts.get(ip);

  if (record && record.lockedUntil && record.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({
      error: `Too many attempts. Try again in ${minutesLeft} minute(s).`,
    });
  }

  if (!passcode) {
    return res.status(400).json({ error: 'Passcode is required' });
  }

  const hash = await getPasscodeHash();
  const valid = hash ? await bcrypt.compare(passcode, hash) : false;

  if (!valid) {
    const current = attempts.get(ip) || { count: 0 };
    current.count += 1;

    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_MS;
      current.count = 0;
    }

    attempts.set(ip, current);
    return res.status(401).json({ error: 'Incorrect passcode' });
  }

  attempts.delete(ip);

  const token = jwt.sign(
    { authorized: true },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({ token });
}

async function changePasscode(req, res) {
  const { currentPasscode, newPasscode } = req.body;

  if (!currentPasscode || !newPasscode) {
    return res.status(400).json({ error: 'Current and new passcode are required' });
  }

  if (newPasscode.length < 6) {
    return res.status(400).json({ error: 'New passcode must be at least 6 characters' });
  }

  const hash = await getPasscodeHash();
  const valid = hash ? await bcrypt.compare(currentPasscode, hash) : false;

  if (!valid) {
    return res.status(401).json({ error: 'Current passcode is incorrect' });
  }

  const newHash = await bcrypt.hash(newPasscode, 10);

  await pool.query(
    `UPDATE auth_settings SET passcode_hash = $1, updated_at = now()
     WHERE id = (SELECT id FROM auth_settings ORDER BY id DESC LIMIT 1)`,
    [newHash]
  );

  res.json({ success: true });
}

module.exports = { login, changePasscode };
