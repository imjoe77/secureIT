import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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
};

export const roleApi = {
  getGraph: () => api.get('/roles/graph'),
};

export const auditApi = {
  getLogs: (filter) => api.get(`/audit/logs${filter ? `?decision=${filter}` : ''}`),
  getFirewallRules: () => api.get('/firewall/rules'),
};

export default api;
