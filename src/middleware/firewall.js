/**
 * Permission Escalation Firewall Middleware
 * 
 * Enforces security policies by delegating access decisions to the 
 * PermissionGraph engine.
 */

const PermissionGraph = require('../engine/permissionGraph');
const { getConnection } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

/**
 * Core Firewall Middleware
 * 
 * @param {string} permissionName - The permission required (e.g., 'manage:roles')
 */
const firewall = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Firewall requires an authenticated user context.'
        });
      }

      const engine = new PermissionGraph();
      
      // resourceTenantId can be provided in body or query for cross-tenant checks
      const resourceTenantId = req.body.resourceTenantId || req.query.resourceTenantId || null;
      
      const result = engine.checkAccess(req.user.id, permissionName, resourceTenantId);

      // Log decision to audit trail
      const db = getConnection();
      db.prepare(`
        INSERT INTO audit_log (
          id, user_id, tenant_id, requested_permission, decision, 
          reason, escalation_path, ip_address, endpoint, method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        req.user.id,
        req.user.tenantId,
        permissionName,
        result.decision,
        result.reason,
        result.accessPath ? JSON.stringify(result.accessPath) : null,
        req.ip,
        req.originalUrl,
        req.method
      );

      if (result.decision === 'ALLOW') {
        // Attach firewall analysis to request for optional downstream use
        req.firewallResult = result;
        next();
      } else {
        res.status(403).json({
          status: 'DENIED',
          error: result.code || 'ACCESS_DENIED',
          message: result.reason,
          details: result
        });
      }
    } catch (err) {
      console.error('🛡️ Firewall Error:', err);
      res.status(500).json({
        error: 'FIREWALL_INTERNAL_ERROR',
        message: 'The permission firewall encountered an internal error.'
      });
    }
  };
};

/**
 * Legacy/Alternative Authorization Wrapper
 * 
 * Converts (action, resource) into a permission name (e.g., 'VIEW_REPORTS')
 */
const authorize = (action, resource) => {
  const permissionName = `${action}_${resource}`.toUpperCase();
  return firewall(permissionName);
};

module.exports = { firewall, authorize };
