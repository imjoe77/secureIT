/**
 * JWT Authentication Middleware
 * 
 * Handles:
 *   - Token verification and decoding
 *   - User context injection into request
 *   - Tenant context extraction
 */

const jwt = require('jsonwebtoken');
const { getConnection } = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'defense-firewall-secret';

/**
 * Middleware: Verify JWT token and attach user to request.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'No valid authentication token provided. Include "Authorization: Bearer <token>" header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch full user details from database
    const db = getConnection();
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.tenant_id, u.is_active, t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Authenticated user no longer exists.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'USER_DEACTIVATED',
        message: `User '${user.username}' has been deactivated.`,
      });
    }

    // Attach user context to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Authentication token is invalid.',
    });
  }
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(userId, tenantId) {
  return jwt.sign(
    { userId, tenantId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

module.exports = { authenticate, generateToken, JWT_SECRET };
