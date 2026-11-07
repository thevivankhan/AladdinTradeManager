import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Globe, Calendar, ShieldAlert, AlertTriangle, Lock, FileText, Scale, Maximize2, ZoomIn, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Chart } from '../Chart';
import { cn } from '../../lib/utils';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: '🇺🇸 USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: '🇪🇺 EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: '🇬🇧 GBP (£) - British Pound' },
  { code: 'INR', symbol: '₹', label: '🇮🇳 INR (₹) - Indian Rupee' },
  { code: 'BDT', symbol: '৳', label: '🇧🇩 BDT (৳) - Bangladeshi Taka' },
  { code: 'PKR', symbol: '₨', label: '🇵🇰 PKR (₨) - Pakistani Rupee' },
  { code: 'AED', symbol: 'د.إ', label: '🇦🇪 AED (د.إ) - UAE Dirham' },
  { code: 'AFN', symbol: '؋', label: '🇦🇫 AFN (؋) - Afghan Afghani' },
  { code: 'ALL', symbol: 'L', label: '🇦🇱 ALL (L) - Albanian Lek' },
  { code: 'AMD', symbol: '֏', label: '🇦🇲 AMD (֏) - Armenian Dram' },
  { code: 'ARS', symbol: '$', label: '🇦🇷 ARS ($) - Argentine Peso' },
  { code: 'AUD', symbol: '$', label: '🇦🇺 AUD ($) - Australian Dollar' },
  { code: 'AZN', symbol: '₼', label: '🇦🇿 AZN (₼) - Azerbaijani Manat' },
  { code: 'BAM', symbol: 'KM', label: '🇧🇦 BAM (KM) - Bosnia-Herzegovina Convertible Mark' },
  { code: 'BGN', symbol: 'лв', label: '🇧🇬 BGN (лв) - Bulgarian Lev' },
  { code: 'BHD', symbol: '.د.ب', label: '🇧🇭 BHD (.د.ب) - Bahraini Dinar' },
  { code: 'BND', symbol: '$', label: '🇧🇳 BND ($) - Brunei Dollar' },
  { code: 'BOB', symbol: 'Bs.', label: '🇧🇴 BOB (Bs.) - Bolivian Boliviano' },
  { code: 'BRL', symbol: 'R$', label: '🇧🇷 BRL (R$) - Brazilian Real' },
  { code: 'CAD', symbol: '$', label: '🇨🇦 CAD ($) - Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', label: '🇨🇭 CHF (Fr) - Swiss Franc' },
  { code: 'CLP', symbol: '$', label: '🇨🇱 CLP ($) - Chilean Peso' },
  { code: 'CNY', symbol: '¥', label: '🇨🇳 CNY (¥) - Chinese Yuan' },
  { code: 'COP', symbol: '$', label: '🇨🇴 COP ($) - Colombian Peso' },
  { code: 'CRC', symbol: '₡', label: '🇨🇷 CRC (₡) - Costa Rican Colón' },
  { code: 'CZK', symbol: 'Kč', label: '🇨🇿 CZK (Kč) - Czech Koruna' },
  { code: 'DKK', symbol: 'kr', label: '🇩🇰 DKK (kr) - Danish Krone' },
  { code: 'DOP', symbol: 'RD$', label: '🇩🇴 DOP (RD$) - Dominican Peso' },
  { code: 'DZD', symbol: 'د.ج', label: '🇩🇿 DZD (د.ج) - Algerian Dinar' },
  { code: 'EGP', symbol: '£', label: '🇪🇬 EGP (£) - Egyptian Pound' },
  { code: 'FJD', symbol: '$', label: '🇫🇯 FJD ($) - Fijian Dollar' },
  { code: 'GEL', symbol: '₾', label: '🇬🇪 GEL (₾) - Georgian Lari' },
  { code: 'GHS', symbol: '₵', label: '🇬🇭 GHS (₵) - Ghanaian Cedi' },
  { code: 'HKD', symbol: '$', label: '🇭🇰 HKD ($) - Hong Kong Dollar' },
  { code: 'HRK', symbol: 'kn', label: '🇭🇷 HRK (kn) - Croatian Kuna' },
  { code: 'HUF', symbol: 'Ft', label: '🇭🇺 HUF (Ft) - Hungarian Forint' },
  { code: 'IDR', symbol: 'Rp', label: '🇮🇩 IDR (Rp) - Indonesian Rupiah' },
  { code: 'IQD', symbol: 'ع.د', label: '🇮🇶 IQD (ع.د) - Iraqi Dinar' },
  { code: 'IRR', symbol: '﷼', label: '🇮🇷 IRR (﷼) - Iranian Rial' },
  { code: 'ISK', symbol: 'kr', label: '🇮🇸 ISK (kr) - Icelandic Króna' },
  { code: 'JMD', symbol: 'J$', label: '🇯🇲 JMD (J$) - Jamaican Dollar' },
  { code: 'JOD', symbol: 'د.ا', label: '🇯🇴 JOD (د.ا) - Jordanian Dinar' },
  { code: 'JPY', symbol: '¥', label: '🇯🇵 JPY (¥) - Japanese Yen' },
  { code: 'KES', symbol: 'KSh', label: '🇰🇪 KES (KSh) - Kenyan Shilling' },
  { code: 'KHR', symbol: '៛', label: '🇰🇭 KHR (៛) - Cambodian Riel' },
  { code: 'KRW', symbol: '₩', label: '🇰🇷 KRW (₩) - South Korean Won' },
  { code: 'KWD', symbol: 'د.ك', label: '🇰🇼 KWD (د.ك) - Kuwaiti Dinar' },
  { code: 'KZT', symbol: '₸', label: '🇰🇿 KZT (₸) - Kazakhstani Tenge' },
  { code: 'LBP', symbol: 'ل.ل', label: '🇱🇧 LBP (ل.ل) - Lebanese Pound' },
  { code: 'LKR', symbol: 'Rs', label: '🇱🇰 LKR (Rs) - Sri Lankan Rupee' },
  { code: 'MAD', symbol: 'د.م.', label: '🇲🇦 MAD (د.م.) - Moroccan Dirham' },
  { code: 'MDL', symbol: 'L', label: '🇲🇩 MDL (L) - Moldovan Leu' },
  { code: 'MKD', symbol: 'ден', label: '🇲🇰 MKD (ден) - Macedonian Denar' },
  { code: 'MMK', symbol: 'K', label: '🇲🇲 MMK (K) - Myanmar Kyat' },
  { code: 'MNT', symbol: '₮', label: '🇲🇳 MNT (₮) - Mongolian Tögrög' },
  { code: 'MUR', symbol: '₨', label: '🇲🇺 MUR (₨) - Mauritian Rupee' },
  { code: 'MXN', symbol: '$', label: '🇲🇽 MXN ($) - Mexican Peso' },
  { code: 'MYR', symbol: 'RM', label: '🇲🇾 MYR (RM) - Malaysian Ringgit' },
  { code: 'NGN', symbol: '₦', label: '🇳🇬 NGN (₦) - Nigerian Naira' },
  { code: 'NOK', symbol: 'kr', label: '🇳🇴 NOK (kr) - Norwegian Krone' },
  { code: 'NPR', symbol: 'रू', label: '🇳🇵 NPR (रू) - Nepalese Rupee' },
  { code: 'NZD', symbol: '$', label: '🇳🇿 NZD ($) - New Zealand Dollar' },
  { code: 'OMR', symbol: 'ر.ع.', label: '🇴🇲 OMR (ر.ع.) - Omani Rial' },
  { code: 'PAB', symbol: 'B/.', label: '🇵🇦 PAB (B/.) - Panamanian Balboa' },
  { code: 'PEN', symbol: 'S/.', label: '🇵🇪 PEN (S/.) - Peruvian Sol' },
  { code: 'PHP', symbol: '₱', label: '🇵🇭 PHP (₱) - Philippine Peso' },
  { code: 'PLN', symbol: 'zł', label: '🇵🇱 PLN (zł) - Polish Złoty' },
  { code: 'PYG', symbol: '₲', label: '🇵🇾 PYG (₲) - Paraguayan Guaraní' },
  { code: 'QAR', symbol: 'ر.ق', label: '🇶🇦 QAR (ر.ق) - Qatari Riyal' },
  { code: 'RON', symbol: 'lei', label: '🇷🇴 RON (lei) - Romanian Leu' },
  { code: 'RSD', symbol: 'дин.', label: '🇷🇸 RSD (дин.) - Serbian Dinar' },
  { code: 'RUB', symbol: '₽', label: '🇷🇺 RUB (₽) - Russian Ruble' },
  { code: 'SAR', symbol: 'ر.س', label: '🇸🇦 SAR (ر.س) - Saudi Riyal' },
  { code: 'SEK', symbol: 'kr', label: '🇸🇪 SEK (kr) - Swedish Krona' },
  { code: 'SGD', symbol: '$', label: '🇸🇬 SGD ($) - Singapore Dollar' },
  { code: 'THB', symbol: '฿', label: '🇹🇭 THB (฿) - Thai Baht' },
  { code: 'TND', symbol: 'د.ت', label: '🇹🇳 TND (د.ت) - Tunisian Dinar' },
  { code: 'TRY', symbol: '₺', label: '🇹🇷 TRY (₺) - Turkish Lira' },
  { code: 'TTD', symbol: 'TT$', label: '🇹🇹 TTD (TT$) - Trinidad and Tobago Dollar' },
  { code: 'TWD', symbol: 'NT$', label: '🇹🇼 TWD (NT$) - New Taiwan Dollar' },
  { code: 'TZS', symbol: 'TSh', label: '🇹🇿 TZS (TSh) - Tanzanian Shilling' },
  { code: 'UAH', symbol: '₴', label: '🇺🇦 UAH (₴) - Ukrainian Hryvnia' },
  { code: 'UGX', symbol: 'USh', label: '🇺🇬 UGX (USh) - Ugandan Shilling' },
  { code: 'UYU', symbol: '$U', label: '🇺🇾 UYU ($U) - Uruguayan Peso' },
  { code: 'UZS', symbol: 'so\'m', label: '🇺🇿 UZS (so\'m) - Uzbekistani So\'m' },
  { code: 'VES', symbol: 'Bs.S', label: '🇻🇪 VES (Bs.S) - Venezuelan Bolívar' },
  { code: 'VND', symbol: '₫', label: '🇻🇳 VND (₫) - Vietnamese Đồng' },
  { code: 'XAF', symbol: 'FCFA', label: '🇨🇲 XAF (FCFA) - Central African CFA Franc' },
  { code: 'XCD', symbol: '$', label: '🇦🇬 XCD ($) - East Caribbean Dollar' },
  { code: 'XOF', symbol: 'CFA', label: '🇸🇳 XOF (CFA) - West African CFA Franc' },
  { code: 'ZAR', symbol: 'R', label: '🇿🇦 ZAR (R) - South African Rand' },
  { code: 'ZMW', symbol: 'ZK', label: '🇿🇲 ZMW (ZK) - Zambian Kwacha' }
];

