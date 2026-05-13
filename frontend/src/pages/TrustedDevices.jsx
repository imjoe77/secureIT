import { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Smartphone, 
  Globe, 
  Clock, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { auditApi, roleApi, authApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const TrustedDevices = () => {
  const [devices, setDevices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDevice, setNewDevice] = useState({ deviceName: '', ipAddress: '', roleName: 'Brigadier' });
  const [status, setStatus] = useState('idle');

  const fetchDevices = async () => {
    try {
      const response = await auditApi.getTrustedDevices();
      setDevices(response.data.devices || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleApi.getRoles();
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDevices(), fetchRoles()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setStatus('saving');
    try {
      await auditApi.registerDevice(newDevice);
      setStatus('success');
      setNewDevice({ deviceName: '', ipAddress: '', roleName: 'Brigadier' });
      await fetchDevices();
      setTimeout(() => {
        setIsAdding(false);
        setStatus('idle');
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleRevoke = async (id) => {
    try {
      await auditApi.revokeDevice(id);
      await fetchDevices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthorizeSelf = async () => {
    try {
      const ipRes = await authApi.getMyIp();
      const deviceName = `Current Terminal (${new Date().toLocaleTimeString()})`;
      await auditApi.registerDevice({ 
        deviceName, 
        ipAddress: ipRes.data.ip, 
        roleName: 'Brigadier' 
      });
      await fetchDevices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      <div className="p-6 border-b border-border bg-bg-surface shrink-0 flex justify-between items-end">
        <div>
          <h2 className="section-label">SECURE TERMINAL REGISTRY</h2>
          <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">Hardware endpoints authorized for high-command authentication</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAuthorizeSelf}
            className="btn-outline h-9 px-4 text-[10px] font-bold uppercase rounded-none"
          >
            AUTHORIZE THIS NODE
          </button>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-accent h-9 px-4 text-[10px] font-bold uppercase rounded-none"
          >
            REGISTER NEW TERMINAL
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-bg-surface z-10">
              <tr className="border-b border-border">
                <th className="px-6 py-3 section-label font-medium">DESIGNATION</th>
                <th className="px-6 py-3 section-label font-medium">IP ADDRESS</th>
                <th className="px-6 py-3 section-label font-medium text-center">CLEARANCE</th>
                <th className="px-6 py-3 section-label font-medium">LAST USED</th>
                <th className="px-6 py-3 section-label font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px] divide-y divide-border-subtle">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse h-12">
                    <td colSpan="5" className="px-6"><div className="h-2 bg-bg-elevated w-full" /></td>
                  </tr>
                ))
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted">
                    <Smartphone size={32} className="mx-auto mb-4 opacity-10" />
                    <p className="uppercase tracking-[0.2em]">NO REGISTERED TERMINALS FOUND</p>
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className={`hover:bg-bg-elevated transition-colors h-12 ${!device.is_active ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center border border-border ${device.is_active ? 'bg-accent/10 text-accent' : 'bg-bg-elevated text-muted'}`}>
                          <Smartphone size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-primary font-bold">{device.device_name}</span>
                          <span className="text-[9px] text-muted uppercase">REG: {new Date(device.registered_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2 text-secondary">
                        <Globe size={12} className="text-muted" />
                        {device.ip_address}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className="inline-block px-3 py-1 bg-bg-elevated border border-border text-accent text-[9px] font-bold uppercase">
                        {device.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2 text-muted">
                        <Clock size={12} />
                        {device.last_used_at ? new Date(device.last_used_at).toLocaleTimeString('en-GB', { hour12: false }) : 'NEVER'}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-right">
                      {device.is_active && (
                        <button 
                          onClick={() => handleRevoke(device.id)}
                          className="p-2 text-muted hover:text-red-secure transition-colors"
                          title="Revoke Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 h-12 border-t border-border bg-bg-surface flex items-center gap-6 shrink-0 overflow-x-auto">
           <div className="flex items-center gap-2">
              <Shield size={12} className="text-accent" />
              <span className="text-[9px] text-secondary uppercase font-bold">Zero-Trust Enabled</span>
           </div>
           <div className="flex items-center gap-2">
              <Activity size={12} className="text-green-secure" />
              <span className="text-[9px] text-secondary uppercase font-bold">Node Monitoring Active</span>
           </div>
           <div className="ml-auto text-[10px] text-muted font-mono uppercase">
              HARDWARE_BINDING_v2.4 · IP_GEOLOCK: INACTIVE
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-base/90 backdrop-blur-sm"
              onClick={() => setIsAdding(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-bg-surface border border-border shadow-2xl p-8"
            >
              <h3 className="text-lg font-bold text-primary uppercase tracking-tight mb-1">Register Terminal</h3>
              <p className="text-[11px] text-muted uppercase tracking-widest mb-8">Grant operational clearance to hardware node</p>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block ml-1">TERMINAL DESIGNATION</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CMD_NODE_ALPHA"
                    value={newDevice.deviceName}
                    onChange={e => setNewDevice({...newDevice, deviceName: e.target.value})}
                    className="w-full input-flat rounded-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block ml-1">IP ADDRESS (STATIC)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 192.168.1.100"
                    value={newDevice.ipAddress}
                    onChange={e => setNewDevice({...newDevice, ipAddress: e.target.value})}
                    className="w-full input-flat rounded-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block ml-1">AUTHORIZED CLEARANCE</label>
                  <select 
                    value={newDevice.roleName}
                    onChange={e => setNewDevice({...newDevice, roleName: e.target.value})}
                    className="w-full input-flat rounded-none appearance-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name.toUpperCase()} (LVL {r.level})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 h-10 text-[10px] uppercase font-bold text-muted hover:text-primary transition-colors border border-transparent"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={status === 'saving'}
                    className="flex-1 bg-accent hover:bg-accent/90 text-white h-10 text-[10px] uppercase font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 rounded-none"
                  >
                    {status === 'saving' ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : status === 'success' ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      'AUTHORIZE TERMINAL'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrustedDevices;
