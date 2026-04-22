import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import { Network, Info, X, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';

const COLORS = [
  '#5a5fff', '#22d3ee', '#a855f7', '#ec4899',
  '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
];

function getNodeColor(importance, idx) {
  if (importance >= 8) return '#5a5fff';
  if (importance >= 6) return '#22d3ee';
  if (importance >= 4) return '#a855f7';
  return COLORS[idx % COLORS.length];
}

export default function ConceptGraph() {
  const { sessionData } = useSession();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(null);
  const lastMouse = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  const { concepts = [], relationships = [], subject = '', summary = '', difficulty = '' } = sessionData || {};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || concepts.length === 0) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize nodes with force-directed positions
    const cx = w / 2, cy = h / 2;
    const nodes = concepts.map((c, i) => {
      const angle = (2 * Math.PI * i) / concepts.length;
      const r = Math.min(w, h) * 0.35;
      return {
        id: c.id,
        label: c.label,
        definition: c.definition,
        importance: c.importance || 5,
        color: getNodeColor(c.importance || 5, i),
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 60,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 60,
        vx: 0, vy: 0,
        radius: 25 + (c.importance || 5) * 2.5,
      };
    });

    const edges = relationships
      .map((r) => ({
        source: nodes.find((n) => n.id === r.source),
        target: nodes.find((n) => n.id === r.target),
        label: r.label,
      }))
      .filter((e) => e.source && e.target);

    nodesRef.current = nodes;
    edgesRef.current = edges;

    let frame = 0;

    const simulate = () => {
      // Force-directed layout
      const k = 150; // Increased repulsion distance
      nodes.forEach((a) => {
        a.vx *= 0.85; a.vy *= 0.85;
        // Repulsion
        nodes.forEach((b) => {
          if (a === b) return;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = (k * k) / dist;
          a.vx += (dx / dist) * force * 0.015;
          a.vy += (dy / dist) * force * 0.015;
        });
        // Gravity to center
        a.vx += (cx - a.x) * 0.002;
        a.vy += (cy - a.y) * 0.002;
      });

      // Attraction along edges
      edges.forEach(({ source, target }) => {
        const dx = target.x - source.x, dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const force = (dist - k) * 0.03;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx; source.vy += fy;
        target.vx -= fx; target.vy -= fy;
      });

      nodes.forEach((n) => {
        if (dragging.current === n) return;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(n.radius + 10, Math.min(w - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(h - n.radius - 10, n.y));
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);

      // Draw edges
      edges.forEach(({ source, target, label }) => {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(90,95,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Edge label
        const mx = (source.x + target.x) / 2;
        const my = (source.y + target.y) / 2;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(label, mx, my - 4);
      });

      // Draw nodes
      nodes.forEach((n) => {
        const isSelected = selected?.id === n.id;

        // Glow
        if (isSelected) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 24;
        }

        // Circle
        const grad = ctx.createRadialGradient(n.x - n.radius * 0.3, n.y - n.radius * 0.3, 0, n.x, n.y, n.radius);
        grad.addColorStop(0, n.color + 'cc');
        grad.addColorStop(1, n.color + '44');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? n.color : grad;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : n.color + '99';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = `${Math.max(10, Math.min(14, n.radius * 0.55))}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap text if needed
        const words = n.label.split(' ');
        if (words.length === 1 || n.radius > 40) {
          ctx.fillText(n.label.length > 20 ? n.label.slice(0, 18) + '…' : n.label, n.x, n.y);
        } else {
          const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
          const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
          ctx.fillText(line1.length > 16 ? line1.slice(0, 15) + '-' : line1, n.x, n.y - 7);
          ctx.fillText(line2.length > 16 ? line2.slice(0, 15) + '…' : line2, n.x, n.y + 7);
        }
      });

      ctx.restore();

      if (frame < 200) simulate();
      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [concepts, relationships, zoom, offset, selected]);

  const getNode = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / zoom;
    const my = (e.clientY - rect.top - offset.y) / zoom;
    return nodesRef.current.find((n) => {
      const dx = n.x - mx, dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });
  };

  const handleMouseDown = (e) => {
    const node = getNode(e);
    if (node) {
      dragging.current = node;
    } else {
      isPanning.current = true;
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (dragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      dragging.current.x += dx / zoom;
      dragging.current.y += dy / zoom;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e) => {
    if (dragging.current) {
      const moved = Math.abs(e.clientX - lastMouse.current.x) < 3 && Math.abs(e.clientY - lastMouse.current.y) < 3;
      if (moved) setSelected(dragging.current === selected ? null : dragging.current);
    }
    dragging.current = null;
    isPanning.current = false;
  };

  const handleClick = (e) => {
    const node = getNode(e);
    setSelected(node || null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  };

  const diffColor = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Network className="w-6 h-6 text-cyan-400" />
            Knowledge Graph
          </h2>
          <p className="text-white/50 text-sm mt-1">{subject} · {concepts.length} concepts · {relationships.length} relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              color: diffColor[difficulty] || '#a855f7',
              borderColor: (diffColor[difficulty] || '#a855f7') + '50',
              background: (diffColor[difficulty] || '#a855f7') + '15',
            }}
          >
            {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1) || 'Intermediate'}
          </span>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="p-2 glass-card rounded-xl hover:text-white text-white/50 transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="p-2 glass-card rounded-xl hover:text-white text-white/50 transition-all">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))} className="p-2 glass-card rounded-xl hover:text-white text-white/50 transition-all">
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card p-5">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-sm text-white/70 leading-relaxed">{summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2 glass-card overflow-hidden" style={{ height: '500px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            style={{ display: 'block' }}
          />
          <div className="absolute bottom-4 left-4 text-xs text-white/30 pointer-events-none">
            Drag nodes · Scroll to zoom · Click to inspect
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '500px' }}>
          <AnimatePresence>
            {selected && (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-5 border border-forge-500/40"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ background: selected.color + '33', border: `1px solid ${selected.color}55` }}
                  />
                  <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/70 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{selected.label}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-3">{selected.definition}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Importance</span>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-3 rounded-full"
                        style={{ background: i < (selected.importance || 5) ? selected.color : 'rgba(255,255,255,0.1)' }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Concept list */}
          {concepts.map((c, i) => (
            <motion.button
              key={c.id}
              onClick={() => setSelected(nodesRef.current.find((n) => n.id === c.id) || null)}
              className={`w-full text-left glass-card p-4 transition-all ${selected?.id === c.id ? 'border-forge-500/50' : ''}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: getNodeColor(c.importance || 5, i) }}
                />
                <div className="min-w-0">
                  <div className="font-medium text-sm text-white/90 truncate">{c.label}</div>
                  <div className="text-xs text-white/40 truncate">{c.definition?.slice(0, 60)}…</div>
                </div>
                <div className="ml-auto text-xs text-white/30 shrink-0">{c.importance || 5}/10</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Key facts */}
      {sessionData.keyFacts?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Key Facts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sessionData.keyFacts.map((fact, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-forge-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{fact}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


