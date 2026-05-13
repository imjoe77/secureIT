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
  Database,
  Info,
  AlertTriangle
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
        setPermissions(response.data.permissions || []);
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
      if (err.response?.data?.check) {
        setResult(err.response.data.check);
      } else {
        setResult({ decision: 'DENY', message: 'The system encountered an unexpected error validating your clearance path.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      <div className="p-6 border-b border-border bg-bg-surface shrink-0 flex justify-between items-end">
         <div>
            <h2 className="section-label">TACTICAL REQUEST TERMINAL</h2>
            <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">Evaluate operational clearance through the Permission Escalation Firewall</p>
         </div>
         <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase">
            <Info size={14} />
            Auto-Audit Active
         </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[340px] border-r border-border p-6 space-y-6 overflow-y-auto bg-bg-surface/30">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-secondary tracking-widest ml-1">TARGET RESOURCE</label>
            <div className="relative">
              <select 
                value={selectedPerm}
                onChange={(e) => setSelectedPerm(e.target.value)}
                className="w-full input-flat cursor-pointer appearance-none pr-10 rounded-none"
              >
                <option value="">CHOOSE PERMISSION...</option>
                {permissions.map((p) => (
                  <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-[10px]">▼</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-secondary tracking-widest ml-1">ORGANIZATION ID (OPTIONAL)</label>
            <input 
              type="text"
              value={targetTenantId}
              onChange={(e) => setTargetTenantId(e.target.value)}
              placeholder="CURRENT TENANT"
              className="w-full input-flat rounded-none"
            />
          </div>

          <div className="p-4 bg-bg-elevated border border-border">
             <span className="text-[9px] text-muted uppercase font-bold block mb-2">Automated Check</span>
             <p className="text-[11px] text-secondary leading-relaxed font-medium">
               The system will trace your role hierarchy nodes to verify if the requested asset is within your tactical reach.
             </p>
          </div>

          <button
            onClick={handleRequest}
            disabled={!selectedPerm || loading}
            className="w-full btn-accent uppercase tracking-widest text-[11px] font-bold h-11 rounded-none disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? 'COMPUTING CLEARANCE...' : 'START ANALYSIS ⟶'}
          </button>
        </div>

        <div className="flex-1 bg-bg-base dot-grid relative overflow-hidden flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Terminal className="text-muted mx-auto mb-4 opacity-10" size={64} />
                <span className="text-[10px] font-mono text-muted uppercase tracking-[0.3em] font-bold">Terminal Awaiting Pulse</span>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="w-10 h-10 border-2 border-accent border-t-transparent animate-spin mx-auto mb-6" />
                <span className="text-[10px] font-mono text-accent uppercase tracking-[0.2em] animate-pulse font-bold">Traversing Permission Graph...</span>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-2xl border p-10 shadow-2xl ${result.decision === 'ALLOW' ? 'bg-bg-surface border-green-secure/30 shadow-green-secure/5' : 'threat-bg'}`}
              >
                <div className="flex items-center gap-8 mb-10">
                  <div className={`w-16 h-16 flex items-center justify-center border ${result.decision === 'ALLOW' ? 'bg-green-secure/10 text-green-secure border-green-secure/20' : 'bg-red-secure/20 text-red-secure border-red-secure/30 animate-pulse'}`}>
                    {result.decision === 'ALLOW' ? <CheckCircle2 size={40} /> : <ShieldAlert size={40} />}
                  </div>
                  <div>
                    <h4 className={`text-2xl font-bold uppercase tracking-tight ${result.decision === 'ALLOW' ? 'text-green-secure' : 'text-red-secure'}`}>
                      {result.decision === 'ALLOW' ? 'ACCESS AUTHORIZED' : 'ACCESS DENIED'}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[11px] font-mono text-secondary uppercase">RESOURCE:</span>
                       <span className="text-[11px] font-mono font-bold text-primary uppercase bg-bg-elevated px-2 py-0.5 border border-border">{selectedPerm}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className={`p-6 border ${result.decision === 'ALLOW' ? 'bg-bg-elevated border-border' : 'bg-red-secure/5 border-red-secure/20'}`}>
                    <p className={`text-[14px] font-mono leading-relaxed italic ${result.decision === 'ALLOW' ? 'text-primary' : 'text-red-secure font-bold'}`}>
                      "{result.message || result.reason}"
                    </p>
                  </div>

                  {result.accessPath && result.accessPath.length > 0 && (
                    <div className="space-y-4">
                      <span className="section-label-sm">TACTICAL ESCALATION PATH</span>
                      <div className="flex flex-wrap items-center gap-3">
                        {result.accessPath.map((node, i) => (
                          <React.Fragment key={i}>
                            <div className={`px-4 py-2 border text-[11px] font-mono font-bold uppercase ${result.decision === 'ALLOW' ? 'bg-bg-elevated border-border text-primary' : 'bg-red-secure/10 border-red-secure/30 text-red-secure'}`}>
                              {node}
                            </div>
                            {i < result.accessPath.length - 1 && (
                              <ArrowRight size={16} className={result.decision === 'ALLOW' ? 'text-muted' : 'text-red-secure opacity-50'} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                     <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Verification ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                     {result.decision === 'DENY' && (
                        <div className="flex items-center gap-2 text-red-secure font-bold text-[10px] uppercase">
                           <AlertTriangle size={14} />
                           Firewall Intercepted
                        </div>
                     )}
                  </div>
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
