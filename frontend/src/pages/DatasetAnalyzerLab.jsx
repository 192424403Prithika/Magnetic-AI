import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Cpu, TrendingUp, Sparkles } from 'lucide-react';
import { uploadDataCSV } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

export default function DatasetAnalyzerLab() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadDataCSV(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'CSV parsing and validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const p = result?.parameters;
  const c = result?.classification;

  const plotData = result?.plot_data
    ? [
        {
          x: result.plot_data.h,
          y: result.plot_data.b,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Experimental Loop (B-H)',
          line: { color: '#38BDF8', width: 2.5 },
          marker: { size: 5, color: '#2DD4BF' }
        }
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Automated CSV Parsing Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <UploadCloud className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>Experimental CSV Dataset Analyzer</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Upload raw magnetometry data files (VSM, SQUID, or fluxmeter) in CSV format. 
          The platform automatically detects column units, filters noise, calculates hysteresis loop parameters, and evaluates ML classification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upload Form Column (4 cols) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-5">
          <h3 className="font-bold text-white text-base border-b border-white/10 pb-3">
            Upload CSV Magnetometry Data
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-cyan-400/30 hover:border-cyan-300 rounded-2xl p-7 text-center glass-card-subtle cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/10">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer space-y-2.5 block">
                <FileSpreadsheet className="w-12 h-12 text-cyan-400 mx-auto drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                <div className="text-xs font-semibold text-white">
                  {file ? file.name : 'Click to Browse or Drag CSV'}
                </div>
                <div className="text-[10px] text-cyan-100/60">
                  Must include field H and induction B (or magnetization M)
                </div>
              </label>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3.5 rounded-full glass-btn-primary text-white font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Validating & Parsing...' : 'Parse & Analyze Magnetometry'}</span>
            </button>
          </form>

          {/* Sample CSV Format Helper */}
          <div className="p-4 rounded-2xl glass-card-subtle border border-white/10 text-[11px] text-cyan-100/70 space-y-2">
            <h4 className="font-bold text-white">Expected Format & Headers:</h4>
            <pre className="p-2.5 rounded-xl bg-slate-950/70 text-[10px] font-mono text-cyan-300 border border-white/5">
{`H,B
-4000,-1.52
-2000,-1.30
0,-0.60
2000,1.30
4000,1.52`}
            </pre>
            <p className="text-[10px] text-slate-400">
              Field H in A/m (or Oe) and Induction B in Tesla.
            </p>
          </div>
        </div>

        {/* Analysis Results Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!result ? (
            <div className="h-full min-h-[380px] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center glass-card-subtle">
              <UploadCloud className="w-14 h-14 text-cyan-400/40 mb-3" />
              <h3 className="text-white font-bold text-base">No Dataset Uploaded</h3>
              <p className="text-xs text-cyan-100/60 max-w-sm mt-1">
                Upload your raw measurement file to visualize experimental zero crossings, hysteresis loop area, and automated classification.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Parse Summary Banner */}
              <div className="p-5 rounded-3xl glass-card border border-cyan-400/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">{result.filename}</span>
                  </div>
                  <div className="text-xs text-cyan-100/70 mt-0.5">
                    Detected Columns: <b>{result.h_column}</b> (H) & <b>{result.b_or_m_column}</b> (B/M) · {result.total_rows_parsed} points
                  </div>
                </div>

                {result.hard_soft_classification && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    result.hard_soft_classification.class_code === 'soft'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}>
                    {result.hard_soft_classification.behavior_class}
                  </span>
                )}
              </div>

              {/* Loop Plot */}
              <div className="glass-card p-6 rounded-3xl space-y-3">
                <h3 className="font-bold text-white text-base">Reconstructed Experimental Loop</h3>
                <div className="min-h-[340px]">
                  <PlotlyChart
                    data={plotData}
                    layout={{
                      title: `Experimental B-H Loop: ${result.filename}`,
                      xaxis: { title: 'Applied Magnetic Field H (A/m)' },
                      yaxis: { title: 'Magnetic Flux Density B (Tesla)' }
                    }}
                  />
                </div>
              </div>

              {/* Extracted Parameters Grid */}
              {p && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl glass-card border border-white/15">
                    <span className="text-[11px] text-cyan-200/80">Coercivity (Hc):</span>
                    <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{p.coercivity_hc.toFixed(1)} A/m</div>
                  </div>
                  <div className="p-4 rounded-2xl glass-card border border-white/15">
                    <span className="text-[11px] text-cyan-200/80">Remanence (Br):</span>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{p.remanence_br.toFixed(3)} T</div>
                  </div>
                  <div className="p-4 rounded-2xl glass-card border border-white/15">
                    <span className="text-[11px] text-cyan-200/80">Saturation (Bs):</span>
                    <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{p.saturation_bs.toFixed(2)} T</div>
                  </div>
                  <div className="p-4 rounded-2xl glass-card border border-white/15">
                    <span className="text-[11px] text-amber-200/80">Loop Area (W):</span>
                    <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">{p.loop_area.toFixed(1)} J/m³</div>
                  </div>
                </div>
              )}

              {/* Auto Classification Result */}
              {c && (
                <div className="p-6 rounded-3xl glass-card border border-cyan-400/30 space-y-3 shadow-xl">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white text-sm">Automated ML Material Classification</h4>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-cyan-100/70">Predicted Category:</span>
                      <div className="text-lg font-extrabold text-cyan-300 uppercase mt-0.5">{c.predicted_category}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-100/70">Model Score:</span>
                      <div className="text-lg font-extrabold text-white mt-0.5">{(c.confidence_score * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
