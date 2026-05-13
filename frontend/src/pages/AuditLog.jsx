import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  Activity,
  ArrowRight
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
        setLogs(response.data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filter]);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      <div className="p-6 border-b border-border bg-bg-surface shrink-0 flex justify-between items-end">
        <div>
          <h2 className="section-label">THEATER AUDIT TRAIL</h2>
          <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">Forensic tracking of all operational access requests</p>
        </div>
        
        <div className="flex items-center bg-bg-elevated border border-border">
          {['all', 'ALLOW', 'DENY'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-accent text-white' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {f === 'all' ? 'ALL' : f === 'ALLOW' ? 'AUTHORIZED' : 'DENIED'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-bg-surface z-10">
              <tr className="border-b border-border">
                <th className="px-6 py-3 section-label font-medium">PERSONNEL</th>
                <th className="px-6 py-3 section-label font-medium">RESOURCE</th>
                <th className="px-6 py-3 section-label font-medium">VERDICT</th>
                <th className="px-6 py-3 section-label font-medium">REASON / FORENSICS</th>
                <th className="px-6 py-3 section-label font-medium">TIMESTAMP</th>
                <th className="px-6 py-3 section-label font-medium">ESCALATION PATH</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px] divide-y divide-border-subtle">
              {loading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse h-10">
                    <td colSpan="6" className="px-6"><div className="h-2 bg-bg-elevated w-full" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted">
                    <Activity size={32} className="mx-auto mb-4 opacity-10" />
                    <p className="uppercase tracking-[0.2em]">NO LOGS MATCHING PARAMETERS</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-bg-elevated transition-colors h-10 ${log.decision === 'DENY' ? 'bg-red-dim/5' : ''}`}
                  >
                    <td className="px-6 py-2">
                       <div className="flex flex-col">
                          <span className="text-primary font-bold">{log.username || 'SYSTEM'}</span>
                          <span className="text-[9px] text-muted uppercase">{log.tenant_name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-2 text-secondary uppercase">{log.requested_permission}</td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`status-dot ${log.decision === 'ALLOW' ? 'green' : 'red'}`} />
                        <span className={`font-bold ${log.decision === 'ALLOW' ? 'text-green-secure' : 'text-red-secure'}`}>
                           {log.decision}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-2">
                      <p className="text-[10px] text-secondary truncate max-w-[240px]" title={log.reason}>
                        {log.reason}
                      </p>
                    </td>
                    <td className="px-6 py-2 text-muted">
                      {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {log.escalation_path && log.escalation_path !== '[]' ? (
                          JSON.parse(log.escalation_path).map((p, i, arr) => (
                            <React.Fragment key={i}>
                              <span className="text-[9px] text-primary bg-bg-elevated px-1.5 py-0.5 border border-border">{p}</span>
                              {i < arr.length - 1 && <ArrowRight size={10} className="text-muted" />}
                            </React.Fragment>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted italic">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 h-10 border-t border-border bg-bg-surface flex items-center justify-between shrink-0">
          <p className="text-[10px] text-muted uppercase">Showing {logs.length} operations detected</p>
          <div className="flex items-center gap-4">
            <button className="text-muted hover:text-primary disabled:opacity-20" disabled><ChevronLeft size={16} /></button>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">PAGE 01</span>
            <button className="text-muted hover:text-primary disabled:opacity-20" disabled><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
