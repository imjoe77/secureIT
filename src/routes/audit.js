/**
 * Audit & Firewall Management Routes
 * 
 * GET  /api/audit/logs         - Get audit trail
 * GET  /api/audit/stats        - Get access statistics
 * GET  /api/firewall/rules     - List firewall rules
 * POST /api/firewall/rules     - Create firewall rule
 * GET  /api/firewall/tenants   - List all tenants
 * GET  /api/firewall/users     - List tenant users
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/audit/logs
router.get('/logs', (req, res) => {
  const db = getConnection();
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const decision = req.query.decision;

  let query = `
    SELECT al.*, u.username, t.name as tenant_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN tenants t ON al.tenant_id = t.id
    WHERE al.tenant_id = ?
  `;
  const params = [req.user.tenantId];

  if (decision) {
    query += ' AND al.decision = ?';
    params.push(decision.toUpperCase());
  }

  query += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = db.prepare(query).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ?`).get(req.user.tenantId);

  res.json({ logs, total: total.count, limit, offset });
});

// GET /api/audit/stats
router.get('/stats', (req, res) => {
  const db = getConnection();
  const tid = req.user.tenantId;

  const totalRequests = db.prepare('SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ?').get(tid);
  const allowed = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ? AND decision = 'ALLOW'").get(tid);
  const denied = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ? AND decision = 'DENY'").get(tid);

  const recentDenials = db.prepare(`
    SELECT al.*, u.username FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.tenant_id = ? AND al.decision = 'DENY'
    ORDER BY al.timestamp DESC LIMIT 10
  `).all(tid);

  const topDeniedPerms = db.prepare(`
    SELECT requested_permission, COUNT(*) as count
    FROM audit_log WHERE tenant_id = ? AND decision = 'DENY'
    GROUP BY requested_permission ORDER BY count DESC LIMIT 5
  `).all(tid);

  res.json({
    totalRequests: totalRequests.count,
    allowed: allowed.count,
    denied: denied.count,
    denyRate: totalRequests.count > 0 ? ((denied.count / totalRequests.count) * 100).toFixed(1) + '%' : '0%',
    recentDenials,
    topDeniedPermissions: topDeniedPerms,
  });
});

// GET /api/firewall/rules
router.get('/rules', (req, res) => {
  const db = getConnection();
  const rules = db.prepare('SELECT * FROM firewall_rules WHERE tenant_id IS NULL OR tenant_id = ? ORDER BY created_at').all(req.user.tenantId);
  res.json({ rules: rules.map(r => ({ ...r, config: JSON.parse(r.config) })) });
});

// POST /api/firewall/rules
router.post('/rules', (req, res) => {
  const { name, description, ruleType, config, tenantId } = req.body;
  if (!name || !ruleType || !config) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'name, ruleType, and config are required.' });
  }
  const db = getConnection();
  const id = uuidv4();
  db.prepare('INSERT INTO firewall_rules (id, name, description, rule_type, config, tenant_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, name, description || null, ruleType, JSON.stringify(config), tenantId || null
  );
  res.status(201).json({ message: `Firewall rule '${name}' created.`, rule: { id, name, ruleType, config } });
});

// GET /api/firewall/tenants
router.get('/tenants', (req, res) => {
  const db = getConnection();
  const tenants = db.prepare(`
    SELECT t.id, t.name, t.created_at, COUNT(u.id) as user_count
    FROM tenants t LEFT JOIN users u ON t.id = u.tenant_id
    GROUP BY t.id ORDER BY t.name
  `).all();
  res.json({ tenants });
});

// GET /api/firewall/users
router.get('/users', (req, res) => {
  const db = getConnection();
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_active, u.created_at, t.name as tenant_name,
           GROUP_CONCAT(r.name) as roles
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.tenant_id = ?
    GROUP BY u.id ORDER BY u.username
  `).all(req.user.tenantId);
  res.json({ users });
});

module.exports = router;
