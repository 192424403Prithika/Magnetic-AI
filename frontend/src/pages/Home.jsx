import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Activity, 
  Calculator, 
  Layers, 
  Thermometer, 
  Box, 
  UploadCloud, 
  BarChart2, 
  Zap, 
  HelpCircle, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Database,
  Sparkles,
  Compass,
  Atom,
  TrendingUp,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { getModelMetrics } from '../api/client';

const quickActions = [
  { name: 'AI Classifier', desc: '5-State ML Engine', icon: Cpu, path: '/classify', color: 'from-cyan-400 to-blue-500' },
  { name: 'Hysteresis Studio', desc: 'B-H & M-H ODEs', icon: Activity, path: '/hysteresis', color: 'from-teal-400 to-emerald-500' },
  { name: 'Calculator', desc: 'Instant Physics Solver', icon: Calculator, path: '/calculator', color: 'from-sky-400 to-indigo-500' },
  { name: '3D Domains', desc: 'Three.js Dipole Lattice', icon: Box, path: '/domains', color: 'from-cyan-300 to-teal-400' },
];

const labModules = [
  {
    title: 'Curie–Weiss Thermal Lab',
    desc: 'Simulate Tc/TN transitions, critical exponent scaling β≈0.35, and Langevin diamagnetism.',
    path: '/temperature',
    icon: Thermometer,
    tag: 'Thermodynamics'
  },
  {
    title: 'Bertotti Core Loss Analysis',
    desc: 'Separation of hysteresis (Wh·f), classical eddy (Pe·f²), and anomalous excess loss in W/m³ & W/kg.',
    path: '/frequency',
    icon: Zap,
    tag: 'Dynamic Loss'
  },
  {
    title: 'Multi-Material Benchmark',
    desc: 'Overlaid B-H induction loops, 5-axis polar radar charts, and industrial suitability matrix.',
    path: '/compare',
    icon: Layers,
    tag: 'Benchmarking'
  },
  {
    title: 'TreeSHAP Explainability (XAI)',
    desc: 'Audit model predictions with local Shapley feature attributions and GroupKFold confusion matrix.',
    path: '/xai',
    icon: BarChart2,
    tag: 'Model Transparency'
  },
  {
    title: 'Experimental CSV Analyzer',
    desc: 'Drag-and-drop raw VSM or SQUID magnetometry files for automated unit checks and loop extraction.',
    path: '/analyzer',
    icon: UploadCloud,
    tag: 'Empirical Data'
  },
  {
    title: 'Learning Centre & Viva Voce',
    desc: 'Interactive moment lattice notes, 20-question certification quiz, and oral defense exam guide.',
    path: '/learning',
    icon: HelpCircle,
    tag: 'Education'
  }
];

