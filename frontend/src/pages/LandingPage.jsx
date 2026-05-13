import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [terminalLines, setTerminalLines] = useState([
    "> SYSTEM BOOT SEQUENCE COMPLETE",
    "> TENANTS ONLINE: 4",
    "> ACTIVE SESSIONS: 847",
    "> THREAT INDEX: 0.03 [NOMINAL]",
    "> LAST ESCALATION BLOCKED: 00:04:22 AGO",
    "> AUDIT LOG: SYNCHRONIZED",
    "> PERMISSION GRAPH NODES: 2,847",
    "> BFS TRAVERSAL: 4ms AVG"
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLines = [
        `> TICK: ${new Date().toISOString()}`,
        `> SESSION_${Math.random().toString(36).substring(7).toUpperCase()} VERIFIED`,
        `> GRAPH_RESCAN: ${Math.floor(Math.random() * 10)}ms`,
        `> THREAT_INDEX: ${(Math.random() * 0.1).toFixed(2)} [NOMINAL]`,
        `> AUDIT_SYNC: SUCCESS`,
      ];
      setTerminalLines(prev => [...prev.slice(-10), newLines[Math.floor(Math.random() * newLines.length)]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg-base text-primary font-sans selection:bg-accent selection:text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-[48px] border-b border-border bg-bg-base/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight uppercase">SECUREIT</span>
          <span className="bg-accent-dim text-accent text-[10px] font-mono px-2 py-0.5 rounded-sm">ENTERPRISE</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] rounded-full bg-green-secure pulse-dot" />
            <span className="text-[11px] font-mono text-green-secure">SYSTEM STATUS: NOMINAL</span>
          </div>
          <Link to="/login" className="bg-accent text-white text-[11px] font-medium px-4 py-1.5 rounded-sm hover:brightness-110 transition-all">
            OPERATOR LOGIN →
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <main className="relative pt-[48px] min-h-[calc(100vh-48px)] flex flex-col items-center justify-center overflow-hidden dot-grid">
        <div className="max-w-7xl w-full px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Block */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-[560px]"
          >
            <div className="inline-block bg-accent-dim text-accent text-[10px] font-mono px-2 py-1 mb-4">
              ZERO-TRUST AUTHORIZATION ENGINE
            </div>
            <h1 className="text-[32px] leading-tight font-bold mb-4">
              Enforce. Detect. Contain.<br />
              <span className="text-secondary">Permission security for critical infrastructure.</span>
            </h1>
            <p className="text-sm text-secondary mb-8 leading-relaxed max-w-[480px]">
              The unified control plane for identity-based threat containment and automated permission graph enforcement across air-gapped environments.
            </p>
            <div className="flex gap-4">
              <Link to="/login" className="bg-accent text-white text-[12px] font-medium px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
                INITIALIZE SESSION
              </Link>
              <button className="border border-border text-primary text-[12px] font-medium px-6 py-2.5 rounded-sm hover:bg-bg-elevated transition-all">
                VIEW THREAT MODEL
              </button>
            </div>
          </motion.div>

          {/* Right Block - Terminal */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="hidden lg:block h-[400px] bg-bg-surface border border-border p-6 font-mono text-[12px] text-secondary overflow-hidden relative shadow-2xl rounded-md"
          >
            <div className="space-y-1">
              {terminalLines.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
              ))}
              <div className="inline-block w-2 h-4 bg-accent/50 animate-pulse align-middle ml-1" />
            </div>
          </motion.div>
        </div>

        {/* Stat Blocks */}
        <div className="absolute bottom-12 w-full max-w-7xl px-12 grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { value: "Hardware-Bound", label: "Sessions" },
            { value: "Triple-Factor", label: "Auth" },
            { value: "BFS Graph", label: "Engine" },
            { value: "Sub-10ms", label: "Enforcement" }
          ].map((stat, i) => (
            <div key={i} className={`px-8 flex flex-col justify-center border-l border-border first:border-l-0 h-16`}>
              <div className="text-[20px] font-mono text-primary">{stat.value}</div>
              <div className="text-[10px] text-muted uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Strip */}
      <footer className="h-[48px] border-t border-border bg-bg-base flex items-center justify-between px-6">
        <div className="text-[11px] font-mono text-muted">
          © 2025 SecureIT. Unauthorized access is monitored and logged.
        </div>
        <div className="text-[11px] font-mono text-muted">
          v2.4.1 · BUILD STABLE
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
