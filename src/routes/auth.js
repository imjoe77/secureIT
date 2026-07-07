/**
 * Authentication Routes
 * 
 * GET  /api/auth/challenge - Issue fingerprint challenge nonce
 * POST /api/auth/login     - User login, returns JWT
 * POST /api/auth/register  - Register new user (admin only in real app)
 * GET  /api/auth/me        - Get current user profile
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');
const { authenticate, generateToken } = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════════════
//  FINGERPRINT CHALLENGE-RESPONSE NONCE STORE
// ═══════════════════════════════════════════════════
// In-memory nonce store. Each nonce is single-use and expires in 60s.
// This prevents replay attacks — an attacker who steals a fingerprint
// hash cannot reuse it because the nonce changes every session.
const nonceStore = new Map();
const NONCE_TTL_MS = 60 * 1000; // 60 seconds

function cleanExpiredNonces() {
  const now = Date.now();
  for (const [nonce, entry] of nonceStore) {
    if (now - entry.createdAt > NONCE_TTL_MS) nonceStore.delete(nonce);
  }
}

// Periodic cleanup every 30s
setInterval(cleanExpiredNonces, 30_000);

/**
 * GET /api/auth/challenge
 * Issues a one-time cryptographic nonce for fingerprint verification.
 * Client must compute SHA256(fingerprint + nonce) and send it with login.
 */
