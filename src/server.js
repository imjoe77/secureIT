/**
 * Multi-Tenant SaaS Permission Escalation Firewall
 * Main server entry point.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initDatabase, getConnection } = require('./database/connection');
const { SCHEMA_SQL } = require('./database/schema');

async function startServer() {
  // Initialize database first
  const db = await initDatabase();
  db.exec(SCHEMA_SQL);
  db.save();

  const app = express();
  const PORT = 5000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/roles', require('./routes/roles'));
  app.use('/api/permissions', require('./routes/permissions'));
  app.use('/api/resource', require('./routes/resource'));
  app.use('/api/audit', require('./routes/audit'));
  app.use('/api/firewall', require('./routes/audit'));

  // Health Check
  app.get('/api/health', (req, res) => {
    const db = getConnection();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get();
    const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_log').get();
    res.json({
      status: 'operational',
      service: 'Multi-Tenant SaaS Permission Escalation Firewall',
      version: '1.0.0',
      uptime: process.uptime(),
      database: { users: userCount.count, tenants: tenantCount.count, auditEntries: auditCount.count },
      timestamp: new Date().toISOString(),
    });
  });

  // SPA catch-all
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    } else {
      res.status(404).json({ error: 'NOT_FOUND', message: 'API endpoint not found.' });
    }
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('🔥 Error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  });

  app.listen(PORT, () => {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  🛡️  Permission Escalation Firewall');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  🌐 Server:     http://localhost:${PORT}`);
    console.log(`  📊 Dashboard:  http://localhost:${PORT}`);
    console.log(`  💚 Health:     http://localhost:${PORT}/api/health`);
    console.log('══════════════════════════════════════════════════════\n');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
