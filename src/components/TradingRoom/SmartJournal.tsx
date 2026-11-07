import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BrainCircuit, 
  BarChart3, 
  Sparkles, 
  Camera, 
  Calendar, 
  Clock, 
  Award, 
  RotateCcw,
  Tag,
  Star,
  CheckSquare,
  FileSpreadsheet,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export interface JournalEntry {
  id: string;
  date: string;
  time: string;
  pair: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  payout: number;
  result: 'WIN' | 'LOSS' | 'BE';
  pnl: number;
  emotion: 'Disciplined' | 'Confident' | 'Calm' | 'Neutral' | 'Anxious' | 'FOMO/Revenge';
  setup: string;
  checklist: string[];
  mistakes: string[];
  rating: number; // 1-5
  notes: string;
  screenshotUrl?: string;
}

interface SmartJournalProps {
  trade?: any;
  trades?: any[];
  onSave?: (journal: any) => void;
}

const STORAGE_KEY = 'ololo_smart_trading_journal_v2';

const DEFAULT_SETUPS = [
  'Support / Resistance Retest',
  'Trend Continuation Pullback',
  '200 EMA Dynamic Rejection',
  'Bollinger Band Mean Reversion',
  'Paradox Compounding Step',
  'Fibonacci 61.8% Golden Zone',
  'Order Block / Supply Demand',
  'Breakout & Momentum',
  'Exhaustion Candle Pattern'
];

const PRE_TRADE_CHECKLIST_ITEMS = [
  'Trend alignment confirmed on higher timeframe',
  'Clear key level or rejection wick verified',
  'Candlestick pattern / volume confirmation present',
  'Followed strict position sizing (no over-leveraging)',
  'Zero revenge mindset - completely calm and disciplined',
  'Broker payout verified above 80%'
];

const COMMON_MISTAKES = [
  'Perfect Execution (No Mistake)',
  'FOMO Entry (Late Entry)',
  'Traded Against Major Trend',
  'Risked Too Much / Sizing Error',
  'Revenge Trade after Loss',
  'Ignored News / High Volatility',
  'Exited / Hesitated Early'
];

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: '14:32',
    pair: 'EUR/USD (OTC)',
    direction: 'CALL',
    amount: 100,
    payout: 92,
    result: 'WIN',
    pnl: 92,
    emotion: 'Disciplined',
    setup: 'Support / Resistance Retest',
    checklist: [
      'Trend alignment confirmed on higher timeframe',
      'Clear key level or rejection wick verified',
      'Followed strict position sizing (no over-leveraging)',
      'Zero revenge mindset - completely calm and disciplined'
    ],
    mistakes: ['Perfect Execution (No Mistake)'],
    rating: 5,
    notes: 'Clean bounce off major 15M demand zone. Waited for 5M rejection wick before execution. Target hit with zero stress.',
    screenshotUrl: ''
  },
  {
    id: 'entry-2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '18:15',
    pair: 'GBP/USD',
    direction: 'PUT',
    amount: 150,
    payout: 88,
    result: 'WIN',
    pnl: 132,
    emotion: 'Confident',
    setup: '200 EMA Dynamic Rejection',
    checklist: [
      'Trend alignment confirmed on higher timeframe',
      'Candlestick pattern / volume confirmation present',
      'Zero revenge mindset - completely calm and disciplined'
    ],
    mistakes: ['Perfect Execution (No Mistake)'],
    rating: 4,
    notes: 'Price hit 200 EMA with bearish engulfing pattern. Flawless downward impulse on 1M expiry.',
    screenshotUrl: ''
  },
  {
    id: 'entry-3',
    date: new Date().toISOString().split('T')[0],
    time: '10:45',
    pair: 'USD/JPY (OTC)',
    direction: 'CALL',
    amount: 100,
    payout: 90,
    result: 'LOSS',
    pnl: -100,
    emotion: 'FOMO/Revenge',
    setup: 'Breakout & Momentum',
    checklist: [
      'Followed strict position sizing (no over-leveraging)'
    ],
    mistakes: ['FOMO Entry (Late Entry)', 'Traded Against Major Trend'],
    rating: 2,
    notes: 'Entered after 4 big green candles without waiting for pullback. Reversal hit stop immediately. Lesson: NEVER chase the runaway candle!',
    screenshotUrl: ''
  }
];

