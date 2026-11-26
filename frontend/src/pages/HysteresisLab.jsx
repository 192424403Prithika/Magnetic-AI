import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Layers, 
  Info, 
  Zap, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { simulateHysteresis } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

export default function HysteresisLab() {
  const [modelType, setModelType] = useState('phenomenological'); // 'phenomenological' | 'jiles_atherton'
  const [loading, setLoading] = useState(false);
  const [loopData, setLoopData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sweepIdx, setSweepIdx] = useState(0);

  // Model parameters state
  const [params, setParams] = useState({
    ms: 1.5e6,       // A/m
    hc: 2000.0,      // A/m
    squareness: 0.75,
    h_max: 10000.0,   // A/m
    // Jiles-Atherton specific
    a: 1100.0,
    k: 1600.0,
    c: 0.2,
    alpha: 1.6e-3
  });

  const [activeTab, setActiveTab] = useState('BH'); // 'BH' | 'MH'

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulateHysteresis({
        model_type: modelType,
        ms: params.ms,
        hc: params.hc,
        squareness: params.squareness,
        h_max: params.h_max,
        a: params.a,
        k: params.k,
        c: params.c,
        alpha: params.alpha,
        num_points: 200
      });
      setLoopData(res.data);
      setSweepIdx(0);
    } catch (err) {
      console.error('Hysteresis simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation();
  }, [modelType]);

  // Sweep Animation Loop
  useEffect(() => {
    let timer;
    if (isPlaying && loopData?.h_loop) {
      timer = setInterval(() => {
        setSweepIdx((prev) => (prev + 1) % loopData.h_loop.length);
      }, 40);
    }
    return () => clearInterval(timer);
  }, [isPlaying, loopData]);

  const handleParamChange = (field, val) => {
    setParams((prev) => ({ ...prev, [field]: parseFloat(val) }));
  };

  // Prepare Plotly traces
  const currentTraceY = activeTab === 'BH' ? loopData?.b_loop : loopData?.m_loop;
  const currentVirginY = activeTab === 'BH' ? loopData?.b_virgin : loopData?.m_virgin;
  const yAxisTitle = activeTab === 'BH' ? 'Magnetic Induction B (Tesla)' : 'Magnetization M (A/m)';

  const currentHPoint = loopData?.h_loop ? loopData.h_loop[sweepIdx] : 0;
  const currentYPoint = currentTraceY ? currentTraceY[sweepIdx] : 0;

  const plotData = loopData
    ? [
        // Major Closed Loop
        {
          x: loopData.h_loop,
          y: currentTraceY,
          type: 'scatter',
          mode: 'lines',
          name: `${activeTab} Major Loop`,
          line: { color: '#38BDF8', width: 2.8 },
          fill: 'toself',
          fillcolor: 'rgba(56, 189, 248, 0.12)'
        },
        // Initial Virgin Magnetization Curve
        {
          x: loopData.h_virgin,
          y: currentVirginY,
          type: 'scatter',
          mode: 'lines',
          name: 'Virgin Curve',
          line: { color: '#FBBF24', width: 2, dash: 'dot' }
        },
        // Current Animated Field Point
        {
          x: [currentHPoint],
          y: [currentYPoint],
          type: 'scatter',
          mode: 'markers',
          name: 'Sweep Vector',
          marker: { color: '#F43F5E', size: 11, symbol: 'circle', line: { color: '#FFFFFF', width: 2 } }
        }
      ]
    : [];

  const p = loopData?.parameters || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Interactive Magnetization Dynamics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
            <Activity className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
            <span>Magnetic Hysteresis Lab (B-H & M-H)</span>
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
            Simulate dynamic magnetization kinetics, evaluate cyclic loop energy losses (∮ H dB), and compare phenomenological tanh curves vs physical Jiles–Atherton ODE systems.
          </p>
        </div>

        {/* Model Switcher Pill */}
        <div className="glass-card-subtle p-1.5 rounded-full flex items-center space-x-1.5 border border-white/15 shadow-inner">
          <button
            onClick={() => setModelType('phenomenological')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              modelType === 'phenomenological'
                ? 'glass-btn-primary text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Empirical Tanh
          </button>
          <button
            onClick={() => setModelType('jiles_atherton')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              modelType === 'jiles_atherton'
                ? 'glass-btn-primary text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Jiles–Atherton ODE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column (4 cols) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span>Model Parameters</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">SI Units</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Common: Saturation Ms */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Saturation Ms:</span>
                <span className="font-mono text-cyan-300 font-bold">{params.ms.toExponential(2)} A/m</span>
              </div>
              <input
                type="range"
                min="100000"
                max="2500000"
                step="50000"
                value={params.ms}
                onChange={(e) => handleParamChange('ms', e.target.value)}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Common: Peak Field Hmax */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Applied Peak Field (Hmax):</span>
                <span className="font-mono text-cyan-300 font-bold">{params.h_max.toLocaleString()} A/m</span>
              </div>
              <input
                type="range"
                min="2000"
                max="50000"
                step="1000"
                value={params.h_max}
                onChange={(e) => handleParamChange('h_max', e.target.value)}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {modelType === 'phenomenological' ? (
              <>
                {/* Coercivity Hc */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Coercivity (Hc):</span>
                    <span className="font-mono text-cyan-300 font-bold">{params.hc.toLocaleString()} A/m</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="15000"
                    step="50"
                    value={params.hc}
                    onChange={(e) => handleParamChange('hc', e.target.value)}
                    className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Squareness S = Mr / Ms */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Loop Squareness (Mr/Ms):</span>
                    <span className="font-mono text-cyan-300 font-bold">{params.squareness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={params.squareness}
                    onChange={(e) => handleParamChange('squareness', e.target.value)}
                    className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </>
            ) : (
              <>
                {/* J-A Parameter 'a' */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Domain Thermal Parameter (a):</span>
                    <span className="font-mono text-cyan-300 font-bold">{params.a} A/m</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="5000"
                    step="100"
                    value={params.a}
                    onChange={(e) => handleParamChange('a', e.target.value)}
                    className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* J-A Parameter 'k' (pinning energy) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Pinning Energy Density (k):</span>
                    <span className="font-mono text-cyan-300 font-bold">{params.k} A/m</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="6000"
                    step="100"
                    value={params.k}
                    onChange={(e) => handleParamChange('k', e.target.value)}
                    className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* J-A Parameter 'c' (reversible bending) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Wall Reversibility (c):</span>
                    <span className="font-mono text-cyan-300 font-bold">{params.c.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.6"
                    step="0.02"
                    value={params.c}
                    onChange={(e) => handleParamChange('c', e.target.value)}
                    className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* J-A Parameter 'alpha' (mean field coupling) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Coupling Parameter (α):</span>
                    <span className="font-mono text-cyan-300 font-bold">{params.alpha.toExponential(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0005"
                    value={params.alpha}
                    onChange={(e) => handleParamChange('alpha', e.target.value)}
                    className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </>
            )}

            <button
              onClick={fetchSimulation}
              disabled={loading}
              className="w-full py-3 rounded-full glass-btn-primary text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'Solving Model...' : 'Recompute Hysteresis'}</span>
            </button>
          </div>

          {/* Model Assumptions Panel */}
          <div className="p-4 rounded-2xl glass-card-subtle border border-white/10 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
              <Info className="w-4 h-4" />
              <span>Model Assumptions & Limits</span>
            </div>
            <ul className="text-[11px] text-cyan-100/70 space-y-1 list-disc list-inside">
              {loopData?.assumptions?.map((assump, idx) => (
                <li key={idx} className="leading-tight">{assump}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Plot & Results Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Plot Card */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('BH')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'BH' ? 'glass-btn-primary text-white shadow-md shadow-cyan-500/30' : 'glass-card-subtle text-slate-300 hover:text-white'
                  }`}
                >
                  B-H Induction Loop
                </button>
                <button
                  onClick={() => setActiveTab('MH')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'MH' ? 'glass-btn-primary text-white shadow-md shadow-cyan-500/30' : 'glass-card-subtle text-slate-300 hover:text-white'
                  }`}
                >
                  M-H Magnetization Loop
                </button>
              </div>

              {/* Animation Sweep Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    isPlaying 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-lg shadow-rose-500/20' 
                      : 'glass-card-subtle text-cyan-300 hover:text-white border border-cyan-400/30'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause Sweep' : 'Play Sweep'}</span>
                </button>
                <button
                  onClick={() => { setIsPlaying(false); setSweepIdx(0); }}
                  className="p-1.5 rounded-full glass-card-subtle text-slate-400 hover:text-white border border-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Plotly Canvas */}
            <div className="min-h-[380px]">
              <PlotlyChart
                data={plotData}
                layout={{
                  title: `${loopData?.model_name || 'Hysteresis Loop'} (${activeTab})`,
                  xaxis: { title: 'Applied Field Intensity H (A/m)' },
                  yaxis: { title: yAxisTitle }
                }}
              />
            </div>

            {/* Sweep Status Bar */}
            <div className="flex justify-between items-center px-3 py-2 rounded-xl glass-card-subtle text-xs text-cyan-200/80 font-mono border border-white/5">
              <span>H(t): {Math.round(currentHPoint).toLocaleString()} A/m</span>
              <span>{activeTab === 'BH' ? 'B(t)' : 'M(t)'}: {currentYPoint?.toExponential(3)}</span>
              <span>Step: {sweepIdx + 1} / {loopData?.h_loop?.length || 0}</span>
            </div>
          </div>

          {/* Extracted Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-white/15">
              <span className="text-[11px] text-cyan-200/80 font-medium">Coercivity (Hc)</span>
              <div className="text-xl font-extrabold text-cyan-300 mt-1 font-mono">
                {p.coercivity_hc ? `${p.coercivity_hc.toFixed(1)} A/m` : '--'}
              </div>
              <span className="text-[10px] text-slate-400">Reverse field for B=0</span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/15">
              <span className="text-[11px] text-cyan-200/80 font-medium">Remanence (Br)</span>
              <div className="text-xl font-extrabold text-white mt-1 font-mono">
                {p.remanence_br ? `${p.remanence_br.toFixed(3)} T` : '--'}
              </div>
              <span className="text-[10px] text-slate-400">Flux at H=0</span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/15">
              <span className="text-[11px] text-cyan-200/80 font-medium">Saturation (Bs)</span>
              <div className="text-xl font-extrabold text-cyan-300 mt-1 font-mono">
                {p.saturation_bs ? `${p.saturation_bs.toFixed(2)} T` : '--'}
              </div>
              <span className="text-[10px] text-slate-400">Peak induction</span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/15">
              <span className="text-[11px] text-amber-200/90 font-medium">Loop Area (W)</span>
              <div className="text-xl font-extrabold text-amber-300 mt-1 font-mono">
                {p.loop_area ? `${p.loop_area.toFixed(1)} J/m³` : '--'}
              </div>
              <span className="text-[10px] text-slate-400">Energy loss per cycle</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
