/**
 * Permission Escalation Firewall - Dashboard Frontend
 */
const API = '';
let token = null;
let currentUser = null;

// ─── API Helper ─────────────────────────────────────────
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ─── Login ──────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    token = data.token;
    currentUser = data.user;
    showDashboard();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
    errEl.classList.remove('hidden');
  }
});

// Demo account chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('login-username').value = chip.dataset.user;
    document.getElementById('login-password').value = 'password123';
  });
});

document.getElementById('logout-btn').addEventListener('click', () => {
  token = null; currentUser = null;
  document.getElementById('dashboard-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('login-username').value = '';
});

// ─── Dashboard ──────────────────────────────────────────
async function showDashboard() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('dashboard-screen').classList.add('active');
  document.getElementById('nav-username').textContent = currentUser.username;
  document.getElementById('nav-tenant').textContent = currentUser.tenant.name;
  document.getElementById('nav-avatar').textContent = currentUser.username[0].toUpperCase();
  loadOverview();
  loadPermissionOptions();
}

// ─── Tabs ───────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'audit') loadAuditLog();
    if (tab.dataset.tab === 'firewall') loadFirewallRules();
    if (tab.dataset.tab === 'graph') loadRoleGraph();
  });
});

// ─── Overview ───────────────────────────────────────────
async function loadOverview() {
  try {
    const data = await api('/api/permissions/map');
    const s = data.summary;
    document.querySelector('#stat-permissions .stat-value').textContent = s.totalPermissions;
    document.querySelector('#stat-direct .stat-value').textContent = s.directPermissions;
    document.querySelector('#stat-inherited .stat-value').textContent = s.inheritedPermissions;
    document.querySelector('#stat-risk .stat-value').textContent = s.byRiskLevel.critical + s.byRiskLevel.high;

    // Roles
    const rolesEl = document.getElementById('user-roles-list');
    rolesEl.innerHTML = data.directRoles.map(r => {
      const cls = r.toLowerCase().replace(/\s+/g, '');
      const roleClass = ['maintenance','reporting','flightops','surveillance','intelligence','command'].find(c => cls.includes(c)) || 'maintenance';
      return `<span class="role-tag ${roleClass}">${r}</span>`;
    }).join('');

    // Permission map
    const mapEl = document.getElementById('permission-map');
    const allPerms = [...(data.permissions.direct || []), ...(data.permissions.inherited || [])];
    allPerms.sort((a, b) => { const r = { critical: 0, high: 1, medium: 2, low: 3 }; return (r[a.riskLevel] || 3) - (r[b.riskLevel] || 3); });
    mapEl.innerHTML = allPerms.map(p => `
      <div class="perm-item">
        <span class="perm-name">${p.name}</span>
        <div class="perm-meta">
          <span class="perm-type ${p.accessType.toLowerCase()}">${p.accessType}</span>
          <span class="risk-dot ${p.riskLevel}" title="${p.riskLevel}"></span>
        </div>
      </div>
    `).join('') || '<div class="empty-state">No permissions found</div>';
  } catch (err) {
    console.error('Overview error:', err);
  }
}

// ─── Permission Check ───────────────────────────────────
async function loadPermissionOptions() {
  try {
    const data = await api('/api/permissions');
    const sel = document.getElementById('perm-check-select');
    sel.innerHTML = '<option value="">Choose a permission...</option>';
    data.permissions.forEach(p => {
      sel.innerHTML += `<option value="${p.name}">${p.name} (${p.risk_level})</option>`;
    });
  } catch (err) { console.error(err); }
}

document.getElementById('perm-check-btn').addEventListener('click', async () => {
  const perm = document.getElementById('perm-check-select').value || document.getElementById('perm-check-custom').value.trim();
  if (!perm) return;
  try {
    const data = await api('/api/permissions/check', { method: 'POST', body: JSON.stringify({ permission: perm }) });
    showCheckResult('check-result', data.check);
  } catch (err) { showCheckResult('check-result', err); }
});

function showCheckResult(containerId, result) {
  const el = document.getElementById(containerId);
  el.classList.remove('hidden', 'allow', 'deny');
  const isAllow = result.decision === 'ALLOW';
  el.classList.add(isAllow ? 'allow' : 'deny');

  let html = `<div class="result-header">
    <span class="result-icon">${isAllow ? '✅' : '🛡️'}</span>
    <span class="result-title ${isAllow ? 'allow' : 'deny'}">${isAllow ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</span>
  </div>`;

  html += `<div class="result-detail">${result.reason || result.message || 'No details'}</div>`;

  if (result.accessPath) {
    html += `<div class="result-path">Path: ${result.accessPath.join(' → ')}</div>`;
  }
  if (result.code) {
    html += `<div class="result-detail" style="margin-top:.5rem;font-family:var(--mono);font-size:.75rem">Code: ${result.code}</div>`;
  }
  if (result.availablePermissions) {
    html += `<div class="result-detail" style="margin-top:.5rem">Available: ${result.availablePermissions.join(', ')}</div>`;
  }
  el.innerHTML = html;
}

// ─── Quick Tests ────────────────────────────────────────
document.querySelectorAll('.test-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const endpoint = btn.dataset.endpoint;
    const method = btn.dataset.method;
    try {
      const data = await api(endpoint, { method });
      showCheckResult('test-result', { decision: 'ALLOW', reason: data.message, accessPath: data.firewallAnalysis?.accessPath });
    } catch (err) {
      showCheckResult('test-result', { decision: 'DENY', ...err });
    }
  });
});

