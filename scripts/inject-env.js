require("dotenv").config();
const fs = require("fs");

// Read the env vars and write them to a file that gets bundled
const envVars = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

// Write to a JS file that gets included in the build
const content = `window.__ENV__ = ${JSON.stringify(envVars)};`;
fs.writeFileSync("src/env.js", content);
console.log("✓ Env vars injected into src/env.js");
