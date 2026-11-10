import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';

interface MarketBias {
  id: string;
  pair: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  newsTime?: string;
  impact?: 'high' | 'medium' | 'low';
  createdAt: any;
}

export const MarketBiasTracker: React.FC = () => {
  const [biases, setBiases] = useState<MarketBias[]>([]);

  useEffect(() => {
    import('../lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
        const unsubscribe = onSnapshot(
          query(collection(db, 'market_bias'), orderBy('createdAt', 'desc')), 
          (snap) => {
            setBiases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
          },
          (err) => {
            console.warn("Market bias tracker listener caught:", err.message);
          }
        );
        return () => unsubscribe();
      });
    });
  }, []);

  const getBiasIcon = (bias: string) => {
    switch (bias) {
      case 'bullish': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'bearish': return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'neutral': return <Minus className="w-5 h-5 text-slate-400" />;
      default: return null;
    }
  };

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'bullish': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'neutral': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'hidden';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
        <div>
          <h4 className="text-emerald-400 font-bold mb-1">Daily Market Bias & News</h4>
          <p className="text-sm text-slate-300">Check the daily bias before trading. Avoid trading 30 minutes before and after high-impact news events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {biases.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">No market bias data available for today.</div>
        ) : (
          biases.map((bias) => (
            <div key={bias.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-white">{bias.pair}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider flex items-center gap-1 ${getBiasColor(bias.bias)}`}>
                  {getBiasIcon(bias.bias)} {bias.bias}
                </div>
              </div>
              
              {bias.newsTime && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300 font-mono">{bias.newsTime}</span>
                  </div>
                  {bias.impact && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getImpactColor(bias.impact)}`}>
                      {bias.impact} Impact
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
