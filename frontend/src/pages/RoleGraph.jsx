import React, { useState, useEffect, useRef } from 'react';
import { Network, Info, Zap, Shield } from 'lucide-react';
import { roleApi } from '../services/api';
import { motion } from 'framer-motion';

const RoleGraph = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const response = await roleApi.getGraph();
        setData(response.data.graph);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const nodes = data.nodes;
    const edges = data.edges;
    if (!nodes.length) return;

    // Hierarchy layout logic
    const nodeMap = {};
    const childSet = new Set(edges.map(e => e.to));
    const roots = nodes.filter(n => !childSet.has(n.id));
    const levels = {};
    const visited = new Set();

    function assignLevel(nodeId, level) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      levels[nodeId] = Math.max(levels[nodeId] || 0, level);
      edges.filter(e => e.from === nodeId).forEach(e => assignLevel(e.to, level + 1));
    }
    
    if (roots.length === 0 && nodes.length > 0) assignLevel(nodes[0].id, 0);
    else roots.forEach(r => assignLevel(r.id, 0));
    nodes.forEach(n => { if (!visited.has(n.id)) levels[n.id] = 0; });

    const maxLevel = Math.max(...Object.values(levels), 0);
    const levelGroups = {};
    nodes.forEach(n => {
      const l = levels[n.id] || 0;
      if (!levelGroups[l]) levelGroups[l] = [];
      levelGroups[l].push(n);
    });

    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];
    const padding = 80;

    nodes.forEach(n => {
      const l = levels[n.id] || 0;
      const group = levelGroups[l];
      const idx = group.indexOf(n);
      const xSpacing = (W - padding * 2) / Math.max(group.length, 1);
      nodeMap[n.id] = {
        x: padding + xSpacing * idx + xSpacing / 2,
        y: padding + (H - padding * 2) / Math.max(maxLevel, 1) * l,
        color: colors[Math.min(l, colors.length - 1)],
        node: n,
      };
    });

    // Draw Edges
    edges.forEach(e => {
      const from = nodeMap[e.from], to = nodeMap[e.to];
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      const cp1y = from.y + (to.y - from.y) * 0.5;
      ctx.bezierCurveTo(from.x, cp1y, to.x, cp1y, to.x, to.y);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Draw Nodes
    Object.values(nodeMap).forEach(({ x, y, color, node }) => {
      // Glow
      ctx.beginPath();
      ctx.arc(x, y, 35, 0, Math.PI * 2);
      ctx.fillStyle = color + '10';
      ctx.fill();

      // Circle
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#0f1428';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name.replace(' Role', ''), x, y);
    });

  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Escalation Topology</h2>
          <p className="text-slate-400 font-medium">Strategic mapping of role inheritance and tactical dependency chains</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl border-defense-primary/20">
            <Info size={14} className="text-defense-primary" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Visualization</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
        <div className="lg:col-span-3 glass rounded-[40px] relative overflow-hidden flex items-center justify-center p-8 border border-white/5 shadow-2xl shadow-defense-primary/5">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            style={{ touchAction: 'none' }}
          />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-defense-900/50 backdrop-blur-sm z-10">
              <Network className="text-defense-primary animate-pulse" size={48} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl h-full">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
              <Zap className="text-defense-yellow" size={18} />
              Hierarchy Legend
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-defense-red rounded shadow-lg shadow-defense-red/20" />
                  <span className="text-xs font-bold text-white">Tactical Level 0 (Command)</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Direct command authority. These roles have direct access to strategic assets and trigger immediate firewall audits.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-defense-yellow rounded shadow-lg shadow-defense-yellow/20" />
                  <span className="text-xs font-bold text-white">Tactical Level 1-2</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Inherited access levels. Permissions flow down from command to surveillance and reporting.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-defense-green rounded shadow-lg shadow-defense-green/20" />
                  <span className="text-xs font-bold text-white">Tactical Level 3-4 (Maintenance)</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Base operational roles. Access to intelligence reports is strictly gated via chain analysis.
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="text-defense-primary" size={14} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy Note</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                "Direct path length of 2+ to Critical resources triggers the escalation firewall by default."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleGraph;
