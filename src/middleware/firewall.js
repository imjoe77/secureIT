/**
 * Permission Firewall Middleware
 * 
 * The core security middleware that intercepts every protected request and:
 *   1. Extracts the required permission from route configuration
 *   2. Runs the permission graph analysis engine
 *   3. Validates tenant boundaries
 *   4. Logs the decision to audit trail
 *   5. Returns detailed allow/deny with explanation
 * 
 * Usage:
 *   app.get('/resource', firewall('read:documents'), handler)
 */

const { v4: uuidv4 } = require('uuid');
const PermissionGraph = require('../engine/permissionGraph');
const { getConnection } = require('../database/connection');

/**
 * Create a firewall middleware for a specific permission.
 * 
 * @param {string} requiredPermission - The permission name required to access this route
 * @param {Object} options - Additional options
 * @param {boolean} options.checkResourceTenant - Whether to check resource tenant ID from params
 * @returns {Function} Express middleware
 */
function firewall(requiredPermission, options = {}) {
  return (req, res, next) => {
    const engine = new PermissionGraph();
    const startTime = Date.now();

    // Determine resource tenant ID (from params, query, or body)
    let resourceTenantId = null;
    if (options.checkResourceTenant) {
      resourceTenantId = req.params.tenantId || req.query.tenantId || req.body?.tenantId;
    }

    // Run the permission engine
    const result = engine.checkAccess(req.user.id, requiredPermission, resourceTenantId);

    // Log to audit trail
    const db = getConnection();
    const auditId = uuidv4();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, escalation_path, ip_address, endpoint, method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      req.user.id,
      req.user.tenantId,
      requiredPermission,
      result.decision,
      result.reason,
      result.accessPath ? JSON.stringify(result.accessPath) : null,
      req.ip || req.connection?.remoteAddress,
      req.originalUrl,
      req.method,
    );

    // Attach the full analysis to the request for downstream use
    req.firewallResult = result;
    req.firewallResult.auditId = auditId;

    if (result.decision === 'ALLOW') {
      // Add firewall headers for transparency
      res.set('X-Firewall-Decision', 'ALLOW');
      res.set('X-Firewall-Access-Type', result.accessType);
      res.set('X-Firewall-Depth', String(result.inheritanceDepth));
      res.set('X-Firewall-Audit-Id', auditId);
      next();
    } else {
      // Denied
      const elapsed = Date.now() - startTime;
      res.status(403).json({
        error: 'ACCESS_DENIED',
        code: result.code,
        message: result.reason,
        details: {
          userId: req.user.id,
          username: req.user.username,
          tenant: req.user.tenantName,
          requestedPermission: requiredPermission,
          endpoint: req.originalUrl,
          method: req.method,
          ...(result.path && { escalationPath: result.path }),
          ...(result.availablePermissions && { availablePermissions: result.availablePermissions }),
          ...(result.foreignRoles && { foreignRoles: result.foreignRoles }),
          ...(result.cyclePath && { cyclePath: result.cyclePath }),
        },
        auditId,
        evaluationTimeMs: elapsed,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Tenant isolation middleware.
 * Ensures the user can only access resources belonging to their tenant.
 * Applied to routes with :tenantId parameter.
 */
function tenantIsolation(req, res, next) {
  const resourceTenantId = req.params.tenantId || req.query.tenantId;

  if (resourceTenantId && resourceTenantId !== req.user.tenantId) {
    const db = getConnection();
    const userTenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(req.user.tenantId);
    const resTenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(resourceTenantId);

    // Log the violation
    const auditId = uuidv4();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, ip_address, endpoint, method)
      VALUES (?, ?, ?, ?, 'DENY', ?, ?, ?, ?)
    `).run(
      auditId,
      req.user.id,
      req.user.tenantId,
      'CROSS_TENANT_ACCESS',
      `Cross-tenant access attempt: User from '${userTenant?.name}' tried to access '${resTenant?.name}'`,
      req.ip,
      req.originalUrl,
      req.method,
    );

    return res.status(403).json({
      error: 'CROSS_TENANT_VIOLATION',
      message: `🛡️ Tenant boundary violation: User '${req.user.username}' from '${userTenant?.name || 'Unknown'}' ` +
               `cannot access resources in '${resTenant?.name || 'Unknown'}'.`,
      auditId,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

module.exports = { firewall, tenantIsolation };
