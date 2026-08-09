const jwt = require('jsonwebtoken');
const config = require('../config/config');
const pool = require('../config/db');

// Every login is scoped to one page (dashboard, finance, fitness, ...) and
// the resulting token carries that page's name plus a session id (sid).
// requireAuth(allowedPages) checks that the token is valid, that its page
// is allowed to call this route, AND that its session hasn't been revoked
// from the Settings "active devices" list — that last check is what makes
// revocation actually take effect immediately instead of waiting for the
// token to expire on its own.
function requireAuth(allowedPages) {
  return async function (req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (Array.isArray(allowedPages) && !allowedPages.includes(decoded.page)) {
      return res.status(403).json({ error: "This page's passcode does not unlock this resource" });
    }

    // Tokens issued before this feature existed won't have a sid — let
    // those through without a session check rather than mass-logging
    // everyone out on deploy.
    if (decoded.sid) {
      const { rows } = await pool.query(
        `SELECT id FROM sessions WHERE id = $1 AND revoked_at IS NULL`,
        [decoded.sid]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'This session has been logged out' });
      }

      pool
        .query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [decoded.sid])
        .catch((err) => console.error('Failed to update session last_seen_at', err));

      req.sessionId = decoded.sid;
    }

    req.authPage = decoded.page;
    next();
  };
}

module.exports = requireAuth;
