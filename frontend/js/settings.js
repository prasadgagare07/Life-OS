document.getElementById('logout-btn').addEventListener('click', logout);

// Settings for passcode are handled server-side (see backend/scripts/hash-passcode.js)
// since the passcode hash lives in .env, not the database — this keeps the
// login secret out of the app's data layer entirely.
