import axios from 'axios';
import { generateDeviceFingerprint, computeChallengeResponse } from './fingerprint';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Cache the fingerprint so we don't regenerate on every request
let cachedFingerprint = null;

async function getFingerprint() {
  if (!cachedFingerprint) {
    cachedFingerprint = await generateDeviceFingerprint();
  }
  return cachedFingerprint;
}

// Attach JWT token AND live device fingerprint to every request
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('secureit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach live device fingerprint for Zero-Trust verification
  const fingerprint = await getFingerprint();
  config.headers['X-Device-Fingerprint'] = fingerprint;

  return config;
});

export const authApi = {
  /**
   * Login with fingerprint challenge-response protocol.
   * 1. Request a nonce from the server
   * 2. Compute SHA256(fingerprint + nonce) 
   * 3. Send fingerprint, nonce, and response to /login
   * This defeats replay attacks — stolen fingerprint hashes cannot be reused.
   */
  login: async (username, password) => {
    const fingerprint = await getFingerprint();

    // Step 1: Request a challenge nonce from the server
    let challengeNonce = null;
    let fingerprintResponse = null;

    try {
      const challengeRes = await api.get('/auth/challenge');
      challengeNonce = challengeRes.data.nonce;

      // Step 2: Compute the challenge response: SHA256(fp + nonce)
      fingerprintResponse = await computeChallengeResponse(fingerprint, challengeNonce);
    } catch (err) {
      console.warn('Challenge endpoint unavailable, falling back to direct fingerprint:', err.message);
    }

    // Step 3: Send everything to /login
    return api.post('/auth/login', {
      username,
      password,
      deviceFingerprint: fingerprint,
      challengeNonce,
      fingerprintResponse,
    });
  },
  getProfile: () => api.get('/auth/me'),
  getMyIp: () => api.get('/my-ip'),
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
  getStats: () => api.get('/audit/stats'),
  getThreats: () => api.get('/audit/threats'),
};

export const engineApi = {
  getStats: () => api.get('/engine/stats'),
};

export default api;
