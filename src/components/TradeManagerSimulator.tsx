import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  RefreshCcw, 
  Calculator, 
  BarChart3, 
  DollarSign, 
  Percent, 
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeResult {
  id: number;
  result: 'WIN' | 'LOSS';
  amount: number;
  return: number;
  balance: number;
}

const TradeManagerSimulator: React.FC = () => {
  const [initialBalance, setInitialBalance] = useState<number>(100);
  const [brokerPayout, setBrokerPayout] = useState<number>(92);
  const [winRate, setWinRate] = useState<number>(22);
  const [targetWins, setTargetWins] = useState<number>(2);
  const [numTrades, setNumTrades] = useState<number>(9);
  const [trades, setTrades] = useState<TradeResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateTrades = () => {
    setIsSimulating(true);
    setProgress(0);
    setTrades([]);
    
    const maxT = numTrades;
    const reqW = targetWins;
    const payoutMult = 1 + (brokerPayout / 100);
    
    // DP Memoization Table
    const dpMem: number[][] = Array.from({ length: maxT + 1 }, () => Array(reqW + 1).fill(-1));
    
    const getDP = (t: number, w: number): number => {
      if (w >= reqW) return 1.0;
      if (reqW - w === maxT - t) return Math.pow(payoutMult, maxT - t);
      if (reqW - w > maxT - t) return Infinity; 
      if (dpMem[t][w] !== -1) return dpMem[t][w];
      
      const nextL = getDP(t + 1, w);
      const nextW = getDP(t + 1, w + 1);
      
      let val = Infinity;
      if (isFinite(nextL) && isFinite(nextW)) {
          val = (payoutMult * nextL * nextW) / (nextL + (payoutMult - 1) * nextW);
      }
      dpMem[t][w] = val;
      return val;
    };
    
    const newTrades: TradeResult[] = [];
    let currentBalance = initialBalance;
    const totalSteps = numTrades;
    
    let step = 0;
    let currentWins = 0;
    
    const interval = setInterval(() => {
      if (step >= totalSteps || currentWins >= reqW) {
        clearInterval(interval);
        setIsSimulating(false);
        setProgress(100);
        return;
      }

      // Calculate Trade Amount using exactly the DP logic
      const nextL = getDP(step + 1, currentWins);
      const nextW = getDP(step + 1, currentWins + 1);
      
      let riskAmount = 0;
      if (isFinite(nextW)) {
        if (isFinite(nextL)) {
          const multiplier = 1 - ((payoutMult * nextW) / (nextL + (payoutMult - 1) * nextW));
          riskAmount = multiplier * currentBalance;
        } else {
          // Must win case
          riskAmount = currentBalance;
        }
      }
      
      if (!isFinite(nextW)) {
        clearInterval(interval);
        setIsSimulating(false);
        setProgress(100);
        return;
      }

      // Simulation probability uses Win Rate %
      const isWin = Math.random() * 100 < winRate;
      const tradeReturn = isWin ? riskAmount * (brokerPayout / 100) : -riskAmount;
      currentBalance += tradeReturn;
      
      if (isWin) currentWins++;

      const trade: TradeResult = {
        id: step + 1,
        result: isWin ? 'WIN' : 'LOSS',
        amount: riskAmount,
        return: tradeReturn,
        balance: currentBalance
      };

      newTrades.push(trade);
      setTrades([...newTrades].reverse());
      setProgress(((step + 1) / totalSteps) * 100);
      step++;
    }, 150);
  };

  useEffect(() => {
    simulateTrades();
  }, []);

  const stats = useMemo(() => {
    if (trades.length === 0) return { 
      totalProfit: 0, 
      finalBalance: initialBalance, 
      winCount: 0, 
      actualWinRate: 0,
      totalReturn: 0 
    };
    
    const latestTrade = trades[0];
    const finalBalance = latestTrade.balance;
    const totalProfit = finalBalance - initialBalance;
    const winCount = trades.filter(t => t.result === 'WIN').length;
    const actualWinRate = (winCount / trades.length) * 100;
    const totalReturn = (totalProfit / initialBalance) * 100;
    
    return { totalProfit, finalBalance, winCount, actualWinRate, totalReturn };
  }, [trades, initialBalance]);

  return (
    <div className="relative bg-[#0A0F1C]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 p-5 md:p-8 max-w-2xl mx-auto group">
      {/* Background Glows */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Header - Single Line & Smaller */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <h2 className="text-sm md:text-base font-black text-white tracking-tight uppercase whitespace-nowrap">ALADDIN TRADE MANAGER 4.0</h2>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20"></span>
            <p className="text-[7px] md:text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase whitespace-nowrap">Advanced Risk Simulation Engine</p>
          </div>
        </div>
        
        <button 
          onClick={simulateTrades}
          disabled={isSimulating}
          className="px-4 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          <RefreshCcw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
          {isSimulating ? '...' : 'Restart'}
        </button>
      </div>

      {/* 4 Square Stats Cards - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { 
            label: 'Final Balance', 
            value: `$${stats.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
            icon: DollarSign, 
            color: 'from-cyan-500 to-blue-600'
          },
          { 
            label: 'Total Profit', 
            value: `${stats.totalProfit >= 0 ? '+' : ''}$${Math.abs(stats.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
            icon: Activity, 
            color: 'from-emerald-500 to-teal-600'
          },
          { 
            label: 'Actual Win Rate', 
            value: `${stats.actualWinRate.toFixed(1)}%`, 
            icon: Target, 
            color: 'from-purple-500 to-indigo-600'
          },
          { 
            label: 'Total Return', 
            value: `${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}%`, 
            icon: Percent, 
            color: 'from-amber-500 to-orange-600'
          }
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col justify-center items-center text-center overflow-hidden h-32"
          >
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{card.label}</div>
            <div className="text-xl font-black text-white tracking-tight">{card.value}</div>
            <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${card.color} w-full opacity-30`}></div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 md:p-8">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
            <Layers className="w-4 h-4 text-cyan-400" />
            Simulation Parameters
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Initial Capital</label>
                <input 
                  type="number" 
                  value={initialBalance} 
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Broker Payout (%)</label>
                <input 
                  type="number" 
                  value={brokerPayout} 
                  onChange={(e) => setBrokerPayout(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Win Prob. Rate (%)</label>
                <input 
                  type="number" 
                  value={winRate} 
                  onChange={(e) => setWinRate(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Total Trades</label>
                <input 
                  type="number" 
                  value={numTrades} 
                  onChange={(e) => setNumTrades(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Required Wins</label>
                <input 
                  type="number" 
                  value={targetWins} 
                  onChange={(e) => setTargetWins(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-black/40 rounded-[2rem] border border-white/10 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live Simulation Feed</h3>
            </div>
            {isSimulating && (
              <div className="flex items-center gap-3">
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-cyan-400">{Math.round(progress)}%</span>
              </div>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0A0F1C] z-10">
                <tr className="text-[9px] text-slate-500 font-black tracking-widest uppercase">
                  <th className="px-6 py-3 border-b border-white/5">Order</th>
                  <th className="px-6 py-3 border-b border-white/5">Status</th>
                  <th className="px-6 py-3 border-b border-white/5">Return</th>
                  <th className="px-6 py-3 border-b border-white/5 text-right">Equity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {trades.map((trade) => (
                    <motion.tr 
                      key={trade.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-[11px] text-slate-500">#{trade.id.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                          trade.result === 'WIN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trade.result}
                        </div>
                      </td>
                      <td className={`px-6 py-3 font-mono text-[11px] font-bold ${trade.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.result === 'WIN' ? '+' : ''}${trade.return.toFixed(0)}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-[11px] text-white font-black">
                        ${trade.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-block px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[9px] text-cyan-400 font-black uppercase tracking-[0.3em]">
          Mathematical Probability Engine v4.0.2
        </div>
      </div>
    </div>
  );
};

export default TradeManagerSimulator;
