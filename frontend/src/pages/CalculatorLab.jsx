import React, { useState } from 'react';
import { 
  Calculator, 
  Play, 
  Info, 
  FileSpreadsheet, 
  CheckCircle2, 
  RotateCcw, 
  Layers, 
  Zap, 
  ArrowRightLeft, 
  Activity 
} from 'lucide-react';
import { computeProperties } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

const MU_0 = 4.0 * Math.PI * 1e-7;

export default function CalculatorLab() {
  const [activeTab, setActiveTab] = useState('point'); // 'point' | 'loop' | 'units'

  // --- TAB 1: Single Point Physics Solver State ---
  const [pointH, setPointH] = useState(1000.0);
  const [pointM, setPointM] = useState(50000.0);
  const [pointMode, setPointMode] = useState('HM'); // 'HM' (input H, M) | 'HB' (input H, B)
  const [pointB, setPointB] = useState(0.064);
  const [pointFreq, setPointFreq] = useState(50.0);
  const [pointHc, setPointHc] = useState(40.0);
  const [pointW, setPointW] = useState(180.0);
  const [pointDensity, setPointDensity] = useState(7850.0);

  // --- TAB 2: Closed Hysteresis Loop State ---
  const [hInput, setHInput] = useState(
    '-4000, -3000, -2000, -1000, 0, 1000, 2000, 3000, 4000, 3000, 2000, 1000, 0, -1000, -2000, -3000, -4000'
  );
  const [bInput, setBInput] = useState(
    '-1.6, -1.5, -1.3, -1.0, -0.6, 0.4, 1.2, 1.5, 1.6, 1.5, 1.3, 1.0, 0.6, -0.4, -1.2, -1.5, -1.6'
  );
  const [loopLoading, setLoopLoading] = useState(false);
  const [loopResults, setLoopResults] = useState(null);
  const [loopError, setLoopError] = useState(null);

  // --- TAB 3: Unit Converter State ---
  const [cgsOe, setCgsOe] = useState(100.0);
  const [cgsGauss, setCgsGauss] = useState(5000.0);
  const [cgsEmu, setCgsEmu] = useState(400.0);
  const [cgsErg, setCgsErg] = useState(1000.0);

  // Helper to clean brackets, commas, semicolons, tabs, newlines
  const cleanAndParseArray = (rawStr) => {
    if (!rawStr) return [];
    const sanitized = rawStr
      .replace(/[\[\]\(\)\{\}\'\"]/g, ' ')
      .replace(/[,;]/g, ' ')
      .trim();
    if (!sanitized) return [];
    return sanitized.split(/\s+/).map(Number);
  };

  // --- POINT SOLVER COMPUTATIONS ---
  const calcH = Number(pointH) || 0;
  let calcM = 0;
  let calcB = 0;
  if (pointMode === 'HM') {
    calcM = Number(pointM) || 0;
    calcB = MU_0 * (calcH + calcM);
  } else {
    calcB = Number(pointB) || 0;
    calcM = calcB / MU_0 - calcH;
  }

  const calcChi = Math.abs(calcH) > 1e-9 ? calcM / calcH : 0;
  const calcMu = Math.abs(calcH) > 1e-9 ? calcB / calcH : MU_0;
  const calcMuR = 1.0 + calcChi;
  const calcPowerVol = (Number(pointW) || 0) * (Number(pointFreq) || 0);
  const calcPowerMass = Number(pointDensity) > 0 ? calcPowerVol / Number(pointDensity) : 0;

  // Hard/soft badge from Hc
  const calcHc = Number(pointHc) || 0;
  let pointHardSoft = { badge: 'Soft Magnetic', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', desc: 'Hc < 1.0 kA/m: Narrow loop, low AC loss, easy domain wall motion.' };
  if (calcHc > 10000) {
    pointHardSoft = { badge: 'Hard Magnetic (Permanent Magnet)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', desc: 'Hc > 10.0 kA/m: High defect pinning, resistant to demagnetization.' };
  } else if (calcHc >= 1000) {
    pointHardSoft = { badge: 'Intermediate / Semi-Hard', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', desc: '1.0 to 10.0 kA/m: Moderate coercivity, used in recording and relays.' };
  }

  // --- LOOP ANALYZER COMPUTATION ---
  const handleLoopCompute = async () => {
    setLoopLoading(true);
    setLoopError(null);
    try {
      const hArr = cleanAndParseArray(hInput);
      const bArr = cleanAndParseArray(bInput);

      if (hArr.length === 0 || bArr.length === 0) {
        throw new Error('Please enter at least one coordinate value in H and B arrays.');
      }
      if (hArr.some(isNaN) || bArr.some(isNaN)) {
        throw new Error('All coordinates must be valid numbers.');
      }
      if (hArr.length !== bArr.length) {
        throw new Error(`Length mismatch: H has ${hArr.length} points while B has ${bArr.length} points.`);
      }

      const res = await computeProperties({ h: hArr, b: bArr });
      setLoopResults({ ...res.data, hArr, bArr });
    } catch (err) {
      setLoopError(err.response?.data?.detail || err.message);
    } finally {
      setLoopLoading(false);
    }
  };

  const loadLoopExample = (type) => {
    if (type === 'soft') {
      setHInput('-800, -400, -100, 0, 100, 400, 800, 400, 100, 0, -100, -400, -800');
      setBInput('-1.4, -1.2, -0.8, -0.2, 0.5, 1.1, 1.4, 1.2, 0.8, 0.2, -0.5, -1.1, -1.4');
    } else if (type === 'hard') {
      setHInput('-80000, -40000, -10000, 0, 10000, 40000, 80000, 40000, 10000, 0, -10000, -40000, -80000');
      setBInput('-1.2, -1.0, -0.6, -0.3, 0.4, 0.9, 1.2, 1.0, 0.6, 0.3, -0.4, -0.9, -1.2');
    } else {
      setHInput('-50, -25, -5, 0, 5, 25, 50, 25, 5, 0, -5, -25, -50');
      setBInput('-0.8, -0.7, -0.5, -0.1, 0.4, 0.7, 0.8, 0.7, 0.5, 0.1, -0.4, -0.7, -0.8');
    }
  };

  // Preview trace for loop
  const loopPlotData = loopResults?.hArr
    ? [
        {
          x: loopResults.hArr,
          y: loopResults.bArr,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'B-H Loop Coordinates',
          line: { color: '#14B8A6', width: 2.2 },
          marker: { color: '#2DD4BF', size: 5 },
          fill: 'toself',
          fillcolor: 'rgba(20, 184, 166, 0.15)'
        }
      ]
    : [];

  const lp = loopResults?.parameters;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-navy-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
          <Calculator className="w-8 h-8 text-teal-400" />
          <span>Magnetic Physics Calculator & Parameter Extractor</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Compute point electromagnetic quantities ($\chi, B, M, \mu, \mu_r, P$), extract closed hysteresis loop parameters ($H_c, B_r, M_s, W = \oint H dB$), and convert CGS/Gaussian units to SI.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab('point')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'point' ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20' : 'bg-navy-900 text-slate-300 hover:text-white'
          }`}
        >
          1. Instant Physics Formula Solver (Point Calculations)
        </button>

        <button
          onClick={() => setActiveTab('loop')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'loop' ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20' : 'bg-navy-900 text-slate-300 hover:text-white'
          }`}
        >
          2. Closed Hysteresis Loop Analyzer (Array / Stream)
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'units' ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20' : 'bg-navy-900 text-slate-300 hover:text-white'
          }`}
        >
          3. CGS / Gaussian to SI Unit Converter
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: POINT CALCULATOR (INSTANT FORMULAS)              */}
      {/* ======================================================== */}
      {activeTab === 'point' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs (5 cols) */}
          <div className="lg:col-span-5 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-2.5">
              <h3 className="font-bold text-white text-sm">Point Excitation Inputs (SI)</h3>
              <span className="text-[10px] font-mono text-teal-400">Live Updating</span>
            </div>

            {/* Field H */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Applied Magnetic Field (H)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={pointH}
                  onChange={(e) => setPointH(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-500">A/m</span>
              </div>
            </div>

            {/* Input Toggle: M or B */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">
                  {pointMode === 'HM' ? 'Magnetization (M)' : 'Flux Density (B)'}
                </label>
                <button
                  type="button"
                  onClick={() => setPointMode(pointMode === 'HM' ? 'HB' : 'HM')}
                  className="text-[10px] text-teal-400 hover:underline flex items-center space-x-1"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Switch to {pointMode === 'HM' ? 'Input B (Tesla)' : 'Input M (A/m)'}</span>
                </button>
              </div>

              {pointMode === 'HM' ? (
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={pointM}
                    onChange={(e) => setPointM(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500">A/m</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={pointB}
                    onChange={(e) => setPointB(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500">Tesla (T)</span>
                </div>
              )}
            </div>

            {/* Frequency & Coercivity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Excitation Frequency (f)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={pointFreq}
                    onChange={(e) => setPointFreq(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500">Hz</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Coercivity (Hc)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={pointHc}
                    onChange={(e) => setPointHc(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500">A/m</span>
                </div>
              </div>
            </div>

            {/* Energy Loss & Density */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Hysteresis Area (W)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={pointW}
                    onChange={(e) => setPointW(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500">J/m³</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Density (ρ)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={pointDensity}
                    onChange={(e) => setPointDensity(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500">kg/m³</span>
                </div>
              </div>
            </div>

            {/* Presets for Point Solver */}
            <div className="pt-2 border-t border-navy-800 space-y-1.5">
              <span className="text-[11px] text-slate-400">Quick Fill Point Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setPointH(100); setPointM(500000); setPointHc(40); setPointW(180); setPointMode('HM'); }}
                  className="px-2 py-1 rounded bg-navy-800 text-[10px] text-teal-300 hover:bg-navy-700"
                >
                  Soft Iron
                </button>
                <button
                  type="button"
                  onClick={() => { setPointH(50000); setPointM(1200000); setPointHc(800000); setPointW(3800000); setPointMode('HM'); }}
                  className="px-2 py-1 rounded bg-navy-800 text-[10px] text-teal-300 hover:bg-navy-700"
                >
                  NdFeB Magnet
                </button>
                <button
                  type="button"
                  onClick={() => { setPointH(1000); setPointM(-0.166); setPointHc(0); setPointW(0); setPointMode('HM'); }}
                  className="px-2 py-1 rounded bg-navy-800 text-[10px] text-teal-300 hover:bg-navy-700"
                >
                  Bismuth (Diamagnet)
                </button>
              </div>
            </div>
          </div>

          {/* Point Results & Derived Properties (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Behavior Badge */}
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Coercivity Classification Verdict:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pointHardSoft.color}`}>
                  {pointHardSoft.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300">{pointHardSoft.desc}</p>
            </div>

            {/* Computed Quantities Grid */}
            <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Instant Derived Electromagnetic Properties</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-0.5">
                  <span className="text-slate-400 text-[11px]">Susceptibility (χ = M/H):</span>
                  <div className="text-lg font-bold text-teal-400 font-mono">
                    {calcChi.toExponential(3)}
                  </div>
                  <span className="text-[10px] text-slate-500">Dimensionless (SI volume)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-0.5">
                  <span className="text-slate-400 text-[11px]">Induction B = μ0(H+M):</span>
                  <div className="text-lg font-bold text-white font-mono">
                    {calcB.toFixed(4)} T
                  </div>
                  <span className="text-[10px] text-slate-500">Flux Density in Tesla</span>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-0.5">
                  <span className="text-slate-400 text-[11px]">Magnetization (M):</span>
                  <div className="text-lg font-bold text-teal-400 font-mono">
                    {calcM.toExponential(3)} A/m
                  </div>
                  <span className="text-[10px] text-slate-500">Dipole moment / volume</span>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-0.5">
                  <span className="text-slate-400 text-[11px]">Permeability (μ = B/H):</span>
                  <div className="text-lg font-bold text-white font-mono">
                    {calcMu.toExponential(3)} H/m
                  </div>
                  <span className="text-[10px] text-slate-500">Henry / meter (T·m/A)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-0.5">
                  <span className="text-slate-400 text-[11px]">Relative Perm. (μr = 1+χ):</span>
                  <div className="text-lg font-bold text-teal-400 font-mono">
                    {calcMuR.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-slate-500">Ratio over vacuum μ0</span>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-0.5">
                  <span className="text-slate-400 text-[11px]">Power Loss (P = W·f):</span>
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    {calcPowerVol.toLocaleString()} W/m³
                  </div>
                  <span className="text-[10px] text-slate-500">{calcPowerMass.toFixed(2)} W/kg (mass specific)</span>
                </div>
              </div>
            </div>

            {/* Formulas Box */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-teal-300">Physics Formulas Applied</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>• χ = M / H</div>
                <div>• B = μ0 (H + M)</div>
                <div>• μ = B / H</div>
                <div>• μr = μ / μ0 = 1 + χ</div>
                <div>• P = W · f [W/m³]</div>
                <div>• P_mass = P / ρ [W/kg]</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CLOSED HYSTERESIS LOOP ANALYZER (ARRAY STREAM)     */}
      {/* ======================================================== */}
      {activeTab === 'loop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs (5 cols) */}
          <div className="lg:col-span-5 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-2.5">
              <h3 className="font-bold text-white text-sm">H-B Coordinate Arrays</h3>
              <div className="space-x-1">
                <button
                  type="button"
                  onClick={() => loadLoopExample('soft')}
                  className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-teal-300 hover:bg-navy-700"
                >
                  Soft Iron
                </button>
                <button
                  type="button"
                  onClick={() => loadLoopExample('hard')}
                  className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-teal-300 hover:bg-navy-700"
                >
                  Hard NdFeB
                </button>
                <button
                  type="button"
                  onClick={() => loadLoopExample('permalloy')}
                  className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-teal-300 hover:bg-navy-700"
                >
                  Permalloy
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    Applied Field H Array (A/m)
                  </label>
                  <span className="text-[10px] text-slate-500">Supports brackets, spaces, commas</span>
                </div>
                <textarea
                  rows={4}
                  value={hInput}
                  onChange={(e) => setHInput(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    Magnetic Flux Density B Array (Tesla)
                  </label>
                  <span className="text-[10px] text-slate-500">Supports brackets, spaces, commas</span>
                </div>
                <textarea
                  rows={4}
                  value={bInput}
                  onChange={(e) => setBInput(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              {loopError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {loopError}
                </div>
              )}

              <button
                onClick={handleLoopCompute}
                disabled={loopLoading}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{loopLoading ? 'Extracting Loop...' : 'Extract Closed Loop Parameters'}</span>
              </button>
            </div>
          </div>

          {/* Loop Results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {!loopResults ? (
              <div className="h-full min-h-[350px] rounded-2xl border-2 border-dashed border-navy-800 flex flex-col items-center justify-center p-8 text-center bg-navy-900/30">
                <FileSpreadsheet className="w-12 h-12 text-navy-700 mb-3" />
                <h3 className="text-slate-300 font-bold text-base">Awaiting Array Computation</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Click 'Extract Closed Loop Parameters' to calculate zero crossings, loop area W, and plot the closed curve.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Loop Plot */}
                <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="font-bold text-white text-base">Reconstructed Closed B-H Loop</h3>
                  <div className="min-h-[300px]">
                    <PlotlyChart
                      data={loopPlotData}
                      layout={{
                        title: 'Closed Hysteresis Loop in H-B Plane',
                        xaxis: { title: 'Applied Field Intensity H (A/m)' },
                        yaxis: { title: 'Magnetic Induction B (Tesla)' }
                      }}
                    />
                  </div>
                </div>

                {/* Parameters Table */}
                {lp && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
                      <span className="text-slate-400 text-[11px]">Coercivity (Hc):</span>
                      <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">
                        {lp.coercivity_hc?.toFixed(1)} A/m
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
                      <span className="text-slate-400 text-[11px]">Remanence (Br):</span>
                      <div className="text-lg font-bold text-white font-mono mt-0.5">
                        {lp.remanence_br?.toFixed(3)} T
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
                      <span className="text-slate-400 text-[11px]">Saturation (Bs):</span>
                      <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">
                        {lp.saturation_bs?.toFixed(2)} T
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
                      <span className="text-slate-400 text-[11px]">Loop Area (∮ H dB):</span>
                      <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                        {lp.loop_area?.toFixed(1)} J/m³
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: UNIT CONVERTER (CGS / GAUSSIAN TO SI)             */}
      {/* ======================================================== */}
      {activeTab === 'units' && (
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-navy-800 pb-3">
            <ArrowRightLeft className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">CGS / Gaussian to Standard SI Unit Converter</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Magnetic Field H: Oersted (Oe) to A/m */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <span className="font-bold text-teal-300">Magnetic Field (H): Oersted (Oe) ↔ A/m</span>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="any"
                  value={cgsOe}
                  onChange={(e) => setCgsOe(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-navy-900 border border-navy-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-slate-400">=</span>
                <span className="text-white font-bold font-mono text-sm">
                  {((cgsOe * 1000) / (4 * Math.PI)).toFixed(2)} A/m
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">1 Oe = 1000 / (4π) ≈ 79.577 A/m</p>
            </div>

            {/* Magnetic Induction B: Gauss (G) to Tesla (T) */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <span className="font-bold text-teal-300">Flux Density (B): Gauss (G) ↔ Tesla (T)</span>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="any"
                  value={cgsGauss}
                  onChange={(e) => setCgsGauss(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-navy-900 border border-navy-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-slate-400">=</span>
                <span className="text-white font-bold font-mono text-sm">
                  {(cgsGauss * 1e-4).toFixed(4)} T
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">1 G = 10⁻⁴ Tesla = 0.1 mT</p>
            </div>

            {/* Magnetization M: emu/cm³ to A/m */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <span className="font-bold text-teal-300">Volume Magnetization (M): emu/cm³ ↔ A/m</span>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="any"
                  value={cgsEmu}
                  onChange={(e) => setCgsEmu(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-navy-900 border border-navy-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-slate-400">=</span>
                <span className="text-white font-bold font-mono text-sm">
                  {(cgsEmu * 1000).toLocaleString()} A/m
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">1 emu/cm³ = 10³ A/m = 1 kA/m</p>
            </div>

            {/* Energy Density W: erg/cm³ to J/m³ */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <span className="font-bold text-teal-300">Energy Density (W): erg/cm³ ↔ J/m³</span>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="any"
                  value={cgsErg}
                  onChange={(e) => setCgsErg(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-navy-900 border border-navy-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-slate-400">=</span>
                <span className="text-white font-bold font-mono text-sm">
                  {(cgsErg * 0.1).toFixed(2)} J/m³
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">1 erg/cm³ = 0.1 J/m³</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
