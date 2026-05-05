const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/firewall');

// Ensure all resource routes are authenticated
router.use(authenticate);

/**
 * DEFENSE RESOURCE ROUTES
 * All routes are strictly enforced via authorize(action, resource)
 */

// 1. VIEW REPORTS
router.get('/reports', authorize('VIEW', 'REPORTS'), (req, res) => {
  res.json({
    status: 'ALLOWED',
    reason: 'Clearance level sufficient for tactical overview',
    data: [
      { id: 'OP-771', title: 'Perimeter Status', classification: 'UNCLASSIFIED' },
      { id: 'OP-882', title: 'Supply Chain Audit', classification: 'CONFIDENTIAL' }
    ]
  });
});

// 2. UPDATE REPORTS
router.put('/reports', authorize('UPDATE', 'REPORTS'), (req, res) => {
  res.json({
    status: 'ALLOWED',
    reason: 'Personnel authorized for tactical record modification',
    message: 'Report OP-771 updated successfully.'
  });
});

// 3. DELETE REPORTS
router.delete('/reports', authorize('DELETE', 'REPORTS'), (req, res) => {
  res.json({
    status: 'ALLOWED',
    reason: 'Strategic deletion authority confirmed',
    message: 'Report OP-882 purged from operational archives.'
  });
});

module.exports = router;
