import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Search, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  Database
} from 'lucide-react';
import { permissionApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const RequestAccess = () => {
  const [targetTenantId, setTargetTenantId] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [selectedPerm, setSelectedPerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await permissionApi.getPermissions();
        setPermissions(response.data.permissions);
      } catch (err) {
        console.error(err);
      }
    };
    loadPermissions();
  }, []);

  const handleRequest = async () => {
    if (!selectedPerm) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await permissionApi.checkAccess(selectedPerm, targetTenantId || null);
      setResult(response.data.check);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.check) {
        setResult(err.response.data.check);
      } else {
        setResult({ decision: 'DENY', message: 'Unknown tactical failure.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white tracking-tight">Tactical Request Terminal</h2>
        <p className="text-slate-400 font-medium mt-2">Evaluate operational clearance through the Permission Escalation Firewall</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Terminal className="text-defense-primary" size={20} />
              Parameters
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Permission</label>
                <div className="relative">
                  <select 
                    value={selectedPerm}
                    onChange={(e) => setSelectedPerm(e.target.value)}
                    className="w-full bg-defense-900 border border-white/10 text-white p-4 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-defense-primary/50 transition-all cursor-pointer font-bold"
                  >
                    <option value="">Select Resource...</option>
                    {permissions.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <Search className="absolute right-4 top-4 text-slate-500 pointer-events-none" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Tenant ID (Optional)</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={targetTenantId}
                    onChange={(e) => setTargetTenantId(e.target.value)}
                    placeholder="Auto-detect (Current Tenant)"
                    className="w-full bg-defense-900 border border-white/10 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-defense-primary/50 transition-all font-mono text-xs"
                  />
                  <Database className="absolute right-4 top-4 text-slate-500 pointer-events-none" size={20} />
                </div>
                <p className="text-[10px] text-slate-600 mt-2 italic">Leave blank to use your assigned command unit.</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={14} className="text-defense-primary" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Guard</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real-time BFS/DFS analysis will be performed on your role inheritance chain.
                </p>
              </div>

              <button
                onClick={handleRequest}
                disabled={!selectedPerm || loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <>
                    Run Analysis
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 min-h-[400px]">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl h-full border-dashed border-white/5 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert className="text-slate-700" size={40} />
                </div>
                <h4 className="text-slate-500 font-bold">Terminal Awaiting Input</h4>
                <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto">
                  Select a tactical resource and initiate the firewall analysis to determine operational clearance.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl h-full flex flex-col items-center justify-center p-12"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-defense-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-defense-primary border-t-transparent rounded-full animate-spin" />
                  <Terminal className="absolute inset-0 m-auto text-defense-primary" size={32} />
                </div>
                <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2 animate-pulse">Analyzing Escalation Paths</h4>
                <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-1/2 h-full bg-defense-primary shadow-lg shadow-defense-primary/50"
                  />
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass rounded-3xl h-full p-10 border-t-4 ${
                  result.decision === 'ALLOW' ? 'border-defense-green' : 'border-defense-red'
                }`}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    result.decision === 'ALLOW' ? 'bg-defense-green/10 text-defense-green' : 'bg-defense-red/10 text-defense-red'
                  }`}>
                    {result.decision === 'ALLOW' ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
                  </div>
                  <div>
                    <h4 className={`text-2xl font-black ${
                      result.decision === 'ALLOW' ? 'text-defense-green' : 'text-defense-red'
                    }`}>
                      {result.decision === 'ALLOW' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                    </h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedPerm}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-defense-900/50 border border-white/5 rounded-2xl">
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "{result.message || result.reason}"
                    </p>
                  </div>

                  {result.accessPath && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ArrowRight size={14} className="text-defense-primary" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escalation Path Detection</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {result.accessPath.map((node, i) => (
                          <React.Fragment key={i}>
                            <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-xs font-bold text-white">
                              {node}
                            </div>
                            {i < result.accessPath.length - 1 && (
                              <ArrowRight size={16} className="text-slate-700" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.decision === 'DENY' && result.code === 'INDIRECT_ESCALATION_BLOCKED' && (
                    <div className="p-4 bg-defense-red/10 border border-defense-red/20 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="text-defense-red mt-0.5" size={18} />
                      <div>
                        <p className="text-defense-red text-xs font-bold uppercase mb-1">Firewall Rule Triggered</p>
                        <p className="text-defense-red/70 text-xs leading-relaxed">
                          The system detected an unauthorized indirect access chain. Strategic depth limits prevent this role from reaching the requested intelligence asset.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RequestAccess;
