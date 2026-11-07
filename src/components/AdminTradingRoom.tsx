import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Trash2, Plus, Edit2, Check, X } from 'lucide-react';

import { SlowButSureStrategy } from './TradingRoom/SlowButSureStrategy';
import { ParadoxStrategy } from './TradingRoom/ParadoxStrategy';

export const AdminTradingRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signals' | 'bias' | 'strategies'>('signals');

  // Signal State
  const [signals, setSignals] = useState<any[]>([]);
  const [newSignal, setNewSignal] = useState({ asset: '', entry: '', sl: '', tp: '', expiry: '', status: 'active', imageUrl: '' });
  const [isSubmittingSignal, setIsSubmittingSignal] = useState(false);

  // Bias State
  const [biases, setBiases] = useState<any[]>([]);
  const [newBias, setNewBias] = useState({ pair: '', bias: 'bullish', newsTime: '', impact: 'medium' });
  const [isSubmittingBias, setIsSubmittingBias] = useState(false);

  useEffect(() => {
    import('../lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
        const unsubscribeSignals = onSnapshot(
          query(collection(db, 'signals'), orderBy('createdAt', 'desc')), 
          (snap) => {
            setSignals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => {
            console.warn("Signals listener error safely caught:", err.message);
          }
        );
        const unsubscribeBiases = onSnapshot(
          query(collection(db, 'market_bias'), orderBy('createdAt', 'desc')), 
          (snap) => {
            setBiases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => {
            console.warn("Market bias listener error safely caught:", err.message);
          }
        );
        return () => {
          unsubscribeSignals();
          unsubscribeBiases();
        };
      });
    });
  }, []);

  const handleAddSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignal.asset || !newSignal.entry || !newSignal.sl || !newSignal.tp) return alert("Please fill required fields.");
    setIsSubmittingSignal(true);
    try {
      const { db } = await import('../lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'signals'), { ...newSignal, createdAt: new Date().toISOString() });
      setNewSignal({ asset: '', entry: '', sl: '', tp: '', expiry: '', status: 'active', imageUrl: '' });
      alert("Signal posted successfully!");
    } catch (e) {
      alert("Error posting signal");
    } finally {
      setIsSubmittingSignal(false);
    }
  };

  const handleUpdateSignalStatus = async (id: string, status: string) => {
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'signals', id), { status });
    } catch (e) {}
  };

  const handleDeleteSignal = async (id: string) => {
    if (!window.confirm("Delete this signal?")) return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'signals', id));
    } catch (e) {}
  };

  const handleAddBias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBias.pair) return alert("Please enter a pair.");
    setIsSubmittingBias(true);
    try {
      const { db } = await import('../lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'market_bias'), { ...newBias, createdAt: new Date().toISOString() });
      setNewBias({ pair: '', bias: 'bullish', newsTime: '', impact: 'medium' });
      alert("Market Bias posted successfully!");
    } catch (e) {} finally {
      setIsSubmittingBias(false);
    }
  };

  const handleDeleteBias = async (id: string) => {
    if (!window.confirm("Delete this market bias?")) return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'market_bias', id));
    } catch (e) {}
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('signals')}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'signals' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Live Signals
        </button>
        <button
          onClick={() => setActiveTab('bias')}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'bias' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Market Bias & News
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'strategies' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Strategies
        </button>
      </div>

      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-md font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Post New Signal
            </h3>
            <form onSubmit={handleAddSignal} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Asset Pair (e.g. XAUUSD)</label>
                <input type="text" value={newSignal.asset} onChange={e => setNewSignal({...newSignal, asset: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Entry Price</label>
                <input type="text" value={newSignal.entry} onChange={e => setNewSignal({...newSignal, entry: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Stop Loss (SL)</label>
                <input type="text" value={newSignal.sl} onChange={e => setNewSignal({...newSignal, sl: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Take Profit (TP)</label>
                <input type="text" value={newSignal.tp} onChange={e => setNewSignal({...newSignal, tp: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Expiry (Optional)</label>
                <input type="text" value={newSignal.expiry} onChange={e => setNewSignal({...newSignal, expiry: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Image URL (Optional)</label>
                <input type="url" value={newSignal.imageUrl} onChange={e => setNewSignal({...newSignal, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={isSubmittingSignal} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                  {isSubmittingSignal ? 'Posting...' : 'Post Signal to Trading Room'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <h3 className="text-md font-bold text-white p-3 border-b border-slate-700">Manage Signals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2">Asset</th>
                    <th className="p-2">Entry</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {signals.map(signal => (
                    <tr key={signal.id} className="hover:bg-slate-700/30">
                      <td className="p-2 font-bold text-white">{signal.asset}</td>
                      <td className="p-2 font-mono text-slate-300">{signal.entry}</td>
                      <td className="p-2">
                        <select 
                          value={signal.status} 
                          onChange={(e) => handleUpdateSignalStatus(signal.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] font-bold uppercase"
                        >
                          <option value="active">Active</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <button onClick={() => handleDeleteSignal(signal.id)} className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bias' && (
        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-md font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Post Daily Bias & News
            </h3>
            <form onSubmit={handleAddBias} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Asset Pair (e.g. EURUSD)</label>
                <input type="text" value={newBias.pair} onChange={e => setNewBias({...newBias, pair: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">Market Bias</label>
                <select value={newBias.bias} onChange={e => setNewBias({...newBias, bias: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white">
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">News Time (Optional)</label>
                <input type="text" placeholder="e.g. 14:30 EST" value={newBias.newsTime} onChange={e => setNewBias({...newBias, newsTime: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-0.5">News Impact (Optional)</label>
                <select value={newBias.impact} onChange={e => setNewBias({...newBias, impact: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={isSubmittingBias} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                  {isSubmittingBias ? 'Posting...' : 'Post Bias to Trading Room'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <h3 className="text-md font-bold text-white p-3 border-b border-slate-700">Manage Biases</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2">Pair</th>
                    <th className="p-2">Bias</th>
                    <th className="p-2">News Time</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {biases.map(bias => (
                    <tr key={bias.id} className="hover:bg-slate-700/30">
                      <td className="p-2 font-bold text-white">{bias.pair}</td>
                      <td className="p-2 uppercase text-[10px] font-bold">{bias.bias}</td>
                      <td className="p-2 font-mono text-slate-300">{bias.newsTime || '-'}</td>
                      <td className="p-2">
                        <button onClick={() => handleDeleteBias(bias.id)} className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'strategies' && (
        <div className="space-y-4">
          <SlowButSureStrategy />
          <ParadoxStrategy />
        </div>
      )}
    </div>
  );
};
