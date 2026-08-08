// Usage: node backend/scripts/hash-passcode.js yourPasscodeHere
// Prints a bcrypt hash of the passcode you pass in. Each page's passcode
// now lives in its own row of auth_settings (see 008_page_auth_settings.sql),
// seeded automatically on startup with known default words and changeable
// per page from Settings → Change Page Passcode. This script is just a
// manual fallback if you ever need to set one directly in the database:
//
//   UPDATE auth_settings SET passcode_hash = '<hash>' WHERE page = 'finance';

const bcrypt = require('bcrypt');

const passcode = process.argv[2];

if (!passcode) {
  console.error('Usage: node backend/scripts/hash-passcode.js <passcode>');
  process.exit(1);
}

bcrypt.hash(passcode, 10).then((hash) => {
  console.log('\nBcrypt hash:\n');
  console.log(hash);
  console.log('\nUPDATE auth_settings SET passcode_hash = \'<hash above>\' WHERE page = \'<page name>\';\n');
});
