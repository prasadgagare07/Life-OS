// Usage: node backend/scripts/hash-passcode.js yourPasscodeHere
// Prints a bcrypt hash to paste into PASSCODE_HASH in your .env file.
// Your real passcode is never stored anywhere — only this hash is.

const bcrypt = require('bcrypt');

const passcode = process.argv[2];

if (!passcode) {
  console.error('Usage: node backend/scripts/hash-passcode.js <passcode>');
  process.exit(1);
}

bcrypt.hash(passcode, 10).then((hash) => {
  console.log('\nAdd this line to your .env file:\n');
  console.log(`PASSCODE_HASH=${hash}\n`);
});
