const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getConnection } = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'defense-firewall-secret';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'No valid authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getConnection();
    
    const user = await db.prepare(`
      SELECT u.id, u.username, u.email, u.tenant_id, u.is_active, t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'USER_INVALID', message: 'User invalid.' });
    }

    // Attach user AND session context (needed for Sudo/Logout)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      session: decoded.sessionId ? { id: decoded.sessionId } : null
    };

    // Layer 1: IP Check
    const clientIp = (req.ip || req.connection?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
    if (decoded.bindingIp && decoded.bindingIp !== clientIp) {
      return res.status(403).json({ error: 'IP_MISMATCH', message: '🛡️ IP Violation detected.' });
    }

    // Layer 2: Fingerprint Check
    if (decoded.fingerprintHash) {
      const liveFp = req.headers['x-device-fingerprint'];
      if (!liveFp) {
        return res.status(403).json({ error: 'FP_REQUIRED', message: '🛡️ Hardware signature required.' });
      }

      const liveHash = crypto.createHash('sha256').update(liveFp).digest('hex');
      if (liveHash !== decoded.fingerprintHash) {
        console.log(`🛡️ [SESSION SPLIT DETECTED] User: ${user.username}`);
        
        // 1. KILL THE SESSION INSTANTLY
        if (decoded.sessionId) {
          await db.prepare('UPDATE user_sessions SET is_revoked = TRUE WHERE id = ?').run(decoded.sessionId);
        }

        // 2. RECORD CRITICAL AUDIT LOG
        const { v4: uuidv4 } = require('uuid');
        await db.prepare(`
          INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, ip_address, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          user.id,
          user.tenantId,
          'SESSION_SPLIT_ALERT',
          'DENY',
          `🚨 CRITICAL: Session Split Detected! Intruder attempted access from unauthorized hardware. Session has been TERMINATED globally.`,
          clientIp,
          new Date().toISOString()
        );

        return res.status(403).json({ 
          error: 'FP_MISMATCH', 
          message: '🛡️ SECURITY BREACH: Possible intruder detected in this session. For your protection, the session has been terminated across all devices.' 
        });
      }
    }

    // Layer 3: Trusted Device Check
    if (decoded.deviceId) {
      const device = await db.prepare('SELECT is_active FROM trusted_devices WHERE id = ? AND is_active = TRUE').get(decoded.deviceId);
      if (!device) {
        return res.status(403).json({ error: 'DEVICE_INVALID', message: '🛡️ Device revoked.' });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

async function isAdmin(req, res, next) {
  const db = getConnection();
  const role = await db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.name IN ('Brigadier', 'Strategic_Admin')
  `).get(req.user.id);
  if (!role) return res.status(403).json({ error: 'ADMIN_ONLY' });
  next();
}

function generateToken(userId, tenantId, bindingData = {}) {
  return jwt.sign(
    { 
      userId, 
      tenantId,
      bindingIp: bindingData.ip,
      deviceId: bindingData.deviceId,
      sessionId: bindingData.sessionId,
      fingerprintHash: bindingData.fingerprintHash || null
    }, 
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticate, isAdmin, generateToken, JWT_SECRET };
