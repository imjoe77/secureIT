/**
 * Database Setup Script
 * Run with: npm run db:setup
 */

require('dotenv').config();
const { initDatabase, closeConnection } = require('./connection');
const { SCHEMA_SQL } = require('./schema');

async function setup() {
  console.log('🔧 Setting up database...\n');

  const db = await initDatabase();
  db.exec(SCHEMA_SQL);

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('✅ Tables created:');
  tables.forEach(t => console.log(`   • ${t.name}`));

  db.save();
  console.log('\n✅ Database setup complete!');
  closeConnection();
}

setup().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
