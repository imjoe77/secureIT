/**
 * Database Bootstrap (Idempotent)
 */

const { SCHEMA_SQL } = require('./schema');

async function tableExists(db, tableName) {
  const row = await db.prepare(`SELECT to_regclass(?) AS table_name`).get(`public.${tableName}`);
  return !!row?.table_name;
}

async function columnExists(db, tableName, columnName) {
  const row = await db.prepare(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
  `).get(tableName, columnName);
  return !!row;
}

async function ensureSessionColumns(db) {
  if (!(await tableExists(db, 'user_sessions'))) return;

  if (!(await columnExists(db, 'user_sessions', 'sudo_until'))) {
    await db.exec('ALTER TABLE user_sessions ADD COLUMN sudo_until TIMESTAMPTZ;');
  }
}

async function ensureSchema(db) {
  const isInitialized = await tableExists(db, 'tenants');

  if (!isInitialized) {
    await db.exec(SCHEMA_SQL);
  }

  await ensureSessionColumns(db);
}

module.exports = { ensureSchema };
