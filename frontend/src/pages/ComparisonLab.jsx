import React, { useState, useEffect } from 'react';
import { Layers, CheckSquare, Square, Info, TrendingUp, BarChart2, Sparkles } from 'lucide-react';
import { compareMaterials } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

const AVAILABLE_COMPARISON_CANDIDATES = [
  { id: 'fe', name: 'Pure Soft Iron', ms: 1.71e6, hc: 40.0, squareness: 0.70, category: 'ferromagnetic' },
  { id: 'ndfeb', name: 'Neodymium (Nd2Fe14B)', ms: 1.28e6, hc: 875000.0, squareness: 0.94, category: 'ferromagnetic' },
  { id: 'permalloy', name: 'Permalloy (Ni80Fe20)', ms: 8.6e5, hc: 2.0, squareness: 0.52, category: 'ferromagnetic' },
  { id: 'si_steel', name: 'Silicon Steel (3% Si-Fe)', ms: 1.60e6, hc: 15.0, squareness: 0.75, category: 'ferromagnetic' },
  { id: 'magnetite', name: 'Magnetite (Fe3O4)', ms: 4.8e5, hc: 5600.0, squareness: 0.25, category: 'ferrimagnetic' },
  { id: 'mnzn_ferrite', name: 'MnZn Soft Ferrite', ms: 3.8e5, hc: 12.0, squareness: 0.17, category: 'ferrimagnetic' },
  { id: 'alnico5', name: 'Alnico 5 Alloy', ms: 1.05e6, hc: 52000.0, squareness: 0.90, category: 'ferromagnetic' }
];

const COLORS = ['#38BDF8', '#2DD4BF', '#FBBF24', '#F43F5E', '#A78BFA'];

export default function ComparisonLab() {
  const [selectedIds, setSelectedIds] = useState(['fe', 'ndfeb', 'permalloy']);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return; // Keep at least 1
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= 5) {
        alert('You can compare a maximum of 5 materials simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const selectedMaterials = AVAILABLE_COMPARISON_CANDIDATES.filter((c) => selectedIds.includes(c.id));
      const res = await compareMaterials({ materials: selectedMaterials });
      setComparisonData(res.data);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedIds]);

  // Prepare Overlaid Loops Plotly Traces
  const loopTraces = comparisonData?.materials?.map((m, idx) => ({
    x: m.h_loop,
    y: m.b_loop,
    type: 'scatter',
    mode: 'lines',
    name: m.name,
    line: { color: COLORS[idx % COLORS.length], width: 2.4 }
  })) || [];

  // Prepare Radar Chart Trace
  const radarCategories = ['Saturation (Bs)', 'Initial Permeability', 'Coercivity (Hc)', 'Energy Efficiency', 'Thermal Stability'];
  const radarTraces = comparisonData?.materials?.map((m, idx) => ({
    type: 'scatterpolar',
    r: [
      m.radar_scores.saturation,
      m.radar_scores.permeability,
      m.radar_scores.coercivity_strength,
      m.radar_scores.energy_efficiency,
      m.radar_scores.thermal_stability,
      m.radar_scores.saturation
    ],
    theta: [...radarCategories, radarCategories[0]],
    fill: 'toself',
    name: m.name,
    line: { color: COLORS[idx % COLORS.length] },
    opacity: 0.7
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Multi-Material Benchmarks</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <Layers className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>Multi-Material Comparative Analysis</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Side-by-side benchmark of up to 5 magnetic materials: overlaid hysteresis loops, multi-axis radar benchmarks, and industrial suitability matrices.
        </p>
      </div>

      {/* Material Selection Pills */}
      <div className="glass-card p-6 rounded-3xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-200">Select Up to 5 Materials to Compare:</span>
          <span className="font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">{selectedIds.length} / 5 Selected</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {AVAILABLE_COMPARISON_CANDIDATES.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleSelect(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all ${
                  isSelected
                    ? 'glass-btn-primary text-white shadow-lg shadow-cyan-500/30'
                    : 'glass-card-subtle text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-200" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualizations Grid: Loops & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Overlaid Loops (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-3xl space-y-3">
          <h3 className="font-bold text-white text-base">Overlaid B-H Hysteresis Loops</h3>
          <div className="min-h-[380px]">
            <PlotlyChart
              data={loopTraces}
              layout={{
                title: 'Overlaid Major Induction Loops',
                xaxis: { title: 'Applied Field Intensity H (A/m)' },
                yaxis: { title: 'Magnetic Flux Density B (Tesla)' }
              }}
            />
          </div>
        </div>

        {/* Polar Radar Chart (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-3xl space-y-3">
          <h3 className="font-bold text-white text-base">Multi-Metric Radar Comparison</h3>
          <div className="min-h-[380px]">
            <PlotlyChart
              data={radarTraces}
              layout={{
                polar: {
                  radialaxis: { visible: true, range: [0, 100], gridcolor: 'rgba(255, 255, 255, 0.15)' },
                  angularaxis: { gridcolor: 'rgba(255, 255, 255, 0.15)' },
                  bgcolor: 'transparent'
                },
                margin: { l: 40, r: 40, t: 40, b: 40 }
              }}
            />
          </div>
        </div>

      </div>

      {/* Comparison Metrics Table */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-white text-base">Comparative Electromagnetic Properties</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="glass-card-subtle text-cyan-200 font-mono uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Coercivity (Hc)</th>
                <th className="py-3 px-4">Remanence (Br)</th>
                <th className="py-3 px-4">Saturation (Ms)</th>
                <th className="py-3 px-4">Loop Area (W)</th>
                <th className="py-3 px-4">Behavior Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {comparisonData?.materials?.map((m, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-sans flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{m.name}</span>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-300">{m.category}</td>
                  <td className="py-3 px-4 text-cyan-300 font-bold">{m.parameters.coercivity_hc.toFixed(1)} A/m</td>
                  <td className="py-3 px-4 text-white font-bold">{m.parameters.remanence_br.toFixed(3)} T</td>
                  <td className="py-3 px-4 text-slate-300">{m.parameters.saturation_ms.toExponential(2)} A/m</td>
                  <td className="py-3 px-4 text-amber-300 font-bold">{m.parameters.loop_area.toFixed(1)} J/m³</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold border ${
                      m.hard_soft.class_code === 'soft' 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' 
                        : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                    }`}>
                      {m.hard_soft.behavior_class}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Suitability Matrix */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">Industrial Application Suitability Scores (0-100)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {comparisonData?.materials?.map((m, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-card-subtle border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="font-bold text-white text-sm">{m.name}</span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(m.applications || {}).map(([appKey, appInfo]) => (
                  <div key={appKey} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{appInfo.title}</span>
                      <span className="font-mono font-bold text-cyan-300">{appInfo.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 rounded-full" style={{ width: `${appInfo.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
