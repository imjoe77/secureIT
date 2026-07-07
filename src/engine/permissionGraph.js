/**
 * Permission Graph Engine
 * 
 * Core algorithm for the Permission Escalation Firewall.
 * Represents roles and permissions as a directed graph and uses
 * BFS/DFS traversal to detect direct and indirect access paths.
 * 
 * Key capabilities:
 *   - Build in-memory role inheritance graph from database
 *   - BFS traversal to find all reachable permissions from a user
 *   - Track the exact path through which each permission was reached
 *   - Detect indirect escalation chains
 *   - Validate tenant boundaries
 *   - Return detailed explainable allow/deny decisions
 */

const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');

class PermissionGraph {
  constructor() {
    this.db = getConnection();
  }

  /**
   * Persist a security decision to the audit log.
   */
  async recordAuditLog(userId, tenantId, permission, decision, reason, path = [], code = null) {
    try {
      const id = uuidv4();
      await this.db.prepare(`
        INSERT INTO audit_log (
          id, user_id, tenant_id, requested_permission, 
          decision, reason, escalation_path, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        userId, 
        tenantId, 
        permission, 
        decision, 
        reason, 
        JSON.stringify(path),
        new Date().toISOString()
      );
    } catch (err) {
      console.error('Failed to record audit log:', err.message);
    }
  }

  /**
   * Build adjacency list for the role hierarchy graph for a given tenant.
   * Each role points to the roles it inherits (children in the hierarchy).
   * 
   * @param {string} tenantId - The tenant to build the graph for
   * @returns {Map<string, string[]>} adjacency list: parentRoleId â†’ [childRoleIds]
   */
  async buildRoleGraph(tenantId) {
    const graph = new Map();
    console.log(`[PermissionGraph] Building graph for tenant: ${tenantId}`);

    // Get all roles for this tenant
    const roles = await this.db.prepare(
      'SELECT id, name FROM roles WHERE tenant_id = ?'
    ).all(tenantId);

    console.log(`[PermissionGraph] Roles found: ${roles.length}`);
    roles.forEach(r => graph.set(r.id, []));

    // Get all hierarchy edges where the parent role belongs to this tenant
    const edges = await this.db.prepare(`
      SELECT rh.parent_role_id, rh.child_role_id
      FROM role_hierarchy rh
      JOIN roles r ON rh.parent_role_id = r.id
      WHERE r.tenant_id = ?
    `).all(tenantId);

    console.log(`[PermissionGraph] Edges found: ${edges.length}`);

    edges.forEach(e => {
      if (graph.has(e.parent_role_id)) {
        graph.get(e.parent_role_id).push(e.child_role_id);
      }
    });

    return graph;
  }

  /**
   * Get direct roles assigned to a user.
   * 
   * @param {string} userId
   * @returns {Array<{id, name, tenant_id}>}
   */
  async getUserDirectRoles(userId) {
    return await this.db.prepare(`
      SELECT r.id, r.name, r.tenant_id
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).all(userId);
  }

  /**
   * Get direct permissions assigned to a specific role.
   * 
   * @param {string} roleId
   * @returns {Array<{id, name, resource, action, risk_level}>}
   */
  async getRoleDirectPermissions(roleId) {
    return await this.db.prepare(`
      SELECT p.id, p.name, p.resource, p.action, p.risk_level
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(roleId);
  }

  /**
   * Get role name by ID.
   */
  async getRoleName(roleId) {
    const role = await this.db.prepare('SELECT name FROM roles WHERE id = ?').get(roleId);
    return role ? role.name : 'Unknown';
  }

  /**
   * BFS Traversal: From a starting role, traverse the inheritance graph
   * and collect ALL reachable permissions with their access paths.
   * 
   * Returns a map of permission names to their access details:
   *   {
   *     'permission_name': {
   *       permission: { id, name, resource, action, risk_level },
   *       path: ['Role A', 'Role B', 'Role C'],  // inheritance chain
   *       depth: 2,      // how many inheritance hops
   *       isDirect: false // whether permission is on the starting role
   *     }
   *   }
   */
  async bfsTraversePermissions(startRoleId, roleGraph) {
    const result = new Map();
    const visited = new Set();
    
    // Queue entries: { roleId, path: string[], depth: number }
    const queue = [{ roleId: startRoleId, path: [await this.getRoleName(startRoleId)], depth: 0 }];

    while (queue.length > 0) {
      const { roleId, path, depth } = queue.shift();

      if (visited.has(roleId)) continue;
      visited.add(roleId);

      // Get direct permissions for this role
      const perms = await this.getRoleDirectPermissions(roleId);
      perms.forEach(perm => {
        // Only record the first (shortest) path to each permission
        if (!result.has(perm.name)) {
          result.set(perm.name, {
            permission: perm,
            path: [...path],
            depth: depth,
            isDirect: depth === 0,
            sourceRole: path[path.length - 1],
          });
        }
      });

      // Traverse children (inherited roles)
      const children = roleGraph.get(roleId) || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push({
            roleId: childId,
            path: [...path, await this.getRoleName(childId)],
            depth: depth + 1,
          });
        }
      }
    }

    return result;
  }

  /**
   * DFS Traversal: Alternative traversal for cycle detection.
   * Detects cycles in role hierarchy which could indicate
   * a misconfiguration or attack.
   * 
   * @param {string} startRoleId
   * @param {Map} roleGraph
   * @returns {{ hasCycle: boolean, cyclePath: string[] | null }}
   */
  async dfsDetectCycles(startRoleId, roleGraph) {
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];

    const dfs = async (roleId) => {
      visited.add(roleId);
      recursionStack.add(roleId);
      path.push(await this.getRoleName(roleId));

      const children = roleGraph.get(roleId) || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          const result = await dfs(childId);
          if (result.hasCycle) return result;
        } else if (recursionStack.has(childId)) {
          // Cycle detected
          const cycleStart = await this.getRoleName(childId);
          const cyclePath = [...path, cycleStart];
          return { hasCycle: true, cyclePath };
        }
      }

      path.pop();
      recursionStack.delete(roleId);
      return { hasCycle: false, cyclePath: null };
    };

    return await dfs(startRoleId);
  }

  /**
   * CORE ALGORITHM: checkAccess
   * 
   * Determines whether a user should be allowed to use a requested permission.
   * 
   * Steps:
   *   1. Validate user exists and is active
   *   2. Get user's directly assigned roles
   *   3. Validate tenant match for all roles
   *   4. Build role inheritance graph for user's tenant
   *   5. Check for cycles in role graph
   *   6. BFS traverse from each direct role to collect all reachable permissions
   *   7. Check if requested permission is reachable
   *   8. Apply firewall rules (indirect escalation blocking, depth limits)
   *   9. Return detailed allow/deny decision
   * 
   * @param {string} userId - The user requesting access
   * @param {string} requestedPermission - The permission name being requested
   * @param {string} resourceTenantId - The tenant of the resource being accessed (optional)
   * @param {object} context - Additional request context (ip, deviceId, etc.)
   * @returns {AccessDecision}
   */
  async checkAccess(userId, requestedPermission, resourceTenantId = null, context = {}) {
    const startTime = Date.now();

    // â”€â”€â”€ Step 1: Validate user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const user = await this.db.prepare(
      'SELECT id, username, tenant_id, is_active FROM users WHERE id = ?'
    ).get(userId);

    if (!user) {
      return this._deny('USER_NOT_FOUND', 'User does not exist', {
        userId,
        requestedPermission,
      });
    }

    if (!user.is_active) {
      return this._deny('USER_INACTIVE', `User '${user.username}' is deactivated`, {
        userId: user.id,
        username: user.username,
        requestedPermission,
      });
    }

    // â”€â”€â”€ Step 2: Cross-tenant resource check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (resourceTenantId && resourceTenantId !== user.tenant_id) {
      const userTenant = await this.db.prepare('SELECT name FROM tenants WHERE id = ?').get(user.tenant_id);
      const resTenant = await this.db.prepare('SELECT name FROM tenants WHERE id = ?').get(resourceTenantId);

      const reason = `Cross-tenant access blocked: User '${user.username}' belongs to '${userTenant?.name || 'Unknown'}' ` +
        `but attempted to access resource in '${resTenant?.name || 'Unknown'}'. ` +
        `Tenant boundary violation detected.`;
      
      await this.recordAuditLog(user.id, user.tenant_id, requestedPermission, 'DENY', reason, [], 'CROSS_TENANT_VIOLATION');

      return this._deny('CROSS_TENANT_VIOLATION', reason,
        {
          userId: user.id,
          username: user.username,
          userTenant: userTenant?.name,
          resourceTenant: resTenant?.name,
          requestedPermission,
        }
      );
    }

    // â”€â”€â”€ Step 3: Get user's direct roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const directRoles = await this.getUserDirectRoles(userId);

    if (directRoles.length === 0) {
      return this._deny('NO_ROLES',
        `Access denied: User '${user.username}' has no roles assigned`,
        { userId: user.id, username: user.username, requestedPermission }
      );
    }

    // â”€â”€â”€ Step 4: Validate role-tenant integrity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const crossTenantRoles = directRoles.filter(r => r.tenant_id !== user.tenant_id);
    if (crossTenantRoles.length > 0) {
      return this._deny('CROSS_TENANT_ROLE',
        `Security violation: User '${user.username}' has roles from foreign tenant(s). ` +
        `Roles: [${crossTenantRoles.map(r => r.name).join(', ')}]. ` +
        `This may indicate a privilege escalation attack.`,
        {
          userId: user.id,
          username: user.username,
          foreignRoles: crossTenantRoles.map(r => ({ name: r.name, tenant_id: r.tenant_id })),
          requestedPermission,
        }
      );
    }

    // â”€â”€â”€ Step 5: Build role graph and check for cycles â”€â”€â”€â”€â”€â”€â”€
    const roleGraph = await this.buildRoleGraph(user.tenant_id);

    for (const role of directRoles) {
      const cycleResult = await this.dfsDetectCycles(role.id, roleGraph);
      if (cycleResult.hasCycle) {
        return this._deny('CYCLE_DETECTED',
          `Security violation: Circular role inheritance detected in path: ` +
          `${cycleResult.cyclePath.join(' â†’ ')}. ` +
          `This may indicate a misconfiguration or escalation attempt.`,
          {
            userId: user.id,
            username: user.username,
            cyclePath: cycleResult.cyclePath,
            requestedPermission,
          }
        );
      }
    }

    // â”€â”€â”€ Step 6: BFS to collect all reachable permissions â”€â”€â”€â”€
    const allPermissions = new Map();
    
    for (const role of directRoles) {
      const rolePerms = await this.bfsTraversePermissions(role.id, roleGraph);
      rolePerms.forEach((value, key) => {
        if (!allPermissions.has(key)) {
          allPermissions.set(key, value);
        }
      });
    }

    // â”€â”€â”€ Step 7: Check if requested permission is reachable â”€â”€
    if (!allPermissions.has(requestedPermission)) {
      // Collect all available permissions for helpful message
      const availablePerms = Array.from(allPermissions.keys()).sort();
      await this.recordAuditLog(user.id, user.tenant_id, requestedPermission, 'DENY', 'Permission not found in user hierarchy.', [], 'PERMISSION_NOT_FOUND');
      return this._deny('PERMISSION_NOT_FOUND',
        `Access denied: User '${user.username}' does not have permission '${requestedPermission}'. ` +
        `This permission is not reachable through any assigned role or role inheritance chain.`,
        {
          userId: user.id,
          username: user.username,
          requestedPermission,
          availablePermissions: availablePerms,
          rolesChecked: directRoles.map(r => r.name),
        }
      );
    }

    const permAccess = allPermissions.get(requestedPermission);

    // â”€â”€â”€ Step 8: Apply firewall rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const firewallResult = await this._applyFirewallRules(user, permAccess, allPermissions, context);
    if (firewallResult) {
      return firewallResult;
    }

    // â”€â”€â”€ Step 9: Allow with full details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const elapsed = Date.now() - startTime;
    
    await this.recordAuditLog(user.id, user.tenant_id, requestedPermission, 'ALLOW', permAccess.isDirect ? 'Direct access' : 'Inherited access', permAccess.path);

    return {
      decision: 'ALLOW',
      userId: user.id,
      username: user.username,
      tenantId: user.tenant_id,
      requestedPermission,
      accessType: permAccess.isDirect ? 'DIRECT' : 'INHERITED',
      accessPath: permAccess.path,
      inheritanceDepth: permAccess.depth,
      riskLevel: permAccess.permission.risk_level,
      sourceRole: permAccess.sourceRole,
      reason: permAccess.isDirect
        ? `Permission '${requestedPermission}' is directly assigned via role '${permAccess.path[0]}'`
        : `Permission '${requestedPermission}' is inherited through chain: ${permAccess.path.join(' â†’ ')}`,
      evaluationTimeMs: elapsed,
      allReachablePermissions: Array.from(allPermissions.entries()).map(([name, info]) => ({
        name,
        accessType: info.isDirect ? 'DIRECT' : 'INHERITED',
        depth: info.depth,
        path: info.path,
        riskLevel: info.permission.risk_level,
      })),
    };
  }

  /**
   * Apply configurable firewall rules to determine if an otherwise-allowed
   * permission should be blocked.
   */
  async _applyFirewallRules(user, permAccess, allPermissions, context = {}) {
    const rules = await this.db.prepare(
      `SELECT * FROM firewall_rules WHERE is_active = TRUE AND (tenant_id IS NULL OR tenant_id = ?)`
    ).all(user.tenant_id);

    for (const rule of rules) {
      const config = JSON.parse(rule.config);

      switch (rule.rule_type) {
        case 'device_lockdown': {
          // Block high-command access from unverified IPs/devices
          if (config.restricted_roles && 
              config.restricted_roles.includes(permAccess.sourceRole) &&
              context.ip && 
              !config.allowed_ips.includes(context.ip)) {
            
            const reason = `ðŸ›¡ï¸ Firewall Rule "${rule.name}" triggered: ` +
              `High-Command access from Unverified Device detected. ` +
              `Device IP [${context.ip}] is not in the trusted registry for role '${permAccess.sourceRole}'.`;
            
            await this.recordAuditLog(user.id, user.tenant_id, permAccess.permission.name, 'DENY', reason, [], 'DEVICE_LOCKDOWN_VIOLATION');

            return this._deny('DEVICE_LOCKDOWN_VIOLATION', reason, {
              userId: user.id,
              username: user.username,
              ip: context.ip,
              rule: rule.name,
              role: permAccess.sourceRole
            });
          }
          break;
        }

        case 'block_indirect': {
          // Block indirect access to high-risk permissions beyond a certain depth
              if (!permAccess.isDirect &&
              config.risk_levels.includes(permAccess.permission.risk_level) &&
              permAccess.depth > config.max_depth) {
            const reason = `ðŸ›¡ï¸ Firewall Rule "${rule.name}" triggered: ` +
              `Permission '${permAccess.permission.name}' (risk: ${permAccess.permission.risk_level}) ` +
              `was reached via indirect inheritance at depth ${permAccess.depth} ` +
              `(max allowed: ${config.max_depth}). ` +
              `Escalation path: ${permAccess.path.join(' â†’ ')}. ` +
              `This may indicate an unintended privilege escalation.`;
            
            await this.recordAuditLog(user.id, user.tenant_id, permAccess.permission.name, 'DENY', reason, permAccess.path, 'INDIRECT_ESCALATION_BLOCKED');

            return this._deny('INDIRECT_ESCALATION_BLOCKED', reason, {
                userId: user.id,
                username: user.username,
                rule: rule.name,
                permission: permAccess.permission.name,
                riskLevel: permAccess.permission.risk_level,
                depth: permAccess.depth,
                maxDepth: config.max_depth,
                path: permAccess.path,
              }
            );
          }
          break;
        }

        case 'max_depth': {
          if (permAccess.depth > config.max_depth) {
            return this._deny('MAX_DEPTH_EXCEEDED',
              `ðŸ›¡ï¸ Firewall Rule "${rule.name}" triggered: ` +
              `Permission reached at inheritance depth ${permAccess.depth}, ` +
              `exceeding maximum allowed depth of ${config.max_depth}.`,
              {
                userId: user.id,
                username: user.username,
                rule: rule.name,
                depth: permAccess.depth,
                maxDepth: config.max_depth,
                path: permAccess.path,
              }
            );
          }
          break;
        }

        case 'block_permission': {
          if (config.blocked_permissions &&
              config.blocked_permissions.includes(permAccess.permission.name)) {
            return this._deny('PERMISSION_BLOCKED',
              `ðŸ›¡ï¸ Firewall Rule "${rule.name}" triggered: ` +
              `Permission '${permAccess.permission.name}' is explicitly blocked by firewall policy.`,
              {
                userId: user.id,
                username: user.username,
                rule: rule.name,
                permission: permAccess.permission.name,
              }
            );
          }
          break;
        }
      }
    }

    return null; // No firewall rule triggered
  }

  /**
   * Generate a deny decision with full context.
   */
  _deny(code, reason, details = {}) {
    return {
      decision: 'DENY',
      code,
      reason,
      ...details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Simulate granting a role to a user and calculate the risk.
   * This is a read-only computation that predicts security impact.
   */
  async simulateUserGrant(userId, hypotheticalRoleId) {
    const user = await this.db.prepare('SELECT id, username, tenant_id FROM users WHERE id = ?').get(userId);
    const role = await this.db.prepare('SELECT id, name, tenant_id FROM roles WHERE id = ?').get(hypotheticalRoleId);

    if (!user || !role) throw new Error('User or Role not found');
    if (user.tenant_id !== role.tenant_id) throw new Error('Cross-tenant simulation forbidden');

    // 1. Get current state
    const currentMap = await this.getUserPermissionMap(userId);
    const currentPerms = new Set([
      ...currentMap.permissions.direct.map(p => p.name),
      ...currentMap.permissions.inherited.map(p => p.name)
    ]);

    // 2. Build projected state (add hypothetical role to user's direct roles)
    const projectedRoles = await this.getUserDirectRoles(userId);
    projectedRoles.push({ id: role.id, name: role.name, tenant_id: role.tenant_id });

    const roleGraph = await this.buildRoleGraph(user.tenant_id);
    const allPermissions = new Map();

    for (const r of projectedRoles) {
      const rolePerms = await this.bfsTraversePermissions(r.id, roleGraph);
      rolePerms.forEach((value, key) => {
        // Keep the path with the lowest depth (strongest access)
        if (!allPermissions.has(key) || value.depth < allPermissions.get(key).depth) {
          allPermissions.set(key, value);
        }
      });
    }

    const projectedPermissions = Array.from(allPermissions.entries()).map(([name, info]) => ({
      name,
      accessType: info.isDirect ? 'DIRECT' : 'INHERITED',
      depth: info.depth,
      path: info.path,
      riskLevel: info.permission.risk_level,
    }));

    // 3. Analyze the Diff
    const newPermissions = projectedPermissions.filter(p => !currentPerms.has(p.name));
    
    // Detect new escalation chains (High/Critical perms gained via inheritance)
    const newChains = newPermissions.filter(p => 
      p.depth > 0 && (p.riskLevel === 'high' || p.riskLevel === 'critical')
    );

    // 4. Calculate Risk Score
    let riskScore = 'Low';
    let riskReason = 'No sensitive permissions gained via indirect paths.';

    if (newChains.length > 0) {
      riskScore = 'Critical';
      riskReason = `Granting this role would create ${newChains.length} high-risk escalation chains through inheritance.`;
    } else if (newPermissions.some(p => p.riskLevel === 'high' || p.riskLevel === 'critical')) {
      riskScore = 'Medium';
      riskReason = 'User will gain direct access to sensitive permissions.';
    } else if (newPermissions.length > 0) {
      riskScore = 'Low';
      riskReason = 'User will gain basic operational permissions.';
    }

    return {
      targetUser: user.username,
      targetRole: role.name,
      currentPermissionCount: currentPerms.size,
      projectedPermissionCount: projectedPermissions.length,
      newPermissions,
      newChains,
      riskScore,
      riskReason
    };
  }

  /**
   * Get complete permission map for a user (for dashboard/debugging).
   */
  async getUserPermissionMap(userId) {
    const user = await this.db.prepare(
      'SELECT id, username, tenant_id FROM users WHERE id = ?'
    ).get(userId);

    if (!user) return null;

    const directRoles = await this.getUserDirectRoles(userId);
    const roleGraph = await this.buildRoleGraph(user.tenant_id);
    const allPermissions = new Map();

    for (const role of directRoles) {
      const rolePerms = await this.bfsTraversePermissions(role.id, roleGraph);
      rolePerms.forEach((value, key) => {
        if (!allPermissions.has(key)) {
          allPermissions.set(key, value);
        }
      });
    }

    const permissionsList = Array.from(allPermissions.entries()).map(([name, info]) => ({
      name,
      accessType: info.isDirect ? 'DIRECT' : 'INHERITED',
      depth: info.depth,
      path: info.path,
      riskLevel: info.permission.risk_level,
      sourceRole: info.sourceRole,
    }));

    return {
      user: { id: user.id, username: user.username, tenantId: user.tenant_id },
      directRoles: directRoles.map(r => r.name),
      summary: {
        totalPermissions: permissionsList.length,
        directPermissions: permissionsList.filter(p => p.accessType === 'DIRECT').length,
        inheritedPermissions: permissionsList.filter(p => p.accessType === 'INHERITED').length,
        byRiskLevel: {
          low: permissionsList.filter(p => p.riskLevel === 'low').length,
          medium: permissionsList.filter(p => p.riskLevel === 'medium').length,
          high: permissionsList.filter(p => p.riskLevel === 'high').length,
          critical: permissionsList.filter(p => p.riskLevel === 'critical').length,
        }
      },
      permissions: {
        direct: permissionsList.filter(p => p.accessType === 'DIRECT'),
        inherited: permissionsList.filter(p => p.accessType === 'INHERITED'),
      },
    };
  }

  /**
   * Get the full role hierarchy graph for a tenant (for visualization).
   */
  async getTenantRoleGraph(tenantId) {
    const roles = await this.db.prepare(
      'SELECT id, name, description, is_system_role FROM roles WHERE tenant_id = ?'
    ).all(tenantId);

    const rawEdges = await this.db.prepare(`
      SELECT rh.parent_role_id, rh.child_role_id, 
             r1.name as parent_name, r2.name as child_name
      FROM role_hierarchy rh
      JOIN roles r1 ON rh.parent_role_id = r1.id
      JOIN roles r2 ON rh.child_role_id = r2.id
      WHERE r1.tenant_id = ? AND r2.tenant_id = ?
    `).all(tenantId, tenantId);

    // Admin is a separate command entity, not part of role inheritance visualization.
    const isAdminRole = (roleName = '') => roleName.toLowerCase().includes('admin');
    const edges = rawEdges.filter(e => !isAdminRole(e.parent_name) && !isAdminRole(e.child_name));

    const rolePermissions = {};
    for (const role of roles) {
      const perms = await this.getRoleDirectPermissions(role.id);
      rolePermissions[role.name] = perms.map(p => ({
        name: p.name,
        riskLevel: p.risk_level,
      }));
    }

    return {
      nodes: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystemRole: Boolean(r.is_system_role),
        directPermissions: rolePermissions[r.name] || [],
      })),
      edges: edges.map(e => ({
        from: e.parent_role_id,
        to: e.child_role_id,
        fromName: e.parent_name,
        toName: e.child_name,
      })),
    };
  }
}

module.exports = PermissionGraph;
