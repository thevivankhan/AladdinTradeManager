import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, LogOut, MessageCircle, Clock } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { SupportModal } from './SupportModal';

interface PaywallScreenProps {
  onPaymentSubmitted?: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onPaymentSubmitted }) => {
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) return;
    setSubmitting(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          hasPendingPayment: true,
          transactionId: transactionId.trim(),
          paymentSubmittedAt: new Date().toISOString(),
        });
      }
      if (onPaymentSubmitted) onPaymentSubmitted();
    } catch (err) {
      console.error('Payment submit error:', err);
      // Fallback for mock/local
      if (onPaymentSubmitted) onPaymentSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem('mock_dbUser');
    localStorage.removeItem('mock_firebaseUser');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
          <CreditCard className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Activate Subscription</h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          Upgrade to ALADDIN TRADE MANAGER to access elite automated risk tools, compounding plans, and bias analysis.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Payment Reference / UTR / TxID
            </label>
            <input
              type="text"
              required
              placeholder="Enter Transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Verifying...' : 'Submit Payment for Verification'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Contact Support
          </button>
          <button
            onClick={logout}
            className="hover:text-rose-400 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </div>

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultMessage="Hello, I need help with my payment activation."
      />
    </div>
  );
};

export const PendingScreen: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const logout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem('mock_dbUser');
    localStorage.removeItem('mock_firebaseUser');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
          <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Verification In Progress</h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          Your payment receipt has been submitted and is currently being verified by admin. You will gain access as soon as approved.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" /> Check Status with Support
          </button>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
          >
            Log Out for now
          </button>
        </div>
      </div>

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultMessage="My payment is pending verification. Can you please check?"
      />
    </div>
  );
};
