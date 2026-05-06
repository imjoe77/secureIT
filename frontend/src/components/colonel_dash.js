'use client';

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Binary,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Crosshair,
  Eye,
  Fingerprint,
  MapPin,
  Menu,
  Radio,
  Shield,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

export default function CommanderUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [typed, setTyped] = useState("");
  const [activeLog, setActiveLog] = useState(0);

  const navLinks = ["Dashboard", "Intel", "Assets", "Security"];

  const terminalText =
    ">> Secure Link Established...\n>> Colonel Authorized: ARJUN RATHORE\n>> Rank Clearance: OMEGA-7\n>> Tactical Grid Online...\n>> War Room Sync Complete.";

  const commandStats = [
    { label: "Years Service", value: "23", suffix: "+", icon: CalendarDays },
    { label: "Ops Commanded", value: "147", suffix: "", icon: Crosshair },
    { label: "Units Directed", value: "18", suffix: "", icon: Users },
    { label: "Decorations", value: "12", suffix: "", icon: Trophy },
  ];

  const missionCards = [
    {
      title: "Operation Iron Meridian",
      meta: "Border stabilization protocol",
      status: "Active",
      progress: 78,
      icon: Target,
      accent: "from-orange-500 to-amber-300",
    },
    {
      title: "Signal Blackout Net",
      meta: "Encrypted communication sweep",
      status: "Monitoring",
      progress: 64,
      icon: Binary,
      accent: "from-cyan-400 to-blue-500",
    },
    {
      title: "Convoy Shield Line",
      meta: "High-value route protection",
      status: "Ready",
      progress: 92,
      icon: Shield,
      accent: "from-emerald-400 to-green-600",
    },
  ];

  const activityLogs = [
    "Secure link active across Forward Command.",
    "Drone feed connected to northern perimeter.",
    "Mission package deployed to Alpha Section.",
    "Intel sync complete with strategic operations cell.",
    "Biometric lock verified for command console.",
  ];

  const capabilities = [
    { label: "Strategic Intelligence", value: 96, icon: Eye },
    { label: "Command Discipline", value: 99, icon: BadgeCheck },
    { label: "Rapid Deployment", value: 91, icon: Zap },
    { label: "Joint Ops Control", value: 94, icon: Radio },
  ];

  const timeline = [
    { year: "2001", title: "Commissioned Officer", note: "Entered field command training with distinction." },
    { year: "2008", title: "Special Operations Lead", note: "Directed multi-unit tactical exercises and readiness drills." },
    { year: "2016", title: "Theater Command Advisor", note: "Coordinated intelligence, logistics, and mission risk planning." },
    { year: "2024", title: "Commander Authority", note: "Assigned to command core for high-priority operational oversight." },
  ];

  const assets = [
    "Command Relay Grid",
    "Encrypted Field Uplink",
    "Recon Drone Channel",
    "Rapid Response Unit",
    "Tactical Medical Wing",
  ];

  useEffect(() => {
    const handleMove = (event) => {
      setPos({
        x: (event.clientX / window.innerWidth - 0.5) * 22,
        y: (event.clientY / window.innerHeight - 0.5) * 22,
      });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTyped(terminalText.slice(0, index));
      index += 1;
      if (index > terminalText.length) clearInterval(interval);
    }, 22);

    return () => clearInterval(interval);
  }, [terminalText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLog((current) => (current + 1) % activityLogs.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [activityLogs.length]);

  const radarDots = useMemo(
    () => [
      { left: "18%", top: "35%", delay: "0s" },
      { left: "68%", top: "28%", delay: ".6s" },
      { left: "54%", top: "72%", delay: "1.1s" },
      { left: "31%", top: "66%", delay: "1.6s" },
    ],
    [],
  );

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#070b12] text-white selection:bg-orange-500/30">
        <style>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap");

          body {
            font-family: "Inter", sans-serif;
          }

          .font-terminal {
            font-family: "JetBrains Mono", monospace;
          }

          .scan-grid {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
            background-size: 48px 48px;
          }

          .glass-panel {
            background: linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.035));
            border: 1px solid rgba(255,255,255,.14);
            box-shadow: 0 22px 70px rgba(0,0,0,.42);
            backdrop-filter: blur(22px) saturate(150%);
          }

          .signal-line {
            background: linear-gradient(90deg, transparent, rgba(251,146,60,.8), transparent);
            animation: signalSweep 3.4s ease-in-out infinite;
          }

          @keyframes signalSweep {
            0% { transform: translateX(-100%); opacity: 0; }
            20%, 70% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }

          @keyframes radarSpin {
            to { transform: rotate(360deg); }
          }

          @keyframes floatPanel {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes pulseRing {
            0% { transform: scale(.8); opacity: .75; }
            100% { transform: scale(1.45); opacity: 0; }
          }

          .animate-radar-spin {
            animation: radarSpin 4s linear infinite;
          }

          .animate-float-panel {
            animation: floatPanel 6s ease-in-out infinite;
          }

          .animate-pulse-ring {
            animation: pulseRing 2s ease-out infinite;
          }
        `}</style>

        <div
          className="fixed inset-0 -z-10 transition-transform duration-200"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(1.08)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(249,115,22,.24),transparent_34%),radial-gradient(circle_at_75%_10%,rgba(59,130,246,.18),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_48%,#1b120a_100%)]" />
          <div className="absolute inset-0 scan-grid opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
        </div>

        <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#070b12]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <a href="#dashboard" className="flex items-center gap-3" aria-label="Command Core home">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-500/15 shadow-lg shadow-orange-500/10">
                <Shield className="h-5 w-5 text-orange-300" />
              </span>
              <span>
                <span className="block text-sm font-black uppercase tracking-[0.28em] text-white">Command Core</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300">Omega Interface</span>
              </span>
            </a>

            <div className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-xs font-bold uppercase tracking-[0.24em] text-white/60 transition hover:text-orange-300"
                >
                  {link}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">System Status</p>
                <p className="flex items-center justify-end gap-1 text-[10px] font-black uppercase text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white lg:hidden"
                aria-label="Toggle navigation menu"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          <div
            className={`lg:hidden overflow-hidden border-t border-white/10 bg-[#070b12]/95 transition-all duration-300 ${
              sidebarOpen ? "max-h-80" : "max-h-0"
            }`}
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  onClick={() => setSidebarOpen(false)}
                  className="text-sm font-black uppercase tracking-[0.25em] text-white/70"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="pointer-events-none fixed bottom-8 right-8 z-20 hidden h-36 w-36 overflow-hidden rounded-full border border-emerald-400/30 bg-emerald-400/5 shadow-2xl shadow-emerald-500/10 md:block">
          <div className="absolute inset-3 rounded-full border border-emerald-400/15" />
          <div className="absolute inset-8 rounded-full border border-emerald-400/15" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-emerald-300" />
          <div className="animate-radar-spin absolute left-1/2 top-1/2 h-16 w-px origin-bottom -translate-y-full bg-gradient-to-t from-emerald-400 to-transparent" />
          {radarDots.map((dot, index) => (
            <span
              key={index}
              className="absolute h-1.5 w-1.5 rounded-full bg-emerald-300"
              style={{ left: dot.left, top: dot.top, animationDelay: dot.delay }}
            />
          ))}
        </div>

        <main id="dashboard" className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
          <section className="grid min-h-[calc(100vh-9rem)] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="animate-float-panel relative mx-auto w-full max-w-md lg:mx-0">
              <div className="absolute -inset-5 rounded-[2rem] bg-orange-500/20 blur-3xl" />
              <div className="glass-panel relative overflow-hidden rounded-[2rem] p-6">
                <div className="signal-line absolute left-0 top-0 h-px w-full" />
                <div className="relative overflow-hidden rounded-[1.35rem] border border-orange-300/25">
                  <img
                    src="/commander_portrait.png"
                    alt="Commander Arjun Rathore"
                    className="h-[460px] w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="mb-2 inline-flex rounded-md bg-orange-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                      Supreme Field Authority
                    </p>
                    <h2 className="text-3xl font-black leading-tight">Colonel Arjun Rathore</h2>
                    <p className="mt-2 text-sm font-semibold text-white/65">Strategic Operations Division</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Clearance</p>
                    <p className="mt-2 text-xl font-black text-orange-300">Omega-7</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Status</p>
                    <p className="mt-2 text-xl font-black text-emerald-300">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                <Fingerprint size={16} /> Colonel Authorized
              </div>

              <div>
                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                  Tactical command with <span className="text-orange-400">total field control.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
                  Colonel Arjun Rathore directs high-risk operations, mission readiness,
                  intelligence routing, and personnel safety across volatile sectors.
                </p>
              </div>

              <div className="font-terminal rounded-2xl border border-emerald-400/25 bg-black/65 p-5 text-sm leading-7 text-emerald-300 shadow-2xl shadow-emerald-950/20">
                <pre className="min-h-36 whitespace-pre-wrap">{typed}</pre>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {commandStats.map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-orange-300/35">
                    <stat.icon className="mb-4 h-5 w-5 text-orange-300" />
                    <p className="text-3xl font-black">
                      {stat.value}
                      <span className="text-orange-300">{stat.suffix}</span>
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="intel" className="grid gap-6 py-16 lg:grid-cols-3">
            {missionCards.map((mission) => (
              <article key={mission.title} className="glass-panel group rounded-2xl p-6 transition hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl bg-gradient-to-br ${mission.accent} p-3 text-slate-950`}>
                    <mission.icon size={24} />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                    {mission.status}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-black text-white">{mission.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{mission.meta}</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${mission.accent} transition-all duration-700`}
                    style={{ width: `${mission.progress}%` }}
                  />
                </div>
                <p className="mt-3 text-right text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                  {mission.progress}% synchronized
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="glass-panel rounded-[1.5rem] p-6 sm:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Live Operations</p>
                  <h2 className="mt-2 text-3xl font-black">Command Activity Feed</h2>
                </div>
                <Radio className="h-7 w-7 text-orange-300" />
              </div>

              <div className="space-y-4">
                {activityLogs.map((log, index) => (
                  <div
                    key={log}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                      activeLog === index
                        ? "border-orange-300/35 bg-orange-400/10 text-white"
                        : "border-white/10 bg-white/5 text-white/55"
                    }`}
                  >
                    <span className="relative flex h-3 w-3">
                      {activeLog === index && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-orange-300" />}
                      <span className="relative h-3 w-3 rounded-full bg-orange-300" />
                    </span>
                    <p className="text-sm font-semibold">{log}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[1.5rem] p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Capability Matrix</p>
              <h2 className="mt-2 text-3xl font-black">Commander Strength</h2>
              <div className="mt-8 space-y-6">
                {capabilities.map((capability) => (
                  <div key={capability.label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-white/80">
                        <capability.icon size={16} className="text-orange-300" />
                        {capability.label}
                      </span>
                      <span className="font-terminal text-xs font-black text-orange-300">{capability.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300" style={{ width: `${capability.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="assets" className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="glass-panel rounded-[1.5rem] p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Strategic Assets</p>
              <h2 className="mt-2 text-3xl font-black">Available Command Tools</h2>
              <div className="mt-8 space-y-3">
                {assets.map((asset) => (
                  <div key={asset} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <span className="flex items-center gap-3 text-sm font-bold text-white/75">
                      <CircleDot size={14} className="text-emerald-300" />
                      {asset}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Linked</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel relative min-h-[420px] overflow-hidden rounded-[1.5rem] p-6 sm:p-8">
              <div className="absolute inset-0 scan-grid opacity-30" />
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/20" />
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/20" />
              <div className="animate-radar-spin absolute left-1/2 top-1/2 h-36 w-px origin-bottom -translate-y-full bg-gradient-to-t from-orange-300 to-transparent" />
              <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Sector Map</p>
                  <h2 className="mt-2 text-3xl font-black">Northern Perimeter</h2>
                </div>
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-orange-300/30 bg-orange-400/10">
                  <MapPin className="h-10 w-10 text-orange-300" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Grid</p>
                    <p className="mt-1 font-terminal text-lg font-black text-white">7-G</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Threat</p>
                    <p className="mt-1 font-terminal text-lg font-black text-orange-300">Moderate</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="security" className="py-10">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-3xl font-black">Service Timeline</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-orange-400/40 to-transparent" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {timeline.map((item) => (
                <article key={item.year} className="glass-panel rounded-2xl p-6 transition hover:-translate-y-1">
                  <p className="font-terminal text-sm font-black text-orange-300">{item.year}</p>
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{item.note}</p>
                </article>
              ))}
            </div>
          </section>

          <footer className="border-t border-white/10 py-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30">
              Command Authority / Tactical Operations / Secure Access
            </p>
            <button className="group mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-orange-300">
              Request Command Dossier
              <ChevronRight size={16} className="transition group-hover:translate-x-1" />
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}
