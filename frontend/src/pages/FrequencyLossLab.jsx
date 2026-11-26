import React, { useState, useEffect } from 'react';
import { Zap, Sliders, Info, ShieldAlert, BarChart2, Sparkles } from 'lucide-react';
import { getFrequencyLosses } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

export default function FrequencyLossLab() {
  const [wh, setWh] = useState(120.0);      // J/m³
  const [ke, setKe] = useState(0.005);      // W*s^2/m^3
  const [kexc, setKexc] = useState(0.05);   // W*s^1.5/m^3
  const [fMin, setFMin] = useState(10.0);   // Hz
  const [fMax, setFMax] = useState(5000.0); // Hz
  const [density, setDensity] = useState(7850.0); // kg/m^3
  const [lossUnit, setLossUnit] = useState('volumetric'); // 'volumetric' (W/m³) | 'mass' (W/kg)
  const [lossData, setLossData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLosses = async () => {
    setLoading(true);
    try {
      const res = await getFrequencyLosses({
        wh_cycle: wh,
        ke_eddy: ke,
        k_exc: kexc,
        f_min: fMin,
        f_max: fMax,
        num_points: 200,
        density_kg_per_m3: density
      });
      setLossData(res.data);
    } catch (err) {
      console.error('Frequency loss fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLosses();
  }, [wh, ke, kexc, fMin, fMax, density]);

  // Prepare Plotly traces
  const freqs = lossData?.frequency_hz || [];
  const isVol = lossUnit === 'volumetric';

  const phTrace = {
    x: freqs,
    y: isVol ? lossData?.power_loss_hysteresis_W_per_m3 : lossData?.power_loss_hysteresis_W_per_kg,
    type: 'scatter',
    mode: 'lines',
    name: 'Hysteresis Loss (Ph ∝ f)',
    line: { color: '#38BDF8', width: 2.2 }
  };

  const peTrace = {
    x: freqs,
    y: isVol ? lossData?.power_loss_eddy_W_per_m3 : lossData?.power_loss_eddy_W_per_kg,
    type: 'scatter',
    mode: 'lines',
    name: 'Classical Eddy Loss (Pe ∝ f²)',
    line: { color: '#2DD4BF', width: 2.2 }
  };

  const pexcTrace = {
    x: freqs,
    y: isVol ? lossData?.power_loss_excess_W_per_m3 : (lossData?.power_loss_excess_W_per_m3 || []).map((v) => v / density),
    type: 'scatter',
    mode: 'lines',
    name: 'Excess Dynamic Loss (Pexc ∝ f^1.5)',
    line: { color: '#FBBF24', width: 2.2 }
  };

  const ptotTrace = {
    x: freqs,
    y: isVol ? lossData?.power_loss_total_W_per_m3 : lossData?.power_loss_total_W_per_kg,
    type: 'scatter',
    mode: 'lines',
    name: 'Total Core Loss (Ptot)',
    line: { color: '#F43F5E', width: 3, dash: 'solid' }
  };

  const plotData = [phTrace, peTrace, pexcTrace, ptotTrace];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Dynamic AC Losses</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <Zap className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>Frequency-Dependent Core Loss Analysis</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Bertotti statistical loss separation: Deconstruct total core losses into linear quasi-static hysteresis loss, quadratic classical eddy current loss, and anomalous excess dynamic loss.
        </p>
      </div>

      {/* Prominent Theoretical Model Disclaimer */}
      <div className="p-4 rounded-3xl glass-card border border-amber-400/30 flex items-start space-x-3 text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
            Theoretical Model Disclaimer – Not Measured Data
          </span>
          <p className="text-[11px] text-amber-100/80 mt-0.5 leading-relaxed">
            Core loss values shown are computed using theoretical Bertotti statistical loss separation models with user-defined coefficients. Real transformer and motor core laminations exhibit frequency skin effects and rotational harmonics that require experimental Epstein frame or toroidal core measurement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column (4 cols) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span>Loss Coefficients</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">SI Units</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Wh cycle */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Hysteresis Loss (Wh):</span>
                <span className="font-mono text-cyan-300 font-bold">{wh} J/m³</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={wh}
                onChange={(e) => setWh(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400">Loop area per cycle (linear in f)</span>
            </div>

            {/* Ke eddy */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Eddy Coefficient (ke):</span>
                <span className="font-mono text-cyan-300 font-bold">{ke.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min="0.0005"
                max="0.02"
                step="0.0005"
                value={ke}
                onChange={(e) => setKe(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400">Classical eddy current loss (quadratic in f²)</span>
            </div>

            {/* Kexc excess */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Excess Loss Coefficient (kexc):</span>
                <span className="font-mono text-cyan-300 font-bold">{kexc.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.2"
                step="0.005"
                value={kexc}
                onChange={(e) => setKexc(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400">Anomalous dynamic loss (scales as f^1.5)</span>
            </div>

            {/* Frequency Max */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Max Frequency (f_max):</span>
                <span className="font-mono text-cyan-300 font-bold">{fMax.toLocaleString()} Hz</span>
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="500"
                value={fMax}
                onChange={(e) => setFMax(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Density */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Material Mass Density:</span>
                <span className="font-mono text-cyan-300 font-bold">{density} kg/m³</span>
              </div>
              <input
                type="range"
                min="2000"
                max="9000"
                step="100"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400">e.g. Electrical steel ~7650-7850 kg/m³</span>
            </div>
          </div>

          {/* Theoretical Equation Box */}
          <div className="p-4 rounded-2xl glass-card-subtle border border-white/10 space-y-1.5 text-xs">
            <span className="font-bold text-cyan-300">Bertotti Loss Separation Model:</span>
            <p className="font-mono text-[11px] text-cyan-200 bg-slate-950/70 p-2.5 rounded-xl border border-white/5">
              P_tot(f) = Wh·f + ke·f² + k_exc·f^1.5
            </p>
            <p className="text-[10px] text-cyan-100/70 leading-tight">
              Energy per cycle: W(f) = P_tot / f = Wh + ke·f + k_exc·f^0.5
            </p>
          </div>
        </div>

        {/* Plot & Decomposition Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Chart Card */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base">Core Loss vs Excitation Frequency</h3>

              {/* Unit Switcher */}
              <div className="glass-card-subtle p-1 rounded-full flex items-center space-x-1 border border-white/10">
                <button
                  onClick={() => setLossUnit('volumetric')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isVol ? 'glass-btn-primary text-white shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Volumetric (W/m³)
                </button>
                <button
                  onClick={() => setLossUnit('mass')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    !isVol ? 'glass-btn-primary text-white shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Mass Specific (W/kg)
                </button>
              </div>
            </div>

            <div className="min-h-[380px]">
              <PlotlyChart
                data={plotData}
                layout={{
                  title: `Power Loss Separation vs Frequency (up to ${fMax} Hz)`,
                  xaxis: { title: 'Excitation Frequency f (Hz)' },
                  yaxis: { title: isVol ? 'Specific Power Loss (W/m³)' : 'Specific Power Loss (W/kg)' }
                }}
              />
            </div>
          </div>

          {/* Key Frequency Benchmarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl glass-card border border-white/15 space-y-1">
              <span className="text-[11px] text-cyan-200/80">Power Grid (50 / 60 Hz)</span>
              <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                {lossData ? (wh * 50 + ke * 2500 + kexc * Math.pow(50, 1.5)).toFixed(1) : '--'} W/m³
              </div>
              <span className="text-[10px] text-slate-400">Hysteresis loss dominates (~80%)</span>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/15 space-y-1">
              <span className="text-[11px] text-cyan-200/80">Aerospace / High-Speed (400 Hz)</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {lossData ? (wh * 400 + ke * 160000 + kexc * Math.pow(400, 1.5)).toFixed(1) : '--'} W/m³
              </div>
              <span className="text-[10px] text-slate-400">Eddy current share increases rapidly</span>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/15 space-y-1">
              <span className="text-[11px] text-amber-200/80">Audio / Switch-Mode (10 kHz)</span>
              <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                {lossData ? (wh * 10000 + ke * 1e8 + kexc * Math.pow(10000, 1.5)).toExponential(2) : '--'} W/m³
              </div>
              <span className="text-[10px] text-slate-400">Eddy currents dominate (ferrites needed)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
