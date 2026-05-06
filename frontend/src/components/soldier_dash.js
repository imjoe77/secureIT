'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { 
  ChevronDown, Award, Target, Star, Shield, 
  Map, Activity, FileText, LayoutGrid, Zap, Clock, Globe, Crosshair
} from 'lucide-react';

export default function SoldierDashboard() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-['Poppins',_sans-serif] selection:bg-blue-500/30">
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      {/* Global Styles & Background */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        body {
          background-color: #0f172a; /* Solid dark background */
          margin: 0;
          color: #e2e8f0;
          font-family: 'Poppins', sans-serif;
        }

        .glass-profile {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
        }

        .section-solid {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.5);
        }

        @keyframes pulse-blue {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-pulse-subtle {
          animation: pulse-blue 3s infinite;
        }

        /* Page Transition Animations */
        @keyframes slideUpFade {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); display: none; }
        }

        @keyframes textSlideUp {
          0% { transform: translateY(100%); opacity: 0; }
          20% { transform: translateY(0); opacity: 1; }
          80% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }

        @keyframes contentReveal {
          0% { transform: translateY(40px); opacity: 0; filter: blur(10px); }
          100% { transform: translateY(0); opacity: 1; filter: blur(0); }
        }

        .page-transition-overlay {
          animation: slideUpFade 1s cubic-bezier(0.77, 0, 0.175, 1) 1.2s forwards;
          transform-origin: top;
        }

        .page-transition-text {
          animation: textSlideUp 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
          transform: translateY(100%);
        }

        .page-content-reveal {
          animation: contentReveal 1.2s cubic-bezier(0.77, 0, 0.175, 1) 1s forwards;
          opacity: 0;
        }
      `}</style>

      {/* GSAP-style Barba Page Transition Overlay */}
      <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex items-center justify-center page-transition-overlay pointer-events-none">
        <div className="overflow-hidden">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-widest uppercase page-transition-text">
            Soldier Dashboard
          </h1>
        </div>
      </div>

      <div className="relative z-10 page-content-reveal">
      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled || mobileMenuOpen ? 'bg-slate-950/95 shadow-2xl py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30 group cursor-pointer hover:bg-blue-600/40 transition-all">
              <Shield className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">Tactical Command</h1>
              <p className="text-blue-400 text-[10px] uppercase tracking-widest font-bold">Protocol v4.2.0</p>
            </div>
          </div>
          
          <div className="hidden lg:flex gap-10">
            {['Mission', 'Intelligence', 'Arsenal', 'Command'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-300 hover:text-white transition text-sm font-medium uppercase tracking-widest relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <Zap className="w-6 h-6 rotate-90" /> : <LayoutGrid className="w-6 h-6" />}
            </button>
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-slate-400">System Status</span>
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border border-blue-500/30 overflow-hidden cursor-pointer hover:ring-2 ring-blue-500/50 transition-all">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed inset-0 bg-slate-950/98 z-40 transition-transform duration-500 ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {['Mission', 'Intelligence', 'Arsenal', 'Command'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-2xl font-bold text-white uppercase tracking-widest"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20">
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl w-full px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: User Profile Glass Card */}
          <div className="lg:col-span-5">
            <div className="glass-profile p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-32 h-32 text-blue-500" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center sm:items-start sm:flex-row gap-6 mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border border-blue-500/50 overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" alt="Colonel Mitchell" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-lg border-2 border-slate-900 shadow-xl">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="text-center sm:text-left pt-2">
                  <h2 className="text-3xl font-bold text-white mb-1">Colonel James Mitchell</h2>
                  <p className="text-blue-400 font-medium tracking-wide flex items-center gap-2 justify-center sm:justify-start">
                    <Zap className="w-4 h-4" /> Elite Special Operations
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-bold uppercase tracking-tighter">Class A</span>
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[10px] font-bold uppercase tracking-tighter">Active</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Total Operations</p>
                  <p className="text-2xl font-bold text-white">482</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-green-400">98.4%</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3">
                  <LayoutGrid className="w-5 h-5" /> Deploy Mission Control
                </button>
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl transition-all flex items-center justify-center gap-3">
                  <Activity className="w-5 h-5" /> View Performance Biometrics
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Mission Briefing */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <Crosshair className="w-4 h-4" /> Priority Intelligence Report
              </div>
              <h2 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Operation <br /> <span className="text-blue-500">Midnight Sentinel</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-xl leading-relaxed">
                Strategic infiltration and extraction protocol engaged. Intelligence suggests high-value target assets are mobilizing in Sector 7-G.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="section-solid p-6 rounded-2xl border-l-4 border-l-blue-500 group cursor-pointer hover:translate-x-2 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Timeline</h4>
                    <p className="text-xs text-slate-400">Deployment in 14h 22m</p>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-2/3 animate-pulse-subtle"></div>
                </div>
              </div>

              <div className="section-solid p-6 rounded-2xl border-l-4 border-l-green-500 group cursor-pointer hover:translate-x-2 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Coordinates</h4>
                    <p className="text-xs text-slate-400">Sector 7-G, Eastern Border</p>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-full opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="absolute bottom-12 animate-bounce cursor-pointer group"
          onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Combat Experience', value: '14.2k Hrs', icon: <Target className="text-red-400" /> },
              { label: 'Intelligence Gathered', value: '8.4 TB', icon: <FileText className="text-blue-400" /> },
              { label: 'Network Reach', value: 'Global', icon: <Globe className="text-green-400" /> },
              { label: 'Current Rank', value: 'Colonel', icon: <Award className="text-yellow-400" /> }
            ].map((stat, i) => (
              <div key={i} className="section-solid p-8 rounded-3xl text-center group hover:scale-105 transition-all duration-300">
                <div className="mb-4 flex justify-center transform group-hover:rotate-12 transition-transform">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    {React.cloneElement(stat.icon, { className: 'w-8 h-8 ' + stat.icon.props.className })}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational Logs / Details Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Mission Logs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FileText className="text-blue-500" /> Operational Logs
                </h3>
                <button className="text-blue-400 text-sm font-bold hover:underline">View Historical Data</button>
              </div>
              
              {[
                { op: 'Silent Falcon', status: 'Completed', date: 'May 02, 2024', outcome: 'Extraction Successful' },
                { op: 'Ghost Recon', status: 'Completed', date: 'April 28, 2024', outcome: 'Data Retrieved' },
                { op: 'Iron Shield', status: 'Failed', date: 'April 15, 2024', outcome: 'Compromised' },
              ].map((log, i) => (
                <div key={i} className="section-solid p-6 rounded-2xl flex items-center justify-between group hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${log.outcome.includes('Successful') || log.outcome.includes('Retrieved') ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h4 className="text-white font-bold">{log.op}</h4>
                      <p className="text-xs text-slate-400">{log.date} • {log.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${log.outcome.includes('Successful') || log.outcome.includes('Retrieved') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {log.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Equipment / Assets */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                <LayoutGrid className="text-blue-500" /> Asset Inventory
              </h3>
              <div className="section-solid p-8 rounded-3xl space-y-6">
                {[
                  { name: 'X-7 Tactical UAV', level: 'Level 4' },
                  { name: 'Quantum Encryptor', level: 'Elite' },
                  { name: 'Thermal Camo Suit', level: 'Prototype' },
                  { name: 'Aegis Defender S2', level: 'Standard' },
                ].map((asset, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{asset.name}</p>
                      <p className="text-[10px] text-blue-400 uppercase font-bold">{asset.level}</p>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(b => (
                        <div key={b} className={`w-1.5 h-1.5 rounded-full ${b <= 4 ? 'bg-blue-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                ))}
                <button className="w-full py-4 mt-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all">
                  Access Armory
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Sections */}
      <section className="py-24 max-w-7xl mx-auto px-8 space-y-32">
        
        {/* Combat Specialties */}
        <div id="skills" className="space-y-12">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-white mb-4">Combat Specialties</h3>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Strategic Intel', val: 95, icon: <Globe /> },
              { label: 'Tactical Extraction', val: 92, icon: <Zap /> },
              { label: 'Stealth Ops', val: 98, icon: <Target /> },
              { label: 'Aerial Recon', val: 88, icon: <Map /> }
            ].map((skill, i) => (
              <div key={i} className="section-solid p-8 rounded-3xl group hover:bg-slate-800 transition-all">
                <div className="mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                  {React.cloneElement(skill.icon, { size: 32 })}
                </div>
                <h4 className="text-white font-bold mb-4">{skill.label}</h4>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${skill.val}%` }} />
                </div>
                <p className="mt-2 text-right text-xs font-bold text-slate-500">{skill.val}% Mastery</p>
              </div>
            ))}
          </div>
        </div>

        {/* Service Timeline */}
        <div id="timeline" className="space-y-12">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-white mb-4">Service Record</h3>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="relative space-y-12 before:absolute before:left-8 md:before:left-1/2 before:top-0 before:h-full before:w-[2px] before:bg-blue-900/50">
            {[
              { year: '2012', title: 'Enlistment', desc: 'Joint Special Operations Command' },
              { year: '2015', title: 'Captaincy', desc: 'Promoted for tactical excellence in Sector 4' },
              { year: '2019', title: 'Elite Para-SF', desc: 'Completed specialist training with 99th Battalion' },
              { year: '2023', title: 'Colonel Rank', desc: 'Current appointment to Strategic Command' }
            ].map((milestone, i) => (
              <div 
                key={i} 
                className={`relative flex items-center justify-between md:justify-normal ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                style={{ 
                  animation: `contentReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${1.5 + (i * 0.3)}s forwards`,
                  opacity: 0
                }}
              >
                <div className="w-full md:w-1/2 px-12">
                  <div className="section-solid p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                    <span className="text-blue-500 font-black text-sm tracking-widest">{milestone.year}</span>
                    <h4 className="text-white font-bold text-xl mt-1">{milestone.title}</h4>
                    <p className="text-slate-400 text-sm mt-2">{milestone.desc}</p>
                  </div>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950 z-10 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              </div>
            ))}
          </div>
        </div>

        {/* Decorations & Honors */}
        <div id="awards" className="space-y-12 pb-12">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-white mb-4">Decorations & Honors</h3>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                name: 'Medal of Valor', 
                icon: (
                  <lord-icon
                    src="https://cdn.lordicon.com/rhmbrqqg.json"
                    trigger="hover"
                    colors="primary:#ffffff,secondary:#3b82f6"
                    style={{ width: '64px', height: '64px' }}
                    suppressHydrationWarning>
                  </lord-icon>
                ) 
              },
              { 
                name: 'Star of Courage', 
                icon: (
                  <div className="bg-white/5 rounded-full p-2 inline-block">
                    <lord-icon
                      src="https://cdn.lordicon.com/wjdlpfml.json"
                      trigger="hover"
                      state="hover-enlarge"
                      colors="primary:#ffffff,secondary:#eab308"
                      style={{ width: '64px', height: '64px' }}
                      suppressHydrationWarning>
                    </lord-icon>
                  </div>
                ) 
              },
              { 
                name: 'Service Ribbon', 
                icon: (
                  <div className="bg-blue-500/10 rounded-full p-2 inline-block shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <lord-icon
                      src="https://cdn.lordicon.com/cfkiwvcc.json"
                      trigger="hover"
                      colors="primary:#ffffff,secondary:#3b82f6"
                      style={{ width: '64px', height: '64px' }}
                      suppressHydrationWarning>
                    </lord-icon>
                  </div>
                ) 
              },
              { 
                name: 'Elite Cross', 
                icon: (
                  <div className="bg-red-500/10 rounded-full p-2 inline-block shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <lord-icon
                      src="https://cdn.lordicon.com/atzcyedn.json"
                      trigger="hover"
                      colors="primary:#ffffff,secondary:#ef4444"
                      style={{ width: '64px', height: '64px' }}
                      suppressHydrationWarning>
                    </lord-icon>
                  </div>
                ) 
              }
            ].map((award, i) => (
              <div key={i} className="section-solid p-6 rounded-2xl text-center hover:scale-105 transition-transform cursor-default">
                <div className="mb-3 flex justify-center items-center h-20">{award.icon}</div>
                <p className="text-white font-bold text-sm tracking-tight">{award.name}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="section-solid border-t border-white/5 py-12 text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">&copy; 2024 Command Center Tactical Interface</p>
        <div className="flex justify-center gap-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Security Protocol</a>
          <a href="#" className="hover:text-white transition-colors">Emergency Contact</a>
        </div>
      </footer>
      </div>
    </div>
  );
}
