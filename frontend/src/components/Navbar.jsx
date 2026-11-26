import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Activity, 
  Cpu, 
  Layers, 
  Thermometer, 
  Box, 
  UploadCloud, 
  HelpCircle, 
  FileText, 
  Zap, 
  Calculator, 
  BarChart2,
  Sparkles
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Compass },
  { name: 'AI Classification', path: '/classify', icon: Cpu },
  { name: 'Hysteresis Lab', path: '/hysteresis', icon: Activity },
  { name: 'Calculator', path: '/calculator', icon: Calculator },
  { name: 'Comparison', path: '/compare', icon: Layers },
  { name: 'Temperature', path: '/temperature', icon: Thermometer },
  { name: '3D Domains', path: '/domains', icon: Box },
  { name: 'CSV Analyzer', path: '/analyzer', icon: UploadCloud },
  { name: 'Explainable AI', path: '/xai', icon: BarChart2 },
  { name: 'Frequency Loss', path: '/frequency', icon: Zap },
  { name: 'Learning Centre', path: '/learning', icon: HelpCircle },
  { name: 'Reports', path: '/reports', icon: FileText },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="glass-card px-4 sm:px-6 py-2.5 backdrop-blur-2xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-13">
          
          {/* Logo & Platform Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-300 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] group-hover:scale-105 transition-transform border border-white/40">
              <Compass className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-teal-300 drop-shadow-sm">
                  MAGNETIC AI
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-sm">
                  v1.0 Capstone
                </span>
              </div>
              <p className="text-[11px] text-cyan-100/70 tracking-wide hidden sm:block">
                Intelligent Magnetic Material Analysis Platform
              </p>
            </div>
          </Link>

          {/* Status Pills */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="glass-pill px-3 py-1 text-xs text-slate-200 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
              <span className="font-medium">Inference Engine: <b className="text-cyan-300">Online</b></span>
            </div>
            <div className="glass-pill px-3 py-1 text-xs text-slate-300">
              Units: <b className="text-teal-300">SI Standardized</b>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1.5 overflow-x-auto pt-2.5 pb-1 scrollbar-none border-t border-white/10 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'glass-btn-primary shadow-[0_0_16px_rgba(56,189,248,0.5)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950 font-bold' : 'text-cyan-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
