import { useState, useEffect } from 'react';
import { permissionApi, auditApi, roleApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, Users, Zap, ShieldAlert, 
  ChevronRight, ExternalLink, TrendingUp, Ban, Loader2, RefreshCw
} from 'lucide-react';

import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass p-6 rounded-3xl border-slate-800/50">
    <div className="flex items-center gap-4">
      <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 shadow-inner border border-white/5`}>
        <Icon className={color.replace('bg-', 'text-')} size={22} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-white tracking-tight mt-0.5">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlocked: 0,
    totalAllowed: 0,
    criticalThreats: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Simulation State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [logsRes, , usersRes, rolesRes] = await Promise.all([
          auditApi.getLogs(),
          permissionApi.getMap(),
          auditApi.getUsers(),
          roleApi.getRoles()
        ]);

        const logs = logsRes.data.logs;
        setRecentAlerts(logs.filter(l => l.decision === 'DENY').slice(0, 5));
        
        setUsers(usersRes.data.users || []);
        setRoles(rolesRes.data.roles || []); 
        
        setStats({
          totalUsers: usersRes.data.users?.length || 0, 
          totalBlocked: logs.filter(l => l.decision === 'DENY').length,
          totalAllowed: logs.filter(l => l.decision === 'ALLOW').length,
          criticalThreats: logs.filter(l => l.code === 'CROSS_TENANT_VIOLATION' || l.code === 'INDIRECT_ESCALATION_BLOCKED').length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const handleSimulate = async () => {
    if (!selectedUser || !selectedRole) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await permissionApi.simulateGrant(selectedUser, selectedRole);
      setSimResult(res.data.simulation);
    } catch (err) {
      alert(err.response?.data?.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleBlockGrant = async () => {
    if (!simResult) return;
    try {
      await auditApi.recordAuditLog({
        userId: selectedUser,
        requestedPermission: 'BLOCK_GRANT',
        decision: 'DENY',
        reason: `ADMIN ACTION: Hypothetical grant blocked. Predicted Risk: ${simResult.riskScore}. User: ${simResult.targetUser}, Role: ${simResult.targetRole}`
      });
      alert('PREVENTATIVE MEASURE LOGGED: This grant has been flagged for permanent restriction.');
      setSimResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-mono tracking-widest uppercase">Initializing Command Center...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase">
            Security <span className="text-amber-500">Command</span> Center
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-2 uppercase tracking-widest">Real-time Permission Escalation & Tenant Isolation Monitoring</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              if (window.confirm('⚠️ WARNING: PURGE ALL TACTICAL LOGS? This cannot be undone.')) {
                await auditApi.clearLogs();
                window.location.reload();
              }
            }}
            className="px-5 py-2.5 bg-defense-red/5 border border-defense-red/20 text-defense-red rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-defense-red/10 transition-all flex items-center gap-2"
          >
            <ShieldAlert size={14} />
            Purge Logs
          </button>
          <div className="px-5 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Live Monitoring Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Personnel" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={Zap} label="Authorized Ops" value={stats.totalAllowed} color="bg-emerald-500" />
        <StatCard icon={ShieldAlert} label="Blocked Attacks" value={stats.totalBlocked} color="bg-defense-red" />
        <StatCard icon={AlertTriangle} label="Critical Escalations" value={stats.criticalThreats} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} className="text-defense-red" />
              Live Interception Feed
            </h2>
            <Link to="/admin/logs" className="text-[10px] font-black text-defense-primary uppercase tracking-widest hover:underline flex items-center gap-1">
              View Full Audit Trail
              <ExternalLink size={10} />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={alert.id} 
                  className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-defense-red/40 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-defense-red/5 border border-defense-red/10 flex items-center justify-center text-defense-red group-hover:bg-defense-red/10 transition-colors">
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-sm uppercase tracking-wide">{alert.username}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-defense-red/10 border border-defense-red/20 text-defense-red font-black uppercase tracking-widest">
                          {alert.code}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1.5 truncate max-w-md font-medium">{alert.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-600 font-mono font-bold">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                    <ChevronRight size={16} className="text-slate-800 group-hover:text-defense-red transition-all mt-1 ml-auto" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-defense-900/50 border border-dashed border-white/10 p-12 rounded-xl text-center">
                <p className="text-slate-600 text-sm italic">No recent threats detected. System is secure.</p>
              </div>
            )}
          </div>
        </div>

        {/* Predictive Escalation Simulator */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col space-y-8">
          <div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <TrendingUp size={16} className="text-amber-500" />
              Escalation Simulator
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Personnel</label>
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl text-xs font-bold focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
                >
                  <option value="">Select User...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hypothetical Role</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl text-xs font-bold focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
                >
                  <option value="">Select Role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleSimulate}
                disabled={!selectedUser || !selectedRole || simulating}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/10 active:scale-[0.98]"
              >
                {simulating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Run Analysis
              </button>
            </div>
          </div>

          <AnimatePresence>
            {simResult && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 space-y-4 border-t border-white/5 pt-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Assessment</span>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    simResult.riskScore === 'Critical' ? 'bg-defense-red/20 text-defense-red' :
                    simResult.riskScore === 'Medium' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {simResult.riskScore}
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed italic">"{simResult.riskReason}"</p>

                {simResult.newChains.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-defense-red uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={12} />
                      Danger: New Escalations
                    </span>
                    <div className="space-y-1.5">
                      {simResult.newChains.slice(0, 2).map((chain, i) => (
                        <div key={i} className="text-[9px] font-bold bg-defense-red/5 border border-defense-red/10 p-2 rounded-lg">
                          <span className="text-defense-red">{chain.path.join(' → ')}</span>
                          <span className="text-white/40 ml-1">↳ [{chain.name}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSimResult(null)}
                    className="flex-1 bg-white/5 border border-white/10 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={12} />
                    Reset
                  </button>
                  {(simResult.riskScore === 'Critical' || simResult.riskScore === 'Medium') && (
                    <button 
                      onClick={handleBlockGrant}
                      className="flex-1 bg-defense-red/10 border border-defense-red/20 text-defense-red py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-defense-red/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Ban size={12} />
                      Block Grant
                    </button>
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

export default AdminDashboard;
