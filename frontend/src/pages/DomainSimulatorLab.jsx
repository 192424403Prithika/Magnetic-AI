import React, { useState } from 'react';
import { Box, Sliders, Info, Compass, RotateCcw, Sparkles } from 'lucide-react';
import Domain3DCanvas from '../components/Domain3DCanvas';

export default function DomainSimulatorLab() {
  const [fieldH, setFieldH] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Interactive 3D Microstructure</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <Box className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>3D Magnetic Domain Microstructure Simulator</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Interactive Three.js dipole lattice simulating domain wall displacement at low fields, followed by coherent spin rotation against magnetocrystalline anisotropy at high excitation fields.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main 3D Canvas (8 cols) */}
        <div className="lg:col-span-8">
          <Domain3DCanvas externalFieldH={fieldH} onFieldChange={setFieldH} />
        </div>

        {/* Physics Theory & Microstructure Guide (4 cols) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-5">
          <h3 className="font-bold text-white text-base flex items-center space-x-2 border-b border-white/10 pb-3">
            <Compass className="w-5 h-5 text-cyan-300" />
            <span>Domain Physics & Kinetics</span>
          </h3>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl glass-card-subtle space-y-1.5 border border-white/10">
              <h4 className="font-bold text-cyan-300">1. Demagnetized Ground State (H = 0)</h4>
              <p className="text-cyan-100/70 text-[11px]">
                In zero field, materials minimize magnetostatic self-demagnetizing energy by dividing into microscopic closure domains with vectors pointing in mutually cancelling easy crystallographic axes.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-card-subtle space-y-1.5 border border-white/10">
              <h4 className="font-bold text-cyan-300">2. Domain Wall Motion (Low H)</h4>
              <p className="text-cyan-100/70 text-[11px]">
                At small applied fields, domains favorably oriented with H expand. The 180° and 90° Bloch/Néel walls shift laterally. Motion is initially reversible, then becomes irreversible as walls overcome microstructural pinning obstacles (Barkhausen jumps).
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-card-subtle space-y-1.5 border border-white/10">
              <h4 className="font-bold text-cyan-300">3. Coherent Spin Rotation (High H)</h4>
              <p className="text-cyan-100/70 text-[11px]">
                When domain wall motion is complete, remaining atomic moments must rotate out of their crystallographic easy directions toward the external field vector against the magnetocrystalline anisotropy energy K1, until saturation Ms is achieved.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl glass-card-subtle border border-cyan-400/30 text-cyan-200 text-[11px]">
              <b className="text-cyan-300">Color Dynamics:</b> Cyan arrows represent spins aligned with the applied field (+H). Rose arrows represent opposing spins (-H). Purple represents orthogonal spins.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
