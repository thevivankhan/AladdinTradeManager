import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs min-w-[150px]">
        <p className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1">Time: {label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-slate-400">Open:</span>
          <span className="text-white font-mono text-right">{data.open}</span>
          <span className="text-slate-400">High:</span>
          <span className="text-emerald-400 font-mono text-right">{data.high}</span>
          <span className="text-slate-400">Low:</span>
          <span className="text-rose-400 font-mono text-right">{data.low}</span>
          <span className="text-slate-400">Close:</span>
          <span className="text-white font-mono text-right">{data.close}</span>
          <span className="text-slate-400">Volume:</span>
          <span className="text-blue-400 font-mono text-right">{data.volume}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-slate-400">Upper BB:</span>
          <span className="text-blue-400 font-mono text-right">{data.upperBB}</span>
          <span className="text-slate-400">Lower BB:</span>
          <span className="text-blue-400 font-mono text-right">{data.lowerBB}</span>
          <span className="text-slate-400">SMA:</span>
          <span className="text-amber-400 font-mono text-right">{data.sma}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ParadoxStrategy = () => {
  const data = useMemo(() => {
    const arr = [];
    let close = 150;
    let k = 50;
    let d = 50;
    for (let i = 0; i < 60; i++) {
      const open = close;
      // Random walk with some trend
      const change = (Math.random() - 0.45) * 4;
      close = open + change;
      
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.floor(Math.random() * 1000) + 500;
      
      // Mock Bollinger Bands
      const upperBB = close + 5 + Math.random() * 2;
      const lowerBB = close - 5 - Math.random() * 2;
      const sma = close + (Math.random() - 0.5) * 2;

      // Mock Stochastic
      // If price drops, stochastic drops
      k = Math.max(5, Math.min(95, k + change * 5 + (Math.random() - 0.5) * 10));
      d = d + (k - d) * 0.3; // D is a smoothed K

      arr.push({
        time: `${i}`,
        price: Number(close.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        upperBB: Number(upperBB.toFixed(2)),
        lowerBB: Number(lowerBB.toFixed(2)),
        sma: Number(sma.toFixed(2)),
        k: Number(k.toFixed(2)),
        d: Number(d.toFixed(2)),
      });
    }
    return arr;
  }, []);

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-400">Paradox Strategy (with Stochastic)</h2>
        <p className="text-slate-300 text-sm mt-2">
          This strategy exploits market overextensions by trading against the trend when momentum is exhausted, enhanced by the Stochastic Oscillator for precise entry timing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold text-white mb-2">Setup:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
              <li><strong>Indicator 1:</strong> Bollinger Bands (20, 2)</li>
              <li><strong>Indicator 2:</strong> Stochastic Oscillator (14, 3, 3)</li>
              <li><strong>Timeframe:</strong> 15m or 1H</li>
            </ul>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold text-white mb-2">Rules:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300">
              <li>
                <strong className="text-emerald-400">Buy Signal:</strong> Price touches or pierces the lower Bollinger Band AND Stochastic %K crosses above %D while both are below 20 (Oversold).
              </li>
              <li>
                <strong className="text-rose-400">Sell Signal:</strong> Price touches or pierces the upper Bollinger Band AND Stochastic %K crosses below %D while both are above 80 (Overbought).
              </li>
              <li>
                <strong className="text-amber-400">Exit:</strong> Middle Bollinger Band (SMA) or opposite band.
              </li>
              <li>
                <strong className="text-blue-400">Risk Management:</strong> Stop loss placed just beyond the recent swing high/low. Max 1% risk per trade.
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 h-[250px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price & Bollinger Bands</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="upperBB" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Upper BB" />
                  <Line type="monotone" dataKey="lowerBB" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Lower BB" />
                  <Line type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={1} dot={false} name="SMA (20)" />
                  <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} name="Price" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 h-[200px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stochastic Oscillator (14,3,3)</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} ticks={[0, 20, 50, 80, 100]} stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="k" stroke="#3b82f6" strokeWidth={2} dot={false} name="%K" />
                  <Line type="monotone" dataKey="d" stroke="#f59e0b" strokeWidth={2} dot={false} name="%D" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-center">
        <p className="text-emerald-300 italic font-medium">"The trend is your friend, until it bends. Stochastic tells you when it's about to snap."</p>
      </div>
    </div>
  );
};
