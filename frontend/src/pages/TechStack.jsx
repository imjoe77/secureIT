import { motion } from 'framer-motion';
import { Database, Shield, Cpu, Globe, Activity } from 'lucide-react';

const TechStack = () => {
  const sections = [
    {
      title: "Frontend (The Interface)",
      icon: Globe,
      items: [
        { name: "React.js", desc: "Single-page application (SPA) architecture for real-time reactivity." },
        { name: "Tailwind CSS", desc: "Enterprise-Grade dark theme with high-contrast tactical styling." },
        { name: "Framer Motion", desc: "Subtle transitions and status indicators for system feedback." },
        { name: "Lucide React", desc: "Vector-based functional security iconography." }
      ]
    },
    {
      title: "Backend (The Engine)",
      icon: Cpu,
      items: [
        { name: "Node.js & Express", desc: "High-concurrency server for API routing and middleware." },
        { name: "Permission Graph Engine", desc: "Custom BFS traversal for recursive role inheritance analysis." },
        { name: "JWT Authentication", desc: "Secure, organization-scoped stateless identity tokens." }
      ]
    },
    {
      title: "Database (The Vault)",
      icon: Database,
      items: [
        { name: "PostgreSQL", desc: "Relational storage with strict foreign key enforcement and pooled connections." },
        { name: "Data Seeding", desc: "Pre-configured organizational hierarchies for multi-tenant simulation." },
        { name: "UUID Identifiers", desc: "Cryptographically strong IDs to prevent horizontal traversal attacks." }
      ]
    },
    {
      title: "Security Architecture",
      icon: Shield,
      items: [
        { name: "Zero-Trust Protocol", desc: "Hardware binding and IP verification for high-clearance nodes." },
        { name: "RBAC + Firewall", desc: "Recursive path logic with depth-aware interception rules." },
        { name: "Forensic Audit Trail", desc: "Real-time telemetry and interception logging for all attempts." }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-hidden">
      <div className="p-6 border-b border-border bg-bg-surface shrink-0">
        <h2 className="section-label">TECHNICAL INTELLIGENCE</h2>
        <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">Detailed architectural breakdown of the SecureIT ecosystem</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, idx) => (
              <div 
                key={section.title} 
                className="bg-bg-surface border border-border p-6 hover:border-accent/30 transition-all group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-bg-elevated border border-border flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                    <section.icon size={20} />
                  </div>
                  <h2 className="text-sm font-bold text-primary uppercase tracking-tight">{section.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex gap-4">
                      <div className="mt-1.5 w-1 h-1 bg-accent shrink-0" />
                      <div>
                        <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">{item.name}</h3>
                        <p className="text-secondary text-[10px] mt-1 leading-relaxed font-mono uppercase opacity-70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-bg-elevated border border-border p-6 flex items-start gap-4">
            <Activity className="text-accent shrink-0" size={20} />
            <div>
               <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2">Performance Optimization Note</h3>
               <p className="text-primary text-[12px] font-mono leading-relaxed italic">
                 "The core innovation lies in the **Permission Graph Engine**. By pre-indexing roles and using an optimized BFS, 
                 we achieve recursive hierarchy traversal and firewall rule validation in under 10ms, 
                 ensuring security checks are transparent to the user experience."
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStack;
