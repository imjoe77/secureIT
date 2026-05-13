/**
 * Database Schema Definition
 * 
 * Defines all tables for the Multi-Tenant SaaS Permission Escalation Firewall.
 * Uses SQLite (via better-sqlite3) for zero-config setup.
 * 
 * Tables:
 *   - tenants: Organizations in the multi-tenant system
 *   - users: Users belonging to a single tenant
 *   - roles: Roles scoped to a tenant
 *   - permissions: Global permission definitions
 *   - user_roles: Many-to-many user ↔ role mapping
 *   - role_permissions: Many-to-many role ↔ permission mapping
 *   - role_hierarchy: Parent-child role inheritance graph
 *   - audit_log: Tracks all access decisions for forensics
 */

const SCHEMA_SQL = `
  -- Tenants (Organizations)
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Users (belong to exactly one tenant)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  -- Roles (scoped to a tenant)
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    tenant_id TEXT NOT NULL,
    is_system_role INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(name, tenant_id)
  );

  -- Permissions (global definitions)
  CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    risk_level TEXT DEFAULT 'low',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- User ↔ Role mapping (many-to-many)
  CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by TEXT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
  );

  -- Role ↔ Permission mapping (many-to-many)
  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
  );

  -- Role Hierarchy (parent_role inherits child_role's permissions)
  CREATE TABLE IF NOT EXISTS role_hierarchy (
    parent_role_id TEXT NOT NULL,
    child_role_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_role_id, child_role_id),
    FOREIGN KEY (parent_role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (child_role_id) REFERENCES roles(id) ON DELETE CASCADE
  );

  -- Audit Log for all access decisions
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    tenant_id TEXT,
    requested_permission TEXT,
    decision TEXT NOT NULL CHECK(decision IN ('ALLOW', 'DENY')),
    reason TEXT,
    escalation_path TEXT,
    ip_address TEXT,
    endpoint TEXT,
    method TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  -- Firewall Rules (configurable escalation policies)
  CREATE TABLE IF NOT EXISTS firewall_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK(rule_type IN ('block_indirect', 'block_cross_tenant', 'max_depth', 'block_permission', 'device_lockdown')),
    config TEXT NOT NULL,
    tenant_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  -- Trusted Devices Registry (Zero-Trust Device Lockdown)
  -- Pre-approved device IPs for restricted high-command roles.
  -- Only devices with matching IPs can authenticate as these roles.
  CREATE TABLE IF NOT EXISTS trusted_devices (
    id TEXT PRIMARY KEY,
    device_name TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    role_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    registered_by TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  -- User Sessions (for real-time revocation)
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_revoked INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sudo_until DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
  CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
  CREATE INDEX IF NOT EXISTS idx_role_hierarchy_parent ON role_hierarchy(parent_role_id);
  CREATE INDEX IF NOT EXISTS idx_role_hierarchy_child ON role_hierarchy(child_role_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_trusted_devices_role ON trusted_devices(role_id);
  CREATE INDEX IF NOT EXISTS idx_trusted_devices_ip ON trusted_devices(ip_address);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_revoked);

  -- Tactical Documents (Owned by specific users)
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    classification TEXT DEFAULT 'UNCLASSIFIED',
    owner_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
  CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

  -- Document Shares (Whitelisting users for other users' docs)
  CREATE TABLE IF NOT EXISTS document_shares (
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    access_level TEXT DEFAULT 'READ', -- READ, WRITE
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id, user_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );
`;

module.exports = { SCHEMA_SQL };