// ─── Role Graph ─────────────────────────────────────────
async function loadRoleGraph() {
  try {
    const data = await api('/api/roles/graph');
    drawGraph(data.graph);
  } catch (err) { console.error(err); }
}

function drawGraph(graph) {
  const canvas = document.getElementById('role-graph-canvas');
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  canvas.width = container.clientWidth * 2;
  canvas.height = container.clientHeight * 2;
  ctx.scale(2, 2);
  const W = container.clientWidth, H = container.clientHeight;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, W, H);

  const nodes = graph.nodes;
  const edges = graph.edges;
  if (!nodes.length) { ctx.fillStyle = '#64748b'; ctx.font = '14px Inter'; ctx.textAlign = 'center'; ctx.fillText('No roles found', W / 2, H / 2); return; }

  // Position nodes in a hierarchy layout
  const nodeMap = {};
  const childSet = new Set(edges.map(e => e.to));
  const roots = nodes.filter(n => !childSet.has(n.id));
  const levels = {};
  const visited = new Set();

  function assignLevel(nodeId, level) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    levels[nodeId] = Math.max(levels[nodeId] || 0, level);
    edges.filter(e => e.from === nodeId).forEach(e => assignLevel(e.to, level + 1));
  }
  if (roots.length === 0 && nodes.length > 0) assignLevel(nodes[0].id, 0);
  else roots.forEach(r => assignLevel(r.id, 0));
  // Also assign unvisited
  nodes.forEach(n => { if (!visited.has(n.id)) levels[n.id] = 0; });

  const maxLevel = Math.max(...Object.values(levels), 0);
  const levelGroups = {};
  nodes.forEach(n => {
    const l = levels[n.id] || 0;
    if (!levelGroups[l]) levelGroups[l] = [];
    levelGroups[l].push(n);
  });

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];
  const padding = 60;
  nodes.forEach(n => {
    const l = levels[n.id] || 0;
    const group = levelGroups[l];
    const idx = group.indexOf(n);
    const xSpacing = (W - padding * 2) / Math.max(group.length, 1);
    nodeMap[n.id] = {
      x: padding + xSpacing * idx + xSpacing / 2,
      y: padding + (H - padding * 2) / Math.max(maxLevel, 1) * l,
      color: colors[Math.min(l, colors.length - 1)],
      node: n,
    };
  });

  // Draw edges
  edges.forEach(e => {
    const from = nodeMap[e.from], to = nodeMap[e.to];
    if (!from || !to) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    const cp1y = from.y + (to.y - from.y) * 0.5;
    ctx.bezierCurveTo(from.x, cp1y, to.x, cp1y, to.x, to.y);
    ctx.strokeStyle = 'rgba(99,102,241,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Arrow
    const angle = Math.atan2(to.y - cp1y, to.x - to.x);
    const ax = to.x, ay = to.y - 18;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 5, ay - 8);
    ctx.lineTo(ax + 5, ay - 8);
    ctx.fillStyle = 'rgba(99,102,241,0.5)';
    ctx.fill();
  });

  // Draw nodes
  Object.values(nodeMap).forEach(({ x, y, color, node }) => {
    // Glow
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fillStyle = color + '15';
    ctx.fill();
    // Circle
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = color + '25';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    // Label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 11px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, x, y);
    // Permission count
    const permCount = node.directPermissions?.length || 0;
    if (permCount > 0) {
      ctx.font = '500 9px JetBrains Mono';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${permCount} perms`, x, y + 32);
    }
  });

  // Legend
  const legendEl = document.getElementById('graph-legend');
  legendEl.innerHTML = colors.slice(0, maxLevel + 1).map((c, i) => {
    const names = (levelGroups[i] || []).map(n => n.name).join(', ');
    return `<div class="legend-item"><span class="legend-dot" style="background:${c}"></span>Level ${i}: ${names}</div>`;
  }).join('');
}

// ─── Audit Log ──────────────────────────────────────────
async function loadAuditLog(filter) {
  try {
    const query = filter && filter !== 'all' ? `?decision=${filter}` : '';
    const data = await api('/api/audit/logs' + query);
    const el = document.getElementById('audit-log-list');
    if (!data.logs.length) { el.innerHTML = '<div class="empty-state">No audit entries yet. Try some permission checks!</div>'; return; }
    el.innerHTML = data.logs.slice(0, 30).map(log => `
      <div class="audit-item">
        <span class="audit-decision ${log.decision.toLowerCase()}">${log.decision}</span>
        <div class="audit-info">
          <span>${log.username || 'system'}</span> → <span class="audit-perm">${log.requested_permission}</span>
          <br><span style="font-size:.7rem;color:var(--text-dim)">${log.method} ${log.endpoint || ''}</span>
        </div>
        <span class="audit-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadAuditLog(btn.dataset.filter);
  });
});

// ─── Firewall Rules ─────────────────────────────────────
async function loadFirewallRules() {
  try {
    const data = await api('/api/firewall/rules');
    const el = document.getElementById('firewall-rules-list');
    if (!data.rules.length) { el.innerHTML = '<div class="empty-state">No firewall rules configured</div>'; return; }
    el.innerHTML = data.rules.map(r => `
      <div class="rule-item">
        <div class="rule-header">
          <span class="rule-name">${r.name}</span>
          <span class="rule-type">${r.rule_type}</span>
        </div>
        <div class="rule-desc">${r.description || ''}</div>
        <div class="rule-config">${JSON.stringify(r.config)}</div>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}
