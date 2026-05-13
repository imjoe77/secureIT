import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  WifiOff,
  Fingerprint,
  ChevronRight,
  FileText,
  ShieldAlert,
  Info,
  XCircle
} from 'lucide-react';
import api, { permissionApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await permissionApi.getMap();
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Tactical data fetch failed');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-bg-base min-h-[400px]">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-secondary animate-pulse">Initializing Board...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center threat-bg m-6">
      <AlertTriangle className="text-red-secure mx-auto mb-4" size={32} />
      <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-widest">Tactical Link Failure</h3>
      <p className="text-secondary text-[11px] mb-6 font-mono">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-outline border-red-secure text-red-secure mx-auto h-9 px-6 text-[10px] font-bold">RETRY HANDSHAKE</button>
    </div>
  );

  const summary = data?.summary || {};
  const perms = [
    ...(data?.permissions?.direct || []).map(p => ({ ...p, source: 'DIRECT', depth: '0' })),
    ...(data?.permissions?.inherited || []).map(p => ({ ...p, source: 'INHERITED', depth: '1' }))
  ];

  const testAction = async (action) => {
    setActionLoading(true);
    setActionResult(null);
    try {
      let response;
      switch(action) {
        case 'VIEW': response = await api.get('/resource/reports'); break;
        case 'UPDATE': response = await api.put('/resource/reports'); break;
        case 'DELETE': response = await api.delete('/resource/reports'); break;
        default: response = { data: { status: 'DENIED', reason: 'Unknown Action' } };
      }
      setActionResult(response.data);
    } catch (err) {
      setActionResult(err.response?.data || { status: 'DENIED', reason: 'Access Restriction' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-base selection:bg-accent selection:text-white">
      {/* Metric Strip */}
      <div className="flex border-b border-border h-14 bg-bg-surface shrink-0">
        {[
          { label: 'TOTAL ACCESS', value: summary.totalPermissions || 0 },
          { label: 'DIRECT RIGHTS', value: summary.directPermissions || 0 },
          { label: 'INHERITED', value: summary.inheritedPermissions || 0 },
          { label: 'CRITICAL AREAS', value: summary.byRiskLevel?.critical || 0 },
          { label: 'LAST VERIFIED', value: 'NOW' }
        ].map((stat, i) => (
          <div key={i} className="flex-1 px-5 flex flex-col justify-center border-l border-border first:border-l-0">
            <div className="text-[20px] font-mono font-bold text-primary leading-none">{stat.value}</div>
            <div className="text-[9px] text-muted uppercase tracking-widest mt-1.5 font-bold leading-none">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
        {/* Left Column: Permission Table */}
        <div className="w-[62%] border-r border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-bg-surface/50 flex justify-between items-center">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">Active Permissions Matrix</h3>
            <span className="text-[9px] text-muted font-bold uppercase">Showing {perms.length} entries</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold text-muted uppercase tracking-widest">PERMISSION</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-muted uppercase tracking-widest">SOURCE</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-muted uppercase tracking-widest text-right">RISK LEVEL</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {perms.map((perm, i) => (
                  <tr key={i} className="border-b border-border-subtle hover:bg-bg-elevated transition-colors h-11">
                    <td className="px-5 text-primary font-bold uppercase tracking-tight">{perm.name}</td>
                    <td className="px-5 text-secondary">{perm.source} · LVL {perm.depth}</td>
                    <td className="px-5 text-right">
                      <div className="inline-flex items-center gap-2.5">
                        <div className={`status-dot ${perm.riskLevel === 'critical' || perm.riskLevel === 'high' ? 'red' : perm.riskLevel === 'medium' ? 'amber' : 'green'}`} />
                        <span className={`font-bold ${perm.riskLevel === 'critical' || perm.riskLevel === 'high' ? 'text-red-secure' : perm.riskLevel === 'medium' ? 'text-amber-secure' : 'text-green-secure'}`}>
                          {perm.riskLevel?.toUpperCase()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Panels */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-bg-base">
          {/* Action Result (Dynamic Highlight) */}
          <AnimatePresence>
             {actionResult && (
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className={`p-6 border-b border-border ${actionResult.status === 'DENIED' ? 'threat-bg' : 'bg-green-secure/10 border-green-secure/20'}`}
                >
                   <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center shrink-0 border ${actionResult.status === 'DENIED' ? 'border-red-secure/30 bg-red-secure/20 text-red-secure' : 'border-green-secure/30 bg-green-secure/20 text-green-secure'}`}>
                         {actionResult.status === 'DENIED' ? <ShieldAlert size={20} className="animate-pulse" /> : <CheckCircle2 size={20} />}
                      </div>
                      <div>
                         <h4 className={`text-sm font-bold uppercase tracking-widest mb-1 ${actionResult.status === 'DENIED' ? 'text-red-secure' : 'text-green-secure'}`}>
                            {actionResult.status === 'DENIED' ? 'ACCESS VIOLATION' : 'AUTHORIZATION GRANTED'}
                         </h4>
                         <p className="text-[12px] font-mono italic opacity-80 leading-relaxed">
                            "{actionResult.reason || 'Operation executed successfully.'}"
                         </p>
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

          {/* Session Integrity */}
          <div className="p-6 border-b border-border bg-bg-surface">
            <h3 className="section-label mb-5">SESSION INTEGRITY</h3>
            <div className="space-y-4 font-mono text-[11px]">
              <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                <div className="flex items-center gap-2">
                   <Fingerprint size={12} className="text-muted" />
                   <span className="text-secondary uppercase">Fingerprint</span>
                </div>
                <span className="text-primary font-bold">8f7a...c2d1</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                <div className="flex items-center gap-2">
                   <Lock size={12} className="text-muted" />
                   <span className="text-secondary uppercase">Token Type</span>
                </div>
                <span className="text-primary font-bold">ED25519_AUTH</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={12} className="text-green-secure" />
                   <span className="text-secondary uppercase">Binding Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="status-dot green pulse-dot" />
                  <span className="text-green-secure font-bold uppercase tracking-wider">SECURE_ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Info / Context */}
          <div className="p-6 bg-bg-surface/30">
             <div className="flex items-center gap-3 mb-4">
                <Info size={14} className="text-accent" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Operator Context</span>
             </div>
             <p className="text-[11px] text-secondary leading-relaxed mb-6 font-medium">
                Your current role inheritance level is <span className="text-primary font-bold uppercase">LVL {data?.role_level || 0}</span>. 
                Tactical reports require multi-tenant authorization from STRAT_DEF_CMD.
             </p>
             <Link to="/request" className="btn-outline h-9 flex items-center justify-center gap-2 text-[10px] uppercase font-bold rounded-none">
                ELEVATE CLEARANCE ⟶
             </Link>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="h-14 border-t border-border bg-bg-surface flex items-center px-6 gap-4 shrink-0">
        <span className="text-[9px] font-bold text-muted uppercase mr-2 tracking-widest">TACTICAL ACTIONS</span>
        <button 
          onClick={() => testAction('VIEW')}
          className="btn-outline h-9 px-4 text-[10px] uppercase font-bold rounded-none"
        >
          GENERATE INTEL REPORT
        </button>
        <button 
          onClick={() => testAction('UPDATE')}
          className="btn-outline h-9 px-4 text-[10px] uppercase font-bold rounded-none"
        >
          UPDATE SATELLITE BINDING
        </button>
        <button 
          onClick={() => testAction('DELETE')}
          className="btn-outline h-9 px-4 text-[10px] uppercase font-bold border-red-secure text-red-secure hover:bg-red-dim rounded-none"
        >
          TERMINATE ALL SESSIONS
        </button>
        
        {actionLoading && (
           <div className="ml-auto flex items-center gap-2">
              <div className="w-4 h-4 border border-accent border-t-transparent animate-spin rounded-full" />
              <span className="text-[9px] font-mono text-accent uppercase animate-pulse">Requesting Clearance...</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
