/**
 * Role Management Routes
 * 
 * POST   /api/roles              - Create a new role
 * GET    /api/roles              - List roles for current tenant
 * POST   /api/roles/assign       - Assign role to user
 * DELETE /api/roles/unassign     - Remove role from user
 * POST   /api/roles/hierarchy    - Set role inheritance
 * DELETE /api/roles/hierarchy    - Remove role inheritance
 * GET    /api/roles/graph        - Get role hierarchy graph
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');
const { authenticate } = require('../middleware/auth');
const { firewall } = require('../middleware/firewall');

const router = express.Router();

// All role routes require authentication
router.use(authenticate);

/**
 * POST /api/roles
 * Create a new role in the current tenant
 */
router.post('/', firewall('manage:roles'), (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Role name is required.',
    });
  }

  const db = getConnection();

  // Check if role name already exists in this tenant
  const existing = db.prepare('SELECT id FROM roles WHERE name = ? AND tenant_id = ?').get(name, req.user.tenantId);
  if (existing) {
    return res.status(409).json({
      error: 'ROLE_EXISTS',
      message: `Role '${name}' already exists in tenant '${req.user.tenantName}'.`,
    });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO roles (id, name, description, tenant_id) VALUES (?, ?, ?, ?)').run(
    id, name, description || null, req.user.tenantId
  );

  res.status(201).json({
    message: `Role '${name}' created successfully.`,
    role: { id, name, description, tenantId: req.user.tenantId },
    firewallAnalysis: req.firewallResult,
  });
});

/**
 * GET /api/roles
 * List all roles in the current tenant
 */
router.get('/', (req, res) => {
  const db = getConnection();

  const roles = db.prepare(`
    SELECT r.id, r.name, r.description, r.is_system_role, r.created_at,
           COUNT(DISTINCT ur.user_id) as user_count,
           COUNT(DISTINCT rp.permission_id) as permission_count
    FROM roles r
    LEFT JOIN user_roles ur ON r.id = ur.role_id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    WHERE r.tenant_id = ?
    GROUP BY r.id
    ORDER BY r.name
  `).all(req.user.tenantId);

  res.json({
    tenant: { id: req.user.tenantId, name: req.user.tenantName },
    roles,
    count: roles.length,
  });
});

/**
 * POST /api/roles/assign
 * Assign a role to a user (with tenant boundary check)
 */
router.post('/assign', firewall('manage:roles'), (req, res) => {
  const { userId, roleId } = req.body;

  if (!userId || !roleId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'userId and roleId are required.',
    });
  }

  const db = getConnection();

  // Verify user exists and belongs to same tenant
  const targetUser = db.prepare('SELECT id, username, tenant_id FROM users WHERE id = ?').get(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Target user does not exist.' });
  }

  if (targetUser.tenant_id !== req.user.tenantId) {
    return res.status(403).json({
      error: 'CROSS_TENANT_VIOLATION',
      message: `🛡️ Cannot assign roles to users in a different tenant. ` +
               `You belong to '${req.user.tenantName}' but the target user belongs to a different tenant.`,
    });
  }

  // Verify role exists and belongs to same tenant
  const role = db.prepare('SELECT id, name, tenant_id FROM roles WHERE id = ?').get(roleId);
  if (!role) {
    return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role does not exist.' });
  }

  if (role.tenant_id !== req.user.tenantId) {
    return res.status(403).json({
      error: 'CROSS_TENANT_VIOLATION',
      message: `🛡️ Cannot assign roles from a different tenant. ` +
               `Role '${role.name}' belongs to a different tenant than '${req.user.tenantName}'.`,
    });
  }

  // Check if already assigned
  const existing = db.prepare('SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?').get(userId, roleId);
  if (existing) {
    return res.status(409).json({
      error: 'ALREADY_ASSIGNED',
      message: `User '${targetUser.username}' already has role '${role.name}'.`,
    });
  }

  db.prepare('INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)').run(
    userId, roleId, req.user.id
  );

  res.json({
    message: `Role '${role.name}' assigned to user '${targetUser.username}'.`,
    assignment: { userId, username: targetUser.username, roleId, roleName: role.name },
    firewallAnalysis: req.firewallResult,
  });
});

/**
 * DELETE /api/roles/unassign
 * Remove a role from a user
 */
