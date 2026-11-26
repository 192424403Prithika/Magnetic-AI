import React, { useState, useEffect } from 'react';
import { BarChart2, ShieldAlert, Cpu, Award, HelpCircle, Layers, CheckCircle2, Sparkles } from 'lucide-react';
import { getModelMetrics } from '../api/client';
import PlotlyChart from '../components/PlotlyChart';

export default function ExplainableAILab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelMetrics()
      .then((res) => {
        setMetrics(res.data);
      })
      .catch((err) => console.error('Metrics fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Feature Importances Bar Chart Trace
  const fi = metrics?.feature_importances || {};
  const fiKeys = Object.keys(fi);
  const fiVals = Object.values(fi);

  const featureImportanceTrace = [
    {
      x: fiVals,
      y: fiKeys,
      type: 'bar',
      orientation: 'h',
      marker: { color: '#38BDF8' }
    }
  ];

  // Confusion Matrix Heatmap Trace
  const cm = metrics?.confusion_matrix || [];
  const classes = metrics?.classes || ['diamagnetic', 'paramagnetic', 'ferromagnetic', 'antiferromagnetic', 'ferrimagnetic'];

  const confusionMatrixTrace = [
    {
      z: cm,
      x: classes,
      y: classes,
      type: 'heatmap',
      colorscale: [
        [0, '#0B1530'],
        [0.5, '#0E7490'],
        [1, '#38BDF8']
      ],
      showscale: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Transparent Physics-Informed ML</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <BarChart2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>Explainable AI (XAI) & Model Transparency</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Rigorous scientific evaluation of machine learning models: GroupKFold cross-validation benchmarks, ensemble model comparisons, global feature importance, and Shapley additive attributions.
        </p>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-4 rounded-3xl glass-card border border-cyan-400/30 flex items-start space-x-3 text-cyan-100">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white text-xs">Scientific & Methodological Transparency Disclaimer</p>
          <p className="text-[11px] text-cyan-100/70 leading-relaxed">
            {metrics?.scientific_disclaimer ||
              'Trained on a small reference + simulated dataset; probabilities are model scores, not validated scientific confidence.'}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-white/15">
          <span className="text-[11px] text-cyan-200/80 uppercase font-mono tracking-wider">Champion Model</span>
          <div className="text-xl font-extrabold text-cyan-300 mt-1">
            {metrics?.best_model || 'Gradient Boosting'}
          </div>
          <span className="text-[10px] text-slate-400">Highest GroupKFold Macro-F1</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-white/15">
          <span className="text-[11px] text-cyan-200/80 uppercase font-mono tracking-wider">Overall Accuracy</span>
          <div className="text-xl font-extrabold text-white mt-1">
            {metrics?.overall_accuracy ? `${(metrics.overall_accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Multi-class classification</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-white/15">
          <span className="text-[11px] text-cyan-200/80 uppercase font-mono tracking-wider">Macro-F1 Score</span>
          <div className="text-xl font-extrabold text-cyan-300 mt-1">
            {metrics?.overall_f1_macro ? metrics.overall_f1_macro.toFixed(3) : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Harmonic mean precision/recall</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-white/15">
          <span className="text-[11px] text-cyan-200/80 uppercase font-mono tracking-wider">Validation Protocol</span>
          <div className="text-xl font-extrabold text-white mt-1">GroupKFold (k=5)</div>
          <span className="text-[10px] text-slate-400">Grouped by material name</span>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">Candidate Model Cross-Validation Benchmarks</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="glass-card-subtle text-cyan-200 font-mono uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Classifier Architecture</th>
                <th className="py-3 px-4">CV Accuracy</th>
                <th className="py-3 px-4">Macro-F1 Score</th>
                <th className="py-3 px-4">Macro Precision</th>
                <th className="py-3 px-4">Macro Recall</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {Object.entries(metrics?.model_comparison || {}).map(([name, scores]) => {
                const isChampion = name === metrics?.best_model;
                return (
                  <tr key={name} className={isChampion ? 'bg-cyan-500/10' : 'hover:bg-white/5 transition-colors'}>
                    <td className="py-3 px-4 font-bold text-white font-sans flex items-center space-x-2">
                      {isChampion && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      <span>{name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{(scores.cv_accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">{scores.cv_f1_macro.toFixed(3)}</td>
                    <td className="py-3 px-4 text-slate-300">{(scores.cv_precision_macro * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-slate-300">{(scores.cv_recall_macro * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      {isChampion ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold font-sans border border-cyan-400/40">
                          Production Model
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizations: Feature Importances & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Feature Importance (6 cols) */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl space-y-3">
          <h3 className="font-bold text-white text-base">Global Feature Importances</h3>
          <div className="min-h-[350px]">
            <PlotlyChart
              data={featureImportanceTrace}
              layout={{
                title: 'Ensemble Feature Weights',
                xaxis: { title: 'Relative Importance' },
                margin: { l: 140, r: 20, t: 40, b: 40 }
              }}
            />
          </div>
        </div>

        {/* Confusion Matrix (6 cols) */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl space-y-3">
          <h3 className="font-bold text-white text-base">Multi-Class Confusion Matrix</h3>
          <div className="min-h-[350px]">
            <PlotlyChart
              data={confusionMatrixTrace}
              layout={{
                title: 'True vs Predicted Classes',
                xaxis: { title: 'Predicted Class', tickangle: -30 },
                yaxis: { title: 'True Literature Class' },
                margin: { l: 100, r: 20, t: 40, b: 60 }
              }}
            />
          </div>
        </div>

      </div>

      {/* Per-Class Detailed Breakdown */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-white text-base">Per-Class Precision, Recall, and Support</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {Object.entries(metrics?.per_class_metrics || {}).map(([cls, data]) => (
            <div key={cls} className="p-4 rounded-2xl glass-card-subtle border border-white/10 space-y-2">
              <span className="font-bold text-cyan-300 capitalize text-sm">{cls}</span>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Precision:</span>
                  <span>{(data.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recall:</span>
                  <span>{(data.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">F1-Score:</span>
                  <span className="font-bold text-cyan-200">{data.f1_score.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 text-[10px] text-slate-400">
                  <span>Support:</span>
                  <span>{data.support} samples</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
