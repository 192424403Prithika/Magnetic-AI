import React from 'react';
import { ShieldAlert, BookOpen, Atom, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-navy-800 bg-[#070D1E] text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Academic and Scientific Disclaimer Box */}
        <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-700/60 flex items-start space-x-3 text-slate-300">
          <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-semibold text-white">
              Academic & Computational Physics Capstone Disclaimer
            </p>
            <p className="text-[11px] text-slate-400">
              MAGNETIC AI is an integrated Engineering Physics and Machine Learning capstone platform. 
              The classification pipeline is trained on curated standard literature reference anchors augmented with physical simulated variations. 
              Class probabilities represent ensemble model scores, not certified metrological certainty. 
              All hysteresis and core loss models employ theoretical phenomenological, Jiles–Atherton, and Bertotti formulations. 
              Critical industrial designs must be certified with physical magnetometry (VSM, SQUID, Epstein frame).
            </p>
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[11px]">
          <div>
            <div className="font-semibold text-white mb-2 flex items-center space-x-1.5">
              <Atom className="w-4 h-4 text-teal-400" />
              <span>Physics Foundations</span>
            </div>
            <ul className="space-y-1 text-slate-400 font-mono text-[10px]">
              <li>B = μ0 (H + M) [SI Tesla]</li>
              <li>χ = M / H [Volume, Dimensionless]</li>
              <li>W = ∮ H dB [J/m³ per cycle]</li>
              <li>P_loss = Ph·f + Pe·f² + Pexc·f^1.5</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-white mb-2 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Standard SI Units</span>
            </div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>Field H: Amperes per meter (A/m)</li>
              <li>Induction B: Tesla (T)</li>
              <li>Magnetization M: Amperes per meter (A/m)</li>
              <li>Permeability μ: Henry per meter (H/m)</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-white mb-2">5 Magnetic Categories</div>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded bg-navy-800 text-slate-300 text-[10px]">Diamagnetic</span>
              <span className="px-2 py-0.5 rounded bg-navy-800 text-slate-300 text-[10px]">Paramagnetic</span>
              <span className="px-2 py-0.5 rounded bg-navy-800 text-slate-300 text-[10px]">Ferromagnetic</span>
              <span className="px-2 py-0.5 rounded bg-navy-800 text-slate-300 text-[10px]">Antiferromagnetic</span>
              <span className="px-2 py-0.5 rounded bg-navy-800 text-slate-300 text-[10px]">Ferrimagnetic</span>
            </div>
            <p className="mt-2 text-[10px] text-teal-400">
              *Hard vs Soft is a behavior class, not a 5th ordering state.
            </p>
          </div>

          <div>
            <div className="font-semibold text-white mb-2">Platform Stack</div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              React 18 · Vite · Tailwind CSS · Plotly.js · Three.js · FastAPI · Scikit-Learn · SHAP · ReportLab.
            </p>
            <p className="mt-2 text-[10px] text-slate-500 font-mono">
              © 2026 MAGNETIC AI Capstone. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
