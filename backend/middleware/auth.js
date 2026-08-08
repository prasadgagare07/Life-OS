const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Every login is scoped to one page (dashboard, finance, fitness, ...) and
// the resulting token only carries that page's name. requireAuth(allowedPages)
// checks that the token is valid *and* that it belongs to one of the pages
// allowed to call this route. The dashboard aggregates read-only data from
// several other pages, so it's included in those pages' allow-lists too.
function requireAuth(allowedPages) {
  return function (req, res, next) {
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

    req.authPage = decoded.page;
    next();
  };
}

module.exports = requireAuth;
