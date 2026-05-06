const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');
const { authenticate } = require('../middleware/auth');
const { firewall } = require('../middleware/firewall');
const PermissionGraph = require('../engine/permissionGraph');

const router = express.Router();
router.use(authenticate);

// POST /api/permissions - Create permission
router.post('/', firewall('manage:roles'), (req, res) => {
  const { name, description, resource, action, riskLevel } = req.body;
  if (!name || !resource || !action) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'name, resource, and action are required.' });
  }
  const risk = riskLevel || 'low';
  const db = getConnection();
  const existing = db.prepare('SELECT id FROM permissions WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'PERMISSION_EXISTS', message: `Permission '${name}' already exists.` });

  const id = uuidv4();
  db.prepare('INSERT INTO permissions (id, name, description, resource, action, risk_level) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, description || null, resource, action, risk);
  res.status(201).json({ message: `Permission '${name}' created.`, permission: { id, name, resource, action, riskLevel: risk } });
});

// GET /api/permissions - List all
router.get('/', (req, res) => {
  const db = getConnection();
  const permissions = db.prepare(`
    SELECT p.id, p.name, p.description, p.resource, p.action, p.risk_level,
           COUNT(DISTINCT rp.role_id) as assigned_to_roles
    FROM permissions p LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    GROUP BY p.id ORDER BY p.resource, p.action
  `).all();
  res.json({ permissions, count: permissions.length });
});

// POST /api/permissions/assign - Assign permission to role
router.post('/assign', firewall('manage:roles'), (req, res) => {
  const { roleId, permissionId } = req.body;
  if (!roleId || !permissionId) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'roleId and permissionId are required.' });

  const db = getConnection();
  const role = db.prepare('SELECT id, name, tenant_id FROM roles WHERE id = ?').get(roleId);
  if (!role) return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role does not exist.' });
  if (role.tenant_id !== req.user.tenantId) return res.status(403).json({ error: 'CROSS_TENANT_VIOLATION', message: 'Cannot assign permissions to roles in a different tenant.' });

  const permission = db.prepare('SELECT id, name FROM permissions WHERE id = ?').get(permissionId);
  if (!permission) return res.status(404).json({ error: 'PERMISSION_NOT_FOUND', message: 'Permission does not exist.' });

  const existing = db.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(roleId, permissionId);
  if (existing) return res.status(409).json({ error: 'ALREADY_ASSIGNED', message: `Already assigned.` });

  db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(roleId, permissionId);
  res.json({ message: `Permission '${permission.name}' assigned to role '${role.name}'.` });
});

// POST /api/permissions/check - Check access
router.post('/check', (req, res) => {
  const { permission, resourceTenantId } = req.body;
  if (!permission) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'permission name is required.' });

  const engine = new PermissionGraph();
  const result = engine.checkAccess(req.user.id, permission, resourceTenantId, { ip: req.ip });
  res.json({ check: { user: req.user.username, tenant: req.user.tenantName, permission, ...result } });
});

// GET /api/permissions/map - Full permission map
router.get('/map', (req, res) => {
  try {
    const engine = new PermissionGraph();
    const permMap = engine.getUserPermissionMap(req.user.id);
    if (!permMap) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    // The engine already provides categorized data and summary
    res.json(permMap);
  } catch (err) {
    console.error('Permission Map Error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST /api/permissions/simulate-grant - Predict security impact
router.post('/simulate-grant', (req, res) => {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'userId and roleId are required.' });
  }

  try {
    const engine = new PermissionGraph();
    const simulation = engine.simulateUserGrant(userId, roleId);
    
    // Log the simulation to the audit trail
    engine.recordAuditLog(
      req.user.id, 
      req.user.tenantId, 
      'SIMULATE_GRANT', 
      'ALLOW', 
      `Admin simulated granting role '${simulation.targetRole}' to user '${simulation.targetUser}'. Risk Score: ${simulation.riskScore}. Reason: ${simulation.riskReason}`
    );

    res.json({ simulation });
  } catch (err) {
    console.error('Simulation Error:', err.message);
    
    // Log failed/forbidden attempts (e.g., cross-tenant simulation)
    const engine = new PermissionGraph();
    engine.recordAuditLog(req.user.id, req.user.tenantId, 'SIMULATE_GRANT', 'DENY', `Simulation failure: ${err.message}`);
    
    res.status(err.message.includes('forbidden') ? 403 : 500).json({ 
      error: 'SIMULATION_ERROR', 
      message: err.message 
    });
  }
});

module.exports = router;
