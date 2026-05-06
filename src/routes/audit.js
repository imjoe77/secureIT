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
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(isAdmin);

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
    WHERE (al.tenant_id = ? OR al.tenant_id IS NULL)
  `;
  const params = [req.user.tenantId];

  if (decision) {
    query += ' AND al.decision = ?';
    params.push(decision.toUpperCase());
  }

  query += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = db.prepare(query).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE (tenant_id = ? OR tenant_id IS NULL)`).get(req.user.tenantId);

  res.json({ logs, total: total.count, limit, offset });
});

// DELETE /api/audit/logs
router.delete('/logs', (req, res) => {
  const db = getConnection();
  db.prepare('DELETE FROM audit_log WHERE tenant_id = ?').run(req.user.tenantId);
  res.json({ message: 'Audit logs purged successfully.' });
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

// POST /api/audit/record - Record a manual security event
router.post('/record', (req, res) => {
  const { requestedPermission, decision, reason, userId } = req.body;
  const db = getConnection();
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId || req.user.id,
    req.user.tenantId,
    requestedPermission || 'MANUAL_LOG',
    decision || 'DENY',
    reason || 'Manual intervention recorded.',
    new Date().toISOString()
  );

  res.json({ message: 'Event recorded.' });
});

// ═══════════════════════════════════════════════════
//  TRUSTED DEVICES MANAGEMENT (Zero-Trust Device Registry)
// ═══════════════════════════════════════════════════

// GET /api/audit/trusted-devices — List all trusted devices
router.get('/trusted-devices', (req, res) => {
  const db = getConnection();
  const devices = db.prepare(`
    SELECT td.*, r.name as role_name 
    FROM trusted_devices td
    JOIN roles r ON td.role_id = r.id
    WHERE td.tenant_id = ?
    ORDER BY td.registered_at DESC
  `).all(req.user.tenantId);
  res.json({ devices });
});

// POST /api/audit/trusted-devices — Register a new trusted device
router.post('/trusted-devices', (req, res) => {
  const { deviceName, ipAddress, roleName } = req.body;
  
  if (!deviceName || !ipAddress || !roleName) {
    return res.status(400).json({ 
      error: 'VALIDATION_ERROR', 
      message: 'deviceName, ipAddress, and roleName are required.' 
    });
  }

  const db = getConnection();
  
  // Find the role
  const role = db.prepare('SELECT id, name FROM roles WHERE name = ? AND tenant_id = ?')
    .get(roleName, req.user.tenantId);
  
  if (!role) {
    return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: `Role '${roleName}' not found.` });
  }

  // Check for duplicate IP for same role
  const existing = db.prepare('SELECT id FROM trusted_devices WHERE ip_address = ? AND role_id = ? AND is_active = 1')
    .get(ipAddress, role.id);
  
  if (existing) {
    return res.status(409).json({ 
      error: 'DEVICE_EXISTS', 
      message: `IP '${ipAddress}' is already registered for role '${roleName}'.` 
    });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO trusted_devices (id, device_name, ip_address, role_id, tenant_id, registered_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, deviceName, ipAddress, role.id, req.user.tenantId, req.user.id);

  res.status(201).json({ 
    message: `Device '${deviceName}' [${ipAddress}] registered for role '${roleName}'.`,
    device: { id, deviceName, ipAddress, roleName }
  });
});

// DELETE /api/audit/trusted-devices/:id — Revoke a trusted device
router.delete('/trusted-devices/:id', (req, res) => {
  const db = getConnection();
  const device = db.prepare('SELECT * FROM trusted_devices WHERE id = ? AND tenant_id = ?')
    .get(req.params.id, req.user.tenantId);
  
  if (!device) {
    return res.status(404).json({ error: 'DEVICE_NOT_FOUND', message: 'Trusted device not found.' });
  }

  db.prepare('UPDATE trusted_devices SET is_active = 0 WHERE id = ?').run(req.params.id);
  
  res.json({ 
    message: `Device '${device.device_name}' [${device.ip_address}] has been revoked.` 
  });
});

module.exports = router;
