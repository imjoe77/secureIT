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
} from 'lucide-react';
import { auditApi, roleApi } from '../services/api';
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
      setDevices(response.data.devices);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleApi.getRoles();
      setRoles(response.data.roles);
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
    e.preventDefault();
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
    if (!window.confirm('Are you sure you want to revoke access for this device?')) return;
    try {
      await auditApi.revokeDevice(id);
      await fetchDevices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Secure Terminal Registry</h2>
          <p className="text-slate-400 font-medium">Pre-approved hardware endpoints for high-command authentication</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-defense-primary hover:bg-defense-primary-hover text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} />
          Register New Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registry Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-[32px] overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Device Name</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">IP Address</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Authorized Role</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Last Used</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-8 py-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : devices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-16 text-center text-slate-600">
                        <Smartphone size={40} className="mx-auto mb-4 opacity-10" />
                        <p>No devices registered in the secure terminal registry.</p>
                      </td>
                    </tr>
                  ) : (
                    devices.map((device) => (
                      <tr key={device.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${
                              device.is_active ? 'bg-defense-primary/10 text-defense-primary' : 'bg-slate-800 text-slate-500'
                            }`}>
                              <Smartphone size={16} />
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${device.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{device.device_name}</p>
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Registered {new Date(device.registered_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-300 font-mono text-xs font-bold">
                            <Globe size={12} className="text-slate-600" />
                            {device.ip_address}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-defense-primary/5 border border-defense-primary/10 text-defense-primary text-[10px] font-black uppercase tracking-widest">
                            {device.role_name}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium whitespace-nowrap">
                            <Clock size={12} />
                            {device.last_used_at ? new Date(device.last_used_at).toLocaleTimeString() : 'Never'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {device.is_active && (
                            <button 
                              onClick={() => handleRevoke(device.id)}
                              className="p-2 text-slate-600 hover:text-defense-red transition-colors"
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
          </div>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-[32px] border border-white/5 bg-gradient-to-br from-defense-primary/5 to-transparent">
            <div className="w-12 h-12 bg-defense-primary/10 rounded-2xl flex items-center justify-center text-defense-primary mb-6 border border-defense-primary/20">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-xl font-black text-white mb-4 tracking-tight">Zero-Trust Protocol</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">
              Strategic Command access is restricted to hardware endpoints registered in this registry. 
              Any login attempt from an unregistered IP for a restricted role will be automatically 
              intercepted and logged as a security violation.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <CheckCircle2 size={16} className="text-defense-green mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-tight">Hardware Binding</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <CheckCircle2 size={16} className="text-defense-green mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-tight">IP Whitelisting</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <CheckCircle2 size={16} className="text-defense-green mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-tight">Instant Revocation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsAdding(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass p-10 rounded-[40px] border border-white/5 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Register Terminal</h3>
              <p className="text-slate-400 font-medium mb-8">Grant supreme command access to a specific hardware node</p>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Terminal Designation</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Command Node ALPHA"
                    value={newDevice.deviceName}
                    onChange={e => setNewDevice({...newDevice, deviceName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary transition-colors font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">IP Address (Static)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 192.168.1.100"
                    value={newDevice.ipAddress}
                    onChange={e => setNewDevice({...newDevice, ipAddress: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary transition-colors font-bold font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Authorized Clearance</label>
                  <select 
                    value={newDevice.roleName}
                    onChange={e => setNewDevice({...newDevice, roleName: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-defense-primary transition-colors font-bold text-sm"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name} (Level {r.level})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={status === 'saving'}
                    className="flex-1 bg-defense-primary hover:bg-defense-primary-hover text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {status === 'saving' ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : status === 'success' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <>
                        <Shield size={18} />
                        Authorize Terminal
                      </>
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
