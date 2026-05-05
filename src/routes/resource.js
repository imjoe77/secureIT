/**
 * Protected Military Resource Routes
 * 
 * Demonstrates firewall-protected endpoints for Air Force operations.
 * Each route requires specific permissions and goes through the firewall.
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { firewall } = require('../middleware/firewall');

const router = express.Router();
router.use(authenticate);

// GET /api/resource - Maintenance logs
router.get('/', firewall('read:maintenance-logs'), (req, res) => {
  res.json({
    message: '✅ Personnel authorized to view aircraft maintenance logs.',
    data: {
      logs: [
        { id: 'MAINT-772', aircraft: 'F-35 Lightning II', status: 'Ready', tech: 'Sgt. Smith' },
        { id: 'MAINT-891', aircraft: 'A-10 Warthog', status: 'In-Repair', tech: 'Airman Lee' },
      ],
    },
    firewallAnalysis: {
      decision: req.firewallResult.decision,
      accessType: req.firewallResult.accessType,
      accessPath: req.firewallResult.accessPath,
      inheritanceDepth: req.firewallResult.inheritanceDepth,
    },
    tenant: { id: req.user.tenantId, name: req.user.tenantName },
  });
});

// GET /api/resource/analytics - Flight schedules
router.get('/analytics', firewall('read:flight-schedules'), (req, res) => {
  res.json({
    message: '✅ Flight schedules accessed.',
    data: {
      sorties: [
        { callsign: 'VIPER-1', takeoff: '0900Z', mission: 'CAP' },
        { callsign: 'STING-4', takeoff: '1130Z', mission: 'CAS' },
      ],
    },
    firewallAnalysis: {
      decision: req.firewallResult.decision,
      accessType: req.firewallResult.accessType,
    },
  });
});

// DELETE /api/resource/:id - Surveillance monitor
router.delete('/:id', firewall('monitor:surveillance'), (req, res) => {
  res.json({
    message: `✅ Surveillance system ${req.params.id} link established.`,
    firewallAnalysis: {
      decision: req.firewallResult.decision,
      accessType: req.firewallResult.accessType,
      accessPath: req.firewallResult.accessPath,
    },
  });
});

// GET /api/resource/admin - Intelligence reports
router.get('/admin', firewall('read:intel-reports'), (req, res) => {
  res.json({
    message: '✅ Classified intelligence report access granted.',
    firewallAnalysis: {
      decision: req.firewallResult.decision,
      accessType: req.firewallResult.accessType,
      accessPath: req.firewallResult.accessPath,
      riskLevel: req.firewallResult.riskLevel,
    },
  });
});

module.exports = router;