export default function Home() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    getModelMetrics()
      .then((res) => setMetrics(res.data))
      .catch((err) => console.log('Metrics fetch error:', err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hero Banner (DentaCare Card Aesthetic) */}
      <div className="relative rounded-3xl glass-card p-8 sm:p-12 overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-cyan-400/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-blue-500/20 blur-[100px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold text-cyan-300 border border-cyan-400/30 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Engineering Physics + Machine Learning Capstone</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Intelligent Magnetism <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 drop-shadow">
                Quantum Precision
              </span>
            </h1>

            <p className="text-cyan-100/80 text-sm sm:text-base leading-relaxed max-w-xl">
              An advanced computational physics environment: classify material ordering into 5 magnetic states, solve differential Jiles–Atherton hysteresis ODEs, explore 3D domain lattices, and audit decisions with Explainable AI.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/classify"
                className="px-6 py-3 glass-btn-primary text-xs sm:text-sm font-bold flex items-center space-x-2"
              >
                <span>Launch AI Classifier</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/hysteresis"
                className="px-5 py-3 glass-pill hover:bg-white/[0.14] text-xs sm:text-sm font-semibold text-white transition-all border border-white/25"
              >
                Hysteresis Studio
              </Link>

              <Link
                to="/reports"
                className="px-5 py-3 glass-pill hover:bg-white/[0.14] text-xs sm:text-sm font-medium text-cyan-200 transition-all border border-white/15 hidden sm:inline-flex"
              >
                Technical Reports
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Frosted Specimen Card (like the Tooth in DentaCare) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm p-6 rounded-3xl glass-card border border-white/25 shadow-[0_16px_40px_rgba(56,189,248,0.25)] flex flex-col items-center text-center space-y-4">
              
              {/* Luminous Glow Behind 3D Icon */}
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 via-teal-300 to-blue-500 p-0.5 shadow-[0_0_35px_rgba(56,189,248,0.6)] flex items-center justify-center">
                <div className="w-full h-full rounded-3xl bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
                  <Atom className="w-12 h-12 text-cyan-300 animate-spin" style={{ animationDuration: '18s' }} />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-lg">Pure Soft Iron (Fe)</h3>
                <p className="text-xs text-cyan-200/70 font-mono mt-0.5">Reference Specimen Standard</p>
              </div>

              {/* Quick Specimen Chips */}
              <div className="grid grid-cols-2 gap-2 w-full text-left text-xs">
                <div className="p-2.5 rounded-2xl glass-card-subtle">
                  <span className="text-[10px] text-cyan-200/60 uppercase font-mono">Coercivity (Hc)</span>
                  <div className="font-bold text-cyan-300 font-mono text-sm">40.0 A/m</div>
                </div>
                <div className="p-2.5 rounded-2xl glass-card-subtle">
                  <span className="text-[10px] text-cyan-200/60 uppercase font-mono">Remanence (Br)</span>
                  <div className="font-bold text-white font-mono text-sm">1.15 Tesla</div>
                </div>
                <div className="p-2.5 rounded-2xl glass-card-subtle">
                  <span className="text-[10px] text-cyan-200/60 uppercase font-mono">Curie Point (Tc)</span>
                  <div className="font-bold text-teal-300 font-mono text-sm">1,043 K</div>
                </div>
                <div className="p-2.5 rounded-2xl glass-card-subtle">
                  <span className="text-[10px] text-cyan-200/60 uppercase font-mono">Behavior</span>
                  <div className="font-bold text-emerald-300 font-mono text-sm">Soft Magnetic</div>
                </div>
              </div>

              <Link
                to="/calculator"
                className="w-full py-2.5 rounded-full glass-pill hover:bg-white/[0.15] text-xs font-bold text-cyan-300 flex items-center justify-center space-x-1.5 transition-colors border border-cyan-400/30"
              >
                <span>Calculate & Verify Parameters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10 text-xs">
          <div>
            <div className="text-2xl font-black text-cyan-400">5 Classes</div>
            <div className="text-[11px] text-cyan-100/60 mt-0.5">Diamag / Paramag / Ferro / Antiferro / Ferri</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics ? `${(metrics.overall_accuracy * 100).toFixed(1)}%` : '77.8%'}
            </div>
            <div className="text-[11px] text-cyan-100/60 mt-0.5">Cross-Validated Accuracy (k=5)</div>
          </div>
          <div>
            <div className="text-2xl font-black text-teal-300">
              {metrics ? metrics.best_model : 'Gradient Boosting'}
            </div>
            <div className="text-[11px] text-cyan-100/60 mt-0.5">Champion Model Architecture</div>
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-300">100% SI</div>
            <div className="text-[11px] text-cyan-100/60 mt-0.5">Rigorous Physical Dimensions</div>
          </div>
        </div>
      </div>

      {/* 4 Frosted Pebble Quick Action Buttons (like DentaCare top action icons) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
          Core Laboratories & Fast Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.name}
                to={act.path}
                className="p-4 rounded-3xl glass-card-interactive flex flex-col items-center text-center space-y-2.5 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${act.color} flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-slate-950 font-bold" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                    {act.name}
                  </h3>
                  <p className="text-[10px] text-cyan-200/60 font-mono mt-0.5">
                    {act.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Popular Lab Modules Grid (like DentaCare "Popular Treatments") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Specialized Physics & Characterization Modules
          </h2>
          <span className="text-xs font-mono text-cyan-300 glass-pill px-3 py-1">
            6 Advanced Labs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labModules.map((lab) => {
            const Icon = lab.icon;
            return (
              <Link
                key={lab.path}
                to={lab.path}
                className="p-6 rounded-3xl glass-card-interactive flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl glass-card-subtle flex items-center justify-center group-hover:border-cyan-400/40 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-300" />
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full glass-pill text-cyan-300">
                      {lab.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                      {lab.title}
                    </h3>
                    <p className="text-xs text-cyan-100/70 leading-relaxed mt-1">
                      {lab.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center text-xs font-bold text-cyan-300 group-hover:translate-x-1 transition-transform">
                  <span>Enter Laboratory</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
