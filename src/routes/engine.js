/**
 * Engine Stats Routes
 * 
 * GET /api/engine/stats — Returns live performance metrics from the
 * Permission Graph Engine. Shows traversal time, graph size, and
 * throughput data for the dashboard "Engine Stats" widget.
 */

const express = require('express');
const { getConnection } = require('../database/connection');
const { authenticate } = require('../middleware/auth');
const PermissionGraph = require('../engine/permissionGraph');

const router = express.Router();
router.use(authenticate);

// ═══════════════════════════════════════════════════
//  LIVE ENGINE PERFORMANCE METRICS
// ═══════════════════════════════════════════════════

router.get('/stats', async (req, res) => {
  const startTotal = process.hrtime.bigint();

  try {
    const db = getConnection();
    const engine = new PermissionGraph();

    // 1. Count graph nodes and edges
    const roleCount = await db.prepare('SELECT COUNT(*) as count FROM roles WHERE tenant_id = ?')
      .get(req.user.tenantId);
    const edgeCount = await db.prepare(`
      SELECT COUNT(*) as count FROM role_hierarchy rh
      JOIN roles r ON rh.parent_role_id = r.id
      WHERE r.tenant_id = ?
    `).get(req.user.tenantId);
    const permissionCount = await db.prepare('SELECT COUNT(*) as count FROM permissions').get();
    const auditCount = await db.prepare('SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ?')
      .get(req.user.tenantId);

    // 2. Benchmark a live graph traversal
    const traversalStart = process.hrtime.bigint();
    const roleGraph = await engine.buildRoleGraph(req.user.tenantId);

    // Traverse from every root to measure real performance
    const roles = await db.prepare('SELECT id FROM roles WHERE tenant_id = ?').all(req.user.tenantId);
    let totalPermissionsEvaluated = 0;

    for (const role of roles) {
      const perms = await engine.bfsTraversePermissions(role.id, roleGraph);
      totalPermissionsEvaluated += perms.size;
    }

    const traversalEnd = process.hrtime.bigint();
    const traversalTimeNs = Number(traversalEnd - traversalStart);
    const traversalTimeMs = (traversalTimeNs / 1_000_000).toFixed(2);

    // 3. Total response time
    const endTotal = process.hrtime.bigint();
    const totalTimeMs = (Number(endTotal - startTotal) / 1_000_000).toFixed(2);

    res.json({
      engine: {
        lastTraversalMs: parseFloat(traversalTimeMs),
        totalResponseMs: parseFloat(totalTimeMs),
        graphNodes: roleCount.count,
        graphEdges: edgeCount.count,
        totalPermissions: permissionCount.count,
        permissionsEvaluated: totalPermissionsEvaluated,
        auditEntries: auditCount.count,
        traversalAlgorithm: 'BFS',
        cycleDetection: 'DFS',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Engine stats error:', err);
    res.status(500).json({ error: 'ENGINE_STATS_FAILED', message: err.message });
  }
});

module.exports = router;
