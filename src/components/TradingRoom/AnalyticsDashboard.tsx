import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Calendar, Award } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { cn } from '../../lib/utils';

interface TradeState {
  id: number;
  result: string;
  customAmount: string;
  journal?: any;
}

interface PastSession {
  date: string;
  profit: number;
  trades: number;
  wins: number;
  losses: number;
}

interface AnalyticsDashboardProps {
  trades: TradeState[];
  pastSessions: PastSession[];
  startCapital: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ trades, pastSessions, startCapital }) => {
  
  const stats = useMemo(() => {
    let totalProfit = 0;
    let totalWins = 0;
    let totalLosses = 0;
    
    pastSessions.forEach(s => {
      totalProfit += s.profit;
      totalWins += s.wins;
      totalLosses += s.losses;
    });
    
    const totalTrades = totalWins + totalLosses;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    
    return { totalProfit, totalWins, totalLosses, totalTrades, winRate };
  }, [pastSessions]);

  const equityData = useMemo(() => {
    let balance = startCapital;
    const data = [{ date: 'Start', balance }];
    
    pastSessions.forEach(session => {
      balance += session.profit;
      let parsedDate = session.date ? new Date(session.date) : new Date();
      data.push({ date: format(parsedDate, 'MM/dd'), balance });
    });
    
    return data;
  }, [pastSessions, startCapital]);

  const heatmapData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i));
    return last30Days.map(date => {
      const session = pastSessions.find(s => {
        let parsedDate = s.date ? new Date(s.date) : new Date();
        return isSameDay(parsedDate, date);
      });
      return {
        date: format(date, 'yyyy-MM-dd'),
        profit: session ? session.profit : 0,
        intensity: session ? (session.profit > 0 ? 1 : session.profit < 0 ? -1 : 0) : 0
      };
    }).reverse();
  }, [pastSessions]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Profit', value: `$${stats.totalProfit.toFixed(2)}`, icon: DollarSign, color: stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: Target, color: 'text-blue-400' },
          { label: 'Total Trades', value: stats.totalTrades, icon: Activity, color: 'text-indigo-400' },
          { label: 'Profit Factor', value: stats.totalLosses > 0 ? (stats.totalWins / stats.totalLosses).toFixed(2) : 'N/A', icon: Award, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex items-center gap-4">
            <div className={cn("p-3 rounded-lg bg-slate-800/50", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Equity Curve
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }} />
              <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" /> 30-Day Performance
        </h3>
        <div className="grid grid-cols-10 gap-1.5">
          {heatmapData.map((day, i) => (
            <div 
              key={i}
              className={cn(
                "h-8 rounded-md transition-colors",
                day.intensity > 0 ? 'bg-emerald-500' : 
                day.intensity < 0 ? 'bg-rose-500' : 'bg-slate-800'
              )}
              title={`${day.date}: $${day.profit.toFixed(2)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
