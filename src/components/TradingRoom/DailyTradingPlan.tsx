import React, { useState } from 'react';
import { Target, Save, CheckCircle, Calendar, AlertTriangle, TrendingUp, ShieldAlert, CheckSquare, Square, BookOpen, Award } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DailyTradingPlan: React.FC = () => {
  // Pre-Market Checklist
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Checked Economic Calendar (News)', completed: false },
    { id: 2, text: 'Analyzed Higher Timeframes (Trend)', completed: false },
    { id: 3, text: 'Identified Key Support/Resistance', completed: false },
    { id: 4, text: 'Mental State is Calm & Focused', completed: false },
    { id: 5, text: 'No Distractions in Workspace', completed: false },
  ]);

  // Daily Goals & Limits
  const [maxLoss, setMaxLoss] = useState<number>(100);
  const [profitTarget, setProfitTarget] = useState<number>(200);
  const [maxTrades, setMaxTrades] = useState<number>(3);

  // Strategy & Focus
  const [focusSetups, setFocusSetups] = useState('');
  
  // End of Day Review
  const [followedRules, setFollowedRules] = useState<boolean | null>(null);
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercentage = (completedCount / checklist.length) * 100;

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">Daily Trading Plan</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Prepare, execute, and review your trading day</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">Date:</span>
          <span className="text-sm font-semibold text-white">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Left Column: Pre-Market & Goals */}
        <div className="space-y-6">
          
          {/* Pre-Market Checklist */}
          <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Pre-Market Checklist
              </h3>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                {completedCount}/{checklist.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="space-y-2 mt-4">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors text-left group"
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400 shrink-0" />
                  )}
                  <span className={cn(
                    "text-sm transition-colors",
                    item.completed ? "text-slate-400 line-through" : "text-slate-200"
                  )}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Limits & Goals */}
          <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-slate-700/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" /> Daily Limits & Goals
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Max Loss
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number" 
                    value={maxLoss} 
                    onChange={(e) => setMaxLoss(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Profit Target
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number" 
                    value={profitTarget} 
                    onChange={(e) => setProfitTarget(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Max Trades
                </label>
                <input 
                  type="number" 
                  value={maxTrades} 
                  onChange={(e) => setMaxTrades(Number(e.target.value))}
                  className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Strategy & Review */}
        <div className="space-y-6 flex flex-col">
          
          {/* Strategy & Focus */}
          <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-slate-700/50 space-y-4 flex-1">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Strategy & Focus Setups
            </h3>
            <textarea 
              value={focusSetups}
              onChange={(e) => setFocusSetups(e.target.value)}
              className="w-full h-[120px] bg-[#0f172a] border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="What specific setups are you looking for today? (e.g., Breakout on EURUSD, Pullback on BTC...)"
            />
          </div>

          {/* End of Day Review */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900 border border-slate-700/50 p-5 rounded-xl space-y-5">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> End of Day Review
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Did you follow your rules?</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFollowedRules(true)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
                      followedRules === true ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    )}
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => setFollowedRules(false)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
                      followedRules === false ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400">Daily Grade</label>
                <div className="flex gap-1">
                  {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrade(g)}
                      className={cn(
                        "w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center transition-colors",
                        grade === g 
                          ? g === 'A' || g === 'B' ? "bg-emerald-500 text-white" 
                            : g === 'C' ? "bg-amber-500 text-white" 
                            : "bg-rose-500 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <textarea 
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full h-[100px] bg-[#0f172a] border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
              placeholder="What went well? What mistakes did you make? What to improve tomorrow?"
            />
            
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
              <Save className="w-4 h-4" /> Save Daily Plan & Review
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
