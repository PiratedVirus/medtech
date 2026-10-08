#!/usr/bin/env node
/**
 * Fails the build if an API route / lib file looks up a user by phone number alone.
 *
 * MULTI-TENANCY: the same phone number can belong to different users in different
 * clinics (e.g. DOCTOR in one clinic, PATIENT in another). Authenticated requests
 * must resolve the user with `tokenUserWhere(decoded)` from lib/clinic-auth.ts.
 */
const fs = require('fs');
const path = require('path');

const ROOTS = ['app', 'lib'];
// The helper itself builds the (phone + clinic) fallback for old tokens
const ALLOWED_FILES = [path.join('lib', 'clinic-auth.ts')];
const FORBIDDEN = [
  /where:\s*\{\s*phoneNumber\s*\}/,
  /phoneNumber:\s*decoded\.plusAddedPhoneNumber/,
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full);
    } else if (/\.(ts|tsx|js)$/.test(entry.name) && !ALLOWED_FILES.includes(full)) {
      fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
        if (FORBIDDEN.some((re) => re.test(line))) {
          findings.push(`${full}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

ROOTS.filter((r) => fs.existsSync(r)).forEach(walk);

if (findings.length > 0) {
  console.error('Phone-only user lookups found. Use tokenUserWhere(decoded) from lib/clinic-auth.ts instead:\n');
  findings.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}
