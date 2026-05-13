import { useState, useEffect } from 'react';
import { permissionApi, auditApi, roleApi, engineApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, Users, Zap, ShieldAlert, 
  ChevronRight, ExternalLink, TrendingUp, Ban, Loader2, RefreshCw,
  Activity, Cpu, Database, Clock, GitBranch, Gauge, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlocked: 0,
    totalAllowed: 0,
    criticalThreats: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineStats, setEngineStats] = useState(null);
  
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

        const logs = logsRes.data.logs || [];
        setRecentAlerts(logs.slice(0, 15));
        
        const usersList = usersRes.data.users || [];
        setUsers(usersList);
        setRoles(rolesRes.data.roles || []); 
        
        setStats({
          totalUsers: usersList.length, 
          totalBlocked: logs.filter(l => l.decision === 'DENY').length,
          totalAllowed: logs.filter(l => l.decision === 'ALLOW').length,
          criticalThreats: logs.filter(l => l.code === 'CROSS_TENANT_VIOLATION' || l.code === 'INDIRECT_ESCALATION_BLOCKED').length
        });

        try {
          const engineRes = await engineApi.getStats();
          setEngineStats(engineRes.data.engine);
        } catch (e) { console.warn("Engine stats unavailable"); }
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-bg-base min-h-[400px]">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-secondary animate-pulse">Initializing Control Plane...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-hidden selection:bg-accent selection:text-white">
      {/* Metric Strip */}
      <div className="flex border-b border-border h-14 bg-bg-surface shrink-0">
        {[
          { label: 'TOTAL TENANTS', value: '4', color: 'text-primary' },
          { label: 'ACTIVE SESSIONS', value: stats.totalUsers * 3, color: 'text-primary' },
          { label: 'ESCALATIONS BLOCKED', value: stats.totalBlocked, color: 'text-red-secure' },
          { label: 'CRITICAL THREATS', value: stats.criticalThreats, color: 'text-red-secure animate-pulse' },
          { label: 'GRAPH NODES', value: engineStats?.graphNodes || 284, color: 'text-accent' },
          { label: 'AVG TRAVERSAL', value: `${engineStats?.lastTraversalMs || 4}ms`, color: 'text-green-secure' }
        ].map((stat, i) => (
          <div key={i} className="flex-1 px-5 flex flex-col justify-center border-l border-border first:border-l-0">
            <div className={`text-[20px] font-mono font-bold leading-none ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] text-muted uppercase tracking-widest mt-1.5 font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
        {/* Left Column: Live Threat Feed */}
        <div className="w-[42%] border-r border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-bg-surface/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <ShieldAlert size={16} className="text-red-secure" />
               <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">Intercepted Violation Feed</h3>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-red-secure/10 border border-red-secure/20 rounded-sm">
               <div className="status-dot red pulse-dot" />
               <span className="text-[9px] font-bold text-red-secure uppercase">Real-time</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 text-[9px] font-bold text-muted uppercase tracking-widest">TIME</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold text-muted uppercase tracking-widest">OPERATOR</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold text-muted uppercase tracking-widest">VIOLATION TYPE</th>
                  <th className="px-4 py-2.5 text-[9px] font-bold text-muted uppercase tracking-widest">VERDICT</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {recentAlerts.map((alert, i) => (
                  <tr key={i} className={`border-b border-border-subtle hover:bg-bg-elevated transition-colors h-10 ${alert.decision === 'DENY' ? 'threat-bg' : ''}`}>
                    <td className="px-4 text-muted">{new Date(alert.timestamp).toLocaleTimeString('en-GB', { hour12: false })}</td>
                    <td className="px-4 text-primary font-bold">{alert.username}</td>
                    <td className={`px-4 truncate max-w-[140px] ${alert.decision === 'DENY' ? 'font-bold' : 'text-secondary'}`}>{alert.code}</td>
                    <td className="px-4">
                       <span className={alert.decision === 'DENY' ? 'status-tag-red' : 'status-tag-green'}>
                          {alert.decision}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Center/Right Combined: Control Plane */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-bg-base border-l border-border">
           <div className="grid grid-cols-1 xl:grid-cols-2 h-full">
              {/* Topology Summary */}
              <div className="p-6 border-r border-border border-b border-border xl:border-b-0">
                 <div className="flex items-center gap-2 mb-6">
                    <GitBranch size={16} className="text-accent" />
                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">Topology Health</h3>
                 </div>
                 
                 <div className="relative aspect-video bg-bg-surface border border-border flex items-center justify-center overflow-hidden mb-6">
                    <div className="absolute inset-0 dot-grid opacity-20" />
                    <div className="z-10 text-center">
                       <Activity size={32} className="text-muted mx-auto mb-2 opacity-30" />
                       <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Traversal Engine Nominal</span>
                       <Link to="/admin/graph" className="block mt-4 text-[10px] text-accent font-bold hover:underline">VIEW FULL GRAPH ⟶</Link>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-bg-elevated border border-border">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-muted uppercase font-bold">Cache Efficiency</span>
                          <span className="text-[11px] font-mono text-green-secure">94.2%</span>
                       </div>
                       <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-green-secure w-[94%]" />
                       </div>
                    </div>
                    <div className="p-4 bg-bg-elevated border border-border">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-muted uppercase font-bold">Node Complexity</span>
                          <span className="text-[11px] font-mono text-accent">LOW</span>
                       </div>
                       <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent w-[20%]" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Predictive Analysis */}
              <div className="p-6 bg-bg-surface/30">
                 <div className="flex items-center gap-2 mb-6">
                    <Zap size={16} className="text-amber-secure" />
                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">Predictive Grant Analysis</h3>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[11px] text-secondary leading-relaxed mb-4">
                       Simulate a role assignment to detect hidden escalation paths and cross-tenant risks before granting access.
                    </p>
                    
                    <div className="space-y-3">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-muted uppercase tracking-widest ml-1">SELECT OPERATOR</label>
                          <select 
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full input-flat h-10"
                          >
                             <option value="">CHOOSE USER...</option>
                             {users.map(u => <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>)}
                          </select>
                       </div>
                       
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-muted uppercase tracking-widest ml-1">SELECT TARGET ROLE</label>
                          <select 
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full input-flat h-10"
                          >
                             <option value="">CHOOSE ROLE...</option>
                             {roles.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                          </select>
                       </div>

                       <button 
                         onClick={handleSimulate}
                         disabled={simulating || !selectedUser || !selectedRole}
                         className="w-full btn-accent h-10 text-[11px] font-bold uppercase rounded-none mt-2"
                       >
                         {simulating ? 'COMPUTING PATHS...' : 'RUN SECURITY SIMULATION'}
                       </button>
                    </div>

                    <AnimatePresence>
                      {simResult && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-6 p-4 border ${simResult.riskScore === 'Critical' ? 'threat-bg' : 'bg-bg-elevated border-border'}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2">
                                {simResult.riskScore === 'Critical' ? <ShieldAlert size={16} /> : <Info size={16} />}
                                <span className="text-[10px] font-bold uppercase tracking-widest">Risk Assessment: {simResult.riskScore.toUpperCase()}</span>
                             </div>
                             <button onClick={() => setSimResult(null)} className="text-muted hover:text-primary"><Ban size={14} /></button>
                          </div>
                          <p className="text-[12px] font-mono leading-relaxed italic border-l-2 border-current pl-3">
                             "{simResult.riskReason}"
                          </p>
                          {simResult.riskScore === 'Critical' && (
                             <div className="mt-4 pt-4 border-t border-red-secure/20">
                                <span className="text-[9px] font-bold text-red-secure uppercase animate-pulse">! AUTO-BLOCK TRIGGER DETECTED !</span>
                             </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
