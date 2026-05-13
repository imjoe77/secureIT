/**
 * Database Bootstrap (Idempotent)
 */

const { SCHEMA_SQL } = require('./schema');

function tableExists(db, tableName) {
  const row = db
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table' AND name = ?`
    )
    .get(tableName);

  return !!row;
}

function columnExists(db, tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((c) => c.name === columnName);
}

function ensureSessionColumns(db) {
  if (!tableExists(db, 'user_sessions')) return;

  if (!columnExists(db, 'user_sessions', 'sudo_until')) {
    db.exec('ALTER TABLE user_sessions ADD COLUMN sudo_until DATETIME;');
  }
}

async function ensureSchema(db) {
  const isInitialized = tableExists(db, 'tenants');

  if (!isInitialized) {
    db.exec(SCHEMA_SQL);
  }

  ensureSessionColumns(db);

  if (typeof db.save === 'function') {
    db.save();
  }
}

module.exports = { ensureSchema };
