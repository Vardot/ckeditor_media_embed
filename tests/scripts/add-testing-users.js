'use strict';

// Create the suite's testing users with drush, no browser. Idempotent.
//   CKEDITOR_MEDIA_EMBED_DRUSH="drush --root=web" node tests/scripts/add-testing-users.js

const { execSync } = require('child_process');
const { users } = require('../../cucumber.shared.js');

const quote = (value) => `'${String(value).replace(/'/g, "'\\''")}'`;

/**
 * Create every non-admin user from worldParameters.users, or reset its
 * password when it exists, and give it its roles.
 *
 * @param {string} drush - the drush command for the site under test.
 */
function addTestingUsers(drush = process.env.CKEDITOR_MEDIA_EMBED_DRUSH || 'drush') {
  const run = (args) => execSync(`${drush} ${args}`, { stdio: ['ignore', 'pipe', 'pipe'] });
  for (const info of Object.values(users)) {
    if (info.isAdmin) {
      continue;
    }
    const name = quote(info.username);
    try {
      run(`user:create ${name} --mail=${quote(info.email)} --password=${quote(info.password)}`);
    } catch {
      // It exists: put the suite's password back.
      run(`user:password ${name} ${quote(info.password)}`);
    }
    for (const role of info.roles || []) {
      run(`user:role:add ${quote(role)} ${name}`);
    }
  }
}

module.exports = { addTestingUsers };

if (require.main === module) {
  addTestingUsers();
}
