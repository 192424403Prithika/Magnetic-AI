import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  Atom, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sparkles 
} from 'lucide-react';
import { getQuizData } from '../api/client';

export default function LearningCentreLab() {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'quiz' | 'viva'
  const [quizData, setQuizData] = useState([]);
  const [vivaData, setVivaData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Viva open accordion state
  const [openVivaIdx, setOpenVivaIdx] = useState(0);

  useEffect(() => {
    getQuizData()
      .then((res) => {
        setQuizData(res.data.quiz || []);
        setVivaData(res.data.viva_qa || []);
      })
      .catch((err) => console.error('Quiz fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectOption = (questionId, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    quizData.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_index) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setSubmitted(true);
  };

  const handleQuizReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Interactive Pedagogy & Viva Voce</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3 tracking-tight">
          <BookOpen className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          <span>Physics Learning Centre & Viva Voce Exam Prep</span>
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100/70 mt-1 max-w-3xl">
          Master the quantum and thermodynamic principles of magnetism: microscopic spin configurations, domain wall pinning, 20-question certification quiz, and faculty viva exam Q&A.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'notes' ? 'glass-btn-primary text-white shadow-lg shadow-cyan-500/30' : 'glass-card-subtle text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          1. Physics Lecture Notes & Spin Lattices
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'quiz' ? 'glass-btn-primary text-white shadow-lg shadow-cyan-500/30' : 'glass-card-subtle text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          2. Certification Physics Quiz (20 Questions)
        </button>

        <button
          onClick={() => setActiveTab('viva')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'viva' ? 'glass-btn-primary text-white shadow-lg shadow-cyan-500/30' : 'glass-card-subtle text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          3. Oral Viva Voce Q&A Master List
        </button>
      </div>

      {/* TAB 1: Physics Lecture Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Diamagnetism */}
            <div className="p-5 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">1. Diamagnetic</span>
                <span className="text-[10px] font-mono text-cyan-100/60">χ &lt; 0 (~10⁻⁵)</span>
              </div>
              {/* Moment diagram */}
              <div className="h-14 rounded-2xl glass-card-subtle border border-white/10 flex items-center justify-center space-x-2 text-slate-400 text-xs font-mono">
                <span>( ⤹ ⤸ ) No Net Spins</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-snug">
                Paired electron shells. Applied field induces orbital currents opposing H by Lenz's law. Repelled by magnetic gradients. Independent of T.
              </p>
              <div className="text-[10px] text-cyan-300 pt-1 border-t border-white/10">
                Examples: Bismuth, Copper, Pyrolytic Graphite, Gold.
              </div>
            </div>

            {/* Paramagnetism */}
            <div className="p-5 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">2. Paramagnetic</span>
                <span className="text-[10px] font-mono text-cyan-100/60">χ &gt; 0 (~10⁻⁴)</span>
              </div>
              <div className="h-14 rounded-2xl glass-card-subtle border border-white/10 flex items-center justify-center space-x-2 text-cyan-400 text-sm font-bold">
                <span>↗ ↘ ↖ ↗ ↙</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-snug">
                Unpaired electron spins. Thermal energy prevents collective ordering in zero field. Moment aligns along H with χ = C/T (Curie Law).
              </p>
              <div className="text-[10px] text-cyan-300 pt-1 border-t border-white/10">
                Examples: Aluminum, Platinum, Titanium, Oxygen.
              </div>
            </div>

            {/* Ferromagnetism */}
            <div className="p-5 rounded-3xl glass-card border border-cyan-400/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">3. Ferromagnetic</span>
                <span className="text-[10px] font-mono text-cyan-300">χ &gt;&gt; 100</span>
              </div>
              <div className="h-14 rounded-2xl glass-card-subtle border border-cyan-400/30 flex items-center justify-center space-x-2 text-cyan-300 text-sm font-extrabold">
                <span>↑ ↑ ↑ ↑ ↑</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-snug">
                Positive quantum exchange interaction (J &gt; 0). Spontaneous parallel spin ordering forming domains, macroscopic remanence, and hysteresis.
              </p>
              <div className="text-[10px] text-cyan-300 pt-1 border-t border-white/10">
                Examples: Iron (Fe), Cobalt (Co), Nickel (Ni), NdFeB.
              </div>
            </div>

            {/* Antiferromagnetism */}
            <div className="p-5 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">4. Antiferromagnetic</span>
                <span className="text-[10px] font-mono text-cyan-100/60">χ ~ 10⁻³</span>
              </div>
              <div className="h-14 rounded-2xl glass-card-subtle border border-white/10 flex items-center justify-center space-x-2 text-cyan-400 text-sm font-bold">
                <span>↑ ↓ ↑ ↓ ↑</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-snug">
                Negative exchange (J &lt; 0). Equal opposing sublattices cancel completely below Néel temperature TN. Sharp susceptibility peak at TN.
              </p>
              <div className="text-[10px] text-cyan-300 pt-1 border-t border-white/10">
                Examples: Manganese Oxide (MnO), Nickel Oxide (NiO), Cr.
              </div>
            </div>

            {/* Ferrimagnetism */}
            <div className="p-5 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">5. Ferrimagnetic</span>
                <span className="text-[10px] font-mono text-cyan-100/60">χ ~ 10 - 10⁴</span>
              </div>
              <div className="h-14 rounded-2xl glass-card-subtle border border-white/10 flex items-center justify-center space-x-2 text-cyan-400 text-sm font-bold">
                <span>↑  ↓  ↑  ↓  ↑</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-snug">
                Antiparallel sublattices with unequal magnetic moment magnitudes, leaving net spontaneous magnetization. High electrical resistivity.
              </p>
              <div className="text-[10px] text-cyan-300 pt-1 border-t border-white/10">
                Examples: Magnetite (Fe3O4), MnZn Ferrite, YIG.
              </div>
            </div>

          </div>

          {/* Hard vs Soft Explanation Box */}
          <div className="p-6 rounded-3xl glass-card border border-cyan-400/30 space-y-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Crucial Distinction: Ordering Category vs Behavioral Class</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <b>Hard vs Soft</b> is an engineering behavioral classification defined by coercivity (Hc), domain wall mobility, and pinning energy kinetics, <b>NOT</b> a fifth fundamental quantum ordering category. Both hard and soft magnetic materials belong to the ferromagnetic or ferrimagnetic families:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl glass-card-subtle border border-white/10 space-y-1">
                <span className="font-bold text-cyan-300">Soft Magnetic Materials (Hc &lt; 1 kA/m)</span>
                <p className="text-cyan-100/70">
                  High domain wall mobility, minimal pinning, narrow hysteresis loop, low core losses. Ideal for power transformers, motor stators, and magnetic shielding.
                </p>
              </div>
              <div className="p-4 rounded-2xl glass-card-subtle border border-white/10 space-y-1">
                <span className="font-bold text-rose-300">Hard Magnetic Materials (Hc &gt; 10 kA/m)</span>
                <p className="text-cyan-100/70">
                  Dense pinning sites, high magnetocrystalline anisotropy, broad loop, high remanence Br and maximum energy product (BH)max. Ideal for permanent magnets, brushless DC rotors, and MRI assemblies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Certification Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl glass-card border border-cyan-400/20">
            <div>
              <h3 className="font-bold text-white text-base">Engineering Physics Certification Quiz</h3>
              <p className="text-xs text-cyan-100/70">20 comprehensive questions covering quantum exchange, hysteresis, and electromagnetic loss theory.</p>
            </div>

            {submitted && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[10px] text-cyan-200/80 uppercase font-mono">Final Score</span>
                  <div className="text-xl font-extrabold text-cyan-300">
                    {score} / {quizData.length} ({Math.round((score / quizData.length) * 100)}%)
                  </div>
                </div>
                <button
                  onClick={handleQuizReset}
                  className="px-4 py-2 rounded-full glass-card-subtle text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-white/15"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {quizData.map((q, idx) => {
              const selected = selectedAnswers[q.id];
              const isCorrect = submitted && selected === q.correct_index;
              const isWrong = submitted && selected !== undefined && selected !== q.correct_index;

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-3xl transition-all border ${
                    submitted
                      ? isCorrect
                        ? 'glass-card border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                        : 'glass-card border-rose-500/50 shadow-lg shadow-rose-500/10'
                      : 'glass-card border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-bold text-white">
                      Q{idx + 1}: {q.question}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 shrink-0 px-2.5 py-0.5 rounded-full glass-card-subtle border border-cyan-400/20">
                      {q.topic}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selected === optIdx;
                      let btnStyle = 'glass-card-subtle border-white/10 text-slate-200 hover:border-cyan-400/40';

                      if (submitted) {
                        if (optIdx === q.correct_index) {
                          btnStyle = 'bg-cyan-500/25 border-cyan-400 text-white font-bold shadow-sm shadow-cyan-500/20';
                        } else if (isChosen && optIdx !== q.correct_index) {
                          btnStyle = 'bg-rose-500/25 border-rose-400 text-rose-200';
                        } else {
                          btnStyle = 'glass-card-subtle border-white/5 text-slate-500 opacity-60';
                        }
                      } else if (isChosen) {
                        btnStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold shadow-inner';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={submitted}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {submitted && optIdx === q.correct_index && (
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                          )}
                          {submitted && isChosen && optIdx !== q.correct_index && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation on submission */}
                  {submitted && (
                    <div className="mt-3.5 p-3.5 rounded-2xl glass-card-subtle text-xs text-cyan-100/90 leading-relaxed border border-white/10">
                      <span className="font-bold text-cyan-300">Physics Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!submitted && (
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(selectedAnswers).length === 0}
              className="w-full py-4 rounded-full glass-btn-primary text-white font-bold text-sm shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>Submit Quiz for Evaluation ({Object.keys(selectedAnswers).length} / {quizData.length} answered)</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 3: Viva Voce Q&A Master List */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl glass-card border border-white/10">
            <h3 className="font-bold text-white text-base">Oral Viva Voce & Defense Examination Guide</h3>
            <p className="text-xs text-cyan-100/70">Model answers to frequently asked engineering physics faculty oral examination questions.</p>
          </div>

          <div className="space-y-3">
            {vivaData.map((item, idx) => {
              const isOpen = openVivaIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-3xl glass-card overflow-hidden shadow-lg transition-all"
                >
                  <button
                    onClick={() => setOpenVivaIdx(isOpen ? -1 : idx)}
                    className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>{item.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-white/10">
                      <div className="p-4 rounded-2xl glass-card-subtle border border-white/10 font-sans text-cyan-100/90 leading-relaxed">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
