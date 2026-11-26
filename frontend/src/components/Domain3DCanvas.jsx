import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Eye, Compass, Layers } from 'lucide-react';

export default function Domain3DCanvas({ externalFieldH = 0, onFieldChange = null }) {
  const mountRef = useRef(null);
  const [field, setField] = useState(externalFieldH);
  const [is3D, setIs3D] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [readout, setReadout] = useState({ m_ratio: 0, aligned_pct: 50, regime: 'Demagnetized State' });

  // Grid dimensions
  const GRID_SIZE = 6;
  const SPACING = 1.6;

  // Scene refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const arrowsGroupRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0.3, y: 0.5 });

  // Sync internal field with prop
  useEffect(() => {
    setField(externalFieldH);
  }, [externalFieldH]);

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current || !is3D) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 400;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070D1E);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x2DD4BF, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 3. Grid of Dipole Arrows
    const arrowsGroup = new THREE.Group();
    arrowsGroupRef.current = arrowsGroup;
    scene.add(arrowsGroup);

    // Seed domain orientations (4 distinct domains)
    const offset = ((GRID_SIZE - 1) * SPACING) / 2;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < (is3D ? 3 : 1); z++) {
          const posX = x * SPACING - offset;
          const posY = y * SPACING - offset;
          const posZ = z * SPACING - (is3D ? SPACING : 0);

          // Arrow container
          const arrowObj = new THREE.Group();
          arrowObj.position.set(posX, posY, posZ);

          // Shaft
          const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
          shaftGeo.translate(0, 0.4, 0);
          const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8 });
          const shaft = new THREE.Mesh(shaftGeo, shaftMat);
          arrowObj.add(shaft);

          // Head (Cone)
          const coneGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
          coneGeo.translate(0, 0.95, 0);
          const coneMat = new THREE.MeshStandardMaterial({ color: 0x14B8A6 });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          arrowObj.add(cone);

          // Store domain metadata for physical orientation update
          // Assign initial domains (checkerboard/stripes)
          const domainId = (x < GRID_SIZE / 2 ? 0 : 1) + (y < GRID_SIZE / 2 ? 0 : 2);
          let initialTheta = 0;
          if (domainId === 0) initialTheta = Math.PI / 2;
          else if (domainId === 1) initialTheta = -Math.PI / 2;
          else if (domainId === 2) initialTheta = 0;
          else initialTheta = Math.PI;

          arrowObj.userData = {
            baseTheta: initialTheta,
            domainId,
            pinningStrength: 0.6 + Math.random() * 0.8
          };

          arrowsGroup.add(arrowObj);
        }
      }
    }

    // Interactive Drag to Rotate
    const handleMouseDown = (e) => {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isMouseDownRef.current || !arrowsGroupRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      rotRef.current.y += dx * 0.008;
      rotRef.current.x += dy * 0.008;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (arrowsGroupRef.current) {
        arrowsGroupRef.current.rotation.x = rotRef.current.x;
        arrowsGroupRef.current.rotation.y = rotRef.current.y;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight || 400;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [is3D]);

  // Update Dipole Orientations based on Applied Magnetic Field H
  useEffect(() => {
    if (!arrowsGroupRef.current) return;

    // Physical 2-stage response:
    // H_norm in [-1, +1]
    const h_norm = Math.max(-1, Math.min(1, field / 10000));
    const h_mag = Math.abs(h_norm);

    let sumCos = 0;
    let alignedCount = 0;
    const total = arrowsGroupRef.current.children.length;

    arrowsGroupRef.current.children.forEach((arrow) => {
      const { baseTheta, pinningStrength } = arrow.userData;

      let theta;
      if (h_mag < 0.45) {
        // Stage 1: Domain wall motion
        // Domains with moments aligned with H grow at the expense of opposing domains
        const wallShift = (h_norm / pinningStrength) * 0.9;
        const sign = Math.sign(h_norm || 1);
        theta = baseTheta * (1 - Math.min(1, h_mag * 1.5)) + (sign > 0 ? 0 : Math.PI) * Math.min(1, h_mag * 1.5);
      } else {
        // Stage 2: Domain rotation
        // Overcomes magnetocrystalline anisotropy toward H direction (angle 0 for +H, PI for -H)
        const targetTheta = h_norm > 0 ? 0 : Math.PI;
        const rotProgress = (h_mag - 0.45) / 0.55;
        theta = targetTheta * rotProgress + (1 - rotProgress) * (h_norm > 0 ? 0.3 : Math.PI - 0.3);
      }

      arrow.rotation.z = -theta + Math.PI / 2;

      // Color coding: teal for aligned, slate/red for anti-aligned
      const cosVal = Math.cos(theta);
      sumCos += cosVal;
      if (cosVal > 0.7) alignedCount++;

      const headMesh = arrow.children[1];
      if (headMesh && headMesh.material) {
        if (cosVal > 0.4) {
          headMesh.material.color.setHex(0x14B8A6); // Teal (aligned)
        } else if (cosVal < -0.4) {
          headMesh.material.color.setHex(0xEF4444); // Red (opposing)
        } else {
          headMesh.material.color.setHex(0x3B82F6); // Blue (orthogonal)
        }
      }
    });

    const mRatio = total > 0 ? sumCos / total : 0;
    let regimeStr = 'Demagnetized State';
    if (h_mag > 0.85) regimeStr = 'Technical Saturation (Single Domain)';
    else if (h_mag > 0.45) regimeStr = 'Domain Rotation against Anisotropy';
    else if (h_mag > 0.05) regimeStr = 'Domain Wall Displacement';

    setReadout({
      m_ratio: Number(mRatio.toFixed(3)),
      aligned_pct: Math.round((alignedCount / (total || 1)) * 100),
      regime: regimeStr
    });
  }, [field, is3D]);

  // Sweep Animation
  useEffect(() => {
    let sweepId;
    if (isSweeping) {
      let t = 0;
      const interval = setInterval(() => {
        t += 0.04;
        const sweptH = Math.sin(t) * 10000;
        setField(sweptH);
        if (onFieldChange) onFieldChange(sweptH);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isSweeping, onFieldChange]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setField(val);
    if (onFieldChange) onFieldChange(val);
  };

  const handleReset = () => {
    setIsSweeping(false);
    setField(0);
    rotRef.current = { x: 0.3, y: 0.5 };
    if (onFieldChange) onFieldChange(0);
  };

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <span>Magnetic Domain Microstructure Simulator</span>
          </h3>
          <p className="text-xs text-slate-400">
            Interactive visualization of domain wall displacement and coherent rotation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIs3D(!is3D)}
            className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-medium text-slate-200 border border-navy-600 flex items-center space-x-1.5"
          >
            {is3D ? <Layers className="w-3.5 h-3.5 text-teal-400" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
            <span>{is3D ? 'Switch to 2D' : 'Switch to 3D'}</span>
          </button>

          <button
            onClick={() => setIsSweeping(!isSweeping)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isSweeping
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-teal-500 text-navy-950 hover:bg-teal-400'
            }`}
          >
            {isSweeping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSweeping ? 'Pause Sweep' : 'Auto Sweep'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white"
            title="Reset Orientation & Field"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas / 2D Grid Area */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden border border-navy-800 bg-[#070D1E]">
        {is3D ? (
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: 36 }).map((_, i) => {
                const hNorm = Math.max(-1, Math.min(1, field / 10000));
                const rotDeg = hNorm * 90;
                return (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg bg-navy-800/80 border border-navy-700 flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `rotate(${rotDeg}deg)` }}
                  >
                    <span className="text-teal-400 font-bold text-xs">↑</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Orbit Helper Overlay */}
        {is3D && (
          <div className="absolute bottom-2 left-3 text-[10px] text-slate-500 pointer-events-none">
            Click & drag to rotate view in 3D space
          </div>
        )}
      </div>

      {/* Applied Field Slider & Readout Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Applied Field Intensity (H):</span>
            <span className="font-mono text-teal-400 font-bold">{Math.round(field).toLocaleString()} A/m</span>
          </div>
          <input
            type="range"
            min="-10000"
            max="10000"
            step="100"
            value={field}
            onChange={handleSliderChange}
            className="w-full h-2 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-10 kA/m (Reverse Saturation)</span>
            <span>0 A/m</span>
            <span>+10 kA/m (Forward Saturation)</span>
          </div>
        </div>

        {/* Live Readout Metrics */}
        <div className="p-3 rounded-xl bg-navy-800/60 border border-navy-700/60 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Net Magnetization (M/Ms):</span>
            <span className="font-mono font-bold text-teal-300">{readout.m_ratio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Spins Aligned:</span>
            <span className="font-mono font-bold text-slate-200">{readout.aligned_pct}%</span>
          </div>
          <div className="text-[10px] pt-1 border-t border-navy-700 text-teal-400 font-semibold truncate">
            {readout.regime}
          </div>
        </div>
      </div>
    </div>
  );
}
