import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ClassificationLab from './pages/ClassificationLab';
import HysteresisLab from './pages/HysteresisLab';
import CalculatorLab from './pages/CalculatorLab';
import ComparisonLab from './pages/ComparisonLab';
import TemperatureLab from './pages/TemperatureLab';
import DomainSimulatorLab from './pages/DomainSimulatorLab';
import DatasetAnalyzerLab from './pages/DatasetAnalyzerLab';
import ExplainableAILab from './pages/ExplainableAILab';
import FrequencyLossLab from './pages/FrequencyLossLab';
import LearningCentreLab from './pages/LearningCentreLab';
import ReportsLab from './pages/ReportsLab';

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-glass-gradient text-slate-100 font-sans selection:bg-cyan-400/30 selection:text-cyan-200">
        
        {/* Luminous Ambient Background Glow Orbs (DentaCare aesthetic) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-400/15 blur-[120px]"></div>
          <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-teal-400/12 blur-[140px]"></div>
          <div className="absolute top-2/3 left-1/3 w-[36rem] h-[36rem] rounded-full bg-blue-600/15 blur-[160px]"></div>
          <div className="absolute -bottom-40 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px]"></div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/classify" element={<ClassificationLab />} />
              <Route path="/hysteresis" element={<HysteresisLab />} />
              <Route path="/calculator" element={<CalculatorLab />} />
              <Route path="/compare" element={<ComparisonLab />} />
              <Route path="/temperature" element={<TemperatureLab />} />
              <Route path="/domains" element={<DomainSimulatorLab />} />
              <Route path="/analyzer" element={<DatasetAnalyzerLab />} />
              <Route path="/xai" element={<ExplainableAILab />} />
              <Route path="/frequency" element={<FrequencyLossLab />} />
              <Route path="/learning" element={<LearningCentreLab />} />
              <Route path="/reports" element={<ReportsLab />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
}
