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
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.set('trust proxy', true); // Enable IP resolution for device lockdown
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(morgan('dev'));
  
  // Serve static files from the frontend build directory
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

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
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'API endpoint not found.' });
    } else {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('🔥 Error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  });

  app.listen(PORT, '127.0.0.1', () => {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  🛡️  Permission Escalation Firewall');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  🌐 Server:     http://127.0.0.1:${PORT}`);
    console.log(`  📊 Dashboard:  http://127.0.0.1:${PORT}`);
    console.log(`  💚 Health:     http://127.0.0.1:${PORT}/api/health`);
    console.log('══════════════════════════════════════════════════════\n');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