router.get('/challenge', async (req, res) => {
  const nonce = crypto.randomBytes(32).toString('hex');
  nonceStore.set(nonce, { createdAt: Date.now(), used: false });

  res.json({
    nonce,
    expiresIn: NONCE_TTL_MS / 1000,
    instruction: 'Compute SHA256(deviceFingerprint + nonce) and send as fingerprintResponse in the login body.'
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  const { username, password, deviceFingerprint, challengeNonce, fingerprintResponse } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Username and password are required.',
    });
  }

  const db = getConnection();
  const user = await db.prepare(`
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
  const roles = await db.prepare(`
    SELECT r.id, r.name, r.level FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(user.id);

  // Extract client IP for binding
  const clientIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const normalizedIp = clientIp.replace(/^::ffff:/, '');
  let activeDeviceId = null;

  // ═══════════════════════════════════════════════════
  //  ZERO-TRUST DEVICE LOCKDOWN — Enforced at Login
  // ═══════════════════════════════════════════════════
  // Check if any of the user's roles are restricted by device_lockdown rules.
  // If so, verify the requesting device's IP against the trusted_devices registry.
  const deviceLockdownRules = await db.prepare(`
    SELECT * FROM firewall_rules 
    WHERE rule_type = 'device_lockdown' AND is_active = TRUE 
    AND (tenant_id IS NULL OR tenant_id = ?)
  `).all(user.tenant_id);

  for (const rule of deviceLockdownRules) {
    const config = JSON.parse(rule.config);
    const restrictedRoles = config.restricted_roles || [];
    
    // Check if user holds any restricted role
    const matchedRole = roles.find(r => restrictedRoles.includes(r.name));
    if (!matchedRole) continue;

    // User holds a restricted role — enforce device verification
    // Look up the requesting IP in the trusted_devices registry
    const trustedDevice = await db.prepare(`
      SELECT * FROM trusted_devices 
      WHERE role_id = ? AND is_active = TRUE 
      AND (ip_address = ? OR ip_address = ? OR ip_address = ?)
    `).get(matchedRole.id, clientIp, normalizedIp, `::ffff:${normalizedIp}`);

    if (!trustedDevice) {
      // BLOCKED: Unregistered device attempting high-command access
      // Log the blocked attempt to the audit trail
      await db.prepare(`
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

    // Device verified — update last_used_at timestamp and track active device
    activeDeviceId = trustedDevice.id;
    await db.prepare('UPDATE trusted_devices SET last_used_at = ? WHERE id = ?')
      .run(new Date().toISOString(), trustedDevice.id);

    // LOG SUCCESS: Record that the device check passed
    await db.prepare(`
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
  }

  // ═══════════════════════════════════════════════════
  //  SESSION REGISTRATION
  // ═══════════════════════════════════════════════════
  // Create a database-backed session for real-time revocation
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default 24h
  
  await db.prepare(`
    INSERT INTO user_sessions (id, user_id, tenant_id, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    sessionId, 
    user.id, 
    user.tenant_id, 
    clientIp, 
    req.headers['user-agent'] || 'unknown', 
    expiresAt
  );

  // ═══════════════════════════════════════════════════
  //  FINGERPRINT CHALLENGE-RESPONSE VERIFICATION
  // ═══════════════════════════════════════════════════
  // If the client provided a nonce + response, verify the challenge.
  // This prevents replay attacks: SHA256(fp + nonce) changes every login.
  let fingerprintHash = null;

  if (deviceFingerprint && challengeNonce && fingerprintResponse) {
    // 1. Validate the nonce exists and hasn't expired/been used
    const nonceEntry = nonceStore.get(challengeNonce);
    if (!nonceEntry) {
      return res.status(403).json({
        error: 'NONCE_INVALID',
        message: '🛡️ Fingerprint challenge nonce is invalid or expired. Request a new challenge.',
      });
    }
    if (nonceEntry.used) {
      return res.status(403).json({
        error: 'NONCE_REUSED',
        message: '🛡️ REPLAY ATTACK DETECTED: This nonce has already been consumed.',
      });
    }
    if (Date.now() - nonceEntry.createdAt > NONCE_TTL_MS) {
      nonceStore.delete(challengeNonce);
      return res.status(403).json({
        error: 'NONCE_EXPIRED',
        message: '🛡️ Challenge nonce has expired. Request a fresh challenge.',
      });
    }

    // 2. Recompute expected response: SHA256(fingerprint + nonce)
    const expectedResponse = crypto
      .createHash('sha256')
      .update(deviceFingerprint + challengeNonce)
      .digest('hex');

    if (fingerprintResponse !== expectedResponse) {
      // Mark nonce as used to prevent retry
      nonceEntry.used = true;

      await db.prepare(`
        INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), user.id, user.tenant_id,
        'FINGERPRINT_CHALLENGE_FAILED', 'DENY',
        `🛡️ CHALLENGE-RESPONSE FAILED: Client provided incorrect SHA256(fp+nonce). Possible replay or fingerprint spoofing attempt.`,
        clientIp, new Date().toISOString()
      );

      return res.status(403).json({
        error: 'CHALLENGE_FAILED',
        message: '🛡️ Fingerprint challenge-response verification failed. Access denied.',
      });
    }

    // 3. Challenge passed — consume the nonce (single-use)
    nonceEntry.used = true;
    fingerprintHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
  } else if (deviceFingerprint) {
    // Fallback: hash the fingerprint directly (backwards compat)
    fingerprintHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
  }

  const token = generateToken(user.id, user.tenant_id, { 
    ip: clientIp, 
    deviceId: activeDeviceId,
    sessionId: sessionId,
    fingerprintHash: fingerprintHash
  });

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
router.post('/register', async (req, res) => {
  const { username, email, password, tenantId } = req.body;

  if (!username || !email || !password || !tenantId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'username, email, password, and tenantId are required.',
    });
  }

  const db = getConnection();

  // Check tenant exists
  const tenant = await db.prepare('SELECT id, name FROM tenants WHERE id = ?').get(tenantId);
  if (!tenant) {
    return res.status(404).json({
      error: 'TENANT_NOT_FOUND',
      message: 'Specified tenant does not exist.',
    });
  }

  // Check username/email uniqueness
  const existing = await db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({
      error: 'USER_EXISTS',
      message: 'Username or email already taken.',
    });
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  await db.prepare('INSERT INTO users (id, username, email, password_hash, tenant_id) VALUES (?, ?, ?, ?, ?)').run(
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
router.get('/me', authenticate, async (req, res) => {
  const db = getConnection();

  const roles = await db.prepare(`
    SELECT r.id, r.name, r.description, r.is_system_role
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(req.user.id);

  const PermissionGraph = require('../engine/permissionGraph');
  const engine = new PermissionGraph();
  const permMap = await engine.getUserPermissionMap(req.user.id);

  res.json({
    user: req.user,
    roles,
    permissions: permMap ? permMap.permissions : [],
  });
});

/**
 * POST /api/auth/sudo
 * Elevate session to High-Risk Mode (Sudo) for 15 minutes
 */
router.post('/sudo', authenticate, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'PASSWORD_REQUIRED', message: 'Password is required for elevation.' });
  }

  const db = getConnection();
  const user = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

  const passwordValid = bcrypt.compareSync(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Elevation failed. Invalid password.' });
  }

  // Set sudo mode for 15 minutes
  const sudoUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.prepare('UPDATE user_sessions SET sudo_until = ? WHERE id = ?').run(sudoUntil, req.user.session.id);

  res.json({
    message: '🛡️ ELEVATION SUCCESSFUL: High-risk operations are now unlocked for 15 minutes.',
    sudoUntil
  });
});

module.exports = router;
