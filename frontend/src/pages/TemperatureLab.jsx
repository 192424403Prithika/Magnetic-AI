import React, { useState, useEffect } from 'react';
import { Thermometer, Sliders, Info, ShieldCheck, Flame, Sparkles } from 'lucide-react';
import { getTemperatureCurves } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

export default function TemperatureLab() {
  const [materialType, setMaterialType] = useState('ferromagnetic');
  const [tempK, setTempK] = useState(300.0);
  const [tMin, setTMin] = useState(10.0);
  const [tMax, setTMax] = useState(1200.0);
  const [tcOrTn, setTcOrTn] = useState(1043.0); // Fe default
  const [ms0, setMs0] = useState(1.74e6);
  const [beta, setBeta] = useState(0.35);
  const [curieC, setCurieC] = useState(0.12);
  const [curvesData, setCurvesData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCurves = async () => {
    setLoading(true);
    try {
      const res = await getTemperatureCurves({
        material_type: materialType,
        t_min: tMin,
        t_max: tMax,
        tc_or_tn: tcOrTn,
        ms0: ms0,
        beta: beta,
        curie_constant: curieC,
        num_points: 250
      });
      setCurvesData(res.data);
    } catch (err) {
      console.error('Temperature curve fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurves();
  }, [materialType, tcOrTn, ms0, beta, curieC, tMin, tMax]);

  const loadReference = (ref) => {
    setMaterialType(ref.type);
    if (ref.critical_temp_k) {
      setTcOrTn(ref.critical_temp_k);
      setTMax(Math.max(1200, ref.critical_temp_k * 1.3));
    }
    if (ref.ms0_A_per_m) setMs0(ref.ms0_A_per_m);
    if (ref.beta) setBeta(ref.beta);
    setTempK(300.0);
  };

  // Determine current phase at temperature slider position
  let currentPhase = 'Unknown Phase';
  let msAtTemp = 0;
  if (materialType === 'ferromagnetic' || materialType === 'ferrimagnetic') {
    if (tempK < tcOrTn) {
      currentPhase = 'Ordered Spontaneous Ferromagnetic Phase';
      msAtTemp = ms0 * Math.pow(Math.max(0, 1 - tempK / tcOrTn), beta);
    } else {
      currentPhase = 'Disordered Paramagnetic Phase (T > Tc)';
      msAtTemp = 0;
    }
  } else if (materialType === 'antiferromagnetic') {
    if (tempK <= tcOrTn) {
      currentPhase = 'Antiferromagnetic Sublattice Ordering (T ≤ TN)';
    } else {
      currentPhase = 'Paramagnetic Phase (T > TN)';
    }
  } else if (materialType === 'paramagnetic') {
    currentPhase = 'Paramagnetic Phase (Curie Law)';
  } else if (materialType === 'diamagnetic') {
    currentPhase = 'Diamagnetic (Temperature-Independent Orbital Lenz State)';
  }

  // Plotly traces
  const msTrace = curvesData?.saturation_ms
    ? [
        {
          x: curvesData.temperature_k,
          y: curvesData.saturation_ms,
          type: 'scatter',
          mode: 'lines',
          name: 'Ms(T) Saturation',
          line: { color: '#38BDF8', width: 2.8 }
        },
        {
          x: [tempK],
          y: [msAtTemp],
          type: 'scatter',
          mode: 'markers',
          name: 'Current Temperature',
          marker: { color: '#F43F5E', size: 10, line: { color: '#FFFFFF', width: 2 } }
        }
      ]
    : [];

  const chiTrace = curvesData?.susceptibility_chi
    ? [
        {
          x: curvesData.temperature_k,
          y: curvesData.susceptibility_chi,
          type: 'scatter',
          mode: 'lines',
          name: 'χ(T) Susceptibility',
          line: { color: '#2DD4BF', width: 2.5 }
        }
      ]
    : [];

  const invChiTrace = curvesData?.inv_susceptibility
    ? [
        {
          x: curvesData.temperature_k,
          y: curvesData.inv_susceptibility,
          type: 'scatter',
          mode: 'lines',
          name: '1/χ(T) Curie-Weiss',
          line: { color: '#FBBF24', width: 2.2 }
        }
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Thermal Phase Transitions</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <Thermometer className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>Temperature-Dependent Magnetism Lab</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Explore thermal disorder transitions: Curie–Weiss paramagnetic law, critical exponent scaling Ms(T) = Ms0(1-T/Tc)^β, Néel antiferromagnetic peak, and temperature-independent Langevin diamagnetism.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column (4 cols) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm">Material Class & Parameters</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">SI Kelvin (K)</span>
          </div>

          {/* Class Select */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Magnetic Category:</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              className="glass-input w-full text-xs text-white rounded-xl p-2.5 focus:outline-none capitalize cursor-pointer"
            >
              <option value="ferromagnetic" className="bg-slate-900 text-white">Ferromagnetic (Fe, Co, Ni)</option>
              <option value="ferrimagnetic" className="bg-slate-900 text-white">Ferrimagnetic (Fe3O4, Ferrites)</option>
              <option value="antiferromagnetic" className="bg-slate-900 text-white">Antiferromagnetic (MnO, NiO)</option>
              <option value="paramagnetic" className="bg-slate-900 text-white">Paramagnetic (Al, Pt)</option>
              <option value="diamagnetic" className="bg-slate-900 text-white">Diamagnetic (Bi, Cu, Ag)</option>
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs">
            {/* Live Temperature Slider */}
            <div className="p-4 rounded-2xl glass-card-subtle border border-cyan-400/30 space-y-2 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-bold text-cyan-300 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span>Current Temperature (T):</span>
                </span>
                <span className="font-mono font-extrabold text-white text-sm">{Math.round(tempK)} K ({Math.round(tempK - 273.15)} °C)</span>
              </div>
              <input
                type="range"
                min={tMin}
                max={tMax}
                step="5"
                value={tempK}
                onChange={(e) => setTempK(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{tMin} K</span>
                <span>293 K (Room)</span>
                <span>{tMax} K</span>
              </div>
            </div>

            {/* Critical Temp Tc / TN */}
            {materialType !== 'diamagnetic' && (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">
                    {materialType === 'antiferromagnetic' ? 'Néel Temperature (TN):' : 'Curie Temperature (Tc):'}
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{tcOrTn} K</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="10"
                  value={tcOrTn}
                  onChange={(e) => setTcOrTn(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            )}

            {/* Critical Exponent beta */}
            {(materialType === 'ferromagnetic' || materialType === 'ferrimagnetic') && (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Critical Exponent (β):</span>
                  <span className="font-mono text-cyan-300 font-bold">{beta.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="0.50"
                  step="0.01"
                  value={beta}
                  onChange={(e) => setBeta(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800/80 rounded appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-400">Typical 3D Heisenberg β ≈ 0.35 - 0.38</span>
              </div>
            )}
          </div>

          {/* Reference Library Table */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Reference Transition Anchors:</span>
              <span className="text-[9px] text-amber-300/80 italic">verify before citing</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {curvesData?.reference_table?.map((ref, idx) => (
                <button
                  key={idx}
                  onClick={() => loadReference(ref)}
                  className="w-full text-left p-2.5 rounded-xl glass-card-interactive flex items-center justify-between text-[11px] transition-all"
                >
                  <span className="font-medium text-slate-200">{ref.material}</span>
                  <span className="font-mono text-cyan-300 font-bold">{ref.critical_temp_k} K</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plots & Phase Indicator Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Phase Badge Card */}
          <div className="p-5 rounded-3xl glass-card border border-cyan-400/30 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-300 tracking-wider">Live Thermal Magnetic Phase</span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">{currentPhase}</h2>
              <p className="text-xs text-cyan-100/70 mt-0.5 font-mono">
                {curvesData?.critical_info?.equation_below}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">Spontaneous Ms(T)</span>
              <div className="text-xl font-bold font-mono text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                {msAtTemp > 0 ? `${msAtTemp.toExponential(2)} A/m` : '0.0 A/m'}
              </div>
            </div>
          </div>

          {/* Plotly Curves */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            {(materialType === 'ferromagnetic' || materialType === 'ferrimagnetic') && (
              <div className="min-h-[300px]">
                <PlotlyChart
                  data={msTrace}
                  layout={{
                    title: 'Spontaneous Saturation Magnetization Ms(T) vs Temperature (K)',
                    xaxis: { title: 'Temperature T (K)' },
                    yaxis: { title: 'Ms(T) (A/m)' }
                  }}
                />
              </div>
            )}

            <div className="min-h-[300px]">
              <PlotlyChart
                data={chiTrace}
                layout={{
                  title: 'Magnetic Susceptibility χ(T) vs Temperature (K)',
                  xaxis: { title: 'Temperature T (K)' },
                  yaxis: { title: 'Volume Susceptibility χ (SI)' }
                }}
              />
            </div>

            <div className="min-h-[300px]">
              <PlotlyChart
                data={invChiTrace}
                layout={{
                  title: 'Inverse Susceptibility 1/χ(T) vs Temperature (K) [Curie–Weiss Plot]',
                  xaxis: { title: 'Temperature T (K)' },
                  yaxis: { title: '1 / χ (SI)' }
                }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