export const SmartJournal: React.FC<SmartJournalProps> = ({ trade, trades = [], onSave }) => {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading smart journal entries:', e);
    }
    return INITIAL_ENTRIES;
  });

  const [activeTab, setActiveTab] = useState<'ENTRIES' | 'NEW' | 'ANALYTICS'>('ENTRIES');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [filterEmotion, setFilterEmotion] = useState<string>('ALL');
  const [filterSetup, setFilterSetup] = useState<string>('ALL');

  // Form State for New / Edit Entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pair, setPair] = useState('EUR/USD (OTC)');
  const [direction, setDirection] = useState<'CALL' | 'PUT'>('CALL');
  const [amount, setAmount] = useState<number>(trade?.recommendedAmount || trade?.amount || 100);
  const [payout, setPayout] = useState<number>(92);
  const [result, setResult] = useState<'WIN' | 'LOSS' | 'BE'>('WIN');
  const [emotion, setEmotion] = useState<'Disciplined' | 'Confident' | 'Calm' | 'Neutral' | 'Anxious' | 'FOMO/Revenge'>('Disciplined');
  const [setup, setSetup] = useState<string>('Support / Resistance Retest');
  const [checklist, setChecklist] = useState<string[]>([...PRE_TRADE_CHECKLIST_ITEMS]);
  const [mistakes, setMistakes] = useState<string[]>(['Perfect Execution (No Mistake)']);
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState<string>(trade?.journal?.notes || '');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Save entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving smart journal:', e);
    }
  }, [entries]);

  // Pre-fill from trade prop if supplied
  useEffect(() => {
    if (trade && trade.id) {
      if (trade.customAmount && !isNaN(Number(trade.customAmount))) {
        setAmount(Number(trade.customAmount));
      }
      if (trade.result === 'W') setResult('WIN');
      else if (trade.result === 'L') setResult('LOSS');
      if (trade.journal) {
        if (trade.journal.notes) setNotes(trade.journal.notes);
        if (trade.journal.setup) setSetup(trade.journal.setup);
      }
    }
  }, [trade]);

  const toggleChecklistItem = (item: string) => {
    setChecklist(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleMistakeItem = (item: string) => {
    setMistakes(prev => {
      if (item === 'Perfect Execution (No Mistake)') {
        return ['Perfect Execution (No Mistake)'];
      }
      const filtered = prev.filter(i => i !== 'Perfect Execution (No Mistake)');
      return filtered.includes(item) ? filtered.filter(i => i !== item) : [...filtered, item];
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setPair('EUR/USD (OTC)');
    setDirection('CALL');
    setAmount(100);
    setPayout(92);
    setResult('WIN');
    setEmotion('Disciplined');
    setSetup('Support / Resistance Retest');
    setChecklist([...PRE_TRADE_CHECKLIST_ITEMS]);
    setMistakes(['Perfect Execution (No Mistake)']);
    setRating(5);
    setNotes('');
    setScreenshotUrl('');
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedPnl = result === 'WIN' 
      ? amount * (payout / 100) 
      : result === 'LOSS' 
        ? -amount 
        : 0;

    const entryData: JournalEntry = {
      id: editingId || `entry-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pair: pair.trim() || 'Custom Asset',
      direction,
      amount: Number(amount) || 0,
      payout: Number(payout) || 92,
      result,
      pnl: calculatedPnl,
      emotion,
      setup,
      checklist,
      mistakes: mistakes.length > 0 ? mistakes : ['Perfect Execution (No Mistake)'],
      rating,
      notes: notes.trim(),
      screenshotUrl: screenshotUrl.trim()
    };

    if (editingId) {
      setEntries(prev => prev.map(item => item.id === editingId ? entryData : item));
    } else {
      setEntries(prev => [entryData, ...prev]);
    }

    if (onSave) {
      onSave(entryData);
    }

    resetForm();
    setActiveTab('ENTRIES');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setPair(entry.pair);
    setDirection(entry.direction);
    setAmount(entry.amount);
    setPayout(entry.payout);
    setResult(entry.result);
    setEmotion(entry.emotion);
    setSetup(entry.setup);
    setChecklist(entry.checklist || []);
    setMistakes(entry.mistakes || []);
    setRating(entry.rating || 5);
    setNotes(entry.notes || '');
    setScreenshotUrl(entry.screenshotUrl || '');
    setActiveTab('NEW');
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (entries.length === 0) return;
    const headers = ['ID', 'Date', 'Time', 'Pair', 'Direction', 'Amount', 'Payout%', 'Result', 'PnL', 'Emotion', 'Setup', 'Rating', 'Mistakes', 'Notes'];
    const rows = entries.map(e => [
      e.id,
      e.date,
      e.time,
      e.pair,
      e.direction,
      e.amount,
      e.payout,
      e.result,
      e.pnl,
      e.emotion,
      `"${e.setup}"`,
      e.rating,
      `"${(e.mistakes || []).join('; ')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Smart_Trading_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      const matchesSearch = 
        item.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.setup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesResult = filterResult === 'ALL' || item.result === filterResult;
      const matchesEmotion = filterEmotion === 'ALL' || item.emotion === filterEmotion;
      const matchesSetup = filterSetup === 'ALL' || item.setup === filterSetup;

      return matchesSearch && matchesResult && matchesEmotion && matchesSetup;
    });
  }, [entries, searchQuery, filterResult, filterEmotion, filterSetup]);

  // Analytics Computation
  const stats = useMemo(() => {
    const total = entries.length;
    if (total === 0) {
      return {
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        netPnl: 0,
        disciplinedRate: 0,
        avgRating: 0,
        emotionBreakdown: {},
        setupBreakdown: {},
        mistakesCount: {}
      };
    }

    let wins = 0;
    let losses = 0;
    let netPnl = 0;
    let totalRating = 0;
    let disciplinedCount = 0;

    const emotionMap: Record<string, { total: number; wins: number }> = {};
    const setupMap: Record<string, { total: number; wins: number; pnl: number }> = {};
    const mistakeMap: Record<string, number> = {};

    entries.forEach(e => {
      if (e.result === 'WIN') wins++;
      if (e.result === 'LOSS') losses++;
      netPnl += e.pnl || 0;
      totalRating += e.rating || 5;

      if (e.emotion === 'Disciplined' || e.emotion === 'Calm') {
        disciplinedCount++;
      }

      // Emotion stats
      if (!emotionMap[e.emotion]) emotionMap[e.emotion] = { total: 0, wins: 0 };
      emotionMap[e.emotion].total++;
      if (e.result === 'WIN') emotionMap[e.emotion].wins++;

      // Setup stats
      if (!setupMap[e.setup]) setupMap[e.setup] = { total: 0, wins: 0, pnl: 0 };
      setupMap[e.setup].total++;
      setupMap[e.setup].pnl += e.pnl || 0;
      if (e.result === 'WIN') setupMap[e.setup].wins++;

      // Mistakes count
      (e.mistakes || []).forEach(m => {
        if (m !== 'Perfect Execution (No Mistake)') {
          mistakeMap[m] = (mistakeMap[m] || 0) + 1;
        }
      });
    });

    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const disciplinedRate = total > 0 ? (disciplinedCount / total) * 100 : 0;
    const avgRating = total > 0 ? totalRating / total : 5;

    return {
      total,
      wins,
      losses,
      winRate,
      netPnl,
      disciplinedRate,
      avgRating,
      emotionBreakdown: emotionMap,
      setupBreakdown: setupMap,
      mistakesCount: mistakeMap
    };
  }, [entries]);

  return (
    <div className="flex flex-col h-full space-y-5 text-slate-100">
      
      {/* TOP HUD BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Total Logged
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {stats.total} <span className="text-xs text-slate-500 font-normal">trades</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Win Rate
          </span>
          <div className={`text-2xl font-black font-mono mt-1 ${stats.winRate >= 60 ? 'text-emerald-400' : stats.winRate >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
            {stats.winRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-400" /> Net Journal PnL
          </span>
          <div className={`text-2xl font-black font-mono mt-1 ${stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" /> Discipline Rate
          </span>
          <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
            {stats.disciplinedRate.toFixed(0)}%
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Execution Score
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1 flex items-baseline gap-1">
            {stats.avgRating.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 5</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-lg flex flex-col justify-center gap-2">
          <button
            onClick={() => { resetForm(); setActiveTab('NEW'); }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Log Trade
          </button>
          <button
            onClick={exportToCSV}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-3 rounded-lg text-[10px] font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS (COMPACT & RESPONSIVE) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('ENTRIES')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ENTRIES' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Entries ({filteredEntries.length})</span>
          </button>
          <button
            onClick={() => { if (!editingId) resetForm(); setActiveTab('NEW'); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'NEW' 
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{editingId ? 'Edit Entry' : 'New Entry'}</span>
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ANALYTICS' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Psychology & Setups</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Active</span>
        </div>
      </div>

      {/* TAB 1: JOURNAL ENTRIES LIST */}
      {activeTab === 'ENTRIES' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-wrap gap-2.5 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by pair, setup, or notes..."
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="ALL">All Results (W/L)</option>
                <option value="WIN">Wins Only</option>
                <option value="LOSS">Losses Only</option>
                <option value="BE">Breakeven</option>
              </select>

              <select
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value)}
                className="bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="ALL">All Emotions</option>
                <option value="Disciplined">🧠 Disciplined</option>
                <option value="Confident">🚀 Confident</option>
                <option value="Calm">🧘 Calm</option>
                <option value="Neutral">😐 Neutral</option>
                <option value="Anxious">😰 Anxious</option>
                <option value="FOMO/Revenge">😡 FOMO / Revenge</option>
              </select>

              <select
                value={filterSetup}
                onChange={(e) => setFilterSetup(e.target.value)}
                className="bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 max-w-[180px]"
              >
                <option value="ALL">All Setups</option>
                {DEFAULT_SETUPS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {(searchQuery || filterResult !== 'ALL' || filterEmotion !== 'ALL' || filterSetup !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterResult('ALL');
                    setFilterEmotion('ALL');
                    setFilterSetup('ALL');
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ENTRIES GRID / LIST */}
          {filteredEntries.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600" />
              <div className="text-base font-bold text-slate-300">No Journal Entries Found</div>
              <p className="text-xs text-slate-500 max-w-sm">
                No trades match your search criteria. Log your first trade reflection or clear your filters to see entries.
              </p>
              <button
                onClick={() => { resetForm(); setActiveTab('NEW'); }}
                className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
              >
                + Log New Trade Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={`bg-slate-900/70 border rounded-xl p-4 transition-all hover:border-slate-700 hover:shadow-xl relative overflow-hidden ${
                    entry.result === 'WIN' 
                      ? 'border-emerald-500/20 hover:border-emerald-500/40' 
                      : entry.result === 'LOSS' 
                        ? 'border-rose-500/20 hover:border-rose-500/40' 
                        : 'border-slate-800'
                  }`}
                >
                  {/* Left Accent Stripe */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    entry.result === 'WIN' ? 'bg-emerald-500' : entry.result === 'LOSS' ? 'bg-rose-500' : 'bg-slate-600'
                  }`} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                        entry.result === 'WIN' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : entry.result === 'LOSS'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700 text-slate-300'
                      }`}>
                        {entry.result}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        entry.direction === 'CALL' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/30' 
                          : 'bg-rose-950 text-rose-400 border border-rose-600/30'
                      }`}>
                        {entry.direction}
                      </span>

                      <span className="font-bold text-white text-sm font-mono">
                        {entry.pair}
                      </span>

                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {entry.date} {entry.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Trade PnL</div>
                        <div className={`text-sm font-bold font-mono ${entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Edit Entry"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 pl-2">
                    
                    {/* Setup & Psychology */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Strategy Setup</div>
                      <div className="text-xs font-semibold text-slate-200 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                        {entry.setup}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Mindset:</span>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {entry.emotion}
                        </span>
                      </div>
                    </div>

                    {/* Mistakes & Rating */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Mistakes & Discipline</div>
                      <div className="flex flex-wrap gap-1">
                        {entry.mistakes && entry.mistakes.map(m => (
                          <span 
                            key={m} 
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              m === 'Perfect Execution (No Mistake)' 
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Execution:</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < (entry.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Notes / Reflections */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                        <span>Notes & Reflections</span>
                        {entry.screenshotUrl && (
                          <button
                            onClick={() => setPreviewImage(entry.screenshotUrl || null)}
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3" /> View Chart
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 italic line-clamp-3">
                        "{entry.notes || 'No detailed observations recorded.'}"
                      </p>
                    </div>
                  </div>

                  {/* Checklist Chips */}
                  {entry.checklist && entry.checklist.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/50 flex flex-wrap items-center gap-1.5 pl-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500 mr-1">Checklist Followed:</span>
                      {entry.checklist.map((c, i) => (
                        <span key={i} className="text-[9px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEW / EDIT JOURNAL ENTRY FORM */}
      {activeTab === 'NEW' && (
        <form onSubmit={handleSaveEntry} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-white text-base">
                  {editingId ? 'Edit Trade Journal Entry' : 'Log New Trade & Psychological Review'}
                </h3>
                <p className="text-xs text-slate-400">Document your strategy, mindset, and learnings to build consistency.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { resetForm(); setActiveTab('ENTRIES'); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* COLUMN 1: TRADE DETAILS */}
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> 1. Trade Parameters
              </h4>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Asset / Currency Pair</label>
                <input
                  type="text"
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  placeholder="e.g. EUR/USD (OTC)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
                  {['EUR/USD (OTC)', 'GBP/USD', 'USD/INR (OTC)', 'BTC/USD', 'AUD/CAD'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPair(p)}
                      className="text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Direction</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDirection('CALL')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                        direction === 'CALL' 
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      CALL ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('PUT')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                        direction === 'PUT' 
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20' 
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      PUT ▼
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Result</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['WIN', 'LOSS', 'BE'] as const).map(res => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => setResult(res)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                          result === res 
                            ? res === 'WIN' 
                              ? 'bg-emerald-500 text-white border-emerald-400' 
                              : res === 'LOSS' 
                                ? 'bg-rose-500 text-white border-rose-400' 
                                : 'bg-slate-600 text-white border-slate-500'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Trade Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Broker Payout (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={payout}
                    onChange={(e) => setPayout(Number(e.target.value) || 92)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Calculated PnL:</span>
                <span className={`font-mono font-bold text-sm ${result === 'WIN' ? 'text-emerald-400' : result === 'LOSS' ? 'text-rose-400' : 'text-slate-300'}`}>
                  {result === 'WIN' ? `+$${(amount * (payout / 100)).toFixed(2)}` : result === 'LOSS' ? `-$${amount.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>

            {/* COLUMN 2: STRATEGY & PSYCHOLOGY */}
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" /> 2. Strategy & Mindset
              </h4>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Strategy Setup</label>
                <select
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {DEFAULT_SETUPS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Custom Technical Setup">Custom Technical Setup</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Psychological State</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Disciplined', label: '🧠 Disciplined', desc: 'Followed all rules' },
                    { id: 'Confident', label: '🚀 Confident', desc: 'A+ high conviction' },
                    { id: 'Calm', label: '🧘 Calm', desc: 'Patient & relaxed' },
                    { id: 'Neutral', label: '😐 Neutral', desc: 'Standard execution' },
                    { id: 'Anxious', label: '😰 Anxious', desc: 'Hesitant or stressed' },
                    { id: 'FOMO/Revenge', label: '😡 FOMO/Revenge', desc: 'Chased market' },
                  ].map(({ id, label, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEmotion(id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        emotion === id 
                          ? 'bg-purple-500/20 border-purple-500/50 shadow-md text-white' 
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-[9px] text-slate-500">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Execution Quality Rating</label>
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-400 ml-auto">
                    {rating === 5 ? 'Flawless (A+)' : rating === 4 ? 'Good (B)' : rating === 3 ? 'Average (C)' : rating === 2 ? 'Subpar (D)' : 'Poor (F)'}
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMN 3: CHECKLIST & MISTAKES */}
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> 3. Discipline Verification
                </h4>
                <button
                  type="button"
                  onClick={() => setChecklist([...PRE_TRADE_CHECKLIST_ITEMS])}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Select All
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                {PRE_TRADE_CHECKLIST_ITEMS.map((item) => {
                  const checked = checklist.includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => toggleChecklistItem(item)}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        checked 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-200' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded mt-0.5 flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                        checked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600 bg-slate-800'
                      }`}>
                        {checked ? '✓' : ''}
                      </div>
                      <span className="text-[11px] leading-tight">{item}</span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Key Mistakes / Friction Points</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_MISTAKES.map((item) => {
                    const selected = mistakes.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleMistakeItem(item)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                          selected
                            ? item === 'Perfect Execution (No Mistake)'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ROW: NOTES & SCREENSHOT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 block">
                Session Reflections, Technical Notes & Market Dynamics
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write specific observations: Candlestick reactions, liquidity sweeps, broker behavior, lessons for future setups..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 custom-scrollbar resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">
                Chart Screenshot / Proof (Optional)
              </label>
              <div className="border border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-4 bg-slate-950/60 text-center flex flex-col items-center justify-center gap-2">
                {screenshotUrl ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-700 group">
                    <img src={screenshotUrl} alt="Chart preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setScreenshotUrl('')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-500" />
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700 transition-colors">
                      Upload Chart Screenshot
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] text-slate-500">PNG, JPG or WebP</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PSYCHOLOGY & SETUPS ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Emotion Performance Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">Psychological State vs Win Rate</h4>
                </div>
                <span className="text-xs text-slate-500 font-mono">Mindset Analytics</span>
              </div>

              <div className="space-y-3">
                {Object.keys(stats.emotionBreakdown).length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-8">Log trades with emotion tags to view breakdown.</div>
                ) : (
                  Object.entries(stats.emotionBreakdown).map(([emo, data]: [string, any]) => {
                    const wr = data.total > 0 ? (data.wins / data.total) * 100 : 0;
                    return (
                      <div key={emo} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-300">{emo}</span>
                          <span className="text-slate-400 font-mono">{data.wins}W / {data.total} Trades ({wr.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              wr >= 60 ? 'bg-emerald-500' : wr >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${wr}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Setups Performance Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">Strategy Setup Win Rates & PnL</h4>
                </div>
                <span className="text-xs text-slate-500 font-mono">Strategy Analytics</span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {Object.keys(stats.setupBreakdown).length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-8">No setup data logged yet.</div>
                ) : (
                  Object.entries(stats.setupBreakdown).map(([setupName, data]: [string, any]) => {
                    const wr = data.total > 0 ? (data.wins / data.total) * 100 : 0;
                    return (
                      <div key={setupName} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white">{setupName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {data.wins} Wins out of {data.total} trades ({wr.toFixed(0)}% Win Rate)
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-xs font-mono font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Repeating Mistakes Heatmap */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Recurring Friction & Mistakes Analysis
            </h4>
            <p className="text-xs text-slate-400">Identify which bad habits cost you the most capital over time.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {Object.keys(stats.mistakesCount).length === 0 ? (
                <div className="col-span-3 text-xs text-emerald-400/80 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                  Zero repeating mistakes logged! Pure discipline.
                </div>
              ) : (
                Object.entries(stats.mistakesCount).map(([mistake, count]) => (
                  <div key={mistake} className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-rose-200 font-medium">{mistake}</span>
                    <span className="text-xs font-mono font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                      {count}x
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT PREVIEW MODAL */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Chart Full View" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-slate-900/80 text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
