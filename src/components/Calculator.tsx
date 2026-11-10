import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Globe, Calendar, ShieldAlert, AlertTriangle, Lock, FileText, Scale, Maximize2, ZoomIn } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { Chart } from './Chart';
import { cn } from '../lib/utils';

type Mode = 'wins' | 'daily';

export const Calculator = () => {
  const [mode, setMode] = useState<Mode>('daily');
  const [currency, setCurrency] = useState('USD');
  const [startCapital, setStartCapital] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // Reinvest Strategy
  const [reinvestPercent, setReinvestPercent] = useState<number>(95);
  
  // Daily Mode State
  const [dailyGainPercent, setDailyGainPercent] = useState<number>(3);
  const [activeDays, setActiveDays] = useState<boolean[]>([false, true, true, true, true, true, false]); // S M T W T F S
  const [durationYears, setDurationYears] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [durationDays, setDurationDays] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Daily');
  
  // Wins Mode State
  const [brokerPayout, setBrokerPayout] = useState<number>(85);
  const [compoundSteps, setCompoundSteps] = useState<number>(5);
  
  // Goal Projector
  const [targetAmount, setTargetAmount] = useState<number>(1000);
  
  // Results State
  const [data, setData] = useState<any[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [totalGain, setTotalGain] = useState<number>(0);
  const [activeBalance, setActiveBalance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [projectedBalanceAtTarget, setProjectedBalanceAtTarget] = useState<number>(0);
  const [targetEndDate, setTargetEndDate] = useState<string>('');

  // Calculate Data
  useEffect(() => {
    let currentCapital = startCapital;
    let withdrawnTotal = 0;
    let profitTotal = 0;
    const newData = [];
    
    let initialDate = startDate ? new Date(startDate) : new Date();
    if (isNaN(initialDate.getTime())) {
      initialDate = new Date();
    }
    
    // Initial data point
    newData.push({
      day: 0,
      step: 0,
      date: initialDate,
      capital: currentCapital,
      profit: 0,
      withdrawn: 0,
      totalWithdrawn: 0
    });

    if (mode === 'daily') {
      const totalDaysToSimulate = (durationYears * 365) + (durationMonths * 30) + durationDays;
      let currentDate = startDate ? new Date(startDate) : new Date();
      if (isNaN(currentDate.getTime())) {
        currentDate = new Date();
      }
      let daysElapsed = 0;
      let targetReachedDay = -1;
      
      for (let i = 1; i <= totalDaysToSimulate; i++) {
        const dayOfWeek = currentDate.getDay();
        let dailyProfit = 0;
        let withdrawnToday = 0;
        let reinvestedToday = 0;

        if (activeDays[dayOfWeek]) {
          dailyProfit = currentCapital * (dailyGainPercent / 100);
          reinvestedToday = dailyProfit * (reinvestPercent / 100);
          withdrawnToday = dailyProfit - reinvestedToday;

          currentCapital += reinvestedToday;
          withdrawnTotal += withdrawnToday;
          profitTotal += dailyProfit;
          daysElapsed++;
        }

        newData.push({
          day: i,
          date: new Date(currentDate),
          capital: currentCapital,
          profit: dailyProfit,
          withdrawn: withdrawnToday,
          totalWithdrawn: withdrawnTotal
        });
        
        if (targetReachedDay === -1 && currentCapital >= targetAmount) {
          targetReachedDay = i;
          setEstimatedTime(`${i} Days`);
          setTargetEndDate(format(currentDate, 'dd MMM yyyy'));
          setProjectedBalanceAtTarget(currentCapital);
        }

        currentDate = addDays(currentDate, 1);
      }
      
      if (targetReachedDay === -1) {
        setEstimatedTime('> Duration');
        setTargetEndDate('-');
        setProjectedBalanceAtTarget(0);
      }

    } else {
      // Wins Mode
      let targetReachedStep = -1;
      for (let i = 1; i <= compoundSteps; i++) {
        const profit = currentCapital * (brokerPayout / 100);
        const reinvested = profit * (reinvestPercent / 100);
        const withdrawn = profit - reinvested;
        
        currentCapital += reinvested;
        withdrawnTotal += withdrawn;
        profitTotal += profit;

        newData.push({
          step: i,
          capital: currentCapital,
          profit: profit,
          withdrawn: withdrawn,
          totalWithdrawn: withdrawnTotal
        });
        
        if (targetReachedStep === -1 && currentCapital >= targetAmount) {
          targetReachedStep = i;
          setEstimatedTime(`${i} Steps`);
          setProjectedBalanceAtTarget(currentCapital);
        }
      }
      
      if (targetReachedStep === -1) {
        setEstimatedTime('> Steps');
        setProjectedBalanceAtTarget(0);
      }
    }

    setData(newData);
    setTotalWithdrawn(withdrawnTotal);
    setNetProfit(profitTotal);
    setTotalGain((profitTotal / startCapital) * 100);
    setActiveBalance(currentCapital);

  }, [mode, startCapital, startDate, reinvestPercent, dailyGainPercent, activeDays, durationYears, durationMonths, durationDays, brokerPayout, compoundSteps, targetAmount]);

  const handleReset = () => {
    setStartCapital(10);
    setReinvestPercent(95);
    setDailyGainPercent(3);
    setBrokerPayout(85);
    setCompoundSteps(5);
    setTargetAmount(1000);
    setDurationYears(0);
    setDurationMonths(1);
    setDurationDays(0);
    setActiveDays([false, true, true, true, true, true, false]);
  };

  const toggleDay = (index: number) => {
    const newDays = [...activeDays];
    newDays[index] = !newDays[index];
    setActiveDays(newDays);
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const targetGainPercent = useMemo(() => {
    return ((targetAmount - startCapital) / startCapital) * 100;
  }, [targetAmount, startCapital]);

  const goalProgressPercent = useMemo(() => {
    const progress = (activeBalance / targetAmount) * 100;
    return Math.min(progress, 100);
  }, [activeBalance, targetAmount]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 p-4 font-sans selection:bg-emerald-500/30">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Main Calculator Card */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="p-5 space-y-6">
            
            {/* Header: Currency & Mode */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-slate-400" />
                </div>
                <select 
                  className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-1 bg-[#0f172a] p-1 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setMode('wins')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors",
                    mode === 'wins' ? "bg-[#1e293b] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Wins
                </button>
                <button
                  onClick={() => setMode('daily')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors",
                    mode === 'daily' ? "bg-[#1e293b] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Daily
                </button>
              </div>
              <button 
                onClick={handleReset}
                className="p-2.5 bg-[#0f172a] border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Base Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Start Capital</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input 
                    type="number" 
                    value={startCapital}
                    onChange={(e) => setStartCapital(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            {/* Reinvest Strategy */}
            <div className="bg-[#0f172a]/50 p-4 rounded-xl border border-slate-700/30 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  Reinvest Strategy
                </div>
                <div className="text-sm font-medium text-slate-300 bg-[#1e293b] px-2 py-1 rounded border border-slate-700">
                  {reinvestPercent}% Reinvest
                </div>
              </div>
              
              <div className="relative pt-2 pb-1">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={reinvestPercent}
                  onChange={(e) => setReinvestPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:outline-none z-10 relative opacity-0"
                />
                <div className="absolute top-2 left-0 w-full h-2 bg-slate-700 rounded-lg pointer-events-none overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-emerald-400"
                    style={{ width: `${reinvestPercent}%` }}
                  />
                </div>
                <div 
                  className="absolute top-2 h-4 w-4 bg-white rounded-full shadow-md -mt-1 pointer-events-none border-2 border-emerald-400"
                  style={{ left: `calc(${reinvestPercent}% - 8px)` }}
                />
              </div>
              
              <div className="flex justify-between text-xs font-medium">
                <span className="text-blue-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Withdraw {100 - reinvestPercent}%
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Reinvest {reinvestPercent}%
                </span>
              </div>
            </div>

            {/* Mode Specific Controls */}
            {mode === 'daily' ? (
              <>
                {/* Daily Gain Percentage */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-200">Daily Gain Percentage</label>
                    <span className="text-emerald-400 font-bold">{dailyGainPercent}%</span>
                  </div>
                  <div className="flex gap-2">
                    {[3, 6, 9].map(val => (
                      <button
                        key={val}
                        onClick={() => setDailyGainPercent(val)}
                        className={cn(
                          "flex-1 py-1.5 rounded border text-sm font-medium transition-colors",
                          dailyGainPercent === val 
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                            : "bg-[#0f172a] border-slate-700 text-slate-400 hover:border-slate-500"
                        )}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number" 
                    value={dailyGainPercent}
                    onChange={(e) => setDailyGainPercent(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Trading Schedule */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-200">Trading Schedule</label>
                    <span className="text-xs text-slate-400 flex items-center gap-1 cursor-pointer hover:text-slate-300">
                      <Calendar className="w-3 h-3" /> Toggle Active Days
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    {dayLabels.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={cn(
                          "w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center transition-colors",
                          activeDays[idx] 
                            ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                            : "bg-rose-900/40 text-rose-500 border border-rose-900/50"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-medium px-1">
                    <span className="text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"/> Week On</span>
                    <span className="text-rose-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> Week Off</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-200">Duration</label>
                    <span className="text-xs text-slate-400">
                      {(durationYears * 365) + (durationMonths * 30) + durationDays} Days Total
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Years</label>
                      <input type="number" value={durationYears} onChange={e => setDurationYears(Number(e.target.value))} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Months</label>
                      <input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Days</label>
                      <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Wins Mode Specifics */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-200">Broker Payout %</label>
                      <span className="text-emerald-400 font-bold">{brokerPayout}%</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" 
                      value={brokerPayout} onChange={e => setBrokerPayout(Number(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-200">Compound Steps (Consecutive Wins)</label>
                      <span className="text-emerald-400 font-bold">{compoundSteps}</span>
                    </div>
                    <input 
                      type="range" min="1" max="50" 
                      value={compoundSteps} onChange={e => setCompoundSteps(Number(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Higher steps significantly increase risk.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Goal Projector */}
            <div className="bg-[#0f172a]/80 p-4 rounded-xl border border-slate-700/50 space-y-4">
              <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                </div>
                Goal Projector
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Target Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input 
                      type="number" 
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(Number(e.target.value))}
                      className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Target Gain (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={targetGainPercent.toFixed(0)}
                      readOnly
                      className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none opacity-80"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                <span className="text-xs text-slate-400">Estimated Time</span>
                <div className="text-right">
                  <div className="font-bold text-white">{estimatedTime}</div>
                  {mode === 'daily' && targetEndDate !== '-' && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" /> {targetEndDate}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Withdrawn</span>
                <span className="font-bold text-blue-400">${totalWithdrawn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Net Profit (Inc. Withdrawals)</span>
                <span className="font-bold text-emerald-400">+${netProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Gain</span>
                <span className="font-bold text-emerald-400">{totalGain.toFixed(2)}%</span>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Goal Progress</span>
                  <span className="text-slate-300">${activeBalance.toFixed(2)} / ${targetAmount.toFixed(2)} <span className="text-amber-500 ml-1">{goalProgressPercent.toFixed(1)}%</span></span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${goalProgressPercent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-400 mb-1">Active Balance</span>
                  <span className="text-3xl font-bold text-white">${activeBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#0f172a]/50 p-3 rounded-lg border border-slate-700/30 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-amber-500 flex items-center justify-center">
                    <div className="w-1 h-1 bg-amber-500 rounded-full" />
                  </div>
                  <span className="text-amber-500">Target</span>
                  <div className="w-3 h-3 rounded-full border border-rose-500 flex items-center justify-center ml-2">
                    <div className="w-1 h-1 bg-rose-500 rounded-full" />
                  </div>
                  <span className="text-rose-500">End Date</span>
                </div>
                <span className="text-slate-300">{targetEndDate || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-slate-500">Projected Balance @ Target</span>
                <span className="text-amber-500 font-bold">${projectedBalanceAtTarget.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden p-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-300">Growth Trajectory</h3>
            <div className="flex gap-2">
              <ZoomIn className="w-4 h-4 text-slate-500" />
              <Maximize2 className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <Chart data={data} mode={mode} />
        </div>

        {/* Data Table Card (Daily Mode Only) */}
        {mode === 'daily' && (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="flex border-b border-slate-700/50">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "flex-1 py-3 text-xs font-medium text-center transition-colors",
                    activeTab === tab 
                      ? "bg-slate-700/30 text-white border-b-2 border-emerald-500" 
                      : "text-slate-400 hover:bg-slate-800/50"
                  )}
                >
                  {tab}<br/>Breakdown
                </button>
              ))}
            </div>
            
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-[#0f172a]/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date / Day</th>
                    <th className="px-4 py-3 font-medium">Start Cap</th>
                    <th className="px-4 py-3 font-medium">Profit</th>
                    <th className="px-4 py-3 font-medium">Cashout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {data.slice(1, 6).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-slate-300">Day {row.day}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {format(row.date, 'd MMM yy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">${(row.capital - row.profit).toFixed(2)}</td>
                      <td className="px-4 py-3 text-emerald-400">
                        {row.profit > 0 ? '+' : ''}${row.profit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-blue-400">${row.withdrawn.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 text-center border-t border-slate-700/50">
                <button className="text-xs text-slate-400 hover:text-white transition-colors">View Full Table</button>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-500 font-bold text-lg leading-tight mb-2">Important Disclaimer: Not Financial Advice</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This calculator is an educational tool designed for theoretical planning and analysis. <strong className="text-slate-300">It does not constitute financial, investment, or legal advice.</strong> The results are simulated projections based on mathematical formulas and do not account for market slippage, broker fees, or economic anomalies.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border border-rose-900/30 p-5 space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 text-rose-500 mb-4 relative z-10">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Financial Risk Warning</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-400 relative z-10 list-disc pl-5">
              <li>Trading financial markets (Forex, Crypto, Binary Options) involves a <strong className="text-slate-300">substantial risk of loss</strong>.</li>
              <li>You should never trade with money you cannot afford to lose.</li>
              <li>Past performance and theoretical compounding are not indicative of future results.</li>
              <li>High-yield strategies often carry "ruin risk" where one bad streak can wipe out capital.</li>
            </ul>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 mb-4">
              <Lock className="w-6 h-6" />
              <h3 className="font-bold text-lg">Safety & Data Privacy</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-400 list-disc pl-5">
              <li><strong className="text-slate-300">Data Privacy:</strong> This calculator runs locally in your browser. We do not store your financial data on our servers.</li>
              <li><strong className="text-slate-300">API Safety:</strong> If using AI features, your API key is used only for the session and is not saved.</li>
              <li><strong className="text-slate-300">Scam Alert:</strong> Beware of services guaranteeing "100% wins" or "fixed returns". Real trading always has variance.</li>
            </ul>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-white mb-3">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-base">Terms & Conditions</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                By using the Aladdin AI Daily Calculator, you agree that the creators and developers are not liable for any financial losses incurred from using these strategies. The tool is provided "as-is" for informational purposes.
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-white mb-3">
                <Scale className="w-5 h-5" />
                <h3 className="font-bold text-base">Note on Results</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Compounding tables assume a "Perfect World" scenario. In reality, psychological factors, market timing, and broker liquidity can affect outcomes. Always maintain strict risk management protocols (e.g., max 1-2% risk per trade).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 pt-4">
          <p className="text-slate-500 text-xs italic leading-relaxed max-w-sm mx-auto">
            "This Aladdin AI Daily Calculator is only for learning and educational purposes. The creators are not responsible for any losses or consequences. All responsibility is yours. Thank you for your best wishes. Keep Growing 🎉"
          </p>
        </div>

      </div>
    </div>
  );
};
