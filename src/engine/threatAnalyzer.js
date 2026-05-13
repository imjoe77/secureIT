/**
 * Sliding Window Rate Analyzer (Threat Actor Detection)
 * 
 * Monitors the audit log for anomalous patterns that indicate a brute-force
 * or slow-burn attack. If the same user_id generates 5+ DENY events within
 * a sliding 60-second window, the system auto-flags them as a THREAT_ACTOR.
 * 
 * This runs as pure backend logic — no additional infrastructure needed.
 * The analyzer queries SQLite directly and surfaces alerts via the /api/audit/threats endpoint.
 */

const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../database/connection');

// ═══════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════
const WINDOW_SECONDS = 60;        // Sliding window size
const DENY_THRESHOLD = 5;         // Number of DENY events to trigger alert
const FLAGGED_ACTORS = new Map(); // In-memory threat actor registry: userId → { flaggedAt, reason, count }

/**
 * Analyze the audit log for sliding-window anomalies.
 * Called on a schedule or on-demand via the API.
 * 
 * @param {string} [tenantId] - Optional tenant filter
 * @returns {{ threats: Array, scannedAt: string }}
 */
function analyzeThreats(tenantId = null) {
  const db = getConnection();
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

  // Query: Group DENY events by user_id within the sliding window
  let query = `
    SELECT 
      al.user_id, 
      u.username,
      COUNT(*) as deny_count,
      GROUP_CONCAT(DISTINCT al.requested_permission) as targeted_permissions,
      GROUP_CONCAT(DISTINCT al.ip_address) as source_ips,
      MIN(al.timestamp) as first_event,
      MAX(al.timestamp) as last_event
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.decision = 'DENY'
      AND al.timestamp >= ?
  `;
  const params = [windowStart];

  if (tenantId) {
    query += ' AND al.tenant_id = ?';
    params.push(tenantId);
  }

  query += ' GROUP BY al.user_id HAVING deny_count >= ?';
  params.push(DENY_THRESHOLD);

  const suspiciousUsers = db.prepare(query).all(...params);

  const threats = [];

  for (const row of suspiciousUsers) {
    if (!row.user_id) continue;

    const threatLevel = row.deny_count >= 15 ? 'CRITICAL' :
                        row.deny_count >= 10 ? 'HIGH' : 'MEDIUM';

    const threat = {
      id: uuidv4(),
      userId: row.user_id,
      username: row.username || 'Unknown',
      denyCount: row.deny_count,
      windowSeconds: WINDOW_SECONDS,
      targetedPermissions: row.targeted_permissions ? row.targeted_permissions.split(',') : [],
      sourceIps: row.source_ips ? row.source_ips.split(',') : [],
      firstEvent: row.first_event,
      lastEvent: row.last_event,
      threatLevel,
      type: 'SLIDING_WINDOW_BREACH',
      reason: `User '${row.username}' generated ${row.deny_count} DENY events within ${WINDOW_SECONDS}s window (threshold: ${DENY_THRESHOLD}). Possible brute-force or privilege probing attack.`,
    };

    threats.push(threat);

    // Auto-flag the actor if not already flagged
    if (!FLAGGED_ACTORS.has(row.user_id)) {
      FLAGGED_ACTORS.set(row.user_id, {
        flaggedAt: new Date().toISOString(),
        reason: threat.reason,
        count: row.deny_count,
        threatLevel,
      });

      // Record the threat detection to the audit log
      try {
        db.prepare(`
          INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          row.user_id,
          tenantId,
          'THREAT_ACTOR_FLAGGED',
          'DENY',
          `🚨 THREAT ACTOR DETECTED: ${threat.reason}`,
          new Date().toISOString()
        );
      } catch (err) {
        console.error('Failed to log threat detection:', err.message);
      }
    }
  }

  return {
    threats,
    flaggedActors: Array.from(FLAGGED_ACTORS.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    })),
    config: {
      windowSeconds: WINDOW_SECONDS,
      denyThreshold: DENY_THRESHOLD,
    },
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Check if a specific user is flagged as a threat actor.
 */
function isUserFlagged(userId) {
  return FLAGGED_ACTORS.has(userId);
}

/**
 * Clear a specific user from the threat actor registry.
 */
function clearFlag(userId) {
  return FLAGGED_ACTORS.delete(userId);
}

/**
 * Get all currently flagged threat actors.
 */
function getFlaggedActors() {
  return Array.from(FLAGGED_ACTORS.entries()).map(([userId, data]) => ({
    userId,
    ...data,
  }));
}

module.exports = { analyzeThreats, isUserFlagged, clearFlag, getFlaggedActors };
