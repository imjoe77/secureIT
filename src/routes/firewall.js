const express = require('express');
const router = express.Router();
const { getConnection } = require('../database/connection');
const { authenticate } = require('../middleware/auth');

/**
 * FIREWALL MANAGEMENT ROUTES
 * Used by Strategic Command to configure escalation policies.
 */

router.use(authenticate);

// 1. LIST ALL RULES
router.get('/rules', async (req, res) => {
  try {
    const db = getConnection();
    const rules = await db.prepare(
      'SELECT * FROM firewall_rules WHERE tenant_id IS NULL OR tenant_id = ? ORDER BY created_at DESC'
    ).all(req.user.tenantId);
    
    res.json(rules.map(r => ({
      ...r,
      config: JSON.parse(r.config),
      is_active: Boolean(r.is_active)
    })));
  } catch (err) {
    console.error('Firewall fetch error:', err);
    res.status(500).json({ error: 'FAILED_TO_FETCH_RULES', message: err.message });
  }
});

// 2. TOGGLE RULE STATUS
router.patch('/rules/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();
    
    const rule = await db.prepare('SELECT is_active FROM firewall_rules WHERE id = ?').get(id);
    if (!rule) return res.status(404).json({ error: 'RULE_NOT_FOUND' });

    const newState = !rule.is_active;
    await db.prepare('UPDATE firewall_rules SET is_active = ? WHERE id = ?').run(newState, id);

    res.json({ success: true, is_active: newState });
  } catch (err) {
    res.status(500).json({ error: 'TOGGLE_FAILED', message: err.message });
  }
});

module.exports = router;

