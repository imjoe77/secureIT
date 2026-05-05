import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity, Users, Zap, ShieldAlert, ChevronRight, ExternalLink } from 'lucide-react';
import { permissionApi, auditApi } from '../services/api';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlocked: 0,
    totalAllowed: 0,
    criticalThreats: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [logsRes, mapRes] = await Promise.all([
          auditApi.getLogs(),
          permissionApi.getMap()
        ]);

        const logs = logsRes.data.logs;
        setRecentAlerts(logs.filter(l => l.decision === 'DENY').slice(0, 5));
        
        setStats({
          totalUsers: mapRes.data.directRoles?.length || 4, 
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

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-defense-800/50 border border-white/5 p-6 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-mono tracking-widest uppercase">Initializing Command Center...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic uppercase">
            Security <span className="text-defense-primary">Command</span> Center
          </h1>
          <p className="text-slate-500 text-sm font-medium">Real-time Permission Escalation & Tenant Isolation Monitoring</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              if (window.confirm('⚠️ WARNING: PURGE ALL TACTICAL LOGS? This cannot be undone.')) {
                await auditApi.clearLogs();
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-defense-red/10 border border-defense-red/20 text-defense-red rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-defense-red/20 transition-all flex items-center gap-2"
          >
            <ShieldAlert size={14} />
            Purge All Logs
          </button>
          <div className="px-4 py-2 bg-defense-primary/10 border border-defense-primary/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-defense-primary rounded-full animate-ping" />
            <span className="text-defense-primary text-[10px] font-bold uppercase tracking-widest">Live Monitoring Active</span>
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
          </div>
          
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={alert.id} 
                  className="bg-defense-900 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-defense-red/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-defense-red/10 flex items-center justify-center text-defense-red">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{alert.username}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-defense-red/20 text-defense-red font-bold uppercase tracking-tighter">
                          {alert.code}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1 truncate max-w-md">{alert.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                    <ChevronRight size={16} className="text-slate-700 group-hover:text-defense-red transition-colors ml-auto" />
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

        {/* Quick Topology View Placeholder */}
        <div className="bg-defense-800/30 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Permission Topology</h2>
            <div className="aspect-square bg-defense-900 rounded-xl border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-defense-primary/5 to-transparent" />
              <Zap size={48} className="text-defense-primary/20 group-hover:scale-110 transition-transform" />
              <p className="absolute bottom-4 text-[10px] text-slate-500 font-bold uppercase">Topology Live</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/role-graph'}
            className="w-full mt-6 bg-white/5 border border-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            Open Full Graph
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
