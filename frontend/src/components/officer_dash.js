'use client';

import { useState, useEffect } from "react";
import { 
  Shield, Target, Users, Award, Globe, 
  Activity, FileText, Fingerprint, Binary,
  CheckCircle2, ChevronDown, LogOut, BadgeCheck
} from "lucide-react";

export default function OfficerProfile() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const profileStats = [
    { label: "Active Deployments", value: "14", icon: Globe },
    { label: "Troops Commanded", value: "1,240", icon: Users },
    { label: "Mission Success", value: "98.2%", icon: Target },
    { label: "Clearance Level", value: "Level 8", icon: Fingerprint }
  ];

  const skillMetrics = [
    { name: "Strategic Planning", score: 96 },
    { name: "Crisis Management", score: 92 },
    { name: "Logistics Coordination", score: 88 },
    { name: "Cyber Intelligence", score: 85 }
  ];

  const activeMissions = [
    { id: "OP-DELTA", name: "Border Security Protocol", status: "Active", progress: 65, color: "bg-blue-500" },
    { id: "OP-ECHO", name: "Supply Line Reinforcement", status: "Monitoring", progress: 90, color: "bg-emerald-500" },
    { id: "OP-NOVA", name: "Urban Reconnaissance", status: "Pending", progress: 15, color: "bg-amber-500" }
  ];

  const recentLogs = [
    { time: "0800 HRS", action: "Authorized deployment of Unit 4.", type: "Command" },
    { time: "0945 HRS", action: "Reviewed Sector 7 intel reports.", type: "Intel" },
    { time: "1130 HRS", action: "Initiated secure comms with HQ.", type: "Comms" },
    { time: "1400 HRS", action: "Updated tactical grid parameters.", type: "System" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-['Poppins',_sans-serif] text-slate-800 pb-20">
      
      {/* NAVBAR */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Shield size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">COMMAND<span className="font-light">NET</span></span>
          </div>
          <div className="flex items-center">
            <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors">
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* HEADER BANNER */}
      <div className="relative h-[320px] bg-blue-900 overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-transparent to-transparent"></div>
        
        {/* Banner Content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl px-6 flex justify-between items-center opacity-20">
          <Globe size={300} className="text-white -ml-20" />
          <Binary size={300} className="text-white -mr-20" />
        </div>
      </div>

      {/* MAIN PROFILE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 relative z-10">
        
        {/* TOP PROFILE CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-end">
          
          {/* Userfile Photo */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-slate-100">
              <img 
                src="/officer_portrait.png" 
                alt="Officer Profile" 
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <Award size={20} className="text-white" />
            </div>
          </div>

          {/* Profile Basic Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-widest mb-3 border border-blue-100">
              Commissioned Officer
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">Officer. James Harrington</h1>
            <p className="text-lg text-slate-500 font-medium mb-6">Regional Officer • Tactical Operations Division</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors flex items-center gap-2">
                <FileText size={18} /> View Full Record
              </button>
              {/* <button className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Radio size={18} /> Ping Location
              </button> */}ē
            </div>
          </div>

        </div>

        {/* 4-COLUMN STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {profileStats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <stat.icon size={24} className="text-blue-600 mb-4" />
              <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* DETAILED INFORMATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* LEFT COLUMN: Skills & Certifications */}
          <div className="space-y-8">
            {/* Skills Panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" /> Operational Metrics
              </h3>
              <div className="space-y-5">
                {skillMetrics.map((skill, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-slate-700">{skill.name}</span>
                      <span className="text-blue-600">{skill.score}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${skill.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Panel */}
            <div className="bg-blue-900 text-white rounded-3xl shadow-lg p-8 relative overflow-hidden">
              <Shield className="absolute -right-6 -top-6 w-32 h-32 text-blue-800 opacity-50" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BadgeCheck size={20} className="text-blue-300" /> Certifications
                </h3>
                <ul className="space-y-4">
                  {[
                    "Level 5 Advanced Tactics",
                    "Joint Operations Command",
                    "Cyber Security Protocol B",
                    "Global Logistics Master"
                  ].map((cert, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span className="text-sm font-medium text-blue-50">{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* MIDDLE/RIGHT COLUMN: Active Missions & Logs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Missions */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" /> Active Directives
                </h3>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
              </div>
              <div className="grid gap-4">
                {activeMissions.map((mission, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{mission.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${mission.color}`}>
                            {mission.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900">{mission.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">{mission.progress}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${mission.color}`}
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Command Logs */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Recent Command Logs
              </h3>
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                {recentLogs.map((log, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-blue-500"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800">{log.action}</p>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {log.type}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{log.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                Load Full History <ChevronDown size={16} />
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
