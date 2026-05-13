const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { authorize } = require('../middleware/firewall');
const { getConnection } = require('../database/connection');

// Ensure all resource routes are authenticated
router.use(authenticate);

/**
 * DEFENSE RESOURCE ROUTES
 * All routes are strictly enforced via authorize(action, resource)
 */

// ═══════════════════════════════════════════════
//  USER-FACING: View MY documents (owned + shared with me)
// ═══════════════════════════════════════════════

router.get('/reports', authorize('VIEW', 'REPORTS'), (req, res) => {
  const db = getConnection();
  
  const reports = db.prepare(`
    SELECT DISTINCT d.id, d.title, d.classification, d.created_at,
           u.username as owner_name,
           CASE WHEN d.owner_id = ? THEN 'OWNER' ELSE 'SHARED' END as access_type
    FROM documents d
    LEFT JOIN document_shares ds ON d.id = ds.document_id AND ds.user_id = ?
    LEFT JOIN users u ON d.owner_id = u.id
    WHERE (d.owner_id = ? OR ds.user_id = ?) 
    AND d.tenant_id = ?
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.tenantId);

  res.json({
    status: 'ALLOWED',
    reason: 'Access verified via Ownership/Delegation',
    data: reports
  });
});

// ─── UPDATE REPORTS ───────────────────────────────────────────────────────────
router.put('/reports', authorize('UPDATE', 'REPORTS'), (req, res) => {
  res.json({
    status: 'ALLOWED',
    reason: 'Personnel authorized for tactical record modification',
    message: 'Report updated successfully.'
  });
});

// ─── DELETE REPORTS ───────────────────────────────────────────────────────────
router.delete('/reports', authorize('DELETE', 'REPORTS'), (req, res) => {
  res.json({
    status: 'ALLOWED',
    reason: 'Strategic deletion authority confirmed',
    message: 'Report purged from operational archives.'
  });
});

// ═══════════════════════════════════════════════
//  ADMIN: Document Access Control Panel APIs
// ═══════════════════════════════════════════════

// GET /api/resource/documents — All documents in tenant (admin view)
router.get('/documents', isAdmin, (req, res) => {
  const db = getConnection();
  const documents = db.prepare(`
    SELECT d.id, d.title, d.classification, d.created_at,
           u.username as owner_name, u.id as owner_id,
           GROUP_CONCAT(r.name) as owner_roles
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE d.tenant_id = ?
    GROUP BY d.id
    ORDER BY u.username, d.title
  `).all(req.user.tenantId);
  res.json({ documents });
});

// GET /api/resource/users — All users in tenant (for the dropdown)
router.get('/users', isAdmin, (req, res) => {
  const db = getConnection();
  const users = db.prepare(`
    SELECT u.id, u.username,
           GROUP_CONCAT(r.name) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.tenant_id = ? AND u.is_active = 1
    GROUP BY u.id
    ORDER BY u.username
  `).all(req.user.tenantId);
  res.json({ users });
});

// GET /api/resource/shares — All active shares in tenant
router.get('/shares', isAdmin, (req, res) => {
  const db = getConnection();
  const shares = db.prepare(`
    SELECT ds.document_id, ds.user_id, ds.access_level, ds.granted_at,
           d.title as document_title, d.classification,
           owner.username as owner_name,
           recipient.username as recipient_name,
           GROUP_CONCAT(r.name) as recipient_roles
    FROM document_shares ds
    JOIN documents d ON ds.document_id = d.id
    JOIN users owner ON d.owner_id = owner.id
    JOIN users recipient ON ds.user_id = recipient.id
    LEFT JOIN user_roles ur ON recipient.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE ds.tenant_id = ?
    GROUP BY ds.document_id, ds.user_id
    ORDER BY ds.granted_at DESC
  `).all(req.user.tenantId);
  res.json({ shares });
});

// POST /api/resource/share — Grant access to a document
router.post('/share', isAdmin, (req, res) => {
  const { documentId, targetUserId } = req.body;
  if (!documentId || !targetUserId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'documentId and targetUserId are required.' });
  }

  const db = getConnection();
  
  // 1. Verify document exists in this tenant
  const doc = db.prepare('SELECT id, title, owner_id, tenant_id FROM documents WHERE id = ? AND tenant_id = ?').get(documentId, req.user.tenantId);
  if (!doc) return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found in your tenant.' });

  // 2. Cannot share a document with its own owner
  if (doc.owner_id === targetUserId) {
    return res.status(400).json({ error: 'SELF_SHARE', message: 'Cannot share a document with its owner — they already have full access.' });
  }

  // 3. Verify target user exists in this tenant (CROSS-TENANT BLOCK)
  const target = db.prepare('SELECT id, username, tenant_id FROM users WHERE id = ? AND tenant_id = ?').get(targetUserId, req.user.tenantId);
  if (!target) return res.status(403).json({ error: 'CROSS_TENANT_VIOLATION', message: '🚨 Cross-tenant data leak blocked: Target user does not belong to your organization.' });

  // 4. Check if share already exists
  const existing = db.prepare('SELECT 1 FROM document_shares WHERE document_id = ? AND user_id = ?').get(documentId, targetUserId);
  if (existing) return res.status(409).json({ error: 'ALREADY_SHARED', message: `${target.username} already has access to '${doc.title}'.` });

  // 5. Create the share
  db.prepare('INSERT INTO document_shares (document_id, user_id, tenant_id) VALUES (?, ?, ?)').run(documentId, targetUserId, req.user.tenantId);

  // 6. Audit the delegation
  db.prepare(`
    INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), req.user.id, req.user.tenantId,
    'DELEGATE_ACCESS', 'ALLOW',
    `Admin granted '${target.username}' access to document '${doc.title}'`,
    new Date().toISOString()
  );

  res.json({ message: `Access to '${doc.title}' granted to ${target.username}.` });
});

// DELETE /api/resource/share — Revoke access
router.delete('/share', isAdmin, (req, res) => {
  const { documentId, targetUserId } = req.body;
  if (!documentId || !targetUserId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'documentId and targetUserId are required.' });
  }

  const db = getConnection();

  // Verify share exists within this tenant
  const share = db.prepare(`
    SELECT ds.*, d.title, u.username 
    FROM document_shares ds 
    JOIN documents d ON ds.document_id = d.id 
    JOIN users u ON ds.user_id = u.id
    WHERE ds.document_id = ? AND ds.user_id = ? AND ds.tenant_id = ?
  `).get(documentId, targetUserId, req.user.tenantId);

  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND', message: 'No active share found for this document-user pair.' });

  db.prepare('DELETE FROM document_shares WHERE document_id = ? AND user_id = ?').run(documentId, targetUserId);

  // Audit the revocation
  db.prepare(`
    INSERT INTO audit_log (id, user_id, tenant_id, requested_permission, decision, reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), req.user.id, req.user.tenantId,
    'REVOKE_ACCESS', 'ALLOW',
    `Admin revoked '${share.username}' access to document '${share.title}'`,
    new Date().toISOString()
  );

  res.json({ message: `Access to '${share.title}' revoked from ${share.username}.` });
});

module.exports = router;
