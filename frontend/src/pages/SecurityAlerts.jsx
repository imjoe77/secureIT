import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Settings, 
  Zap, 
  Lock, 
  Activity, 
  ShieldCheck,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { auditApi } from '../services/api';
import { motion } from 'framer-motion';

const SecurityAlerts = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await auditApi.getFirewallRules();
        setRules(response.data.rules);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Security Command Center</h2>
          <p className="text-slate-400 font-medium">Active firewall protocols and threat mitigation status</p>
        </div>
        <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-2xl border-defense-red/20">
          <Activity size={18} className="text-defense-red animate-pulse" />
          <span className="text-xs font-black text-defense-red uppercase tracking-widest">Real-time Defense Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Active Protocols */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-defense-primary" size={20} />
            <h3 className="text-xl font-bold text-white tracking-tight">Active Firewall Protocols</h3>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="glass h-32 rounded-3xl animate-pulse" />
              ))
            ) : rules.map((rule, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={rule.id}
                className="glass p-8 rounded-[32px] group hover:border-defense-primary/30 transition-all border-l-4 border-l-defense-primary"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-defense-primary/10 rounded-xl flex items-center justify-center text-defense-primary group-hover:scale-110 transition-transform">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{rule.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{rule.rule_type}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    rule.is_active ? 'bg-defense-green/10 border-defense-green/20 text-defense-green' : 'bg-slate-800 border-white/5 text-slate-500'
                  }`}>
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">
                  {rule.description}
                </p>
                <div className="flex items-center gap-2 font-mono text-[10px] text-defense-primary bg-defense-primary/5 p-3 rounded-xl border border-defense-primary/10 overflow-hidden">
                  <Zap size={12} />
                  <span className="truncate">{JSON.stringify(rule.config)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Mitigations */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="text-defense-red" size={20} />
            <h3 className="text-xl font-bold text-white tracking-tight">Recent Tactical Interceptions</h3>
          </div>

          <div className="glass p-8 rounded-[40px] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-defense-red/5 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="space-y-4 relative z-10">
              <div className="p-6 bg-defense-red/10 border border-defense-red/20 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-defense-red" />
                    <span className="text-xs font-black text-defense-red uppercase tracking-widest">Escalation Blocked</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">T-minus 2m</span>
                </div>
                <p className="text-sm text-white font-bold mb-2">Unauthorized Intel Access Attempt</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Personnel <span className="text-slate-200">airman_smith</span> attempted to bypass clearance protocols via indirect role chain.
                </p>
              </div>

              <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-orange-500" />
                    <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Cross-Tenant Alert</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">T-minus 12m</span>
                </div>
                <p className="text-sm text-white font-bold mb-2">Boundary Violation Attempted</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Foreign personnel <span className="text-slate-200">gdf_operator</span> attempted to probe US Air Force resources.
                </p>
              </div>

              <div className="p-6 bg-defense-green/5 border border-white/5 rounded-3xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-defense-green" />
                    <span className="text-xs font-black text-defense-green uppercase tracking-widest">Security Update</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">T-minus 1h</span>
                </div>
                <p className="text-sm text-slate-300 font-bold mb-2">Command Chain Re-validated</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Strategic graph successfully recalculated for 12,000+ Personnel-Role permutations.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 text-center">
              <button className="text-defense-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                View Full Forensic Analysis
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="glass p-8 rounded-[40px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-defense-green/10 rounded-2xl flex items-center justify-center text-defense-green shadow-lg shadow-defense-green/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Firewall Integrity</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">99.9% Shield Strength</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-white">0.0ms</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Response Latency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAlerts;
