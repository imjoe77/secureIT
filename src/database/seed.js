/**
 * Database Seed Script - Air Force Operational Environment
 * 
 * Replaces demo data with Air Force specific entities:
 *   - Tenants: US Air Force, Global Defense Force
 *   - Personnel: Airmen, Operators, Analysts, Officers
 *   - Roles: Maintenance, Flight Ops, Surveillance, Intel, Reporting
 *   - Hierarchy: Multi-path inheritance chains
 *   - Firewall: Rules tailored for military security protocols
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { initDatabase, closeConnection } = require('./connection');
const { SCHEMA_SQL } = require('./schema');

async function seed() {
  console.log('🛡️  Seeding Defense-Grade Operational Environment...\n');
  const db = await initDatabase();
  db.exec(SCHEMA_SQL);

  // Clear existing data
  db.exec(`
    DELETE FROM audit_log; DELETE FROM firewall_rules; DELETE FROM role_hierarchy;
    DELETE FROM role_permissions; DELETE FROM user_roles; DELETE FROM permissions;
    DELETE FROM roles; DELETE FROM users; DELETE FROM tenants; DELETE FROM trusted_devices;
  `);

  // TENANTS
  const tenants = [
    { id: uuidv4(), name: 'Strategic Defense Command' },
    { id: uuidv4(), name: 'Global Defense Force' }
  ];
  tenants.forEach(t => db.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)').run(t.id, t.name));
  const sdc = tenants[0];
  const gdf = tenants[1];

  // PERMISSIONS (Action + Resource)
  const permissions = [
    { id: uuidv4(), name: 'VIEW_REPORTS',   resource: 'REPORTS', action: 'VIEW', risk: 'low' },
    { id: uuidv4(), name: 'UPDATE_REPORTS', resource: 'REPORTS', action: 'UPDATE', risk: 'medium' },
    { id: uuidv4(), name: 'DELETE_REPORTS', resource: 'REPORTS', action: 'DELETE', risk: 'high' },
  ];
  permissions.forEach(p => db.prepare('INSERT INTO permissions (id, name, resource, action, risk_level) VALUES (?, ?, ?, ?, ?)').run(p.id, p.name, p.resource, p.action, p.risk));

  // ROLES (with levels)
  const roles = [
    { id: uuidv4(), name: 'Soldier',   level: 1,  desc: 'Level 1: Tactical Operator' },
    { id: uuidv4(), name: 'Officer',   level: 3,  desc: 'Level 3: Field Commander' },
    { id: uuidv4(), name: 'Colonel',   level: 6,  desc: 'Level 6: Regional Strategist' },
    { id: uuidv4(), name: 'Brigadier', level: 10, desc: 'Level 10: Supreme Command' },
    { id: uuidv4(), name: 'Strategic_Admin', level: 11, desc: 'Level 11: HQ Strategic Oversight' },
  ];
  roles.forEach(r => db.prepare('INSERT INTO roles (id, name, level, description, tenant_id) VALUES (?, ?, ?, ?, ?)').run(r.id, r.name, r.level, r.desc, sdc.id));

  // ROLE PERMISSIONS MAPPING
  const getP = (n) => permissions.find(p => p.name === n).id;
  const getR = (n) => roles.find(r => r.name === n).id;

  const mapping = [
    // Soldier: Tactical viewing only
    { rid: getR('Soldier'),   pid: getP('VIEW_REPORTS') },
    
    // Officer: Field management
    { rid: getR('Officer'),   pid: getP('VIEW_REPORTS') },
    { rid: getR('Officer'),   pid: getP('UPDATE_REPORTS') },
    
    // Colonel: Regional authority (Can Delete)
    { rid: getR('Colonel'),   pid: getP('VIEW_REPORTS') },
    { rid: getR('Colonel'),   pid: getP('UPDATE_REPORTS') },
    { rid: getR('Colonel'),   pid: getP('DELETE_REPORTS') }, // <--- HIGH RISK (Direct)
    
    // Brigadier: Supreme oversight
    { rid: getR('Brigadier'), pid: getP('VIEW_REPORTS') },
    { rid: getR('Brigadier'), pid: getP('UPDATE_REPORTS') },
  ];
  mapping.forEach(m => db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(m.rid, m.pid));

  // ROLE HIERARCHY (The Chain: Brigadier -> Colonel -> Officer -> Soldier)
  const hierarchy = [
    { parent: getR('Strategic_Admin'), child: getR('Brigadier'), pName: 'Strategic_Admin', cName: 'Brigadier' },
    { parent: getR('Brigadier'), child: getR('Colonel'), pName: 'Brigadier', cName: 'Colonel' },
    { parent: getR('Colonel'),   child: getR('Officer'), pName: 'Colonel', cName: 'Officer' },
    { parent: getR('Officer'),   child: getR('Soldier'), pName: 'Officer', cName: 'Soldier' }
  ];
  
  console.log('🔗 Establishing Role Chain of Command...');
  hierarchy.forEach(h => {
    const res = db.prepare('INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (?, ?)').run(h.parent, h.child);
    console.log(`   Link created: ${h.pName} -> ${h.cName} (${res.changes} change)`);
  });

  // FIREWALL RULES
  const firewallRules = [
    {
      id: uuidv4(),
      name: 'Anti-Escalation Policy',
      desc: 'Blocks high-risk permissions reached via indirect inheritance (> 1 hop)',
      type: 'block_indirect',
      config: JSON.stringify({
        risk_levels: ['high', 'critical'],
        max_depth: 0
      }),
      tenant_id: sdc.id
    },
    {
      id: uuidv4(),
      name: 'Strategic Command Lockdown',
      desc: 'Brigadier role restricted to verified Secure Terminals — only pre-registered device IPs can authenticate. Remote/unknown devices are blocked at login.',
      type: 'device_lockdown',
      config: JSON.stringify({
        restricted_roles: ['Brigadier'],
        enforce_at_login: true
      }),
      tenant_id: sdc.id
    }
  ];
  firewallRules.forEach(r => db.prepare('INSERT INTO firewall_rules (id, name, description, rule_type, config, tenant_id) VALUES (?, ?, ?, ?, ?, ?)').run(r.id, r.name, r.desc, r.type, r.config, r.tenant_id));

  // TRUSTED DEVICES — Pre-registered device IPs for Brigadier access
  // Only these IPs can authenticate as Brigadier (Zero-Trust Device Lockdown)
  console.log('🔐 Registering Trusted Devices for Supreme Command...');
  const trustedDevices = [
    {
      id: uuidv4(),
      device_name: 'Secure Command Terminal Alpha',
      ip_address: '127.0.0.1',
      role_id: getR('Brigadier'),
      tenant_id: sdc.id
    },
    {
      id: uuidv4(),
      device_name: 'Secure Command Terminal Alpha (IPv6)',
      ip_address: '::1',
      role_id: getR('Brigadier'),
      tenant_id: sdc.id
    },
    {
      id: uuidv4(),
      device_name: 'Secure Command Terminal Alpha (IPv6-mapped)',
      ip_address: '::ffff:127.0.0.1',
      role_id: getR('Brigadier'),
      tenant_id: sdc.id
    }
  ];
  trustedDevices.forEach(d => {
    db.prepare('INSERT INTO trusted_devices (id, device_name, ip_address, role_id, tenant_id) VALUES (?, ?, ?, ?, ?)').run(
      d.id, d.device_name, d.ip_address, d.role_id, d.tenant_id
    );
    console.log(`   ✅ Registered: ${d.device_name} [${d.ip_address}]`);
  });

  // USERS
  const hash = bcrypt.hashSync('password123', 10);
  const users = [
    { id: uuidv4(), username: 'soldier_user',   role: 'Soldier' },
    { id: uuidv4(), username: 'soldier_alpha',  role: 'Soldier' },
    { id: uuidv4(), username: 'soldier_bravo',  role: 'Soldier' },
    { id: uuidv4(), username: 'officer_user',   role: 'Officer' },
    { id: uuidv4(), username: 'colonel_user',   role: 'Colonel' },
    { id: uuidv4(), username: 'brigadier_user', role: 'Brigadier' },
    { id: uuidv4(), username: 'hq_admin', role: 'Strategic_Admin' },
  ];

  users.forEach(u => {
    db.prepare('INSERT INTO users (id, username, email, password_hash, tenant_id) VALUES (?, ?, ?, ?, ?)').run(u.id, u.username, `${u.username}@defense.gov`, hash, sdc.id);
    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(u.id, getR(u.role));
  });

  // TACTICAL DOCUMENTS — Multiple per user at every rank
  console.log('📄 Creating Private Tactical Documents...');
  const getU = (n) => users.find(u => u.username === n).id;

  const docs = [
    // Soldier User
    { id: uuidv4(), title: 'Patrol Route Delta-7',        owner: getU('soldier_user'),    class: 'UNCLASSIFIED' },
    { id: uuidv4(), title: 'Guard Duty Roster - Week 12', owner: getU('soldier_user'),    class: 'RESTRICTED' },

    // Soldier Alpha
    { id: uuidv4(), title: "Alpha's Recon Log - Sector 4",      owner: getU('soldier_alpha'), class: 'CONFIDENTIAL' },
    { id: uuidv4(), title: "Alpha's Equipment Manifest",         owner: getU('soldier_alpha'), class: 'UNCLASSIFIED' },
    { id: uuidv4(), title: "Alpha's Field Observation Notes",    owner: getU('soldier_alpha'), class: 'RESTRICTED' },

    // Soldier Bravo
    { id: uuidv4(), title: "Bravo's Personnel Assessment",       owner: getU('soldier_bravo'), class: 'RESTRICTED' },
    { id: uuidv4(), title: "Bravo's Medical Readiness Report",   owner: getU('soldier_bravo'), class: 'CONFIDENTIAL' },

    // Officer
    { id: uuidv4(), title: 'Platoon Deployment Plan - Op Falcon',  owner: getU('officer_user'),  class: 'CONFIDENTIAL' },
    { id: uuidv4(), title: 'After Action Review - Exercise Storm', owner: getU('officer_user'),  class: 'RESTRICTED' },
    { id: uuidv4(), title: 'Unit Readiness Assessment Q3',         owner: getU('officer_user'),  class: 'CONFIDENTIAL' },

    // Colonel
    { id: uuidv4(), title: 'Regional Threat Analysis - Zone 9',    owner: getU('colonel_user'),  class: 'SECRET' },
    { id: uuidv4(), title: 'Force Structure Optimization Report',  owner: getU('colonel_user'),  class: 'CONFIDENTIAL' },

    // Brigadier
    { id: uuidv4(), title: "General's Strategic War Plan",          owner: getU('brigadier_user'), class: 'TOP SECRET' },
    { id: uuidv4(), title: 'National Defense Posture Review',      owner: getU('brigadier_user'), class: 'TOP SECRET' },
    { id: uuidv4(), title: 'Allied Command Integration Brief',     owner: getU('brigadier_user'), class: 'SECRET' },
  ];

  docs.forEach(d => {
    db.prepare(`
      INSERT INTO documents (id, title, owner_id, tenant_id, classification, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(d.id, d.title, d.owner, sdc.id, d.class, `Tactical content for ${d.title}`);
  });

  // PRE-SEEDED SHARES — Demonstrate delegated access
  console.log('🤝 Creating Delegated Access Entries...');
  // Bravo can see Alpha's Recon Log
  const alphaReconId = docs.find(d => d.title.includes("Alpha's Recon")).id;
  db.prepare('INSERT INTO document_shares (document_id, user_id, tenant_id) VALUES (?, ?, ?)').run(alphaReconId, getU('soldier_bravo'), sdc.id);
  // Officer can see Colonel's Threat Analysis
  const colonelThreatId = docs.find(d => d.title.includes("Threat Analysis")).id;
  db.prepare('INSERT INTO document_shares (document_id, user_id, tenant_id) VALUES (?, ?, ?)').run(colonelThreatId, getU('officer_user'), sdc.id);

  // The database is updated synchronously by better-sqlite3
  console.log('✅ Defense system seeded successfully.');
  
  // Wait a moment for fs buffers to clear
  setTimeout(() => {
    closeConnection();
    process.exit(0);
  }, 500);
}

seed().catch(err => { 
  console.error('❌ SEED ERROR:', err); 
  process.exit(1); 
});