type Mode = 'wins' | 'daily';

interface Props {
  currentCapital?: number;
}

export const OlOlODailyCalculator = ({ currentCapital }: Props) => {
  // Load saved state or use defaults
  const getSavedState = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`ololo_daily_calc_${key}`);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Error loading ${key} from localStorage`, e);
    }
    return defaultValue;
  };

  const [mode, setMode] = useState<Mode>(() => getSavedState('mode', 'daily'));
  const [currency, setCurrency] = useState(() => getSavedState('currency', 'USD'));
  const [startCapital, setStartCapital] = useState<number>(() => getSavedState('startCapital', 100));
  const [startDate, setStartDate] = useState<string>(() => getSavedState('startDate', format(new Date(), 'yyyy-MM-dd')));
  
  // Reinvest Strategy
  const [reinvestPercent, setReinvestPercent] = useState<number>(() => getSavedState('reinvestPercent', 95));
  
  // Daily Mode State
  const [dailyGainPercent, setDailyGainPercent] = useState<number>(() => getSavedState('dailyGainPercent', 3));
  const [activeDays, setActiveDays] = useState<boolean[]>(() => getSavedState('activeDays', [false, true, true, true, true, true, false])); // S M T W T F S
  const [durationYears, setDurationYears] = useState<number>(() => getSavedState('durationYears', 0));
  const [durationMonths, setDurationMonths] = useState<number>(() => getSavedState('durationMonths', 1));
  const [durationDays, setDurationDays] = useState<number>(() => getSavedState('durationDays', 0));
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>(() => getSavedState('activeTab', 'Daily'));
  
  // Wins Mode State
  const [brokerPayout, setBrokerPayout] = useState<number>(() => getSavedState('brokerPayout', 92));
  const [compoundSteps, setCompoundSteps] = useState<number>(() => getSavedState('compoundSteps', 5));
  
  // Daily Advanced Features
  const [regularAmount, setRegularAmount] = useState<number>(() => getSavedState('regularAmount', 0));
  const [regularType, setRegularType] = useState<'Deposit' | 'Withdrawal'>(() => getSavedState('regularType', 'Deposit'));
  const [regularFrequency, setRegularFrequency] = useState<'Weekly' | 'Monthly'>(() => getSavedState('regularFrequency', 'Monthly'));
  const [winRate, setWinRate] = useState<number>(() => getSavedState('winRate', 100));
  const [averageLoss, setAverageLoss] = useState<number>(() => getSavedState('averageLoss', 0));
  const [useTieredGain, setUseTieredGain] = useState<boolean>(() => getSavedState('useTieredGain', false));
  const [tierThreshold, setTierThreshold] = useState<number>(() => getSavedState('tierThreshold', 10000));
  const [tierGainPercent, setTierGainPercent] = useState<number>(() => getSavedState('tierGainPercent', 1));
  const [monthlyTaxPercent, setMonthlyTaxPercent] = useState<number>(() => getSavedState('monthlyTaxPercent', 0));
  
  // New 5 Daily Features
  const [useAdvancedDaily, setUseAdvancedDaily] = useState<boolean>(() => getSavedState('useAdvancedDaily', false));
  const [marketSession, setMarketSession] = useState<'Asian' | 'London' | 'NY' | 'Tokyo'>(() => getSavedState('marketSession', 'London'));
  const [stopLossAmount, setStopLossAmount] = useState<number>(() => getSavedState('stopLossAmount', 0));
  const [targetAmountDaily, setTargetAmountDaily] = useState<number>(() => getSavedState('targetAmountDaily', 0));
  const [badStreakLength, setBadStreakLength] = useState<number>(() => getSavedState('badStreakLength', 3));
  const [perTradeCommission, setPerTradeCommission] = useState<number>(() => getSavedState('perTradeCommission', 0));
  const [reinvestThreshold, setReinvestThreshold] = useState<number>(() => getSavedState('reinvestThreshold', 1000));
  const [reinvestThresholdPercent, setReinvestThresholdPercent] = useState<number>(() => getSavedState('reinvestThresholdPercent', 50));
  
  // Wins Advanced Features
  const [cashoutStep, setCashoutStep] = useState<number>(() => getSavedState('cashoutStep', 0));
  const [winsPerSession, setWinsPerSession] = useState<number>(() => getSavedState('winsPerSession', 3));
  const [totalBankroll, setTotalBankroll] = useState<number>(() => getSavedState('totalBankroll', 100));

  // New 5 Wins Features
  const [useAdvancedWins, setUseAdvancedWins] = useState<boolean>(() => getSavedState('useAdvancedWins', false));
  const [marketSessionWins, setMarketSessionWins] = useState<'Asian' | 'London' | 'NY' | 'Tokyo'>(() => getSavedState('marketSessionWins', 'London'));
  const [stopLossAmountWins, setStopLossAmountWins] = useState<number>(() => getSavedState('stopLossAmountWins', 0));
  const [targetAmountWins, setTargetAmountWins] = useState<number>(() => getSavedState('targetAmountWins', 0));
  const [consecutiveLossLimit, setConsecutiveLossLimit] = useState<number>(() => getSavedState('consecutiveLossLimit', 3));
  const [perTradeCommissionWins, setPerTradeCommissionWins] = useState<number>(() => getSavedState('perTradeCommissionWins', 0));
  const [reinvestThresholdWins, setReinvestThresholdWins] = useState<number>(() => getSavedState('reinvestThresholdWins', 1000));
  const [reinvestThresholdPercentWins, setReinvestThresholdPercentWins] = useState<number>(() => getSavedState('reinvestThresholdPercentWins', 50));

  // UI State
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // Goal Projector
  const [targetAmount, setTargetAmount] = useState<number>(() => getSavedState('targetAmount', 1000));

  // Custom Milestones (Daily)
  const [customMilestones, setCustomMilestones] = useState<{amount: number, reachedDay: number | null}[]>(() => getSavedState('customMilestones', []));
  const [newMilestone, setNewMilestone] = useState<string>('');

  // Save state whenever it changes
  useEffect(() => {
    localStorage.setItem('ololo_daily_calc_mode', JSON.stringify(mode));
    localStorage.setItem('ololo_daily_calc_currency', JSON.stringify(currency));
    localStorage.setItem('ololo_daily_calc_startCapital', JSON.stringify(startCapital));
    localStorage.setItem('ololo_daily_calc_startDate', JSON.stringify(startDate));
    localStorage.setItem('ololo_daily_calc_reinvestPercent', JSON.stringify(reinvestPercent));
    localStorage.setItem('ololo_daily_calc_dailyGainPercent', JSON.stringify(dailyGainPercent));
    localStorage.setItem('ololo_daily_calc_activeDays', JSON.stringify(activeDays));
    localStorage.setItem('ololo_daily_calc_durationYears', JSON.stringify(durationYears));
    localStorage.setItem('ololo_daily_calc_durationMonths', JSON.stringify(durationMonths));
    localStorage.setItem('ololo_daily_calc_durationDays', JSON.stringify(durationDays));
    localStorage.setItem('ololo_daily_calc_activeTab', JSON.stringify(activeTab));
    localStorage.setItem('ololo_daily_calc_brokerPayout', JSON.stringify(brokerPayout));
    localStorage.setItem('ololo_daily_calc_compoundSteps', JSON.stringify(compoundSteps));
    localStorage.setItem('ololo_daily_calc_targetAmount', JSON.stringify(targetAmount));
    localStorage.setItem('ololo_daily_calc_regularAmount', JSON.stringify(regularAmount));
    localStorage.setItem('ololo_daily_calc_regularType', JSON.stringify(regularType));
    localStorage.setItem('ololo_daily_calc_regularFrequency', JSON.stringify(regularFrequency));
    localStorage.setItem('ololo_daily_calc_winRate', JSON.stringify(winRate));
    localStorage.setItem('ololo_daily_calc_averageLoss', JSON.stringify(averageLoss));
    localStorage.setItem('ololo_daily_calc_useTieredGain', JSON.stringify(useTieredGain));
    localStorage.setItem('ololo_daily_calc_tierThreshold', JSON.stringify(tierThreshold));
    localStorage.setItem('ololo_daily_calc_tierGainPercent', JSON.stringify(tierGainPercent));
    localStorage.setItem('ololo_daily_calc_monthlyTaxPercent', JSON.stringify(monthlyTaxPercent));
    localStorage.setItem('ololo_daily_calc_cashoutStep', JSON.stringify(cashoutStep));
    localStorage.setItem('ololo_daily_calc_winsPerSession', JSON.stringify(winsPerSession));
    localStorage.setItem('ololo_daily_calc_totalBankroll', JSON.stringify(totalBankroll));
    localStorage.setItem('ololo_daily_calc_customMilestones', JSON.stringify(customMilestones));
    localStorage.setItem('ololo_daily_calc_useAdvancedDaily', JSON.stringify(useAdvancedDaily));
    localStorage.setItem('ololo_daily_calc_marketSession', JSON.stringify(marketSession));
    localStorage.setItem('ololo_daily_calc_stopLossAmount', JSON.stringify(stopLossAmount));
    localStorage.setItem('ololo_daily_calc_targetAmountDaily', JSON.stringify(targetAmountDaily));
    localStorage.setItem('ololo_daily_calc_badStreakLength', JSON.stringify(badStreakLength));
    localStorage.setItem('ololo_daily_calc_perTradeCommission', JSON.stringify(perTradeCommission));
    localStorage.setItem('ololo_daily_calc_reinvestThreshold', JSON.stringify(reinvestThreshold));
    localStorage.setItem('ololo_daily_calc_reinvestThresholdPercent', JSON.stringify(reinvestThresholdPercent));
    localStorage.setItem('ololo_daily_calc_useAdvancedWins', JSON.stringify(useAdvancedWins));
    localStorage.setItem('ololo_daily_calc_marketSessionWins', JSON.stringify(marketSessionWins));
    localStorage.setItem('ololo_daily_calc_stopLossAmountWins', JSON.stringify(stopLossAmountWins));
    localStorage.setItem('ololo_daily_calc_targetAmountWins', JSON.stringify(targetAmountWins));
    localStorage.setItem('ololo_daily_calc_consecutiveLossLimit', JSON.stringify(consecutiveLossLimit));
    localStorage.setItem('ololo_daily_calc_perTradeCommissionWins', JSON.stringify(perTradeCommissionWins));
    localStorage.setItem('ololo_daily_calc_reinvestThresholdWins', JSON.stringify(reinvestThresholdWins));
    localStorage.setItem('ololo_daily_calc_reinvestThresholdPercentWins', JSON.stringify(reinvestThresholdPercentWins));
  }, [mode, currency, startCapital, startDate, reinvestPercent, dailyGainPercent, activeDays, durationYears, durationMonths, durationDays, activeTab, brokerPayout, compoundSteps, targetAmount, regularAmount, regularType, regularFrequency, winRate, averageLoss, useTieredGain, tierThreshold, tierGainPercent, monthlyTaxPercent, cashoutStep, winsPerSession, totalBankroll, customMilestones, useAdvancedDaily, marketSession, stopLossAmount, targetAmountDaily, badStreakLength, perTradeCommission, reinvestThreshold, reinvestThresholdPercent, useAdvancedWins, marketSessionWins, stopLossAmountWins, targetAmountWins, consecutiveLossLimit, perTradeCommissionWins, reinvestThresholdWins, reinvestThresholdPercentWins]);

  
  // Results State
  const [data, setData] = useState<any[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [totalGain, setTotalGain] = useState<number>(0);
  const [activeBalance, setActiveBalance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [projectedBalanceAtTarget, setProjectedBalanceAtTarget] = useState<number>(0);
  const [targetEndDate, setTargetEndDate] = useState<string>('');
  const [showFullTable, setShowFullTable] = useState<boolean>(false);
  const [showDateColumn, setShowDateColumn] = useState<boolean>(false);

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

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
      let milestoneTracker = [...customMilestones].map(m => ({ ...m, reachedDay: null as number | null }));
      
      for (let i = 1; i <= totalDaysToSimulate; i++) {
        const dayOfWeek = currentDate.getDay();
        let dailyProfit = 0;
        let withdrawnToday = 0;
        let reinvestedToday = 0;
        let taxDeducted = 0;
        let regularFlow = 0;

        if (activeDays[dayOfWeek]) {
          if (useAdvancedDaily) {
            const sessionMultiplier = marketSession === 'Asian' ? 0.8 : marketSession === 'London' ? 1.2 : marketSession === 'Tokyo' ? 1.0 : 1.1;
            const effectiveGainPercent = ((winRate / 100 * dailyGainPercent) - ((100 - winRate) / 100 * averageLoss)) * sessionMultiplier;
            const actualGainPercent = (useTieredGain && currentCapital >= tierThreshold) ? tierGainPercent : effectiveGainPercent;

            // Bad Streak Simulation
            dailyProfit = currentCapital * (actualGainPercent / 100);
            if (i % badStreakLength === 0) {
              dailyProfit = -currentCapital * (averageLoss / 100);
            }

            const currentReinvestPercent = currentCapital >= reinvestThreshold ? reinvestThresholdPercent : reinvestPercent;
            reinvestedToday = dailyProfit * (currentReinvestPercent / 100);
            withdrawnToday = dailyProfit - reinvestedToday;

            currentCapital += reinvestedToday - perTradeCommission;
            
            // Stop Loss / Target Check
            if (stopLossAmount > 0 && currentCapital <= (startCapital - stopLossAmount)) break;
            if (targetAmountDaily > 0 && currentCapital >= (startCapital + targetAmountDaily)) break;
          } else {
            dailyProfit = currentCapital * (dailyGainPercent / 100);
            reinvestedToday = dailyProfit * (reinvestPercent / 100);
            withdrawnToday = dailyProfit - reinvestedToday;
            currentCapital += reinvestedToday;
          }

          withdrawnTotal += withdrawnToday;
          profitTotal += dailyProfit;
          daysElapsed++;
        }

        if (regularAmount > 0) {
          if ((regularFrequency === 'Weekly' && i % 7 === 0) || (regularFrequency === 'Monthly' && i % 30 === 0)) {
            if (regularType === 'Deposit') {
              currentCapital += regularAmount;
              regularFlow = regularAmount;
            } else {
              const actualWithdrawal = Math.min(currentCapital, regularAmount);
              currentCapital -= actualWithdrawal;
              withdrawnTotal += actualWithdrawal;
              regularFlow = -actualWithdrawal;
            }
          }
        }

        if (monthlyTaxPercent > 0 && i % 30 === 0) {
          taxDeducted = currentCapital * (monthlyTaxPercent / 100);
          currentCapital -= taxDeducted;
        }

        newData.push({
          day: i,
          date: new Date(currentDate),
          capital: currentCapital,
          profit: dailyProfit,
          withdrawn: withdrawnToday,
          totalWithdrawn: withdrawnTotal,
          tax: taxDeducted,
          flow: regularFlow
        });
        
        if (targetReachedDay === -1 && currentCapital >= targetAmount) {
          targetReachedDay = i;
          setEstimatedTime(`${i} Days`);
          setTargetEndDate(format(currentDate, 'dd MMM yyyy'));
          setProjectedBalanceAtTarget(currentCapital);
        }

        milestoneTracker.forEach(m => {
          if (m.reachedDay === null && currentCapital >= m.amount) {
            m.reachedDay = i;
          }
        });

        currentDate = addDays(currentDate, 1);
      }
      
      if (JSON.stringify(milestoneTracker) !== JSON.stringify(customMilestones)) {
        setCustomMilestones(milestoneTracker);
      }
      
      if (targetReachedDay === -1) {
        setEstimatedTime('> Duration');
        setTargetEndDate('-');
        setProjectedBalanceAtTarget(0);
      }

    } else {
      // Wins Mode
      let targetReachedStep = -1;
      let consecutiveLosses = 0;
      for (let i = 1; i <= compoundSteps; i++) {
        let tradeAmount = currentCapital;
        let profit = 0;
        let reinvested = 0;
        let withdrawn = 0;

        if (useAdvancedWins) {
          const sessionMultiplier = marketSessionWins === 'Asian' ? 0.9 : marketSessionWins === 'London' ? 1.1 : marketSessionWins === 'Tokyo' ? 1.0 : 1.05;
          const adjustedBrokerPayout = brokerPayout * sessionMultiplier;
          
          profit = currentCapital * (adjustedBrokerPayout / 100);
          
          // Bad Streak Simulation
          let isWin = true;
          if (consecutiveLosses >= consecutiveLossLimit) {
            isWin = false;
          }

          if (isWin) {
            const currentReinvestPercent = currentCapital >= reinvestThresholdWins ? reinvestThresholdPercentWins : reinvestPercent;
            reinvested = profit * (currentReinvestPercent / 100);
            withdrawn = profit - reinvested;
            consecutiveLosses = 0;
          } else {
            reinvested = -currentCapital;
            consecutiveLosses++;
          }
          
          if (cashoutStep === i) {
            withdrawn = Math.max(withdrawn, Math.min(profit, startCapital));
            reinvested = profit - withdrawn;
          }
          
          currentCapital += reinvested - perTradeCommissionWins;
          
          // Stop Loss / Target Check
          if (stopLossAmountWins > 0 && currentCapital <= (startCapital - stopLossAmountWins)) break;
          if (targetAmountWins > 0 && currentCapital >= (startCapital + targetAmountWins)) break;
        } else {
          profit = currentCapital * (brokerPayout / 100);
          reinvested = profit * (reinvestPercent / 100);
          withdrawn = profit - reinvested;
          currentCapital += reinvested;
        }
        
        withdrawnTotal += withdrawn;
        profitTotal += profit;

        newData.push({
          step: i,
          capital: currentCapital,
          profit: profit,
          withdrawn: withdrawn,
          totalWithdrawn: withdrawnTotal,
          tradeAmount: tradeAmount
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
    setStartCapital(100);
    setReinvestPercent(95);
    setDailyGainPercent(3);
    setBrokerPayout(92);
    setCompoundSteps(5);
    setTargetAmount(1000);
    setDurationYears(0);
    setDurationMonths(1);
    setDurationDays(0);
    setActiveDays([false, true, true, true, true, true, false]);
    setRegularAmount(0);
    setWinRate(100);
    setAverageLoss(0);
    setUseTieredGain(false);
    setMonthlyTaxPercent(0);
    setCashoutStep(0);
    setWinsPerSession(3);
    setTotalBankroll(100);
    setMarketSession('London');
    setStopLossAmount(0);
    setTargetAmountDaily(0);
    setBadStreakLength(3);
    setPerTradeCommission(0);
    setReinvestThreshold(1000);
    setReinvestThresholdPercent(50);
    setUseAdvancedDaily(false);
    setMarketSessionWins('London');
    setStopLossAmountWins(0);
    setTargetAmountWins(0);
    setConsecutiveLossLimit(3);
    setPerTradeCommissionWins(0);
    setReinvestThresholdWins(1000);
    setReinvestThresholdPercentWins(50);
    setUseAdvancedWins(false);
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

  const getBreakdownData = () => {
    if (data.length <= 1) return [];
    
    // Skip the initial day 0
    const workingData = data.slice(1);
    
    if (mode === 'wins') {
      return workingData.map((row, index) => {
        const startCap = row.capital - (row.profit - row.withdrawn);
        const total = startCap + row.profit;
        const carryOver = total - row.withdrawn;
        
        const nextTarget = workingData[index + 1] ? workingData[index + 1].profit : carryOver * (brokerPayout / 100);
        
        const recoveryTrade = startCap / (brokerPayout / 100);
        const riskPercent = (startCap / totalBankroll) * 100;
        
        return {
          key: `Win ${row.step}`,
          label: `Win ${row.step}`,
          dateStr: '',
          startCapital: startCap,
          profit: row.profit,
          withdrawn: row.withdrawn,
          nextTarget: nextTarget,
          total: total,
          recoveryTrade: recoveryTrade,
          riskPercent: riskPercent
        };
      });
    }
    
    if (activeTab === 'Daily') {
      return workingData.map((row, index) => {
        const date = row.date ? new Date(row.date) : new Date();
        const startCap = row.capital - (row.profit - row.withdrawn) - (row.flow || 0) + (row.tax || 0);
        const total = startCap + row.profit + (row.flow || 0) - (row.tax || 0);
        const carryOver = total - row.withdrawn;
        
        let nextTarget = 0;
        for (let i = index + 1; i < workingData.length; i++) {
          if (workingData[i].profit > 0) {
            nextTarget = workingData[i].profit;
            break;
          }
        }
        if (nextTarget === 0) {
          nextTarget = carryOver * (dailyGainPercent / 100);
        }
        
        return {
          key: `Day ${row.day}`,
          label: `Day ${row.day}`,
          dateStr: isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy'),
          startCapital: startCap,
          profit: row.profit,
          withdrawn: row.withdrawn,
          nextTarget: nextTarget,
          total: total,
          tax: row.tax,
          flow: row.flow
        };
      });
    }
    
    const groupedData: any[] = [];
    let currentGroup: any = null;
    
    workingData.forEach((row, index) => {
      const date = row.date ? new Date(row.date) : new Date();
      const isValidDate = !isNaN(date.getTime());
      let groupKey = '';
      let groupLabel = '';
      let dateStr = '';
      
      if (activeTab === 'Weekly') {
        const weekNum = Math.floor(index / 7) + 1;
        groupKey = `Week ${weekNum}`;
        groupLabel = `Week ${weekNum}`;
        dateStr = isValidDate ? `${format(date, 'dd/MM/yyyy')} - ${format(addDays(date, 6), 'dd/MM/yyyy')}` : '-';
      } else if (activeTab === 'Monthly') {
        groupKey = isValidDate ? format(date, 'MM/yyyy') : `Month ${Math.floor(index / 30) + 1}`;
        groupLabel = isValidDate ? format(date, 'MMMM') : `Month ${Math.floor(index / 30) + 1}`;
        dateStr = isValidDate ? format(date, 'yyyy') : '-';
      } else if (activeTab === 'Yearly') {
        groupKey = isValidDate ? format(date, 'yyyy') : `Year ${Math.floor(index / 365) + 1}`;
        groupLabel = isValidDate ? `Year ${format(date, 'yyyy')}` : `Year ${Math.floor(index / 365) + 1}`;
        dateStr = '';
      }
      
      if (!currentGroup || currentGroup.key !== groupKey) {
        if (currentGroup) {
          groupedData.push(currentGroup);
        }
        currentGroup = {
          key: groupKey,
          label: groupLabel,
          dateStr: dateStr,
          startCapital: row.capital - (row.profit - row.withdrawn),
          endCapital: row.capital,
          profit: row.profit,
          withdrawn: row.withdrawn
        };
      } else {
        currentGroup.endCapital = row.capital;
        currentGroup.profit += row.profit;
        currentGroup.withdrawn += row.withdrawn;
      }
    });
    
    if (currentGroup) {
      groupedData.push(currentGroup);
    }
    
    return groupedData.map((group, index) => {
      const total = group.startCapital + group.profit;
      const carryOver = total - group.withdrawn;
      
      let nextTarget = groupedData[index + 1] ? groupedData[index + 1].profit : 0;
      if (nextTarget === 0) {
        // Estimate next group's profit based on current group's profit scaled by growth
        nextTarget = group.profit > 0 ? group.profit * (1 + (dailyGainPercent / 100)) : carryOver * (dailyGainPercent / 100);
      }
      
      return {
        ...group,
        total,
        nextTarget
      };
    });
  };

  const breakdownData = getBreakdownData();
  const displayData = showFullTable ? breakdownData : breakdownData.slice(0, 5);

  return (
    <div className="bg-[#0f172a] text-slate-300 p-4 font-sans selection:bg-emerald-500/30 rounded-2xl border border-slate-800">
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
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
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
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-medium">Start Capital</label>
                  {currentCapital !== undefined && (
                    <button 
                      onClick={() => setStartCapital(currentCapital)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded"
                      title="Sync with current balance"
                    >
                      <RefreshCw className="w-3 h-3" /> Sync
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
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
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number" 
                          min="0.5" max="100" step="0.1"
                          value={brokerPayout}
                          onChange={(e) => setBrokerPayout(Number(e.target.value))}
                          className="w-16 bg-[#0f172a] border border-slate-700 text-emerald-400 font-bold rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        />
                        <span className="text-emerald-400 font-bold">%</span>
                      </div>
                    </div>
                    <input 
                      type="range" min="0.5" max="100" step="0.1"
                      value={brokerPayout} onChange={e => setBrokerPayout(Number(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-200">Compound Steps (Consecutive Wins)</label>
                      <input 
                        type="number" 
                        min="1" max="50"
                        value={compoundSteps}
                        onChange={(e) => setCompoundSteps(Number(e.target.value))}
                        className="w-16 bg-[#0f172a] border border-slate-700 text-emerald-400 font-bold rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
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

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-slate-700/50">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-emerald-400" />
                  Advanced Settings
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-5 bg-[#0f172a]/50 p-4 rounded-xl border border-slate-700/30">
                  {mode === 'daily' ? (
                    <>
                      {/* Daily Advanced Features */}
                      <div className="space-y-4">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">SIP / Regular Flow</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input type="number" value={regularAmount} onChange={e => setRegularAmount(Number(e.target.value))} placeholder="Amount" className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          <select value={regularType} onChange={e => setRegularType(e.target.value as any)} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                            <option value="Deposit">Deposit</option>
                            <option value="Withdrawal">Withdraw</option>
                          </select>
                          <select value={regularFrequency} onChange={e => setRegularFrequency(e.target.value as any)} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Win Rate (%)</label>
                            <input type="number" min="1" max="100" value={winRate} onChange={e => setWinRate(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Avg Loss (%)</label>
                            <input type="number" min="0" max="100" value={averageLoss} onChange={e => setAverageLoss(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tiered Gain</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={useTieredGain} onChange={e => setUseTieredGain(e.target.checked)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                          {useTieredGain && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500">Threshold ({currencySymbol})</label>
                                <input type="number" value={tierThreshold} onChange={e => setTierThreshold(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500">New Gain (%)</label>
                                <input type="number" value={tierGainPercent} onChange={e => setTierGainPercent(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400">Monthly Tax / Fee (%)</label>
                          <input type="number" min="0" max="100" value={monthlyTaxPercent} onChange={e => setMonthlyTaxPercent(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>

                        {/* New 5 Daily Features UI */}
                        <div className="pt-4 border-t border-slate-700/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Advanced Smart Features</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={useAdvancedDaily} onChange={e => setUseAdvancedDaily(e.target.checked)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                          
                          <div className={`space-y-3 ${useAdvancedDaily ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Market Session</label>
                              <select value={marketSession} onChange={e => setMarketSession(e.target.value as any)} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                                <option value="Asian">Asian</option>
                                <option value="London">London</option>
                                <option value="NY">New York</option>
                                <option value="Tokyo">Tokyo</option>
                              </select>
                            </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Stop Loss ($)</label>
                              <input type="number" value={stopLossAmount} onChange={e => setStopLossAmount(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Target ($)</label>
                              <input type="number" value={targetAmountDaily} onChange={e => setTargetAmountDaily(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400">Bad Streak Length (Days)</label>
                            <input type="number" min="1" value={badStreakLength} onChange={e => setBadStreakLength(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400">Per-Trade Commission ($)</label>
                            <input type="number" value={perTradeCommission} onChange={e => setPerTradeCommission(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Reinvest Threshold ($)</label>
                              <input type="number" value={reinvestThreshold} onChange={e => setReinvestThreshold(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">New Reinvest %</label>
                              <input type="number" min="0" max="100" value={reinvestThresholdPercent} onChange={e => setReinvestThresholdPercent(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Wins Advanced Features */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400">Capital Protection (Cashout Step)</label>
                          <select value={cashoutStep} onChange={e => setCashoutStep(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                            <option value={0}>Disabled</option>
                            {Array.from({length: compoundSteps}, (_, i) => i + 1).map(step => (
                              <option key={step} value={step}>Cashout Initial Capital at Step {step}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Total Bankroll ({currencySymbol})</label>
                            <input type="number" value={totalBankroll} onChange={e => setTotalBankroll(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Wins per Session</label>
                            <input type="number" min="1" max="50" value={winsPerSession} onChange={e => setWinsPerSession(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                        </div>

                        {/* New 5 Wins Features UI */}
                        <div className="pt-4 border-t border-slate-700/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Advanced Smart Features</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={useAdvancedWins} onChange={e => setUseAdvancedWins(e.target.checked)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                          
                          <div className={`space-y-3 ${useAdvancedWins ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Market Session</label>
                              <select value={marketSessionWins} onChange={e => setMarketSessionWins(e.target.value as any)} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                                <option value="Asian">Asian</option>
                                <option value="London">London</option>
                                <option value="NY">New York</option>
                                <option value="Tokyo">Tokyo</option>
                              </select>
                            </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Stop Loss ($)</label>
                              <input type="number" value={stopLossAmountWins} onChange={e => setStopLossAmountWins(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Target ($)</label>
                              <input type="number" value={targetAmountWins} onChange={e => setTargetAmountWins(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400">Consecutive Loss Limit</label>
                            <input type="number" min="1" value={consecutiveLossLimit} onChange={e => setConsecutiveLossLimit(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400">Per-Trade Commission ($)</label>
                            <input type="number" value={perTradeCommissionWins} onChange={e => setPerTradeCommissionWins(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">Reinvest Threshold ($)</label>
                              <input type="number" value={reinvestThresholdWins} onChange={e => setReinvestThresholdWins(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-400">New Reinvest %</label>
                              <input type="number" min="0" max="100" value={reinvestThresholdPercentWins} onChange={e => setReinvestThresholdPercentWins(Number(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

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
                  <label className="text-xs text-slate-400 font-medium">Target Amount ({currencySymbol})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
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
                <span className="font-bold text-blue-400">{currencySymbol}{totalWithdrawn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Net Profit (Inc. Withdrawals)</span>
                <span className="font-bold text-emerald-400">+{currencySymbol}{netProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Gain</span>
                <span className="font-bold text-emerald-400">{totalGain.toFixed(2)}%</span>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Goal Progress</span>
                  <span className="text-slate-300">{currencySymbol}{activeBalance.toFixed(2)} / {currencySymbol}{targetAmount.toFixed(2)} <span className="text-amber-500 ml-1">{goalProgressPercent.toFixed(1)}%</span></span>
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
                  <span className="text-3xl font-bold text-white">{currencySymbol}{activeBalance.toFixed(2)}</span>
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
                <span className="text-amber-500 font-bold">{currencySymbol}{projectedBalanceAtTarget.toFixed(2)}</span>
              </div>

              {mode === 'wins' && (
                <div className="pt-4 border-t border-slate-700/50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Estimated Sessions (Days)</span>
                    <span className="text-emerald-400 font-medium">{Math.ceil(compoundSteps / winsPerSession)} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Safety Net (Attempts)</span>
                    <span className="text-blue-400 font-medium">{Math.floor(totalBankroll / startCapital)} Attempts</span>
                  </div>
                </div>
              )}

              {mode === 'daily' && (
                <div className="pt-4 border-t border-slate-700/50 space-y-2">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Milestone Tracker</div>
                  {customMilestones.map((m, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-[#1e293b] p-2 rounded-lg border border-slate-700/50">
                      <span className="text-slate-300">{currencySymbol}{m.amount.toLocaleString()}</span>
                      {m.reachedDay ? (
                        <span className="text-emerald-400">Reached Day {m.reachedDay}</span>
                      ) : (
                        <span className="text-slate-500">Not Reached</span>
                      )}
                      <button onClick={() => setCustomMilestones(customMilestones.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300 ml-2">×</button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="number" 
                      value={newMilestone} 
                      onChange={e => setNewMilestone(e.target.value)} 
                      placeholder="Add Milestone Amount" 
                      className="flex-1 bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button 
                      onClick={() => {
                        if (Number(newMilestone) > 0) {
                          setCustomMilestones([...customMilestones, { amount: Number(newMilestone), reachedDay: null }].sort((a, b) => a.amount - b.amount));
                          setNewMilestone('');
                        }
                      }}
                      className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
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

        {/* Data Table Card */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
          {mode === 'daily' && (
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
          )}
          
          <div className="p-0 overflow-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 z-10 text-xs text-slate-400 uppercase bg-[#0f172a] border-b border-slate-700/50">
                <tr>
                  <th 
                    className={cn("px-4 py-3 font-medium", mode === 'daily' && "cursor-pointer hover:text-white transition-colors")}
                    onClick={() => mode === 'daily' && setShowDateColumn(!showDateColumn)}
                    title={mode === 'daily' ? "Click to switch between Day and Date" : ""}
                  >
                    {mode === 'daily' ? (
                      <div className="flex items-center gap-1.5">
                        <span>{showDateColumn ? 'Date' : 'Day'}</span>
                        <RefreshCw className={cn("w-3 h-3 text-slate-500 transition-transform duration-300", showDateColumn && "rotate-180")} />
                      </div>
                    ) : 'Win'}
                  </th>
                  <th className="px-4 py-3 font-medium">Start Cap</th>
                  {mode === 'daily' && regularAmount > 0 && <th className="px-4 py-3 font-medium">Flow</th>}
                  <th className="px-4 py-3 font-medium">Profit</th>
                  {mode === 'daily' && monthlyTaxPercent > 0 && <th className="px-4 py-3 font-medium">Tax</th>}
                  <th className="px-4 py-3 font-medium">Cashout</th>
                  <th className="px-4 py-3 font-medium">Next Target</th>
                  {mode === 'wins' && <th className="px-4 py-3 font-medium">Recovery</th>}
                  {mode === 'wins' && <th className="px-4 py-3 font-medium">Risk %</th>}
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {displayData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {mode === 'daily' ? (
                          <span className="text-slate-300">
                            {showDateColumn && row.dateStr && row.dateStr !== '-' ? row.dateStr : row.label}
                          </span>
                        ) : (
                          <span className="text-slate-300">{row.label}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{currencySymbol}{row.startCapital.toFixed(2)}</td>
                    {mode === 'daily' && regularAmount > 0 && (
                      <td className={cn("px-4 py-3", row.flow > 0 ? "text-emerald-400" : row.flow < 0 ? "text-rose-400" : "text-slate-500")}>
                        {row.flow > 0 ? '+' : ''}{row.flow ? `${currencySymbol}${Math.abs(row.flow).toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-emerald-400">
                      {row.profit > 0 ? '+' : ''}{currencySymbol}{row.profit.toFixed(2)}
                    </td>
                    {mode === 'daily' && monthlyTaxPercent > 0 && (
                      <td className="px-4 py-3 text-rose-400">
                        {row.tax > 0 ? `-${currencySymbol}${row.tax.toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-blue-400">{currencySymbol}{row.withdrawn.toFixed(2)}</td>
                    <td className="px-4 py-3 text-amber-400">{currencySymbol}{row.nextTarget.toFixed(2)}</td>
                    {mode === 'wins' && (
                      <td className="px-4 py-3 text-rose-400">{currencySymbol}{row.recoveryTrade.toFixed(2)}</td>
                    )}
                    {mode === 'wins' && (
                      <td className={cn("px-4 py-3", row.riskPercent > 10 ? "text-rose-400 font-bold" : "text-slate-300")}>
                        {row.riskPercent.toFixed(1)}%
                      </td>
                    )}
                    <td className="px-4 py-3 text-white font-medium">{currencySymbol}{row.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              </table>
              {breakdownData.length > 5 && (
                <div className="p-3 text-center border-t border-slate-700/50">
                  <button 
                    onClick={() => setShowFullTable(!showFullTable)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {showFullTable ? "Show Less" : "View Full Table"}
                  </button>
                </div>
              )}
            </div>
        </div>

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
