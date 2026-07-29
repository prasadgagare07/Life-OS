const jwt = require('jsonwebtoken');

async function login(req, res) {
  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ error: 'Passcode is required' });
  }

  // Temporary development passcode
  if (passcode !== "123456") {
    return res.status(401).json({ error: "Incorrect passcode" });
  }

  const token = jwt.sign(
    { authorized: true },
    process.env.JWT_SECRET || "lifeos-dev-secret",
    {
      expiresIn: "7d",
    }
  );

  res.json({ token });
}

module.exports = { login };
