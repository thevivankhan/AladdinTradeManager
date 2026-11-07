import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, FastForward, TrendingUp, TrendingDown, RotateCcw, X, Activity, DollarSign, Crosshair, BarChart2, Target, History, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Position {
  id: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  size: number;
  time: number;
}

interface ClosedTrade {
  id: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  profit: number;
  time: number;
}

// --- Helper: Generate Market Data ---
const generateMarketData = (count: number, startPrice: number = 10000): Candle[] => {
  let currentPrice = startPrice;
  const data: Candle[] = [];
  let momentum = 0;

  for (let i = 0; i < count; i++) {
    momentum = momentum * 0.85 + (Math.random() - 0.5) * 15; // Mean reverting momentum
    const volatility = 5 + Math.random() * 25;
    
    const open = currentPrice;
    const close = open + momentum + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000) + 100;

    data.push({ time: i, open, high, low, close, volume });
    currentPrice = close;
  }
  return data;
};

export const BacktestSimulator: React.FC = () => {
  const VISIBLE_CANDLES = 60;
  const TOTAL_CANDLES = 2000;
  
  // --- State ---
  const [fullData, setFullData] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(VISIBLE_CANDLES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5 | 10>(1);
  
  // Trading State
  const [balance, setBalance] = useState(10000);
  const [position, setPosition] = useState<Position | null>(null);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [tradeSize, setTradeSize] = useState(1); // 1 unit = $1 per point

  // --- Initialization ---
  useEffect(() => {
    setFullData(generateMarketData(TOTAL_CANDLES, 15000));
  }, []);

  // --- Playback Engine ---
  useEffect(() => {
    if (!isPlaying) return;
    
    const intervalTime = 1000 / speed;
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= fullData.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [isPlaying, speed, fullData.length]);

  // --- Derived Data ---
  const visibleData = useMemo(() => {
    if (fullData.length === 0) return [];
    return fullData.slice(Math.max(0, currentIndex - VISIBLE_CANDLES), currentIndex);
  }, [fullData, currentIndex]);

  const currentPrice = visibleData[visibleData.length - 1]?.close || 0;
  const previousPrice = visibleData[visibleData.length - 2]?.close || currentPrice;
  const isPriceUp = currentPrice >= previousPrice;

  const currentPnL = position 
    ? (position.type === 'LONG' 
        ? (currentPrice - position.entryPrice) * position.size 
        : (position.entryPrice - currentPrice) * position.size)
    : 0;
  
  const equity = balance + currentPnL;
  const winRate = closedTrades.length > 0 
    ? (closedTrades.filter(t => t.profit > 0).length / closedTrades.length) * 100 
    : 0;

  // --- Chart Scaling ---
  const { minPrice, maxPrice, chartMin, chartMax, chartRange } = useMemo(() => {
    if (visibleData.length === 0) return { minPrice: 0, maxPrice: 0, chartMin: 0, chartMax: 1, chartRange: 1 };
    const min = Math.min(...visibleData.map(d => d.low));
    const max = Math.max(...visibleData.map(d => d.high));
    const range = max - min || 1;
    const padding = range * 0.15;
    return {
      minPrice: min,
      maxPrice: max,
      chartMin: min - padding,
      chartMax: max + padding,
      chartRange: (max + padding) - (min - padding)
    };
  }, [visibleData]);

  const getY = (price: number) => 100 - ((price - chartMin) / chartRange) * 100;
  const getX = (index: number) => (index / (VISIBLE_CANDLES - 1)) * 100;

  // --- Actions ---
  const handleTrade = (type: 'LONG' | 'SHORT') => {
    if (position) return; // Only one position at a time for simplicity
    setPosition({
      id: Date.now().toString(),
      type,
      entryPrice: currentPrice,
      size: tradeSize,
      time: currentIndex
    });
  };

  const closePosition = () => {
    if (!position) return;
    setBalance(prev => prev + currentPnL);
    setClosedTrades(prev => [{
      id: position.id,
      type: position.type,
      entryPrice: position.entryPrice,
      exitPrice: currentPrice,
      profit: currentPnL,
      time: currentIndex
    }, ...prev]);
    setPosition(null);
  };

  const stepForward = () => {
    if (currentIndex < fullData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const resetSimulator = () => {
    setIsPlaying(false);
    setFullData(generateMarketData(TOTAL_CANDLES, 15000));
    setCurrentIndex(VISIBLE_CANDLES);
    setBalance(10000);
    setPosition(null);
    setClosedTrades([]);
  };

  if (fullData.length === 0) return <div className="p-8 text-center text-slate-400">Loading Market Data...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col w-full h-[600px] lg:h-[650px] bg-slate-950 rounded-lg border border-slate-800 shadow-lg overflow-hidden font-sans"
    >
      
      {/* Top Bar: Stats & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 px-3 border-b border-slate-800 bg-slate-900/80 gap-2 shrink-0">
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Equity</div>
              <div className="text-lg font-mono font-black text-white">${equity.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="w-px h-6 bg-slate-800 shrink-0" />
          
          <div>
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Balance</div>
            <div className="text-base font-mono font-bold text-slate-300">${balance.toFixed(2)}</div>
          </div>

          <div className="w-px h-6 bg-slate-800 shrink-0" />
          
          <div>
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Win Rate</div>
            <div className={`text-base font-mono font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {closedTrades.length > 0 ? `${winRate.toFixed(1)}%` : '---'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-1">
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s as any)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${speed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {s}x
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'}`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button 
              onClick={stepForward}
              disabled={isPlaying}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button 
              onClick={resetSimulator}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 hover:bg-slate-700 hover:text-white"
              title="Reset Simulator"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        
        {/* Chart Area */}
        <div className="flex-1 relative bg-[#0B0E14] overflow-hidden flex flex-col min-h-[200px] lg:min-h-0">
          {/* Chart Header Overlay */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-md px-2 py-1 flex items-center gap-2">
              <span className="font-black text-white text-xs tracking-wider">BTC/USD</span>
              <span className="text-[10px] text-slate-400 font-mono">1m</span>
              <div className={`font-mono font-black text-sm flex items-center gap-1 ${isPriceUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentPrice.toFixed(2)}
                {isPriceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="flex-1 relative w-full h-full">
            {/* Grid Background */}
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />

            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Y-Axis Grid Lines */}
              {[0.2, 0.4, 0.6, 0.8].map(ratio => {
                const price = chartMax - (chartRange * ratio);
                const y = ratio * 100;
                return (
                  <g key={ratio}>
                    <line x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="100%" y={`${y}%`} dy="-5" dx="-5" textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">
                      {price.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Candles */}
              {visibleData.map((candle, i) => {
                const x = getX(i);
                const isBull = candle.close >= candle.open;
                const color = isBull ? '#10b981' : '#f43f5e';
                const candleWidth = 100 / VISIBLE_CANDLES * 0.6; // 60% of available width

                return (
                  <g key={candle.time}>
                    {/* Wick */}
                    <line 
                      x1={`${x}%`} y1={`${getY(candle.high)}%`} 
                      x2={`${x}%`} y2={`${getY(candle.low)}%`} 
                      stroke={color} strokeWidth="1.5" 
                    />
                    {/* Body */}
                    <rect 
                      x={`${x - candleWidth/2}%`} 
                      y={`${getY(Math.max(candle.open, candle.close))}%`} 
                      width={`${candleWidth}%`} 
                      height={`${Math.max(0.5, Math.abs(getY(candle.open) - getY(candle.close)))}%`} 
                      fill={color} 
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* Current Price Line */}
              <line 
                x1="0" y1={`${getY(currentPrice)}%`} 
                x2="100%" y2={`${getY(currentPrice)}%`} 
                stroke={isPriceUp ? '#10b981' : '#f43f5e'} 
                strokeWidth="1" strokeDasharray="2 2" 
                opacity="0.5"
              />
              
              {/* Position Entry Line */}
              {position && (
                <g>
                  <line 
                    x1="0" y1={`${getY(position.entryPrice)}%`} 
                    x2="100%" y2={`${getY(position.entryPrice)}%`} 
                    stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 5" 
                  />
                  <rect x="10" y={`${getY(position.entryPrice) - 2}%`} width="80" height="4%" fill="#3b82f6" rx="4" />
                  <text x="50" y={`${getY(position.entryPrice)}%`} dy="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                    {position.type} ENTRY
                  </text>
                </g>
              )}
            </svg>

            {/* Current Price Tag (Right Axis) */}
            <div 
              className={`absolute right-0 px-2 py-1 text-xs font-mono font-bold text-white translate-x-1 -translate-y-1/2 rounded-l-md z-20 shadow-lg ${isPriceUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ top: `${getY(currentPrice)}%` }}
            >
              {currentPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Trading Panel */}
        <div className="w-full lg:w-72 bg-slate-900/80 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 lg:shrink h-[300px] lg:h-auto">
          
          {/* Order Entry */}
          <div className="p-2 px-3 border-b border-slate-800 shrink-0">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target className="w-3 h-3" /> Order Entry
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Trade Size (Units)</label>
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
                  <button onClick={() => setTradeSize(Math.max(1, tradeSize - 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded">-</button>
                  <input 
                    type="number" 
                    value={tradeSize} 
                    onChange={(e) => setTradeSize(Number(e.target.value))}
                    className="flex-1 bg-transparent text-center font-mono text-sm font-bold text-white focus:outline-none"
                  />
                  <button onClick={() => setTradeSize(tradeSize + 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded">+</button>
                </div>
              </div>

              {!position ? (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleTrade('LONG')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <span className="text-base">BUY</span>
                    <span className="text-[9px] opacity-80">Market Long</span>
                  </button>
                  <button 
                    onClick={() => handleTrade('SHORT')}
                    className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-black py-2 rounded-xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  >
                    <span className="text-base">SELL</span>
                    <span className="text-[9px] opacity-80">Market Short</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${position.type === 'LONG' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">{position.type} {position.size}u</div>
                      <div className="text-xs font-mono text-white">@ {position.entryPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-bold">Open P&L</div>
                      <div className={`text-base font-mono font-black ${currentPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={closePosition}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-3 h-3" /> CLOSE POSITION
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trade History */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 px-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> Trade History
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              <AnimatePresence>
                {closedTrades.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-6">No trades yet.</div>
                ) : (
                  closedTrades.map((trade) => (
                    <motion.div 
                      key={trade.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className={`text-xs font-black tracking-wider ${trade.type === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.type}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {trade.entryPrice.toFixed(0)} → {trade.exitPrice.toFixed(0)}
                        </div>
                      </div>
                      <div className={`text-sm font-mono font-black ${trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
