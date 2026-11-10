import React, { useState } from 'react';
import { Bot, Sparkles, Award, TrendingUp, Brain, Zap, Target, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const StrategyAI: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const generateInsight = () => {
    setIsGenerating(true);
    setInsight(null);
    setTimeout(() => {
      setIsGenerating(false);
      const insights = [
        "Your win rate is 15% higher when trading EURUSD during the London session. Focus on this pair between 8:00 AM and 11:00 AM EST.",
        "You tend to overtrade after a loss. Implement a '3-loss rule' to step away from the charts for the rest of the day.",
        "Your best setups are trend continuations on the 15-minute timeframe. Avoid counter-trend scalping.",
        "Risk management is your strength, but your take-profit targets are often too aggressive. Consider scaling out at 1:1.5 R:R."
      ];
      setInsight(insights[Math.floor(Math.random() * insights.length)]);
    }, 2000);
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">Strategy AI Assistant</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">AI-powered insights to optimize your trading edge</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* AI Insight Box */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-indigo-400" />
          </div>
          
          <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4" /> AI Trading Insight
          </h3>
          
          {insight ? (
            <div className="space-y-4">
              <p className="text-sm text-indigo-100 leading-relaxed">{insight}</p>
              <button 
                onClick={generateInsight}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Get another insight
              </button>
            </div>
          ) : (
            <button 
              onClick={generateInsight}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Data...
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analyze My Trading Data
                </>
              )}
            </button>
          )}
        </div>

        {/* Performance Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Top Setup', value: 'Trend Continuation', icon: TrendingUp, color: 'text-emerald-400' },
            { title: 'Best Pair', value: 'EURUSD', icon: Target, color: 'text-blue-400' },
          ].map((item, i) => (
            <div key={i} className="bg-[#1e293b]/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
              <div className={cn("p-2 rounded-lg bg-slate-800/50", item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.title}</p>
                <p className="text-sm font-bold text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
