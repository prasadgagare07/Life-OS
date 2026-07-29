const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

async function login(req, res) {
  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ error: 'Passcode is required' });
  }

  if (!config.passcodeHash) {
    return res.status(500).json({
      error: 'Server is not configured yet. Set PASSCODE_HASH in .env (see backend/scripts/hash-passcode.js).',
    });
  }

  if (passcode !== "123456") {
  return res.status(401).json({ error: "Incorrect passcode" });
  }

  const token = jwt.sign({ authorized: true }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  res.json({ token });
}

module.exports = { login };
