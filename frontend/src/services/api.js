import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('secureit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/me'),
};

export const permissionApi = {
  getPermissions: () => api.get('/permissions'),
  checkAccess: (permission, resourceTenantId) => 
    api.post('/permissions/check', { permission, resourceTenantId }),
  getMap: () => api.get('/permissions/map'),
  simulateGrant: (userId, roleId) => api.post('/permissions/simulate-grant', { userId, roleId }),
};

export const roleApi = {
  getGraph: () => api.get('/roles/graph'),
  getRoles: () => api.get('/roles'), 
};

export const auditApi = {
  getLogs: (filter) => api.get(`/audit/logs${filter ? `?decision=${filter}` : ''}`),
  clearLogs: () => api.delete('/audit/logs'),
  getFirewallRules: () => api.get('/firewall/rules'),
  getUsers: () => api.get('/audit/users'),
  recordAuditLog: (data) => api.post('/audit/record', data),
  getTrustedDevices: () => api.get('/audit/trusted-devices'),
  registerDevice: (data) => api.post('/audit/trusted-devices', data),
  revokeDevice: (id) => api.delete(`/audit/trusted-devices/${id}`),
};

export default api;
