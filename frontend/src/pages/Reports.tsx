import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="flex-grow p-4 sm:p-6 lg:p-8 bg-[#0a0f1d] min-h-screen text-slate-100 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Reports & Analytics
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Audit AI deflection rates, team response benchmarks, and customer resolution scores.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[#0c1325]/60 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AI Deflection Rate</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">74.2%</h3>
            <span className="text-[10.5px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.1% deflection this week
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0c1325]/60 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Resolution Time</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">18 mins</h3>
            <span className="text-[10.5px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              -6.5m response delay improvement
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0c1325]/60 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer CSAT</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">4.8 / 5.0</h3>
            <span className="text-[10.5px] text-indigo-300 flex items-center gap-1 mt-1">
              Based on 145 surveys
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Under Construction Graphic */}
      <div className="bg-[#0c1325]/40 border border-slate-800 border-dashed rounded-2xl p-8 sm:p-16 flex flex-col items-center justify-center text-center flex-grow">
        <BarChart3 className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
        <h3 className="text-slate-200 font-bold text-base">Analytical Visualizations</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
          Interactive line charts showing message traffic and agent performance curves are compiling in background workers.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-950/20 border border-yellow-900/30 text-[10px] text-yellow-400 font-bold rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          Analytics engine running in background
        </div>
      </div>
    </div>
  );
};
export default Reports;
