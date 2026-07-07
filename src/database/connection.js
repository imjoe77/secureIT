/**
 * Database Connection Manager
 *
 * Provides a singleton PostgreSQL pool while preserving the small
 * prepared-statement API the app already uses: prepare().get/all/run.
 */

const { Pool } = require('pg');
const { env } = require('../config/env');

let pool = null;
let db = null;

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

class PreparedStatement {
  constructor(sql) {
    this.sql = convertPlaceholders(sql);
  }

  async get(...params) {
    const result = await pool.query(this.sql, params);
    return result.rows[0];
  }

  async all(...params) {
    const result = await pool.query(this.sql, params);
    return result.rows;
  }

  async run(...params) {
    const result = await pool.query(this.sql, params);
    return { changes: result.rowCount };
  }
}

class DatabaseWrapper {
  prepare(sql) {
    return new PreparedStatement(sql);
  }

  async exec(sql) {
    return pool.query(sql);
  }

  async query(sql, params = []) {
    return pool.query(sql, params);
  }

  async close() {
    await closeConnection();
  }
}

async function initDatabase() {
  if (db) return db;

  const ssl = env.PGSSLMODE === 'disable'
    ? false
    : { rejectUnauthorized: env.PGSSLMODE !== 'no-verify' };

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl,
  });
  await pool.query('SELECT 1');

  db = new DatabaseWrapper();
  console.log('Database connected: PostgreSQL');
  return db;
}

function getConnection() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('Database connection closed');
  }
}

module.exports = { initDatabase, getConnection, closeConnection };
