/**
 * Database Setup Script
 * Run with: npm run db:setup
 */

require('dotenv').config();
const { initDatabase, closeConnection } = require('./connection');
const { SCHEMA_SQL } = require('./schema');

async function setup() {
  console.log('Setting up database...\n');

  const db = await initDatabase();

  // Temporarily disable FK checks and drop child tables first.
  db.exec('PRAGMA foreign_keys = OFF;');

  db.exec(`
    DROP TABLE IF EXISTS document_shares;
    DROP TABLE IF EXISTS documents;
    DROP TABLE IF EXISTS user_sessions;
    DROP TABLE IF EXISTS audit_log;
    DROP TABLE IF EXISTS firewall_rules;
    DROP TABLE IF EXISTS trusted_devices;
    DROP TABLE IF EXISTS role_hierarchy;
    DROP TABLE IF EXISTS role_permissions;
    DROP TABLE IF EXISTS user_roles;
    DROP TABLE IF EXISTS permissions;
    DROP TABLE IF EXISTS roles;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS tenants;
  `);

  db.exec(SCHEMA_SQL);
  db.exec('PRAGMA foreign_keys = ON;');

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables created:');
  tables.forEach((t) => console.log(` - ${t.name}`));

  db.save();
  console.log('\nDatabase setup complete!');
  closeConnection();
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
