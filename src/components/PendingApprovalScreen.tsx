import React, { useState } from "react";
import { Clock, LogOut, MessageCircle } from "lucide-react";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { SupportModal } from "./SupportModal";

export const PendingApprovalScreen = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const selectedPlan = typeof window !== 'undefined' ? (localStorage.getItem('atm_selected_plan') || '') : '';

  const logout = async () => {
    try { await signOut(auth); } catch (e) {}
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
        
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          Pending Approval
        </h2>
        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
          Your account has been created successfully, but it is currently waiting for <strong className="text-white">Admin Approval</strong>.
        </p>

        {selectedPlan && (
          <div className="mb-5 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-between">
            <span>Selected Plan:</span>
            <span className="font-bold text-white font-mono">{selectedPlan}</span>
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-500">
            Once the admin activates your account, you will be able to access the ALADDIN TRADE MANAGER. Please check back later.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support for Fast Activation
          </button>

          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 w-full transition-colors py-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout for now
          </button>
        </div>
      </div>

      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
        defaultMessage={selectedPlan ? `Hello, I have registered my account for ${selectedPlan}. Please activate my license key.` : "Hello, I have registered my account. Please activate my license key."}
      />
    </div>
  );
};
