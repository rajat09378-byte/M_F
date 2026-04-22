import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import { Box, Play, Pause, SkipBack, SkipForward, CheckCircle2, Code2 } from 'lucide-react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Dark Neon Palette
const COLORS = {
  bg: "#060812",
  panel: "#11111f",
  border: "#1e1e3a",
  accentGlow: "#a855f7",
  found: "#22d3ee",
  complement: "#f59e0b",
  text: "#e2e8f0",
  muted: "#64748b",
};

// Helper to create glowing text sprite
function createTextSprite(text, color = '#ffffff', fontSize = 32) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  
  const paddingX = 24;
  const paddingY = 16;
  canvas.width = textWidth + paddingX * 2;
  canvas.height = fontSize + paddingY * 2;
  
  // Draw background pill
  ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
  ctx.beginPath();
  ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 16);
  ctx.fill();
  
  // Glowing border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw text
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width * 0.008, canvas.height * 0.008, 1); // Significantly reduced scale
  return sprite;
}

export default function Visualizer3D() {
  const { sessionData } = useSession();
  const containerRef = useRef(null);
  const config = sessionData?.visualization3D;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepData, setStepData] = useState(null);
  
  const engineRef = useRef(null);

  // Initialize Cinematic Engine
  useEffect(() => {
    if (!containerRef.current || !config) return;
    const el = containerRef.current;
    const w = el.clientWidth, h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    if (config.scene?.fog) {
      scene.fog = new THREE.FogExp2(COLORS.bg, 0.015);
    }

    const camConfig = config.camera || { position: [0, 4, 12], lookAt: [0, 0, 0], fov: 60 };
    const camera = new THREE.PerspectiveCamera(camConfig.fov, w / h, 0.1, 1000);
    camera.position.set(...camConfig.position);
    camera.lookAt(...camConfig.lookAt);

    // Post-Processing Pipeline (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Cinematic Lighting
    scene.add(new THREE.AmbientLight('#ffffff', 1.5));
    const dl = new THREE.DirectionalLight('#ffffff', 2);
    dl.position.set(5, 10, 7);
    scene.add(dl);
    const pl1 = new THREE.PointLight(COLORS.found, 4, 100);
    pl1.position.set(5, 10, 5);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(COLORS.accentGlow, 3, 100);
    pl2.position.set(-5, 5, -5);
    scene.add(pl2);

    // Atmospheric Grid Floor
    const gridHelper = new THREE.GridHelper(60, 60, COLORS.border, COLORS.border);
    gridHelper.position.y = -6;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);

    // Object Registry
    const meshMap = new Map();
    const connectionLines = [];

    // Create Premium Objects
    (config.objects || []).forEach(obj => {
      let geo;
      const r = obj.geometry?.radius || 0.5;
      const [width, height, depth] = [obj.geometry?.width || 1, obj.geometry?.height || 1, obj.geometry?.depth || 1];
      
      const c = new THREE.Color(obj.color || '#334155');
      const em = new THREE.Color(obj.emissive || obj.color || '#000000');
      
      // Bright Neon Material
      const mat = new THREE.MeshStandardMaterial({ 
        color: c, 
        emissive: em,
        emissiveIntensity: 0.8,
        transparent: true, 
        opacity: obj.opacity ?? 0.9,
        roughness: 0.2,
        metalness: 0.1
      });

      if (obj.type === 'sphere') geo = new THREE.SphereGeometry(r, 64, 64);
      else if (obj.type === 'box' || obj.type === 'bar') geo = new THREE.BoxGeometry(width, height, depth);
      else if (obj.type === 'cylinder') geo = new THREE.CylinderGeometry(r, r, height, 64);
      else if (obj.type === 'cone') geo = new THREE.ConeGeometry(r, height, 64);
      else geo = new THREE.SphereGeometry(r, 32, 32);

      const mesh = new THREE.Mesh(geo, mat);
      if (obj.position) mesh.position.set(...obj.position);
      if (obj.scale) mesh.scale.set(...obj.scale);
      
      // Floating Label
      if (obj.label) {
        const labelSprite = createTextSprite(obj.label, '#' + c.getHexString());
        labelSprite.position.set(0, r + 0.6, 0);
        mesh.add(labelSprite);
      }
      if (obj.displayValue) {
        const valSprite = createTextSprite(obj.displayValue, COLORS.found, 28);
        valSprite.position.set(0, -r - 0.5, 0);
        valSprite.name = 'displayValue';
        mesh.add(valSprite);
      }

      scene.add(mesh);
      meshMap.set(obj.id, mesh);
    });

    // Create Glowing Connections
    (config.connections || []).forEach(conn => {
      const fromMesh = meshMap.get(conn.from);
      const toMesh = meshMap.get(conn.to);
      if (fromMesh && toMesh) {
        const c = new THREE.Color(conn.color || COLORS.border);
        const mat = new THREE.LineBasicMaterial({ 
          color: c, 
          transparent: true, 
          opacity: conn.opacity ?? 0.6,
          linewidth: 2
        });
        const geo = new THREE.BufferGeometry().setFromPoints([fromMesh.position, toMesh.position]);
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        
        let labelSprite = null;
        if (conn.weightLabel || conn.weight) {
          labelSprite = createTextSprite(String(conn.weightLabel || conn.weight), '#' + c.getHexString(), 24);
          scene.add(labelSprite);
        }
        
        connectionLines.push({ line, fromMesh, toMesh, labelSprite });
      }
    });

    // Animation Engine state
    const tweens = [];
    let camTargetPos = camera.position.clone();
    let camTargetLook = new THREE.Vector3(...camConfig.lookAt);

    // Expose engine control
    engineRef.current = {
      applyStep: (stepIndex) => {
        if (!config.steps || !config.steps[stepIndex]) return;
        const step = config.steps[stepIndex];
        
        // Camera
        if (step.camera) {
          camTargetPos.set(...step.camera.moveTo);
          camTargetLook.set(...step.camera.lookAt);
        }

        // Actions
        (step.actions || []).forEach(act => {
          const target = meshMap.get(act.targetId);
          if (!target) return;
          
          const dur = act.duration || 500;
          
          if (act.type === 'color') {
            const startColor = target.material.color.clone();
            const endColor = new THREE.Color(act.value);
            tweens.push({
              dur, elapsed: 0,
              update: (t) => {
                target.material.color.lerpColors(startColor, endColor, t);
                target.material.emissive.lerpColors(startColor, endColor, t);
              }
            });
          } else if (act.type === 'scale') {
            const startScale = target.scale.clone();
            const endScale = new THREE.Vector3(...act.value);
            tweens.push({
              dur, elapsed: 0,
              update: (t) => target.scale.lerpVectors(startScale, endScale, t)
            });
          } else if (act.type === 'position') {
            const startPos = target.position.clone();
            const endPos = new THREE.Vector3(...act.value);
            tweens.push({
              dur, elapsed: 0,
              update: (t) => target.position.lerpVectors(startPos, endPos, t)
            });
          } else if (act.type === 'pulse') {
            const startScale = target.scale.clone();
            const upScale = startScale.clone().multiplyScalar(1.5);
            tweens.push({
              dur, elapsed: 0,
              update: (t) => {
                const s = t < 0.5 ? t * 2 : 1 - (t - 0.5) * 2;
                target.scale.lerpVectors(startScale, upScale, s);
              }
            });
          } else if (act.type === 'displayValue') {
            const oldSprite = target.children.find(c => c.name === 'displayValue');
            if (oldSprite) target.remove(oldSprite);
            const valSprite = createTextSprite(String(act.value), COLORS.found, 28);
            const r = target.geometry.parameters.radius || 0.5;
            valSprite.position.set(0, -r - 0.5, 0);
            valSprite.name = 'displayValue';
            target.add(valSprite);
          }
        });
      }
    };

    let lastTime = performance.now();
    const animate = (time) => {
      const id = requestAnimationFrame(animate);
      renderer.animId = id;
      const dt = time - lastTime;
      lastTime = time;

      // Update Tweens
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tween = tweens[i];
        tween.elapsed += dt;
        let t = Math.min(tween.elapsed / tween.dur, 1);
        t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // EaseInOut
        tween.update(t);
        if (tween.elapsed >= tween.dur) tweens.splice(i, 1);
      }

      // Smooth Camera Drift
      const driftTime = time * 0.0002;
      const driftRadius = 1.0;
      const targetX = camTargetPos.x + Math.sin(driftTime) * driftRadius;
      const targetZ = camTargetPos.z + Math.cos(driftTime) * driftRadius;
      
      camera.position.lerp(new THREE.Vector3(targetX, camTargetPos.y, targetZ), 0.05);
      
      const lookAtVec = new THREE.Vector3();
      camera.getWorldDirection(lookAtVec);
      lookAtVec.add(camera.position).lerp(camTargetLook, 0.05);
      camera.lookAt(camTargetLook);

      // Update connection lines
      connectionLines.forEach(({ line, fromMesh, toMesh, labelSprite }) => {
        const positions = line.geometry.attributes.position.array;
        positions[0] = fromMesh.position.x; positions[1] = fromMesh.position.y; positions[2] = fromMesh.position.z;
        positions[3] = toMesh.position.x; positions[4] = toMesh.position.y; positions[5] = toMesh.position.z;
        line.geometry.attributes.position.needsUpdate = true;
        
        if (labelSprite) {
          labelSprite.position.copy(fromMesh.position).lerp(toMesh.position, 0.5);
        }
      });

      composer.render();
    };
    animate(performance.now());

    const handleResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      renderer.setSize(nw, nh);
      composer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(renderer.animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [config]);

  // Handle Step Changes
  useEffect(() => {
    if (!config || !config.steps) return;
    const step = config.steps[currentStep];
    setStepData(step);
    if (engineRef.current) engineRef.current.applyStep(currentStep);
  }, [currentStep, config]);

  // Autoplay Logic
  useEffect(() => {
    let timer;
    if (isPlaying && config && config.steps) {
      const step = config.steps[currentStep];
      const duration = step?.duration || 2000;
      timer = setTimeout(() => {
        if (currentStep < config.steps.length - 1) {
          setCurrentStep(c => c + 1);
        } else {
          setIsPlaying(false);
        }
      }, duration + 500);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, config]);

  if (!config) return null;

  const codeLines = config.extractedData?.codeLines || [];

  return (
    <div className="relative w-full flex h-[700px] font-mono text-white rounded-2xl overflow-hidden border border-[#1e1e3a]" style={{ backgroundColor: COLORS.bg }}>
      
      {/* 3D Canvas Area */}
      <div className="relative flex-1 h-full overflow-hidden">
        
        {/* Top Header */}
        <div className="absolute top-0 left-0 w-full p-6 flex items-start justify-between z-20 pointer-events-none">
          <div>
            <div style={{ color: COLORS.accentGlow, fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', textShadow: `0 0 15px ${COLORS.accentGlow}` }}>
              Algorithm Visualizer
            </div>
            <h2 className="text-3xl font-bold mt-1 tracking-tight" style={{ color: COLORS.text }}>
              {config.topic || 'Simulation'}
            </h2>
            <p className="text-sm mt-2 opacity-70 max-w-lg">
              {config.description}
            </p>
          </div>
          
          <div className="flex gap-3">
            {config.subjectType && (
              <div className="px-4 py-1.5 rounded-md text-xs font-bold border" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border, color: COLORS.accentGlow }}>
                {config.subjectType}
              </div>
            )}
            {config.difficulty && (
              <div className="px-4 py-1.5 rounded-md text-xs font-bold border" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border, color: COLORS.found }}>
                {config.difficulty}
              </div>
            )}
          </div>
        </div>

        {/* The Three.js Container */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* Dynamic UI Overlays */}
        <AnimatePresence mode="wait">
          {stepData && (
            <>
              {/* Step Annotations (Top Left) */}
              <motion.div 
                key={`step-${currentStep}`}
                className="absolute top-28 left-6 z-20 pointer-events-none"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-80 p-4 rounded-xl border shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(17, 17, 31, 0.85)', borderColor: COLORS.border }}>
                  <div style={{ color: COLORS.muted, fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Step {stepData.stepNumber} / {config.steps.length}
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-white">
                    {stepData.title}
                  </h3>
                  <p style={{ color: COLORS.text, fontSize: '13px', lineHeight: '1.5', opacity: 0.8 }}>
                    {stepData.annotate || stepData.description}
                  </p>
                </div>
              </motion.div>

              {/* Formula & State (Bottom Right corner of the 3D view) */}
              <motion.div 
                key={`state-${currentStep}`}
                className="absolute bottom-28 right-6 flex flex-col gap-3 items-end z-20 pointer-events-none"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {stepData.formulaBox && (
                  <div className="px-5 py-3 rounded-xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(17, 17, 31, 0.85)', borderColor: COLORS.border }}>
                    <div style={{ color: COLORS.found, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>Formula</div>
                    <div className="text-md font-bold text-white tracking-wide">{stepData.formulaBox}</div>
                  </div>
                )}
                
                {config.stateTable && (
                  <div className="p-4 rounded-xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(17, 17, 31, 0.85)', borderColor: COLORS.border, minWidth: '280px' }}>
                    <div style={{ color: COLORS.muted, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{config.stateTable.title}</div>
                    <table className="text-xs text-left w-full text-white">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          {config.stateTable.headers.map((h, i) => <th key={i} className="pb-1.5 pr-4 text-gray-500 font-normal tracking-wide">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {config.stateTable.initialRows?.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, j) => <td key={j} className="pt-1.5 pr-4 text-gray-200">{val}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Final Answer Banner */}
        <AnimatePresence>
          {currentStep === (config.steps?.length - 1) && config.finalAnswer && (
            <motion.div 
              className="absolute top-6 right-6 p-5 rounded-2xl flex flex-col items-end shadow-2xl z-30 border backdrop-blur-lg"
              style={{ backgroundColor: 'rgba(15, 42, 42, 0.9)', borderColor: COLORS.visited }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <div className="flex items-center gap-1.5 mb-1" style={{ color: COLORS.visited }}>
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold tracking-widest uppercase text-xs">Final Result</span>
              </div>
              <div className="text-2xl font-black text-white mb-1 tracking-tight">
                {config.finalAnswer.result} <span className="text-sm text-gray-400 font-normal">{config.finalAnswer.unit}</span>
              </div>
              <div style={{ color: COLORS.muted, fontSize: '12px', textAlign: 'right', maxWidth: '250px' }}>
                {config.finalAnswer.workingStr}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Controls */}
        <div className="absolute bottom-0 left-0 w-full h-24 flex items-center justify-center gap-6 z-30 bg-gradient-to-t from-black to-transparent pointer-events-auto">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="p-3 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-4 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${COLORS.accentGlow}, #7c3aed)`, boxShadow: `0 0 20px ${COLORS.accentGlow}66` }}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button 
            onClick={() => setCurrentStep(Math.min((config.steps?.length || 1) - 1, currentStep + 1))}
            disabled={currentStep === (config.steps?.length || 1) - 1}
            className="p-3 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Code Viewer Panel */}
      {codeLines.length > 0 && (
        <div className="w-[380px] h-full flex flex-col border-l z-40 relative" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
          <div className="p-4 flex items-center gap-2 border-b" style={{ borderColor: COLORS.border }}>
            <Code2 className="w-5 h-5" style={{ color: COLORS.accentGlow }} />
            <h3 className="font-bold text-sm tracking-wide text-white">LIVE EXECUTION</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed">
            {codeLines.map((line, i) => {
              // Usually line numbers are 1-indexed in step data, so i+1
              const isActive = stepData?.execLine === (i + 1);
              
              return (
                <div 
                  key={i} 
                  className="flex rounded-md py-1 px-2 transition-all duration-300 relative"
                  style={{ 
                    backgroundColor: isActive ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  }}
                >
                  {/* Left border highlight */}
                  {isActive && (
                    <div className="absolute left-0 top-0 w-1 h-full rounded-l-md shadow-lg" style={{ backgroundColor: COLORS.accentGlow, boxShadow: `0 0 10px ${COLORS.accentGlow}` }} />
                  )}
                  
                  <div className="w-8 text-right pr-4 select-none" style={{ color: isActive ? COLORS.accentGlow : COLORS.muted }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 whitespace-pre" style={{ color: isActive ? '#ffffff' : COLORS.text, textShadow: isActive ? `0 0 8px ${COLORS.accentGlow}` : 'none' }}>
                    {line}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
