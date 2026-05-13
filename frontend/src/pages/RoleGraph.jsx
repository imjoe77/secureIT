import { useState, useEffect, useRef } from 'react';
import { Network, Info, Zap, Shield, AlertTriangle, Activity, GitBranch } from 'lucide-react';
import { roleApi, auditApi } from '../services/api';

const RoleGraph = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attackPaths, setAttackPaths] = useState([]);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const nodeMapRef = useRef({});

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const [graphRes, logsRes] = await Promise.all([
          roleApi.getGraph(),
          auditApi.getLogs('DENY').catch(() => ({ data: { logs: [] } })),
        ]);

        setData(graphRes.data.graph);

        const denials = logsRes.data.logs || [];
        const escalationPaths = denials
          .filter(l => l.escalation_path && l.escalation_path !== '[]')
          .map(l => {
            try {
              const path = JSON.parse(l.escalation_path);
              return { path, reason: l.reason, code: l.requested_permission };
            } catch { return null; }
          })
          .filter(Boolean);

        setAttackPaths(escalationPaths);
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

    const nodes = data.nodes;
    const edges = data.edges;
    if (!nodes.length) return;

    const dangerousEdges = new Set();
    attackPaths.forEach(ap => {
      if (!ap.path || ap.path.length < 2) return;
      for (let i = 0; i < ap.path.length - 1; i++) {
        dangerousEdges.add(`${ap.path[i]}→${ap.path[i + 1]}`);
      }
    });

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
    nodes.forEach(n => { if (!visited.has(n.id)) assignLevel(n.id, 0); });

    const maxLevel = Math.max(...Object.values(levels), 0);
    const levelGroups = {};
    nodes.forEach(n => {
      const l = levels[n.id] || 0;
      if (!levelGroups[l]) levelGroups[l] = [];
      levelGroups[l].push(n);
    });

    const padding = 60;
    nodes.forEach(n => {
      const l = levels[n.id] || 0;
      const group = levelGroups[l];
      const idx = group.indexOf(n);
      const xSpacing = (W - padding * 2) / Math.max(group.length, 1);
      nodeMap[n.id] = {
        x: padding + xSpacing * idx + xSpacing / 2,
        y: padding + (H - padding * 2) / Math.max(maxLevel, 1) * l,
        node: n,
      };
    });

    nodeMapRef.current = nodeMap;

    let pulsePhase = 0;
    function render() {
      pulsePhase += 0.04;
      ctx.clearRect(0, 0, W, H);

      // Draw Grid Background
      ctx.strokeStyle = '#1c1f2e33';
      ctx.lineWidth = 1;
      for(let x=0; x<W; x+=24) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for(let y=0; y<H; y+=24) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Draw edges
      edges.forEach(e => {
        const from = nodeMap[e.from], to = nodeMap[e.to];
        if (!from || !to) return;

        const edgeKey = `${e.fromName}→${e.toName}`;
        const isDangerous = dangerousEdges.has(edgeKey);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        
        if (isDangerous) {
          const pulse = 0.5 + 0.5 * Math.sin(pulsePhase * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${0.4 + pulse * 0.6})`;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -pulsePhase * 20;
        } else {
          ctx.strokeStyle = '#1c1f2e';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowSize = 6;
        const offset = 22;
        const arrowX = to.x - offset * Math.cos(angle);
        const arrowY = to.y - offset * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowSize * Math.cos(angle - Math.PI/6), arrowY - arrowSize * Math.sin(angle - Math.PI/6));
        ctx.lineTo(arrowX - arrowSize * Math.cos(angle + Math.PI/6), arrowY - arrowSize * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fillStyle = isDangerous ? '#dc2626' : '#1c1f2e';
        ctx.fill();
      });

      // Draw nodes
      Object.values(nodeMap).forEach(({ x, y, node }) => {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#0f1117';
        ctx.strokeStyle = '#1c1f2e';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.substring(0, 8), x, y);
      });

      animFrameRef.current = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [data, attackPaths]);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      <div className="p-4 border-b border-border bg-bg-surface flex justify-between items-center">
        <div>
          <h2 className="section-label">PERMISSION INHERITANCE GRAPH</h2>
          <p className="text-[11px] text-muted mt-0.5">Relational topology of access roles and escalation vectors</p>
        </div>
        <div className="flex gap-4">
           {attackPaths.length > 0 && (
             <div className="flex items-center gap-2 bg-red-dim border border-red-secure/20 px-3 py-1">
                <AlertTriangle size={12} className="text-red-secure pulse-dot" />
                <span className="text-[10px] font-bold text-red-secure uppercase">{attackPaths.length} RISK VECTORS</span>
             </div>
           )}
           <div className="bg-bg-elevated border border-border px-3 py-1 flex items-center gap-2">
              <div className="status-dot green pulse-dot" />
              <span className="text-[10px] font-bold text-secondary uppercase">ENGINE LIVE</span>
           </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      <div className="h-12 border-t border-border bg-bg-surface flex items-center px-6 gap-6">
         <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-red-secure" />
            <span className="text-[10px] text-secondary uppercase font-semibold">ESCALATION PATH</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-border" />
            <span className="text-[10px] text-secondary uppercase font-semibold">SAFE INHERITANCE</span>
         </div>
         <div className="ml-auto text-[10px] text-muted font-mono uppercase">
            TRAVERSAL: BFS_OPTIMIZED · DEPTH_MAX: 4
         </div>
      </div>
    </div>
  );
};

export default RoleGraph;
