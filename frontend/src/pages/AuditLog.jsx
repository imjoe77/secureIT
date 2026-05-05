import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { auditApi } from '../services/api';
import { motion } from 'framer-motion';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await auditApi.getLogs(filter !== 'all' ? filter : null);
        setLogs(response.data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Theater Audit Trail</h2>
          <p className="text-slate-400 font-medium">Forensic tracking of all operational access requests</p>
        </div>
        
        <div className="flex items-center gap-2 bg-defense-800 p-1.5 rounded-2xl border border-white/5">
          {['all', 'ALLOW', 'DENY'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-defense-primary text-white shadow-lg shadow-defense-primary/20' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Everything' : f === 'ALLOW' ? 'Authorized' : 'Intercepted'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[32px] overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Personnel / ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Resource Requested</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Decision</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Escalation Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-6">
                      <div className="h-4 bg-white/5 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-600">
                    <Activity size={40} className="mx-auto mb-4 opacity-10" />
                    <p>No operational logs matching current parameters.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={log.id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-defense-800 rounded-lg flex items-center justify-center text-defense-primary border border-white/5">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{log.username || 'System'}</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{log.tenant_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-500" />
                        <span className="font-mono text-xs font-bold text-slate-300">{log.requested_permission}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                        log.decision === 'ALLOW' 
                          ? 'bg-defense-green/10 border-defense-green/20 text-defense-green' 
                          : 'bg-defense-red/10 border-defense-red/20 text-defense-red'
                      }`}>
                        {log.decision === 'ALLOW' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{log.decision}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        {log.access_path ? (
                          JSON.parse(log.access_path).map((p, i) => (
                            <React.Fragment key={i}>
                              <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded">{p}</span>
                              {i < JSON.parse(log.access_path).length - 1 && <span className="text-slate-800">→</span>}
                            </React.Fragment>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-slate-700 italic">No Chain</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-8 py-6 border-t border-white/5 bg-white/2 flex items-center justify-between">
          <p className="text-xs text-slate-600 font-medium">Showing {logs.length} operations detected</p>
          <div className="flex items-center gap-4">
            <button className="btn-ghost p-1 disabled:opacity-20" disabled><ChevronLeft size={20} /></button>
            <span className="text-xs font-black text-white uppercase tracking-widest">Page 01</span>
            <button className="btn-ghost p-1 disabled:opacity-20" disabled><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
