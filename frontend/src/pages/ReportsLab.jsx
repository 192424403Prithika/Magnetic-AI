import React, { useState, useEffect } from 'react';
import { FileText, Download, RotateCcw, Clock, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { getHistory, generateReport } from '../api/client';

export default function ReportsLab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownload = async (record) => {
    setDownloadingId(record.id);
    try {
      const payload = {
        material_name: record.material_name,
        analysis_data: {
          predicted_category: record.predicted_category,
          confidence_score: record.confidence,
          probabilities: record.probabilities,
          hard_soft_classification: {
            behavior_class: record.hard_soft_class || 'N/A'
          },
          properties: record.properties,
          xai: {
            plain_english_narrative: `Material classified as ${record.predicted_category.toUpperCase()} with confidence ${(record.confidence * 100).toFixed(1)}%.`
          },
          applications: {
            transformer: { title: 'Transformer Core', score: 85, rating: 'High', rationale: 'Suitable magnetic parameters.' }
          }
        }
      };

      const res = await generateReport(payload);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${record.material_name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Report download error:', err);
      alert('Could not generate PDF report.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Archived Analyses & Export</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
            <FileText className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
            <span>Technical Characterization Reports & History</span>
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
            Access previous session analyses persisted in SQLite and generate publication-quality PDF reports with embedded B-H plots, properties, and XAI summaries.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="px-4 py-2 rounded-full glass-card-subtle hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-white/15 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* History Table Card */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-bold text-white text-base">Persisted Analysis Sessions</h3>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">{history.length} Saved Records</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-cyan-100/60 text-xs">
            No analysis sessions logged yet. Head to the AI Classification Lab to analyze your first specimen!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="glass-card-subtle text-cyan-200 font-mono uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Specimen Name</th>
                  <th className="py-3 px-4">Predicted Class</th>
                  <th className="py-3 px-4">Model Score</th>
                  <th className="py-3 px-4">Behavior Class</th>
                  <th className="py-3 px-4 text-right">PDF Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{record.created_at ? record.created_at.replace('T', ' ').slice(0, 19) : '--'}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-sans">{record.material_name}</td>
                    <td className="py-3 px-4 capitalize text-cyan-300 font-bold">{record.predicted_category}</td>
                    <td className="py-3 px-4 text-slate-200">{(record.confidence * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{record.hard_soft_class || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => handleDownload(record)}
                        disabled={downloadingId === record.id}
                        className="px-3.5 py-1.5 rounded-full glass-card-interactive text-cyan-300 border border-cyan-400/40 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === record.id ? 'Building...' : 'Download PDF'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
