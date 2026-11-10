import React, { useState } from "react";
import { Clock, LogOut, MessageCircle, KeyRound, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { SupportModal } from "./SupportModal";
import { validateLicenseCode, verifyLicenseKeyOnline, saveActiveSession } from "../lib/licenseEngine";
import { openTelegramSupport, openSaifyKhanTelegram } from "../lib/telegram";

interface PendingApprovalScreenProps {
  user?: any;
  onActivated?: (user: any) => void;
  onLogout?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  onActivated,
  onLogout,
}) => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [keyCode, setKeyCode] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const selectedPlan = typeof window !== 'undefined' ? (localStorage.getItem('atm_selected_plan') || '') : '';

  const handleActivateWithKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);
    const clean = keyCode.trim().toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '');

    if (clean.length !== 7) {
      setActivationError("Please enter your full 7-character Access Key.");
      return;
    }

    if (['C3XU78M', '9B2X74M', 'XXXXXXX', '1234567', '0000000', 'TESTKEY'].includes(clean)) {
      setActivationError("❌ Invalid Key: Example codes cannot be used. Please contact Master Admin to receive your official 7-digit access key.");
      return;
    }

    setIsActivating(true);
    try {
      const res = await verifyLicenseKeyOnline(`ATM-${clean}`);
      if (!res.valid || !res.license) {
        setActivationError(res.reason || "Invalid Access Key. Please contact Master Admin.");
        return;
      }

      saveActiveSession(res.license);
      const activatedUser = {
        ...(user || {}),
        uid: user?.uid || 'lic-' + res.license.cleanKey,
        name: res.license.traderName || user?.name || 'Trader Member',
        status: 'active',
        isLifetimePaid: res.license.plan.includes('Lifetime'),
        plan: res.license.plan,
        expiresAt: res.license.expiresAt,
        subscriptionEndDate: res.license.expiresAt ? new Date(res.license.expiresAt).toISOString() : null,
        activeCryptoKey: res.license.key,
      };

      try {
        localStorage.setItem("mock_dbUser", JSON.stringify(activatedUser));
        localStorage.setItem("aladdin_in_app", "true");
      } catch {}

      if (onActivated) {
        onActivated(activatedUser);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setActivationError(err.message || "Failed to activate license.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        localStorage.removeItem("mock_dbUser");
        localStorage.removeItem("mock_firebaseUser");
        localStorage.removeItem("atm_auth_token");
        localStorage.removeItem("aladdin_in_app");
      } catch {}
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#05070e] flex flex-col items-center justify-center p-4 selection:bg-amber-500/30">
      <div className="w-full max-w-md p-6 sm:p-8 bg-[#0b1325]/95 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
        
        {/* Animated Status Icon */}
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
          <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mb-1">
          Pending Master Approval
        </h2>
        <p className="text-slate-400 text-xs mb-4 leading-relaxed">
          Welcome <span className="text-amber-300 font-semibold">{user?.name || user?.email || "Trader"}</span>! Your account application has been received by the desk.
        </p>

        {selectedPlan && (
          <div className="mb-4 p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-between">
            <span>Requested Access:</span>
            <span className="font-bold text-white font-mono">{selectedPlan}</span>
          </div>
        )}

        {/* 7-Digit Access Code Terminal */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 text-left">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-cyan-300">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>Already have your 7-Digit Key?</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            If Master Admin has already issued your VIP key, enter it below to unlock the software immediately:
          </p>

          <form onSubmit={handleActivateWithKey} className="space-y-2.5">
            <div className="relative">
              <input
                type="text"
                maxLength={7}
                placeholder="e.g. 7-Digit Key"
                value={keyCode}
                onChange={(e) => {
                  setKeyCode(e.target.value.toUpperCase());
                  if (activationError) setActivationError(null);
                }}
                className="w-full bg-slate-900 border border-cyan-500/40 focus:border-cyan-400 text-cyan-300 font-mono tracking-widest text-center py-2.5 px-3 rounded-xl text-sm font-bold uppercase outline-none transition-colors placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
              />
            </div>

            {activationError && (
              <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{activationError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivating || !keyCode.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Unlock VIP Platform Now
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => openTelegramSupport(user?.name ? `Hello Master Admin, I am ${user.name}. My account application is pending activation. Please verify and issue my key.` : "Hello Master Admin, my account application is pending activation. Please verify and issue my key.")}
            className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Desk on Aladdin AI Support
          </button>

          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold text-xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Submit Fast Verification Ticket
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 w-full transition-colors py-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout for now
          </button>
        </div>
      </div>

      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
        defaultMessage={selectedPlan ? `Hello Master Admin, I have registered my account for ${selectedPlan}. Please review my application and issue my 7-digit key.` : "Hello Master Admin, I have registered my account. Please review my application and issue my 7-digit key."}
      />
    </div>
  );
};
