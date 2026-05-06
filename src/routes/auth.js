/**
 * Authentication Routes
 * 
 * POST /api/auth/login    - User login, returns JWT
 * POST /api/auth/register - Register new user (admin only in real app)
 * GET  /api/auth/me       - Get current user profile
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');
const { authenticate, generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Username and password are required.',
    });
  }

  const db = getConnection();
  const user = db.prepare(`
    SELECT u.id, u.username, u.email, u.password_hash, u.tenant_id, u.is_active, t.name as tenant_name
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password.',
    });
  }

  if (!user.is_active) {
    return res.status(403).json({
      error: 'USER_DEACTIVATED',
      message: `Account '${username}' has been deactivated. Contact your administrator.`,
    });
  }

  const passwordValid = bcrypt.compareSync(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password.',
    });
  }

  // Get user's roles
  const roles = db.prepare(`
    SELECT r.id, r.name, r.level FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(user.id);

  // ═══════════════════════════════════════════════════
  //  ZERO-TRUST DEVICE LOCKDOWN — Enforced at Login
  // ═══════════════════════════════════════════════════
  // Check if any of the user's roles are restricted by device_lockdown rules.
  // If so, verify the requesting device's IP against the trusted_devices registry.
  const deviceLockdownRules = db.prepare(`
    SELECT * FROM firewall_rules 
    WHERE rule_type = 'device_lockdown' AND is_active = 1 
    AND (tenant_id IS NULL OR tenant_id = ?)
  `).all(user.tenant_id);

  for (const rule of deviceLockdownRules) {
    const config = JSON.parse(rule.config);
    const restrictedRoles = config.restricted_roles || [];
    
    // Check if user holds any restricted role
    const matchedRole = roles.find(r => restrictedRoles.includes(r.name));
    if (!matchedRole) continue;

    // User holds a restricted role — enforce device verification
    // Extract the client IP address
    const clientIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    
    // Normalize IPv6-mapped IPv4 addresses for consistent matching
    const normalizedIp = clientIp.replace(/^::ffff:/, '');
    
    // Look up the requesting IP in the trusted_devices registry
    const trustedDevice = db.prepare(`
      SELECT * FROM trusted_devices 
      WHERE role_id = ? AND is_active = 1 
      AND (ip_address = ? OR ip_address = ? OR ip_address = ?)
    `).get(matchedRole.id, clientIp, normalizedIp, `::ffff:${normalizedIp}`);

    if (!trustedDevice) {
      // BLOCKED: Unregistered device attempting high-command access
      // Log the blocked attempt to the audit trail
      db.prepare(`
        INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        user.id,
        user.tenant_id,
        'LOGIN_DEVICE_LOCKDOWN',
        'DENY',
        `🛡️ DEVICE LOCKDOWN: Login attempt for role '${matchedRole.name}' blocked. ` +
        `Device IP [${clientIp}] is NOT in the trusted device registry. ` +
        `Only pre-registered Secure Command Terminals can access this role. ` +
        `Firewall Rule: "${rule.name}".`,
        clientIp,
        new Date().toISOString()
      );

      return res.status(403).json({
        error: 'DEVICE_LOCKDOWN_VIOLATION',
        message: `🛡️ REMOTE ACCESS BLOCKED — Device IP [${clientIp}] is not registered as a trusted Secure Command Terminal for role '${matchedRole.name}'. Only pre-authorized devices can access supreme command. Contact your security administrator to register this device.`,
        details: {
          detectedIp: clientIp,
          restrictedRole: matchedRole.name,
          firewallRule: rule.name,
          resolution: 'Register this device IP in the Trusted Devices Registry via admin panel.'
        }
      });
    }

    // Device verified — update last_used_at timestamp
    db.prepare('UPDATE trusted_devices SET last_used_at = ? WHERE id = ?')
      .run(new Date().toISOString(), trustedDevice.id);

    // LOG SUCCESS: Record that the device check passed
    db.prepare(`
      INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      user.id,
      user.tenant_id,
      'LOGIN_DEVICE_VERIFIED',
      'ALLOW',
      `🔐 ZERO-TRUST PASSED: Authenticated via Trusted Terminal [${trustedDevice.device_name}]. ` +
      `Identity verified for restricted role '${matchedRole.name}'.`,
      clientIp,
      new Date().toISOString()
    );
    
    console.log(`🔐 Device Lockdown PASSED: ${trustedDevice.device_name} [${clientIp}] verified for ${matchedRole.name}`);
  }

  const token = generateToken(user.id, user.tenant_id);

  res.json({
    message: `Welcome back, ${user.username}!`,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      tenant: {
        id: user.tenant_id,
        name: user.tenant_name,
      },
      roles: roles.map(r => r.name),
    },
  });
});

/**
 * POST /api/auth/register
 * Register a new user (for demo purposes)
 */
router.post('/register', (req, res) => {
  const { username, email, password, tenantId } = req.body;

  if (!username || !email || !password || !tenantId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'username, email, password, and tenantId are required.',
    });
  }

  const db = getConnection();

  // Check tenant exists
  const tenant = db.prepare('SELECT id, name FROM tenants WHERE id = ?').get(tenantId);
  if (!tenant) {
    return res.status(404).json({
      error: 'TENANT_NOT_FOUND',
      message: 'Specified tenant does not exist.',
    });
  }

  // Check username/email uniqueness
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({
      error: 'USER_EXISTS',
      message: 'Username or email already taken.',
    });
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, username, email, password_hash, tenant_id) VALUES (?, ?, ?, ?, ?)').run(
    id, username, email, passwordHash, tenantId
  );

  const token = generateToken(id, tenantId);

  res.status(201).json({
    message: `User '${username}' registered successfully in '${tenant.name}'.`,
    token,
    user: {
      id,
      username,
      email,
      tenant: { id: tenantId, name: tenant.name },
      roles: [],
    },
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authenticate, (req, res) => {
  const db = getConnection();

  const roles = db.prepare(`
    SELECT r.id, r.name, r.description, r.is_system_role
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(req.user.id);

  const PermissionGraph = require('../engine/permissionGraph');
  const engine = new PermissionGraph();
  const permMap = engine.getUserPermissionMap(req.user.id);

  res.json({
    user: req.user,
    roles,
    permissions: permMap ? permMap.permissions : [],
  });
});

module.exports = router;