router.delete('/unassign', firewall('manage:roles'), (req, res) => {
  const { userId, roleId } = req.body;

  if (!userId || !roleId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'userId and roleId are required.',
    });
  }

  const db = getConnection();

  const result = db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?').run(userId, roleId);

  if (result.changes === 0) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'User does not have this role assigned.',
    });
  }

  res.json({ message: 'Role unassigned successfully.' });
});

/**
 * POST /api/roles/hierarchy
 * Set role inheritance (parent inherits child's permissions)
 */
router.post('/hierarchy', firewall('manage:roles'), (req, res) => {
  const { parentRoleId, childRoleId } = req.body;

  if (!parentRoleId || !childRoleId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'parentRoleId and childRoleId are required.',
    });
  }

  if (parentRoleId === childRoleId) {
    return res.status(400).json({
      error: 'SELF_INHERITANCE',
      message: 'A role cannot inherit from itself.',
    });
  }

  const db = getConnection();

  // Verify both roles exist and belong to same tenant
  const parentRole = db.prepare('SELECT id, name, tenant_id FROM roles WHERE id = ?').get(parentRoleId);
  const childRole = db.prepare('SELECT id, name, tenant_id FROM roles WHERE id = ?').get(childRoleId);

  if (!parentRole || !childRole) {
    return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'One or both roles do not exist.' });
  }

  if (parentRole.tenant_id !== req.user.tenantId || childRole.tenant_id !== req.user.tenantId) {
    return res.status(403).json({
      error: 'CROSS_TENANT_VIOLATION',
      message: '🛡️ Role hierarchy can only be created within the same tenant.',
    });
  }

  // Check for existing link
  const existing = db.prepare('SELECT 1 FROM role_hierarchy WHERE parent_role_id = ? AND child_role_id = ?')
    .get(parentRoleId, childRoleId);
  if (existing) {
    return res.status(409).json({
      error: 'HIERARCHY_EXISTS',
      message: `Inheritance link '${parentRole.name}' → '${childRole.name}' already exists.`,
    });
  }

  // Check if adding this link would create a cycle
  const PermissionGraph = require('../engine/permissionGraph');
  const engine = new PermissionGraph();
  
  // Temporarily add the edge and check for cycles
  db.prepare('INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (?, ?)').run(parentRoleId, childRoleId);
  
  const roleGraph = engine.buildRoleGraph(req.user.tenantId);
  const cycleCheck = engine.dfsDetectCycles(parentRoleId, roleGraph);
  
  if (cycleCheck.hasCycle) {
    // Rollback
    db.prepare('DELETE FROM role_hierarchy WHERE parent_role_id = ? AND child_role_id = ?').run(parentRoleId, childRoleId);
    return res.status(400).json({
      error: 'CYCLE_DETECTED',
      message: `🛡️ Adding this inheritance would create a circular dependency: ${cycleCheck.cyclePath.join(' → ')}`,
      cyclePath: cycleCheck.cyclePath,
    });
  }

  res.status(201).json({
    message: `Role hierarchy created: '${parentRole.name}' now inherits from '${childRole.name}'.`,
    hierarchy: {
      parent: { id: parentRole.id, name: parentRole.name },
      child: { id: childRole.id, name: childRole.name },
    },
    firewallAnalysis: req.firewallResult,
  });
});

/**
 * DELETE /api/roles/hierarchy
 * Remove role inheritance link
 */
router.delete('/hierarchy', firewall('manage:roles'), (req, res) => {
  const { parentRoleId, childRoleId } = req.body;

  if (!parentRoleId || !childRoleId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'parentRoleId and childRoleId are required.',
    });
  }

  const db = getConnection();
  const result = db.prepare('DELETE FROM role_hierarchy WHERE parent_role_id = ? AND child_role_id = ?')
    .run(parentRoleId, childRoleId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Hierarchy link does not exist.' });
  }

  res.json({ message: 'Role hierarchy link removed successfully.' });
});

/**
 * GET /api/roles/graph
 * Get the role hierarchy graph for the current tenant (for visualization)
 */
router.get('/graph', (req, res) => {
  const PermissionGraph = require('../engine/permissionGraph');
  const engine = new PermissionGraph();
  const graph = engine.getTenantRoleGraph(req.user.tenantId);

  res.json({
    tenant: { id: req.user.tenantId, name: req.user.tenantName },
    graph,
  });
});

module.exports = router;
