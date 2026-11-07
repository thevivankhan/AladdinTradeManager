import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, TrendingDown, CheckCircle2, XCircle, RotateCcw, Activity, Info, Zap, RefreshCw, ArrowUpRight, ArrowDownRight, Rocket, Wallet, Sparkles, Calendar, CalendarOff, Download, Flag } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import confetti from 'canvas-confetti';

interface CompoundingPlannerProps {
  compoundingStartCapital: number;
  setCompoundingStartCapital: (val: number) => void;
  compoundingDailyTarget: number;
  setCompoundingDailyTarget: (val: number) => void;
  compoundingActuals: Record<number, string>;
  setCompoundingActuals: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  runningBalance: number;
  initialCapital: number;
  setInitialCapital: (val: number) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  currency: string;
  formatMoney: (amount: number) => string;
  onClose?: () => void;
}

export function CompoundingPlanner({
  compoundingStartCapital,
  setCompoundingStartCapital,
  compoundingDailyTarget,
  setCompoundingDailyTarget,
  compoundingActuals,
  setCompoundingActuals,
  runningBalance,
  initialCapital,
  setInitialCapital,
  showToast,
  confirmAction,
  currency,
  formatMoney,
  onClose,
}: CompoundingPlannerProps) {
  const [duration, setDuration] = useState<number>(30);
  const [tradingDaysOnly, setTradingDaysOnly] = useState<boolean>(false);
  const [withdrawalPercentage, setWithdrawalPercentage] = useState<number>(0);
  const [withdrawalFrequency, setWithdrawalFrequency] = useState<number>(7); // Days
  const [showDateInBreakdown, setShowDateInBreakdown] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [simWinRate, setSimWinRate] = useState<number>(60);
  const [simRR, setSimRR] = useState<number>(2);
  const [simTradesPerDay, setSimTradesPerDay] = useState<number>(3);
  const [simRiskPerTrade, setSimRiskPerTrade] = useState<number>(1);

  const handleActualChange = (day: number, value: string) => {
    setCompoundingActuals((prev) => ({ ...prev, [day]: value }));
  };

  const resetPlanner = () => {
    confirmAction(
      "Reset Planner",
      "Are you sure you want to clear all actuals? This cannot be undone.",
      () => {
        setCompoundingActuals({});
        showToast("Planner reset successfully", "success");
      }
    );
  };

  // Calculate table data and chart data
  const { tableData, chartData, currentDay, aheadBehind, currentStreak, targetBalanceAtEnd, progressPercentage, daysToDouble, doubleProgress, milestones, totalWithdrawn } = useMemo(() => {
    const days = Array.from({ length: duration }, (_, i) => i + 1);
    let streak = 0;
    let lastFilledDay = 0;
    let currentAheadBehind = 0;
    let currentBalance = compoundingStartCapital;
    let dateTracker = new Date(); // Start from today
    
    let doubleHit = false;
    let tenXHit = false;
    const calculatedMilestones: { type: string, day: number, amount: number }[] = [];
    let accumulatedWithdrawals = 0;
    
    let currentTargetBalance = compoundingStartCapital;
    
    const tData = days.map((day) => {
      // Logic for skipping weekends
      if (day > 1) {
        dateTracker.setDate(dateTracker.getDate() + 1);
        if (tradingDaysOnly) {
          while (dateTracker.getDay() === 0 || dateTracker.getDay() === 6) {
            dateTracker.setDate(dateTracker.getDate() + 1); // Skip weekend
          }
        }
      }

      // Dynamic Compounding: If the previous day was filled, the target for today 
      // should be based on that actual balance. Otherwise, based on previous target.
      if (day > 1) {
        const prevDayActual = compoundingActuals[day - 1];
        if (prevDayActual && !isNaN(parseFloat(prevDayActual))) {
          currentTargetBalance = parseFloat(prevDayActual);
        }
      }

      currentTargetBalance = currentTargetBalance * (1 + compoundingDailyTarget / 100);
      
      // Apply withdrawals to target balance calculation
      if (withdrawalPercentage > 0 && day % withdrawalFrequency === 0) {
          const withdrawalAmount = currentTargetBalance * (withdrawalPercentage / 100);
          currentTargetBalance -= withdrawalAmount;
      }
      
      let targetBalance = currentTargetBalance;

      const actualStr = compoundingActuals[day] || '';
      const actualNum = parseFloat(actualStr);
      const isFilled = !isNaN(actualNum) && actualStr !== '';
      
      let diff = 0;
      let isSuccess = false;
      let isFailure = false;
      let withdrawnToday = 0;
      let isActiveDay = false;
      let liveActiveBalance = 0;

      if (isFilled) {
        lastFilledDay = day;
        currentBalance = actualNum;
        
        // Calculate actual withdrawals if applicable
        if (withdrawalPercentage > 0 && day % withdrawalFrequency === 0) {
            withdrawnToday = currentBalance * (withdrawalPercentage / 100);
            accumulatedWithdrawals += withdrawnToday;
            // In a real scenario, the user would enter the post-withdrawal balance,
            // or we'd need a separate field for withdrawals. For simplicity, we track it.
        }

        diff = actualNum - targetBalance;
        isSuccess = actualNum >= (targetBalance - 0.000001);
        isFailure = actualNum < (targetBalance - 0.000001);
        currentAheadBehind = diff;

        if (isSuccess) {
          streak++;
        } else {
          streak = 0;
        }

        // Check milestones based on actuals
        if (!doubleHit && actualNum >= compoundingStartCapital * 2) {
          doubleHit = true;
          calculatedMilestones.push({ type: '2x', day, amount: actualNum });
        }
        if (!tenXHit && actualNum >= compoundingStartCapital * 10) {
          tenXHit = true;
          calculatedMilestones.push({ type: '10x', day, amount: actualNum });
        }
      } else {
        if (day === lastFilledDay + 1) {
          isActiveDay = true;
          const baseBalance = lastFilledDay > 0 ? parseFloat(compoundingActuals[lastFilledDay]) : compoundingStartCapital;
          const currentSessionPnL = runningBalance - initialCapital;
          liveActiveBalance = baseBalance + currentSessionPnL;
          
          diff = liveActiveBalance - targetBalance;
          isSuccess = liveActiveBalance >= (targetBalance - 0.000001);
          isFailure = liveActiveBalance < (targetBalance - 0.000001);
          currentAheadBehind = diff;
        }

        // Project milestones based on targets if not filled yet
        if (!doubleHit && targetBalance >= compoundingStartCapital * 2) {
           doubleHit = true;
           calculatedMilestones.push({ type: '2x (Proj)', day, amount: targetBalance });
        }
        if (!tenXHit && targetBalance >= compoundingStartCapital * 10) {
           tenXHit = true;
           calculatedMilestones.push({ type: '10x (Proj)', day, amount: targetBalance });
        }
      }

      return {
        day,
        targetBalance,
        actualStr,
        actualNum,
        isFilled,
        isActiveDay,
        liveActiveBalance,
        diff,
        isSuccess,
        isFailure,
        withdrawnToday,
        date: new Date(dateTracker) // Store date for potential future use
      };
    });

    const cData = tData.map((d) => ({
      day: `Day ${d.day}`,
      Target: Number(d.targetBalance.toFixed(2)),
      Actual: d.isFilled ? Number(d.actualNum.toFixed(2)) : (d.isActiveDay ? Number(d.liveActiveBalance.toFixed(2)) : null),
      Difference: d.isFilled ? Number(d.diff.toFixed(2)) : (d.isActiveDay ? Number(d.diff.toFixed(2)) : null),
    }));

    const finalTarget = tData[tData.length - 1]?.targetBalance || compoundingStartCapital;
    const progress = Math.min(100, Math.max(0, ((currentBalance - compoundingStartCapital) / (finalTarget - compoundingStartCapital)) * 100)) || 0;

    const daysToDouble = compoundingDailyTarget > 0 ? Math.ceil(Math.log(2) / Math.log(1 + compoundingDailyTarget / 100)) : 0;
    const doubleProgress = Math.min(100, Math.max(0, ((currentBalance - compoundingStartCapital) / compoundingStartCapital) * 100)) || 0;

    return {
      tableData: tData,
      chartData: cData,
      currentDay: lastFilledDay,
      aheadBehind: currentAheadBehind,
      currentStreak: streak,
      targetBalanceAtEnd: finalTarget,
      progressPercentage: progress,
      daysToDouble,
      doubleProgress,
      milestones: calculatedMilestones,
      totalWithdrawn: accumulatedWithdrawals
    };
  }, [compoundingStartCapital, compoundingDailyTarget, compoundingActuals, duration, tradingDaysOnly, withdrawalPercentage, withdrawalFrequency, runningBalance, initialCapital]);

  // Celebration Effect
  const lastCelebratedDay = useRef<number>(-1);
  useEffect(() => {
    if (currentDay === lastCelebratedDay.current) return;
    lastCelebratedDay.current = currentDay;

    if (currentDay > 0 && tableData[currentDay - 1]?.isSuccess) {
       // Trigger small confetti on daily success
       confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#10b981', '#fbbf24']
      });
    }
    
    // Check if a milestone was hit TODAY
    const todayMilestone = milestones.find(m => m.day === currentDay && !m.type.includes('Proj'));
    if (todayMilestone) {
      // Big celebration for milestones
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
      
      showToast(`🎉 Milestone Reached: ${todayMilestone.type}!`, 'success');
    }
  }, [currentDay, tableData, milestones, showToast]);

  const exportToCSV = () => {
    const headers = ['Day', 'Target Balance', 'Actual Balance', 'Difference', 'Status'];
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => [
        row.day,
        row.targetBalance.toFixed(2),
        row.isFilled ? row.actualNum.toFixed(2) : '',
        row.isFilled ? row.diff.toFixed(2) : '',
        row.isFilled ? (row.isSuccess ? 'Success' : 'Failure') : 'Pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compounding_plan_${duration}days.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runSimulation = () => {
    let simBalance = compoundingStartCapital;
    const newActuals: { [key: number]: string } = {};
    
    for (let day = 1; day <= duration; day++) {
      let dailyPnl = 0;
      for (let t = 0; t < simTradesPerDay; t++) {
        const isWin = Math.random() * 100 <= simWinRate;
        const riskAmount = simBalance * (simRiskPerTrade / 100);
        if (isWin) {
          dailyPnl += riskAmount * simRR;
        } else {
          dailyPnl -= riskAmount;
        }
      }
      simBalance += dailyPnl;
      newActuals[day] = simBalance.toFixed(2);
    }
    
    confirmAction(
      "Apply Simulation?",
      "This will overwrite your current actuals with simulated data based on your win rate and R:R settings.",
      () => {
        setCompoundingActuals(newActuals);
        showToast("Simulation applied successfully", "success");
        setShowSimulator(false);
      }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="flex flex-col gap-4 relative w-full max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Action Bar - Scrollable & Refined */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-slate-800/20 border border-slate-700/30 rounded-xl backdrop-blur-md -mt-2 shadow-inner overflow-x-auto scrollbar-none min-w-0">
        <div className="flex items-center gap-4 shrink-0">
          <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-[0.15em] whitespace-nowrap">
            <div className="p-1 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
              <Target className="w-3.5 h-3.5 text-amber-500" />
            </div>
            30-Day Planner
          </h3>
          <div className="h-4 w-[1px] bg-slate-700/50 hidden sm:block" />
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV} 
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 border border-slate-700/50 hover:border-blue-500/30 rounded-lg transition-all duration-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm whitespace-nowrap"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button 
              onClick={resetPlanner} 
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/30 rounded-lg transition-all duration-300 text-[10px] font-bold uppercase tracking-wider group backdrop-blur-sm whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-rose-400 transition-all duration-300 p-1.5 hover:bg-rose-500/10 rounded-lg shrink-0"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-500" /> Day {duration} Target
            </span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 font-mono tracking-tight">
              {formatMoney(targetBalanceAtEnd)}
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" /> Current Balance
            </span>
            <span className="text-2xl font-black text-slate-200 font-mono tracking-tight flex items-baseline gap-2">
              {formatMoney(currentDay > 0 ? tableData[currentDay - 1].actualNum : compoundingStartCapital)}
            </span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Current Streak
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                {currentStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
        </motion.div>



        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-purple-400" /> Double In
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-400 font-mono tracking-tight">
                {daysToDouble > 0 ? daysToDouble : '-'}
              </span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Days</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden relative">
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-purple-300 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${doubleProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Simulator Panel */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-3xl backdrop-blur-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-purple-100">Trading Simulator</h3>
              </div>
              <p className="text-sm text-purple-300/70 mb-6">Simulate a compounding journey based on your trading strategy metrics.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Win Rate (%)</label>
                  <input
                    type="number"
                    value={simWinRate}
                    onChange={(e) => setSimWinRate(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reward:Risk Ratio</label>
                  <input
                    type="number"
                    value={simRR}
                    onChange={(e) => setSimRR(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trades / Day</label>
                  <input
                    type="number"
                    value={simTradesPerDay}
                    onChange={(e) => setSimTradesPerDay(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Risk per Trade (%)</label>
                  <input
                    type="number"
                    value={simRiskPerTrade}
                    onChange={(e) => setSimRiskPerTrade(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={runSimulation}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-500/20"
                >
                  Run Simulation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inputs & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" /> Plan Parameters
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Capital</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-300 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400 font-mono">{currency}</span>
                    <input
                      type="number"
                      value={compoundingStartCapital || ''}
                      onChange={(e) => setCompoundingStartCapital(Number(e.target.value))}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 transition-colors font-mono text-lg shadow-inner"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Target</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 6, 9].map(pct => (
                      <button 
                        key={pct}
                        onClick={() => setCompoundingDailyTarget(pct)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${compoundingDailyTarget === pct ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-300 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={compoundingDailyTarget || ''}
                      onChange={(e) => setCompoundingDailyTarget(Number(e.target.value))}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-amber-500/50 transition-colors font-mono text-lg shadow-inner"
                      placeholder="5"
                    />
                    <span className="absolute right-4 text-slate-400 font-mono">%</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Duration (Days)</label>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={duration || ''}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val > 30) val = 30;
                        if (val < 1) val = 1;
                        setDuration(val);
                      }}
                      max={30}
                      min={1}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-lg shadow-inner"
                      placeholder="30"
                    />
                    <span className="absolute right-4 text-slate-400 font-mono">Days</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setTradingDaysOnly(!tradingDaysOnly)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${tradingDaysOnly ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2">
                    {tradingDaysOnly ? <CalendarOff className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    <span className="text-sm font-bold uppercase tracking-wider">Trading Days Only</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${tradingDaysOnly ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${tradingDaysOnly ? 'left-4.5 right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
                <p className="text-[10px] text-slate-500 mt-2 text-center">If enabled, weekends are skipped in calculations.</p>
              </div>

              {/* Withdrawal Planner */}
              <div className="pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Withdrawal Planner</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Withdrawal %</label>
                      <span className="text-xs text-slate-400 font-mono">{withdrawalPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={withdrawalPercentage}
                      onChange={(e) => setWithdrawalPercentage(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Frequency</label>
                    <select
                      value={withdrawalFrequency}
                      onChange={(e) => setWithdrawalFrequency(Number(e.target.value))}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                    >
                      <option value={7}>Weekly (Every 7 Days)</option>
                      <option value={14}>Bi-Weekly (Every 14 Days)</option>
                      <option value={30}>Monthly (Every 30 Days)</option>
                    </select>
                  </div>
                  {totalWithdrawn > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-bold mb-1">Total Projected Withdrawals</div>
                      <div className="text-lg font-black text-emerald-400 font-mono">{formatMoney(totalWithdrawn)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Milestones Card */}
          {milestones.length > 0 && (
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Flag className="w-4 h-4 text-purple-500" /> Milestones
              </h3>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${m.type.includes('Proj') ? 'bg-slate-900/50 border-slate-700/50' : 'bg-purple-500/10 border-purple-500/30'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${m.type.includes('Proj') ? 'bg-slate-600' : 'bg-purple-500 animate-pulse'}`} />
                      <span className={`text-sm font-bold ${m.type.includes('Proj') ? 'text-slate-400' : 'text-purple-400'}`}>{m.type}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm ${m.type.includes('Proj') ? 'text-slate-300' : 'text-white font-bold'}`}>{formatMoney(m.amount)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Day {m.day}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 shadow-xl backdrop-blur-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Growth Projection
          </h3>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${currency}${value}`} 
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: '#334155', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}
                  formatter={(value: number, name: string) => [
                    formatMoney(value), 
                    <span className={name === 'Target' ? 'text-amber-400' : 'text-emerald-400'}>{name}</span>
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
                  iconType="circle"
                />
                <Area 
                  type="monotone" 
                  dataKey="Target" 
                  stroke="#fbbf24" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorTarget)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="Actual" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} 
                  connectNulls 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 30-Day Breakdown */}
      <div className="mt-8 mb-4">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> {duration}-Day Breakdown
        </h4>
      </div>

      {/* 30-Day Breakdown Table */}
      <div className="mt-8 mb-4 overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-800/20">
        <div className="h-[350px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-900/50 border-b border-slate-700/30 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-800/50 transition-colors group"
                  onClick={() => setShowDateInBreakdown(!showDateInBreakdown)}
                  title="Click to toggle between Day and Date view"
                >
                  <div className="flex items-center gap-2">
                    <span>{showDateInBreakdown ? 'Date' : 'Day'}</span>
                    <RotateCcw className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">Start Cap</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 font-medium">Cashout</th>
                <th className="px-4 py-3 font-medium">Next Target</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {tableData.map((row, index) => {
                const startCap = index === 0 ? compoundingStartCapital : (tableData[index - 1].isFilled ? tableData[index - 1].actualNum : tableData[index - 1].targetBalance);
                const profit = row.isFilled ? row.actualNum - startCap : (row.isActiveDay ? row.liveActiveBalance - startCap : row.targetBalance - startCap);
                const withdrawnToday = row.isFilled ? row.withdrawnToday : (row.isActiveDay && withdrawalPercentage > 0 && row.day % withdrawalFrequency === 0 ? row.liveActiveBalance * (withdrawalPercentage / 100) : 0);
                const displayTotal = row.isFilled ? row.actualNum : (row.isActiveDay ? row.liveActiveBalance : row.targetBalance);
                
                const nextTargetAmount = row.isFilled ? 0 : (row.isActiveDay ? Math.max(0, row.targetBalance - row.liveActiveBalance) : row.targetBalance - startCap);
                
                return (
                  <tr key={row.day} className={`transition-colors ${row.isActiveDay ? 'bg-blue-900/10' : 'hover:bg-slate-800/40'}`}>
                    <td className="px-4 py-3 text-slate-300">
                      {showDateInBreakdown ? (
                        <span className="font-mono font-bold text-amber-400/90 whitespace-nowrap">
                          {row.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-400/90 whitespace-nowrap">Day {row.day.toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{formatMoney(startCap)}</td>
                    <td className={`px-4 py-3 font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(profit >= 0 ? '+' : '') + formatMoney(profit)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{withdrawnToday > 0 ? formatMoney(withdrawnToday) : '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {row.isFilled ? '-' : formatMoney(nextTargetAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {row.isFilled ? (
                        <span 
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-help ${row.isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
                          title={`Target: ${formatMoney(row.targetBalance)} | Actual: ${formatMoney(row.actualNum)}`}
                        >
                          {row.isSuccess ? 'Pass' : 'Fail'}
                        </span>
                      ) : row.isActiveDay ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => {
                              // If they click Pass, we assume they hit at least the target if they want it to be a Pass
                              const finalVal = Math.max(row.liveActiveBalance, row.targetBalance);
                              handleActualChange(row.day, finalVal.toString());
                              setInitialCapital(finalVal);
                              showToast(`Day ${row.day} Passed!`, 'success');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                            title="Lock as Pass (Sets balance to target if current is lower)"
                          >
                            Pass
                          </button>
                          <button
                            onClick={() => {
                              // If they click Fail, we use current balance (which should be < target)
                              const finalVal = Math.min(row.liveActiveBalance, row.targetBalance - 0.01);
                              handleActualChange(row.day, finalVal.toString());
                              setInitialCapital(finalVal);
                              showToast(`Day ${row.day} Failed.`, 'error');
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                            title="Lock as Fail (Sets balance below target if current is higher)"
                          >
                            Fail
                          </button>
                          <button
                            onClick={() => {
                              handleActualChange(row.day, row.liveActiveBalance.toString());
                              setInitialCapital(row.liveActiveBalance);
                              showToast(`Day ${row.day} Locked.`, 'warning');
                            }}
                            className="bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                            title="Lock current balance as is"
                          >
                            Lock
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] uppercase font-medium tracking-wider">Projected</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{formatMoney(displayTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

