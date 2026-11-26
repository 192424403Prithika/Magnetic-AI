import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Download, 
  RotateCcw, 
  Info, 
  Briefcase, 
  TrendingUp, 
  Eye, 
  FileText,
  Sliders
} from 'lucide-react';
import { classifyMaterial, getPresetMaterials, generateReport } from '../api/client';

export default function ClassificationLab() {
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    material_name: 'Custom Specimen',
    temperature: 300.0,
    susceptibility: '',
    saturation_magnetization: '',
    remanent_magnetization: '',
    coercivity: '',
    initial_permeability: '',
    loop_area: ''
  });

  // Toggles for "not measured"
  const [unmeasured, setUnmeasured] = useState({
    susceptibility: false,
    saturation_magnetization: false,
    remanent_magnetization: false,
    coercivity: false,
    initial_permeability: false,
    loop_area: false
  });

  useEffect(() => {
    getPresetMaterials()
      .then((res) => {
        setPresets(res.data.presets || []);
      })
      .catch((err) => console.log('Error loading presets:', err));
  }, []);

  const handlePresetSelect = (e) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    if (!id) return;

    const preset = presets.find((p) => p.id === id);
    if (preset) {
      const f = preset.features;
      setFormData({
        material_name: preset.name,
        temperature: f.temperature || 300.0,
        susceptibility: f.susceptibility !== null && f.susceptibility !== undefined ? f.susceptibility : '',
        saturation_magnetization: f.saturation_magnetization || '',
        remanent_magnetization: f.remanent_magnetization || '',
        coercivity: f.coercivity || '',
        initial_permeability: f.initial_permeability || '',
        loop_area: f.loop_area || ''
      });

      setUnmeasured({
        susceptibility: f.susceptibility === null || f.susceptibility === undefined,
        saturation_magnetization: !f.saturation_magnetization,
        remanent_magnetization: !f.remanent_magnetization,
        coercivity: !f.coercivity,
        initial_permeability: !f.initial_permeability,
        loop_area: !f.loop_area
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleUnmeasured = (field) => {
    setUnmeasured((prev) => {
      const nextState = !prev[field];
      if (nextState) {
        setFormData((f) => ({ ...f, [field]: '' }));
      }
      return { ...prev, [field]: nextState };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        material_name: formData.material_name || 'Custom Sample',
        temperature: parseFloat(formData.temperature) || 300.0,
        susceptibility: !unmeasured.susceptibility && formData.susceptibility !== '' ? parseFloat(formData.susceptibility) : null,
        saturation_magnetization: !unmeasured.saturation_magnetization && formData.saturation_magnetization !== '' ? parseFloat(formData.saturation_magnetization) : null,
        remanent_magnetization: !unmeasured.remanent_magnetization && formData.remanent_magnetization !== '' ? parseFloat(formData.remanent_magnetization) : null,
        coercivity: !unmeasured.coercivity && formData.coercivity !== '' ? parseFloat(formData.coercivity) : null,
        initial_permeability: !unmeasured.initial_permeability && formData.initial_permeability !== '' ? parseFloat(formData.initial_permeability) : null,
        loop_area: !unmeasured.loop_area && formData.loop_area !== '' ? parseFloat(formData.loop_area) : null
      };

      const res = await classifyMaterial(payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Classification failed. Please review your input units.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const res = await generateReport({
        material_name: formData.material_name,
        analysis_data: result
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.material_name.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF error:', err);
      alert('Could not download report.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const resetForm = () => {
    setSelectedPresetId('');
    setFormData({
      material_name: 'Custom Specimen',
      temperature: 300.0,
      susceptibility: '',
      saturation_magnetization: '',
      remanent_magnetization: '',
      coercivity: '',
      initial_permeability: '',
      loop_area: ''
    });
    setUnmeasured({
      susceptibility: false,
      saturation_magnetization: false,
      remanent_magnetization: false,
      coercivity: false,
      initial_permeability: false,
      loop_area: false
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Preset Loader */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
            <Cpu className="w-8 h-8 text-cyan-400" />
            <span>AI Magnetic Material Classifier</span>
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/70 mt-1">
            Supervised machine learning ensemble classifying into 5 magnetic categories with TreeSHAP explainability and hard/soft behavior analysis.
          </p>
        </div>

        {/* Preset Selector Pill */}
        <div className="flex items-center space-x-2 glass-pill px-3 py-1.5 border border-white/20">
          <label className="text-xs text-cyan-200 font-semibold">Load Preset:</label>
          <select
            value={selectedPresetId}
            onChange={handlePresetSelect}
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-white">-- Choose Reference Material --</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={resetForm}
            className="p-1 rounded-full hover:bg-white/20 text-cyan-300 transition-colors"
            title="Reset Form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-bold text-white text-base">Electromagnetic Parameters (SI)</h2>
            <span className="text-[11px] text-cyan-300 font-mono glass-pill px-2.5 py-0.5">Partial Inputs Supported</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sample Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sample Specimen ID / Name
              </label>
              <input
                type="text"
                name="material_name"
                value={formData.material_name}
                onChange={handleInputChange}
                className="w-full glass-input px-3.5 py-2.5 text-xs text-white"
                placeholder="e.g. Iron Alloy #4B"
              />
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Temperature (T)
                </label>
                <span className="text-[11px] font-mono text-cyan-300">Kelvin (K)</span>
              </div>
              <input
                type="number"
                step="any"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full glass-input px-3.5 py-2.5 text-xs text-white"
                placeholder="300.0"
              />
            </div>

            {/* Susceptibility */}
            <div className="p-3.5 rounded-2xl glass-card-subtle space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200">
                  Volume Susceptibility (χ = M/H)
                </label>
                <button
                  type="button"
                  onClick={() => toggleUnmeasured('susceptibility')}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono transition-colors ${
                    unmeasured.susceptibility ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'glass-pill text-slate-400'
                  }`}
                >
                  {unmeasured.susceptibility ? 'Not Measured' : 'Mark Unmeasured'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                name="susceptibility"
                disabled={unmeasured.susceptibility}
                value={formData.susceptibility}
                onChange={handleInputChange}
                className={`w-full glass-input px-3.5 py-2 text-xs text-white ${
                  unmeasured.susceptibility ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                placeholder="e.g. -1.66e-4 (Bi) or 5000 (Fe)"
              />
              <span className="text-[10px] text-cyan-200/50">Dimensionless (SI volume). Negative for diamagnets.</span>
            </div>

            {/* Saturation Magnetization Ms */}
            <div className="p-3.5 rounded-2xl glass-card-subtle space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200">
                  Saturation Magnetization (Ms)
                </label>
                <button
                  type="button"
                  onClick={() => toggleUnmeasured('saturation_magnetization')}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono transition-colors ${
                    unmeasured.saturation_magnetization ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'glass-pill text-slate-400'
                  }`}
                >
                  {unmeasured.saturation_magnetization ? 'Not Measured' : 'Mark Unmeasured'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                name="saturation_magnetization"
                disabled={unmeasured.saturation_magnetization}
                value={formData.saturation_magnetization}
                onChange={handleInputChange}
                className={`w-full glass-input px-3.5 py-2 text-xs text-white ${
                  unmeasured.saturation_magnetization ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                placeholder="e.g. 1.71e6"
              />
              <span className="text-[10px] text-cyan-200/50">SI Units: Amperes per meter (A/m)</span>
            </div>

            {/* Coercivity Hc */}
            <div className="p-3.5 rounded-2xl glass-card-subtle space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200">
                  Coercivity (Hc)
                </label>
                <button
                  type="button"
                  onClick={() => toggleUnmeasured('coercivity')}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono transition-colors ${
                    unmeasured.coercivity ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'glass-pill text-slate-400'
                  }`}
                >
                  {unmeasured.coercivity ? 'Not Measured' : 'Mark Unmeasured'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                name="coercivity"
                disabled={unmeasured.coercivity}
                value={formData.coercivity}
                onChange={handleInputChange}
                className={`w-full glass-input px-3.5 py-2 text-xs text-white ${
                  unmeasured.coercivity ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                placeholder="e.g. 40.0 (soft iron) or 875000 (NdFeB)"
              />
              <span className="text-[10px] text-cyan-200/50">SI Units: Amperes per meter (A/m)</span>
            </div>

            {/* Remanent Mr */}
            <div className="p-3.5 rounded-2xl glass-card-subtle space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200">
                  Remanent Magnetization (Mr)
                </label>
                <button
                  type="button"
                  onClick={() => toggleUnmeasured('remanent_magnetization')}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono transition-colors ${
                    unmeasured.remanent_magnetization ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'glass-pill text-slate-400'
                  }`}
                >
                  {unmeasured.remanent_magnetization ? 'Not Measured' : 'Mark Unmeasured'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                name="remanent_magnetization"
                disabled={unmeasured.remanent_magnetization}
                value={formData.remanent_magnetization}
                onChange={handleInputChange}
                className={`w-full glass-input px-3.5 py-2 text-xs text-white ${
                  unmeasured.remanent_magnetization ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                placeholder="e.g. 1.15e6"
              />
              <span className="text-[10px] text-cyan-200/50">SI Units: Amperes per meter (A/m)</span>
            </div>

            {/* Loop Area W */}
            <div className="p-3.5 rounded-2xl glass-card-subtle space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200">
                  Loop Energy Loss (W = ∮ H dB)
                </label>
                <button
                  type="button"
                  onClick={() => toggleUnmeasured('loop_area')}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono transition-colors ${
                    unmeasured.loop_area ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'glass-pill text-slate-400'
                  }`}
                >
                  {unmeasured.loop_area ? 'Not Measured' : 'Mark Unmeasured'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                name="loop_area"
                disabled={unmeasured.loop_area}
                value={formData.loop_area}
                onChange={handleInputChange}
                className={`w-full glass-input px-3.5 py-2 text-xs text-white ${
                  unmeasured.loop_area ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                placeholder="e.g. 180.0"
              />
              <span className="text-[10px] text-cyan-200/50">SI Units: Joules per cubic meter per cycle (J/m³)</span>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 glass-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating Features...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute ML Classification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results & Analysis Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <div className="h-full min-h-[420px] rounded-3xl glass-card border border-dashed border-white/20 flex flex-col items-center justify-center p-8 text-center">
              <Cpu className="w-14 h-14 text-cyan-400/50 mb-3" />
              <h3 className="text-white font-bold text-base">Awaiting Material Inputs</h3>
              <p className="text-xs text-cyan-100/60 max-w-sm mt-1">
                Select a reference material preset above or enter measured physical parameters, then click Execute ML Classification.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Primary Verdict Card */}
              <div className="p-6 rounded-3xl glass-card border border-white/25 shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                      Predicted Magnetic State
                    </span>
                    <h2 className="text-3xl font-extrabold text-white uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-200">
                      {result.predicted_category}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-cyan-200 uppercase">Model Score</span>
                    <div className="text-2xl font-black text-cyan-300">
                      {(result.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Hard vs Soft Badge */}
                {result.hard_soft_classification && (
                  <div className="p-4 rounded-2xl glass-card-subtle space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-200">Behavioral Sub-Classification:</span>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                        result.hard_soft_classification.class_code === 'soft'
                          ? 'bg-teal-400/20 text-teal-300 border-teal-400/40'
                          : result.hard_soft_classification.class_code === 'hard'
                          ? 'bg-rose-400/20 text-rose-300 border-rose-400/40'
                          : 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40'
                      }`}>
                        {result.hard_soft_classification.behavior_class}
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-100/70 leading-relaxed">
                      {result.hard_soft_classification.description}
                    </p>
                    <p className="text-[10px] text-cyan-200/50 italic pt-1 border-t border-white/10">
                      *{result.hard_soft_classification.note}
                    </p>
                  </div>
                )}

                {/* OOD Warning */}
                {result.out_of_distribution?.is_ood && (
                  <div className="p-4 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-start space-x-3 text-amber-300 text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Out-Of-Distribution / Ambiguity Detected</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        {result.out_of_distribution.warning_message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Probability Spectrum */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-300">Ensemble Probability Spectrum</span>
                  <div className="space-y-2">
                    {Object.entries(result.probabilities || {}).map(([cat, prob]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className={cat === result.predicted_category ? 'font-bold text-cyan-300 capitalize' : 'text-slate-400 capitalize'}>
                            {cat}
                          </span>
                          <span className="font-mono text-cyan-200">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full glass-card-subtle overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              cat === result.predicted_category
                                ? 'bg-gradient-to-r from-cyan-400 to-teal-300 shadow-[0_0_12px_#22d3ee]'
                                : 'bg-slate-600/60'
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PDF Report Trigger */}
                <div className="pt-3 border-t border-white/10 flex justify-end">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="px-5 py-2.5 rounded-full glass-pill hover:bg-white/[0.15] text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'Generating PDF...' : 'Download Technical PDF Report'}</span>
                  </button>
                </div>
              </div>

              {/* Explainable AI (XAI) Panel */}
              {result.xai && (
                <div className="p-6 rounded-3xl glass-card border border-white/20 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
                    <Briefcase className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">Explainable AI (TreeSHAP Physical Attribution)</h3>
                  </div>

                  <div className="text-xs text-cyan-100/80 leading-relaxed glass-card-subtle p-4 rounded-2xl whitespace-pre-line">
                    {result.xai.plain_english_narrative}
                  </div>

                  {/* Top SHAP Attributions Bar Chart */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-slate-300">Key Feature Contributions (SHAP Values)</span>
                    <div className="space-y-2">
                      {result.xai.shap_attributions?.slice(0, 5).map((attr) => {
                        const isPos = attr.shap_value >= 0;
                        return (
                          <div key={attr.feature} className="p-3 rounded-2xl glass-card-subtle flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono text-slate-200 font-medium">{attr.feature}</span>
                              <div className="text-[10px] text-cyan-200/60">Input: {attr.input_value}</div>
                            </div>
                            <span className={`font-mono font-bold ${isPos ? 'text-cyan-300' : 'text-rose-400'}`}>
                              {isPos ? `+${attr.shap_value.toFixed(3)}` : attr.shap_value.toFixed(3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Industrial Application Recommendations */}
              {result.applications && (
                <div className="p-6 rounded-3xl glass-card border border-white/20 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">Industrial Application Recommendations</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {Object.entries(result.applications).map(([key, app]) => (
                      <div key={key} className="p-3.5 rounded-2xl glass-card-subtle space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white">{app.title}</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            app.score >= 70 ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40' : app.score >= 40 ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : 'glass-pill text-slate-400'
                          }`}>
                            {app.score}% ({app.rating})
                          </span>
                        </div>
                        <p className="text-[11px] text-cyan-100/70 leading-snug">{app.rationale}</p>
                      </div>
                    ))}
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
