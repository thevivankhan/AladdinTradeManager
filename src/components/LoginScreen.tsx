import React, { useState } from "react";
import { 
  Key, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, 
  AlertCircle, MessageCircle, ChevronLeft, Check, Clock, Sparkles, Send
} from "lucide-react";
import { 
  MASTER_ADMIN_EMAILS, 
  validateLicenseCode, 
  getClientDeviceId,
  submitStudentApplication 
} from "../lib/licenseEngine";
import { openTelegramSupport } from "../lib/telegram";

interface LoginScreenProps {
  onLogin: (user: any, dbUser: any) => void;
  authError?: string | null;
  setAuthError?: (error: string | null) => void;
  onBack?: () => void;
  initialMode?: "login" | "signup";
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  authError,
  setAuthError,
  onBack,
  initialMode = "login",
}) => {
  const [activeTab, setActiveTab] = useState<"key" | "signup" | "password">(
    initialMode === "signup" ? "signup" : "key"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>(authError || "");

  // Key Access State
  const [keyCodeInput, setKeyCodeInput] = useState("");

  // Student Sign-Up State
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentTraderId, setStudentTraderId] = useState("");
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  // Password / Master Admin Login State
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const deviceId = React.useMemo(() => getClientDeviceId(), []);
  const shortDeviceId = React.useMemo(() => {
    return `ATM-DEV-${deviceId.replace(/\D/g, '').slice(-4) || '3045'}`.toUpperCase();
  }, [deviceId]);

  React.useEffect(() => {
    if (authError) {
      setAuthError?.(null);
    }
  }, [authError, setAuthError]);

  // Handle Cryptographic Key Authentication
  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = keyCodeInput.trim();
    if (!trimmed) {
      setError("Please enter your Cryptographic ATM Access Key.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanUpper = trimmed.toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '');
      const testKey = cleanUpper.length === 7 ? `ATM-${cleanUpper}` : trimmed;

      const licenseResult = validateLicenseCode(testKey);
      if (licenseResult.valid) {
        const lic = licenseResult.license;
        const licenseUser = {
          uid: "lic-" + (lic?.cleanKey || cleanUpper),
          email: lic?.traderName || `trader-${cleanUpper}@aladdin.org.in`,
          name: lic?.traderName || "VIP Member",
          role: licenseResult.role || "user",
          status: "active",
          isLifetimePaid: lic?.plan?.includes("Lifetime") ?? true,
          plan: lic?.plan || "VIP Access",
          expiresAt: lic?.expiresAt,
          createdAt: new Date().toISOString(),
        };
        onLogin({ uid: licenseUser.uid, email: licenseUser.email }, licenseUser);
        return;
      }

      throw new Error(licenseResult.reason || "Invalid Access Key. Please contact Support Desk.");
    } catch (err: any) {
      setError(err.message || "Failed to verify access key.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Sign-Up Request
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!studentName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!studentEmail.trim() || !studentEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const newApp = submitStudentApplication(
        studentName.trim(),
        studentPhone.trim() || "",
        studentTraderId.trim() || undefined,
        studentEmail.trim()
      );
      setSubmittedApp(newApp);
    } catch (err: any) {
      setError(err.message || "Could not submit registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password / Admin Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = loginId.trim();
    if (!trimmedId) {
      setError("Please enter your Login Email or ID.");
      return;
    }

    setIsLoading(true);
    try {
      const lowerId = trimmedId.toLowerCase();
      const isAdminEmail = MASTER_ADMIN_EMAILS.map((em) => em.toLowerCase()).includes(lowerId);

      // 1. Master Admin Whitelist Login
      if (isAdminEmail) {
        const adminUser = {
          uid: "admin-" + lowerId,
          email: lowerId,
          name: "Master Admin (" + lowerId.split("@")[0] + ")",
          role: "admin",
          status: "active",
          isLifetimePaid: true,
          createdAt: new Date().toISOString(),
        };
        onLogin({ uid: adminUser.uid, email: lowerId }, adminUser);
        return;
      }

      // 2. Student Password Verification
      if (!password.trim()) {
        throw new Error("Please enter your password.");
      }

      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedId,
          password: password.trim(),
          deviceId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid Login ID or Password.");
      }

      const student = data.student;
      const studentUser = {
        uid: student.id || "std-" + student.email,
        email: student.email,
        name: student.name || "Student Member",
        role: student.role || "user",
        status: student.status || "active",
        isLifetimePaid: student.isLifetimePaid ?? true,
        maxDevices: student.maxDevices || 1,
        devices: student.devices || [deviceId],
        createdAt: student.createdAt || new Date().toISOString(),
      };

      onLogin({ uid: studentUser.uid, email: studentUser.email }, studentUser);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center py-6 px-4 relative overflow-x-hidden selection:bg-cyan-500/30">
      {/* Background glow lines */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-around opacity-15">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent"></div>
      </div>

      {/* Top back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-20 text-slate-400 hover:text-white font-semibold text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      {/* Compact Terminal Card */}
      <div className="w-full max-w-[360px] p-4.5 bg-[#0b1325]/95 border border-slate-800/90 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-3.5">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-1.5 border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <span className="text-base">🪙</span>
          </div>
          <h1 className="text-xs font-black text-white tracking-widest uppercase">
            Aladdin Trade Manager
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wide font-medium mt-0.5">
            Institutional Binary & Forex Suite
          </p>
        </div>

        {/* Tab Switcher */}
        {!submittedApp && activeTab !== "password" && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-3 text-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab("key");
                setError("");
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "key"
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Access Key</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError("");
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "signup"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Sign-Up</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-xl mb-3 text-xs text-center leading-tight flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: CRYPTOGRAPHIC ACCESS KEY ENTRY */}
        {activeTab === "key" && !submittedApp && (
          <form onSubmit={handleKeySubmit} className="space-y-3">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Enter Cryptographic Key
                </label>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                  7-Character Key
                </span>
              </div>

              {/* Cryptographic Key Box with ATM- Prefix Badge */}
              <div className="flex items-center rounded-xl overflow-hidden border border-slate-800 bg-[#060c18] focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-inner">
                <div className="bg-emerald-500/10 border-r border-slate-800 px-3 py-3 text-emerald-400 font-mono font-black text-xs tracking-wider select-none shrink-0 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ATM-</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="XXXXXXX"
                  value={keyCodeInput.toUpperCase().replace(/^ATM[-_\s]?/, '')}
                  onChange={(e) => {
                    const raw = e.target.value.toUpperCase();
                    const clean = raw.replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setKeyCodeInput(clean);
                  }}
                  className="w-full bg-transparent text-white px-3.5 py-3 text-sm font-mono font-bold tracking-widest focus:outline-none placeholder:text-slate-600 placeholder:tracking-normal"
                />
              </div>
            </div>

            {/* Hardware lock notice */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#060c18] border border-slate-800/80 rounded-xl text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                1 Key = 1 Device Bound
              </span>
              <span className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {shortDeviceId}
              </span>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Unlock Aladdin Trade Manager</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to password login toggle */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("password");
                  setError("");
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign In with Password →</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: STUDENT SIGN-UP APPLICATION FORM */}
        {activeTab === "signup" && !submittedApp && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rohit Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white px-3.5 py-3 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rohit.trader@gmail.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white px-3.5 py-3 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* WhatsApp Number (Optional) */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                placeholder="Mobile number (optional)"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white px-3.5 py-3 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Pocket Option Trader ID (Optional) */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Pocket Option Trader ID (UID)
                </label>
                <a
                  href="https://pocket-friends.co/r/mphdnyllo5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Create Broker ID (Free)
                </a>
              </div>
              <input
                type="text"
                placeholder="e.g. 143702223 (optional)"
                value={studentTraderId}
                onChange={(e) => setStudentTraderId(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#060c18] border border-slate-800 text-white px-3.5 py-3 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Submit Application Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Request VIP Access Key</span>
              )}
            </button>
          </form>
        )}

        {/* SUBMITTED SUCCESS / APPLICATION IN REVIEW SCREEN */}
        {submittedApp && (
          <div className="text-center py-2 space-y-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>

            <div>
              <span className="text-[9px] font-mono uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                ⏳ Pending Desk Approval
              </span>
              <h3 className="text-xs font-black text-white mt-1.5">
                Application Received!
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Applicant: <span className="text-slate-200 font-bold">{submittedApp.name}</span> {submittedApp.traderId ? `(ID: ${submittedApp.traderId})` : ''}
              </p>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                Device Lock: {shortDeviceId}
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-left text-[10px] text-slate-300 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Next Step to Unlock:</span>
              </div>
              <p className="text-slate-400 text-[9.5px]">
                To expedite your verification and receive your ATM access key, message our Support Desk on Telegram:
              </p>
            </div>

            {/* Telegram Direct Action Button */}
            <button
              type="button"
              onClick={() => openTelegramSupport(`Hi Support Desk, I submitted my registration for Aladdin Trade Manager. Name: ${submittedApp.name}${submittedApp.traderId ? `, Trader ID: ${submittedApp.traderId}` : ''}. Please approve my access key.`)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#229ED9] hover:bg-[#1E8BC0] text-white shadow-md shadow-[#229ED9]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contact Support Desk</span>
            </button>

            {/* Return to Enter Key Button */}
            <button
              type="button"
              onClick={() => {
                setSubmittedApp(null);
                setActiveTab("key");
                setError("");
              }}
              className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer underline"
            >
              I Received My ATM Key → Enter Portal
            </button>
          </div>
        )}

        {/* TAB 3: PASSWORD / ADMIN LOGIN */}
        {activeTab === "password" && !submittedApp && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                Login ID / Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Student Email or Master Admin"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-[#060c18] border border-slate-800 text-white pl-8 pr-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060c18] border border-slate-800 text-white pl-8 pr-8 py-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer mt-1"
            >
              Sign In with Password
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("key");
                  setError("");
                }}
                className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                ← Back to Cryptographic Key Login
              </button>
            </div>
          </form>
        )}

        {/* Pocket Option Broker Registration Option (Compact) */}
        {!submittedApp && (
          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                Official Broker Partner
              </span>
              <span className="text-[8.5px] text-cyan-200 bg-cyan-500/20 px-1 py-0.5 rounded font-mono font-semibold">
                Pocket Option
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mb-2 leading-tight">
              Create account, copy Trader ID, and submit for instant VIP verification.
            </p>
            <a
              href="https://pocket-friends.co/r/mphdnyllo5"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-2.5 rounded-lg font-bold text-[10px] bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all flex items-center justify-center cursor-pointer text-center"
            >
              Register on Pocket Option (Free)
            </a>
          </div>
        )}

        {/* Official Customer Support (Solid, no blinking dot) */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => openTelegramSupport("Hi Desk Support, I need assistance with my Aladdin Trade Manager access.")}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 border border-emerald-500/25 hover:border-emerald-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Support Desk</span>
          </button>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full max-w-sm mt-3 text-center">
        <p className="text-slate-600 text-[8.5px] font-medium tracking-wider uppercase">
          All Rights Reserved © Aladdin AI Organization — www.Aladdin.Org.In
        </p>
      </div>
    </div>
  );
};
