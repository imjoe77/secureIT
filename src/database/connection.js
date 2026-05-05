/**
 * Database Connection Manager
 * 
 * Provides a singleton SQLite connection using sql.js (pure JavaScript SQLite).
 * sql.js is used for zero-config setup with no native compilation required.
 * 
 * The API is adapted to match better-sqlite3's synchronous API pattern
 * by wrapping sql.js to provide .prepare().get(), .prepare().all(), .prepare().run().
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'firewall.db');

let db = null;
let SQL = null;

/**
 * Wrapper around sql.js statement to match better-sqlite3 API.
 */
class PreparedStatement {
  constructor(database, sql, wrapper) {
    this.database = database;
    this.sql = sql;
    this.wrapper = wrapper;
  }

  get(...params) {
    try {
      const stmt = this.database.prepare(this.sql);
      stmt.bind(params);
      if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const row = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  all(...params) {
    try {
      const results = [];
      const stmt = this.database.prepare(this.sql);
      stmt.bind(params);
      while (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const row = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        results.push(row);
      }
      stmt.free();
      return results;
    } catch (e) {
      throw e;
    }
  }

  run(...params) {
    try {
      this.database.run(this.sql, params);
      const changes = this.database.getRowsModified();
      // Debounced save after write operations
      if (this.wrapper) this.wrapper._debouncedSave();
      return { changes };
    } catch (e) {
      throw e;
    }
  }
}

class DatabaseWrapper {
  constructor(sqlJsDb) {
    this.db = sqlJsDb;
    this._saveTimer = null;
  }

  prepare(sql) {
    return new PreparedStatement(this.db, sql, this);
  }

  exec(sql) {
    this.db.exec(sql);
    this._save();
  }

  pragma(str) {
    try {
      this.db.exec(`PRAGMA ${str}`);
    } catch (e) {
      // Some pragmas not supported in sql.js
    }
  }

  close() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._save();
    this.db.close();
  }

  _debouncedSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(), 100);
  }

  // Auto-save after write operations
  _save() {
    try {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (e) {
      console.error('Failed to save database:', e.message);
    }
  }

  // Periodic save for run() operations
  save() {
    this._save();
  }
}

/**
 * Initialize sql.js and load/create the database.
 * This MUST be called before getConnection().
 */
async function initDatabase() {
  if (db) return db;

  SQL = await initSqlJs();

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let sqlJsDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlJsDb = new SQL.Database(fileBuffer);
    console.log('📦 Database loaded from:', DB_PATH);
  } else {
    sqlJsDb = new SQL.Database();
    console.log('📦 New database created:', DB_PATH);
  }

  db = new DatabaseWrapper(sqlJsDb);
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Get the database connection (must call initDatabase() first).
 */
function getConnection() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeConnection() {
  if (db) {
    db.close();
    db = null;
    console.log('📦 Database connection closed');
  }
}

module.exports = { initDatabase, getConnection, closeConnection };
