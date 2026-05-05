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
  console.log('🛡️  Seeding Air Force Operational Environment data...\n');
  const db = await initDatabase();
  db.exec(SCHEMA_SQL);

  // Clear existing data
  db.exec(`
    DELETE FROM audit_log; DELETE FROM firewall_rules; DELETE FROM role_hierarchy;
    DELETE FROM role_permissions; DELETE FROM user_roles; DELETE FROM permissions;
    DELETE FROM roles; DELETE FROM users; DELETE FROM tenants;
  `);

  // TENANTS (Air Force Branches)
  const tenants = [
    { id: uuidv4(), name: 'US Air Force' },
    { id: uuidv4(), name: 'Global Defense Force' },
  ];
  tenants.forEach(t => db.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)').run(t.id, t.name));
  console.log('✅ Operational Branches:', tenants.map(t => t.name).join(', '));

  // PERMISSIONS (Access Types)
  const permissions = [
    { id: uuidv4(), name: 'read:maintenance-logs', resource: 'maintenance', action: 'read',   risk: 'low' },
    { id: uuidv4(), name: 'read:flight-schedules', resource: 'flight-ops',  action: 'read',   risk: 'medium' },
    { id: uuidv4(), name: 'monitor:surveillance',  resource: 'surveillance',action: 'monitor',risk: 'high' },
    { id: uuidv4(), name: 'read:intel-reports',    resource: 'intelligence',action: 'read',   risk: 'critical' },
    { id: uuidv4(), name: 'create:ops-reports',    resource: 'reporting',   action: 'create', risk: 'medium' },
    { id: uuidv4(), name: 'admin:command',         resource: 'command',     action: 'admin',  risk: 'critical' },
  ];
  permissions.forEach(p => db.prepare('INSERT INTO permissions (id, name, description, resource, action, risk_level) VALUES (?, ?, ?, ?, ?, ?)').run(p.id, p.name, `${p.action} access to ${p.resource}`, p.resource, p.action, p.risk));
  console.log(`✅ ${permissions.length} military permissions defined`);

  const permByName = (name) => permissions.find(p => p.name === name);
  const usaf = tenants[0], gdf = tenants[1];

  // ROLES
  const roles = [
    { id: uuidv4(), name: 'Maintenance Role',   tenant_id: usaf.id, desc: 'Aircraft maintenance and repair', sys: 0 },
    { id: uuidv4(), name: 'Reporting Role',     tenant_id: usaf.id, desc: 'Operational status reporting',    sys: 0 },
    { id: uuidv4(), name: 'Flight Ops Role',    tenant_id: usaf.id, desc: 'Flight planning and execution',   sys: 0 },
    { id: uuidv4(), name: 'Surveillance Role',  tenant_id: usaf.id, desc: 'Strategic monitoring',            sys: 0 },
    { id: uuidv4(), name: 'Intelligence Role',  tenant_id: usaf.id, desc: 'Classified intel access',         sys: 0 },
    { id: uuidv4(), name: 'Command Role',       tenant_id: usaf.id, desc: 'Strategic command authority',      sys: 1 },
    
    { id: uuidv4(), name: 'Basic Operator',     tenant_id: gdf.id, desc: 'GDF basic duties',               sys: 0 },
    { id: uuidv4(), name: 'Command Center',     tenant_id: gdf.id, desc: 'GDF full access',                sys: 1 },
  ];
  roles.forEach(r => db.prepare('INSERT INTO roles (id, name, description, tenant_id, is_system_role) VALUES (?, ?, ?, ?, ?)').run(r.id, r.name, r.desc, r.tenant_id, r.sys));
  console.log(`✅ ${roles.length} functional roles established`);

  const roleByNameTenant = (name, tid) => roles.find(r => r.name === name && r.tenant_id === tid);

  // ROLE HIERARCHY (AS REQUESTED)
  // Maintenance Role → Reporting Role → Intelligence Role
  // Flight Operations Role → Surveillance Role → Intelligence Role
  const hierarchies = [
    { parent: roleByNameTenant('Maintenance Role', usaf.id),   child: roleByNameTenant('Reporting Role', usaf.id) },
    { parent: roleByNameTenant('Reporting Role', usaf.id),     child: roleByNameTenant('Intelligence Role', usaf.id) },
    
    { parent: roleByNameTenant('Flight Ops Role', usaf.id),    child: roleByNameTenant('Surveillance Role', usaf.id) },
    { parent: roleByNameTenant('Surveillance Role', usaf.id),  child: roleByNameTenant('Intelligence Role', usaf.id) },
    
    { parent: roleByNameTenant('Command Role', usaf.id),       child: roleByNameTenant('Intelligence Role', usaf.id) },
  ];
  hierarchies.forEach(h => db.prepare('INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (?, ?)').run(h.parent.id, h.child.id));
  console.log(`✅ ${hierarchies.length} hierarchy links (Chain: Maintenance -> Reporting -> Intelligence)`);

  // ROLE PERMISSIONS
  const rp = [
    { role: roleByNameTenant('Maintenance Role', usaf.id),  perm: permByName('read:maintenance-logs') },
    { role: roleByNameTenant('Reporting Role', usaf.id),    perm: permByName('create:ops-reports') },
    { role: roleByNameTenant('Flight Ops Role', usaf.id),   perm: permByName('read:flight-schedules') },
    { role: roleByNameTenant('Surveillance Role', usaf.id), perm: permByName('monitor:surveillance') },
    { role: roleByNameTenant('Intelligence Role', usaf.id), perm: permByName('read:intel-reports') },
    { role: roleByNameTenant('Command Role', usaf.id),      perm: permByName('admin:command') },
    
    { role: roleByNameTenant('Basic Operator', gdf.id),     perm: permByName('read:maintenance-logs') },
  ];
  rp.forEach(x => db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(x.role.id, x.perm.id));
  console.log(`✅ ${rp.length} role-permission assignments`);

  // USERS (Air Force Personnel)
  const hash = bcrypt.hashSync('password123', 10);
  const users = [
    { id: uuidv4(), username: 'airman_smith',   email: 'smith@af.mil',   tenant_id: usaf.id },
    { id: uuidv4(), username: 'pilot_jones',    email: 'jones@af.mil',   tenant_id: usaf.id },
    { id: uuidv4(), username: 'analyst_miller', email: 'miller@af.mil',  tenant_id: usaf.id },
    { id: uuidv4(), username: 'colonel_vance',  email: 'vance@af.mil',   tenant_id: usaf.id },
    { id: uuidv4(), username: 'gdf_operator',   email: 'op@gdf.int',     tenant_id: gdf.id },
  ];
  users.forEach(u => db.prepare('INSERT INTO users (id, username, email, password_hash, tenant_id) VALUES (?, ?, ?, ?, ?)').run(u.id, u.username, u.email, hash, u.tenant_id));
  console.log(`✅ ${users.length} personnel registered (password: password123)`);

  const userByName = (name) => users.find(u => u.username === name);

  // PERSONNEL ROLE ASSIGNMENTS
  const ur = [
    { user: userByName('airman_smith'),   role: roleByNameTenant('Maintenance Role', usaf.id) },
    { user: userByName('pilot_jones'),    role: roleByNameTenant('Flight Ops Role', usaf.id) },
    { user: userByName('analyst_miller'), role: roleByNameTenant('Intelligence Role', usaf.id) },
    { user: userByName('colonel_vance'),  role: roleByNameTenant('Command Role', usaf.id) },
    { user: userByName('gdf_operator'),   role: roleByNameTenant('Basic Operator', gdf.id) },
  ];
  ur.forEach(x => db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(x.user.id, x.role.id));
  console.log(`✅ ${ur.length} personnel assignments`);

  // FIREWALL RULES (Security Policy)
  // Block indirect critical escalation: Intelligence reports should not be accessible via chain longer than 1
  const rules = [
    { 
      id: uuidv4(), 
      name: 'Block Intel Escalation', 
      desc: 'Prevent Maintenance or Flight personnel from indirectly reaching Intelligence reports via long chains', 
      type: 'block_indirect', 
      config: JSON.stringify({ max_depth: 1, risk_levels: ['critical'] }) 
    },
    { 
      id: uuidv4(), 
      name: 'Strict Branch Isolation', 
      desc: 'Prevent cross-branch (tenant) information leakage', 
      type: 'block_cross_tenant', 
      config: JSON.stringify({ strict: true }) 
    },
    { 
      id: uuidv4(), 
      name: 'Protocol Depth Limit', 
      desc: 'Maximum 4 hops in command chain', 
      type: 'max_depth', 
      config: JSON.stringify({ max_depth: 4 }) 
    },
  ];
  rules.forEach(r => db.prepare('INSERT INTO firewall_rules (id, name, description, rule_type, config, tenant_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)').run(r.id, r.name, r.desc, r.type, r.config, null, 1));
  console.log(`✅ ${rules.length} firewall security protocols active`);

  db.save();

  console.log('\n══════════════════════════════════════════════');
  console.log('🛡️  AIR FORCE DATA SEEDED');
  console.log('══════════════════════════════════════════════');
  console.log('📋 Personnel (password: password123):');
  console.log('  USAF: airman_smith, pilot_jones, analyst_miller, colonel_vance');
  console.log('  GDF:  gdf_operator');
  console.log('\n⛓️  Chain 1: Maintenance → Reporting → Intelligence');
  console.log('⛓️  Chain 2: Flight Ops → Surveillance → Intelligence');
  console.log('══════════════════════════════════════════════\n');

  closeConnection();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
