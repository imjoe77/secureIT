/**
 * Database Setup Script
 * Run with: npm run db:setup
 */

require('dotenv').config();
const { initDatabase, closeConnection } = require('./connection');
const { SCHEMA_SQL } = require('./schema');

async function setup() {
  console.log('Setting up PostgreSQL database...\n');

  const db = await initDatabase();

  await db.exec(`
    DROP TABLE IF EXISTS document_shares CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS user_sessions CASCADE;
    DROP TABLE IF EXISTS audit_log CASCADE;
    DROP TABLE IF EXISTS firewall_rules CASCADE;
    DROP TABLE IF EXISTS trusted_devices CASCADE;
    DROP TABLE IF EXISTS role_hierarchy CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS tenants CASCADE;
  `);

  await db.exec(SCHEMA_SQL);

  const tables = await db.prepare(`
    SELECT tablename AS name
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `).all();

  console.log('Tables created:');
  tables.forEach((t) => console.log(` - ${t.name}`));

  console.log('\nDatabase setup complete!');
  await closeConnection();
}

setup().catch(async (err) => {
  console.error('Setup failed:', err);
  await closeConnection().catch(() => {});
  process.exit(1);
});
