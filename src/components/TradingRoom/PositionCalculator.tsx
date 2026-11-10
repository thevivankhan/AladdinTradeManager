import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Target, ShieldAlert, ArrowRight, Activity, Scale, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PositionCalculator: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [riskAmount, setRiskAmount] = useState<number>(100);
  
  const [entryPrice, setEntryPrice] = useState<number>(50000);
  const [stopLossPrice, setStopLossPrice] = useState<number>(49000);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(53000);
  
  const [assetType, setAssetType] = useState<'Crypto' | 'Forex' | 'Stocks' | 'Binary'>('Crypto');
  const [contractSize, setContractSize] = useState<number>(100000); // Standard lot for Forex
  const [binaryPayout, setBinaryPayout] = useState<number>(85); // Binary options payout %

  // Sync Risk % and Risk Amount
  const handleRiskPercentChange = (val: number) => {
    setRiskPercentage(val);
    setRiskAmount((accountBalance * val) / 100);
  };

  const handleRiskAmountChange = (val: number) => {
    setRiskAmount(val);
    if (accountBalance > 0) {
      setRiskPercentage((val / accountBalance) * 100);
    }
  };

  const handleBalanceChange = (val: number) => {
    setAccountBalance(val);
    setRiskAmount((val * riskPercentage) / 100);
  };

  // Calculations
  const isLong = takeProfitPrice > entryPrice || stopLossPrice < entryPrice;
  const priceDifference = Math.abs(entryPrice - stopLossPrice);
  const stopLossPercentage = entryPrice > 0 ? (priceDifference / entryPrice) * 100 : 0;
  
  const profitDifference = Math.abs(takeProfitPrice - entryPrice);
  const takeProfitPercentage = entryPrice > 0 ? (profitDifference / entryPrice) * 100 : 0;

  let positionSize = 0;
  let positionValue = 0;
  let potentialProfit = 0;
  let riskRewardRatio = 0;

  if (assetType === 'Binary') {
    positionSize = riskAmount;
    positionValue = riskAmount;
    potentialProfit = riskAmount * (binaryPayout / 100);
    riskRewardRatio = riskAmount > 0 ? potentialProfit / riskAmount : 0;
  } else if (priceDifference > 0) {
    if (assetType === 'Forex') {
      // Basic Forex calculation (assuming USD quote currency for simplicity)
      const riskPerPip = riskAmount / (priceDifference * 10000); // Assuming 4 decimal places
      positionSize = (riskAmount / priceDifference) / contractSize;
      positionValue = positionSize * contractSize;
    } else {
      // Crypto / Stocks
      positionSize = riskAmount / priceDifference;
      positionValue = positionSize * entryPrice;
    }
    
    potentialProfit = positionSize * profitDifference;
    if (assetType === 'Forex') {
      potentialProfit = positionSize * contractSize * profitDifference;
    }
    
    riskRewardRatio = riskAmount > 0 ? potentialProfit / riskAmount : 0;
  }

  // Effective Leverage (Position Value / Account Balance)
  const effectiveLeverage = accountBalance > 0 ? positionValue / accountBalance : 0;

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Calculator className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">Advanced Position Calculator</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Calculate precise position sizes and risk parameters</p>
          </div>
        </div>
        
        <div className="flex bg-[#1e293b] rounded-lg p-1 border border-slate-700 w-full md:w-auto overflow-x-auto hide-scrollbar">
          {(['Crypto', 'Forex', 'Stocks', 'Binary'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setAssetType(type)}
              className={cn(
                "flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                assetType === type 
                  ? "bg-emerald-500 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account & Risk Section */}
          <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-slate-700/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Account & Risk
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Account Balance ($)</label>
                <input 
                  type="number" 
                  value={accountBalance} 
                  onChange={(e) => handleBalanceChange(Number(e.target.value))}
                  className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Risk Percentage (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={riskPercentage} 
                    onChange={(e) => handleRiskPercentChange(Number(e.target.value))}
                    step="0.1"
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Risk Amount ($)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={riskAmount} 
                    onChange={(e) => handleRiskAmountChange(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Trade Parameters Section */}
          <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-slate-700/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Trade Parameters
            </h3>
            
            {assetType === 'Binary' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Broker Payout (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={binaryPayout} 
                      onChange={(e) => setBinaryPayout(Number(e.target.value))}
                      className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Entry Price</label>
                  <input 
                    type="number" 
                    value={entryPrice} 
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Stop Loss</span>
                    <span className="text-rose-400">{stopLossPercentage.toFixed(2)}%</span>
                  </label>
                  <input 
                    type="number" 
                    value={stopLossPrice} 
                    onChange={(e) => setStopLossPrice(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Take Profit</span>
                    <span className="text-emerald-400">{takeProfitPercentage.toFixed(2)}%</span>
                  </label>
                  <input 
                    type="number" 
                    value={takeProfitPrice} 
                    onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {assetType === 'Forex' && (
              <div className="pt-4 border-t border-slate-700/50">
                <div className="w-1/3 pr-2 space-y-1.5">
                  <label className="text-xs text-slate-400">Contract Size (Lot)</label>
                  <input 
                    type="number" 
                    value={contractSize} 
                    onChange={(e) => setContractSize(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-24 h-24 text-emerald-500" />
            </div>
            
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              {assetType === 'Binary' ? 'Investment Amount' : 'Position Size'}
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-white">
                {assetType === 'Binary' ? `$${positionSize.toFixed(2)}` : (positionSize > 0 ? positionSize.toFixed(assetType === 'Crypto' ? 4 : 2) : '0.00')}
              </span>
              <span className="text-sm text-emerald-400/80 font-medium">
                {assetType === 'Forex' ? 'Lots' : assetType === 'Binary' ? 'Risk' : 'Units'}
              </span>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center pb-3 border-b border-emerald-500/20">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" /> Position Value
                </span>
                <span className="text-sm font-semibold text-white">${positionValue.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-emerald-500/20">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Value at Risk
                </span>
                <span className="text-sm font-semibold text-rose-400">-${riskAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-emerald-500/20">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Potential Profit
                </span>
                <span className="text-sm font-semibold text-emerald-400">+${potentialProfit.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" /> R:R Ratio
                </span>
                <span className="text-sm font-semibold text-blue-400">1 : {riskRewardRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warnings / Info */}
          {effectiveLeverage > 1 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-500">Leverage Required</h4>
                <p className="text-xs text-amber-500/80 mt-1">
                  This position requires {effectiveLeverage.toFixed(1)}x leverage based on your account balance.
                </p>
              </div>
            </div>
          )}

          {riskPercentage > 5 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-rose-500">High Risk Warning</h4>
                <p className="text-xs text-rose-500/80 mt-1">
                  Risking more than 5% of your account on a single trade is not recommended for long-term consistency.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
