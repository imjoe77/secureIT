import { motion } from 'framer-motion';
import { Database, Shield, Cpu, Globe } from 'lucide-react';

const TechStack = () => {
  const sections = [
    {
      title: "Frontend (The Interface)",
      icon: Globe,
      items: [
        { name: "React.js", desc: "Single-page application (SPA) architecture for real-time reactivity." },
        { name: "Tailwind CSS", desc: "Defense-Grade dark theme with high-contrast tactical styling." },
        { name: "Framer Motion", desc: "Smooth animations and 'pulse' effects for security alerts." },
        { name: "Lucide React", desc: "Vector-based military and security iconography." }
      ]
    },
    {
      title: "Backend (The Engine)",
      icon: Cpu,
      items: [
        { name: "Node.js & Express", desc: "High-concurrency server for API routing and middleware." },
        { name: "Permission Graph Engine", desc: "Custom BFS (Breadth-First Search) for role chain analysis." },
        { name: "JWT Authentication", desc: "Secure, organization-scoped stateless identity tokens." }
      ]
    },
    {
      title: "Database (The Vault)",
      icon: Database,
      items: [
        { name: "SQLite (via sql.js)", desc: "Pure JS implementation for zero-config, portable tactical use." },
        { name: "Relational Schema", desc: "Strict foreign key enforcement for identity integrity." },
        { name: "UUID v4", desc: "Randomized identifiers to prevent ID-guessing (IDOR) attacks." }
      ]
    },
    {
      title: "Security Architecture",
      icon: Shield,
      items: [
        { name: "Multi-Tenant Isolation", desc: "Hard organizational boundaries at the request level." },
        { name: "RBAC + Firewall", desc: "Standard role logic augmented by depth-aware security rules." },
        { name: "Forensic Audit trail", desc: "Real-time logging of all intercepted escalation attempts." }
      ]
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
          Technical <span className="text-defense-primary">Intelligence</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
          Detailed architectural breakdown of the MSAS (Military Secure Access System) ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={section.title} 
            className="bg-defense-800/30 border border-white/5 p-8 rounded-[32px] hover:border-defense-primary/30 transition-all group"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-defense-primary/10 rounded-2xl flex items-center justify-center text-defense-primary group-hover:bg-defense-primary group-hover:text-white transition-all">
                <section.icon size={24} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{section.title}</h2>
            </div>
            
            <div className="space-y-6">
              {section.items.map((item) => (
                <div key={item.name} className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-defense-primary rounded-full" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{item.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-defense-primary/5 border border-defense-primary/20 p-8 rounded-[32px] text-center">
        <h2 className="text-xs font-black text-defense-primary uppercase tracking-[0.3em] mb-4">The Technical "Win"</h2>
        <p className="text-white font-medium text-lg italic max-w-3xl mx-auto">
          "The biggest challenge was building the **Permission Graph Engine**. We had to ensure we could traverse complex, 
          multi-level role hierarchies and apply firewall rules in under 10ms to ensure security didn't slow down the mission."
        </p>
      </div>
    </div>
  );
};

export default TechStack;
