import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert,
  Info,
  FileText,
  XCircle,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { permissionApi } from '../services/api';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass p-6 rounded-2xl flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 shadow-lg`}>
      <Icon size={28} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-white leading-none mt-1">{value}</p>
    </div>
  </div>
);

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
        console.error('Dashboard data load failed:', err);
        setError(err.message || 'Tactical data fetch failed');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-defense-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Initializing Tactical Board...</p>
    </div>
  );

  if (error) return (
    <div className="glass p-12 rounded-[40px] text-center border-defense-red/20">
      <AlertTriangle className="text-defense-red mx-auto mb-4" size={48} />
      <h3 className="text-xl font-bold text-white mb-2">Tactical Data Failure</h3>
      <p className="text-slate-400 mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-primary">Retry Link</button>
    </div>
  );

  const summary = data?.summary || {};
  const perms = data?.permissions || { direct: [], inherited: [] };
  const roles = data?.directRoles || [];

  const stats = [
    { label: 'Total Access', value: summary.totalPermissions || 0, icon: ShieldCheck, color: 'bg-defense-primary' },
    { label: 'Direct Rights', value: summary.directPermissions || 0, icon: Zap, color: 'bg-defense-green' },
    { label: 'Inherited', value: summary.inheritedPermissions || 0, icon: Activity, color: 'bg-defense-yellow' },
    { label: 'Critical Area', value: summary.byRiskLevel?.critical || 0, icon: AlertTriangle, color: 'bg-defense-red' },
  ];

  const testAction = async (action) => {
    setActionLoading(true);
    setActionResult(null);
    try {
      let response;
      
      switch(action) {
        case 'VIEW':
          response = await api.get('/resource/reports');
          break;
        case 'UPDATE':
          response = await api.put('/resource/reports');
          break;
        case 'DELETE':
          response = await api.delete('/resource/reports');
          break;
      }
      setActionResult(response.data);
    } catch (err) {
      setActionResult(err.response?.data || { status: 'ERROR', reason: 'Connection Failure' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Strategic Defense Console</h2>
          <p className="text-slate-400 font-medium">Theater Operational Readiness & Enforcement</p>
        </div>
        <div className="glass px-6 py-3 rounded-2xl border-defense-primary/30 flex items-center gap-3">
          <div className="w-2 h-2 bg-defense-green rounded-full animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-defense-green">System Live</span>
        </div>
      </motion.div>

      {/* Defense Operational Console */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[40px] border-defense-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert size={120} />
        </div>
        
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
          <Lock className="text-defense-primary" size={24} />
          Operational Action Terminal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => testAction('VIEW')}
            disabled={actionLoading}
            className="flex flex-col items-center justify-center p-6 bg-defense-primary/10 border border-defense-primary/20 rounded-3xl hover:bg-defense-primary/20 transition-all group"
          >
            <div className="w-12 h-12 bg-defense-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="text-defense-primary" size={24} />
            </div>
            <span className="font-black text-white uppercase tracking-widest text-xs">View Intelligence</span>
          </button>

          <button 
            onClick={() => testAction('UPDATE')}
            disabled={actionLoading}
            className="flex flex-col items-center justify-center p-6 bg-defense-yellow/10 border border-defense-yellow/20 rounded-3xl hover:bg-defense-yellow/20 transition-all group"
          >
            <div className="w-12 h-12 bg-defense-yellow/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="text-defense-yellow" size={24} />
            </div>
            <span className="font-black text-white uppercase tracking-widest text-xs">Update Operationals</span>
          </button>

          <button 
            onClick={() => testAction('DELETE')}
            disabled={actionLoading}
            className="flex flex-col items-center justify-center p-6 bg-defense-red/10 border border-defense-red/20 rounded-3xl hover:bg-defense-red/20 transition-all group"
          >
            <div className="w-12 h-12 bg-defense-red/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="text-defense-red" size={24} />
            </div>
            <span className="font-black text-white uppercase tracking-widest text-xs">Purge Archives</span>
          </button>
        </div>

        {actionResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-6 rounded-3xl border ${
              actionResult.status === 'ALLOWED' 
                ? 'bg-defense-green/10 border-defense-green/20' 
                : 'bg-defense-red/10 border-defense-red/20'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                actionResult.status === 'ALLOWED' ? 'bg-defense-green/20' : 'bg-defense-red/20'
              }`}>
                {actionResult.status === 'ALLOWED' ? (
                  <CheckCircle2 className="text-defense-green" size={20} />
                ) : (
                  <XCircle className="text-defense-red" size={20} />
                )}
              </div>
              <div>
                <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${
                  actionResult.status === 'ALLOWED' ? 'text-defense-green' : 'text-defense-red'
                }`}>
                  Action {actionResult.status}
                </h4>
                <p className="text-white font-bold text-lg">{actionResult.reason || actionResult.message}</p>
                {actionResult.data && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {actionResult.data.map(item => (
                      <div key={item.id} className="text-xs bg-white/5 p-2 rounded-lg text-slate-400 font-mono">
                        [{item.id}] {item.title} - {item.classification}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass p-8 rounded-3xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <CheckCircle2 className="text-defense-green" size={20} />
              Assigned Operational Access
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(perms.direct || []).map((perm) => (
                <div key={perm.name} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-defense-primary/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      perm.riskLevel === 'critical' ? 'bg-defense-red' : 'bg-defense-green'
                    }`} />
                    <span className="font-mono text-sm text-slate-300 font-bold">{perm.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 group-hover:text-defense-primary transition-colors">Direct</span>
                </div>
              ))}
              {(perms.inherited || []).map((perm) => (
                <div key={perm.name} className="flex items-center justify-between p-4 bg-defense-yellow/5 border border-defense-yellow/10 rounded-xl hover:border-defense-yellow/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-defense-yellow" />
                    <span className="font-mono text-sm text-slate-300 font-bold">{perm.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-defense-yellow/40 group-hover:text-defense-yellow transition-colors">Inherited</span>
                </div>
              ))}
            </div>
            
            {!(perms.direct?.length || perms.inherited?.length) && (
              <div className="text-center py-12 text-slate-600">
                <Info size={40} className="mx-auto mb-4 opacity-20" />
                <p>No active operational permissions detected.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldAlert className="text-defense-primary" size={20} />
              Assigned Roles
            </h3>
            <div className="space-y-3">
              {(roles || []).map((role) => (
                <div key={role} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-default">
                  <div className="w-10 h-10 bg-defense-primary/20 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="text-defense-primary" size={20} />
                  </div>
                  <span className="text-sm font-bold text-white">{role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-defense-primary to-indigo-700 p-8 rounded-3xl shadow-xl shadow-defense-primary/20">
            <h4 className="text-white font-black text-lg mb-2">Need higher access?</h4>
            <p className="text-indigo-100 text-sm mb-6 font-medium leading-relaxed">
              Submit a tactical clearance request to the command firewall for evaluation.
            </p>
            <Link to="/request" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-defense-primary rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
              Open Request Terminal
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
