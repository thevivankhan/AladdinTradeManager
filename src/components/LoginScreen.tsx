import React, { useState } from "react";
import { 
  Key, Mail, Lock, ArrowRight, Eye, EyeOff, 
  AlertCircle, ChevronLeft, ChevronDown, ChevronUp, Check, Send, ExternalLink,
  User, Phone, Crown, TrendingUp, BarChart3, Sparkles, Shield,
  MessageCircle, ShieldCheck, RotateCcw, MapPin, CreditCard, Wallet
} from "lucide-react";
import { 
  MASTER_ADMIN_EMAILS, 
  verifyLicenseKeyOnline,
  saveActiveSession,
  getClientDeviceId,
  getDeviceHumanName,
  submitStudentApplication 
} from "../lib/licenseEngine";
import { openTelegramSupport } from "../lib/telegram";
import { SupportModal } from "./SupportModal";

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

  // Student VIP Access Sign-Up State
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [studentLocation, setStudentLocation] = useState("");
  const [studentExperience, setStudentExperience] = useState("Beginner (< 1 Year)");
  const [studentMarket, setStudentMarket] = useState("Binary Options (1-Min Turbo)");
  const [planCategory, setPlanCategory] = useState<"direct" | "pocket">("direct");
  const [studentPlan, setStudentPlan] = useState("Lifetime VIP Access ($247) — Never Pay Again");
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI / Google Pay / PhonePe");
  const [studentTraderId, setStudentTraderId] = useState("");
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  // Password / Admin Login State
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Support Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

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
      setError("Please enter your 7-digit access key.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanUpper = trimmed.toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '');
      if (cleanUpper.length !== 7) {
        throw new Error("Invalid License Key. Please enter a valid 7-digit ATM Key or request access from Master Admin.");
      }

      const testKey = `ATM-${cleanUpper}`;
      const licenseResult = await verifyLicenseKeyOnline(testKey);

      if (licenseResult.valid) {
        const lic = licenseResult.license;
        if (lic) {
          saveActiveSession(lic);
        }
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

      throw new Error(licenseResult.reason || "Invalid License Key. Please enter a valid 7-digit ATM Key or request access from Master Admin.");
    } catch (err: any) {
      setError(err.message || "Invalid License Key. Please enter a valid 7-digit ATM Key or request access from Master Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle VIP Access Application Submission
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!studentName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!studentEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    // Basic email format check
    if (!studentEmail.includes("@") || !studentEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const isBrokerPlan = planCategory === "pocket" || studentPlan.includes("Deposit");
      const chosenBroker = isBrokerPlan ? "Pocket Option" : "Direct VIP License";
      const chosenPaymentMode = isBrokerPlan 
        ? "Broker Deposit Sponsored (Pocket Option)" 
        : paymentMethod;

      const newApp = submitStudentApplication(
        studentName.trim(),
        studentMobile.trim() || "Not provided",
        studentTraderId.trim() || undefined,
        studentEmail.trim(),
        chosenBroker,
        "$100 - $500",
        studentPlan.trim(),
        studentExperience,
        studentMarket,
        studentLocation.trim() || undefined,
        chosenPaymentMode
      );
      setSubmittedApp({
        ...newApp,
        location: studentLocation.trim() || undefined,
        paymentMethod: chosenPaymentMode,
        experience: studentExperience,
        market: studentMarket
      });
    } catch (err: any) {
      setError(err.message || "Could not submit application. Please try again.");
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
      setError("Please enter your login email or ID.");
      return;
    }

    setIsLoading(true);
    try {
      const lowerId = trimmedId.toLowerCase();
      const isAdminEmail = MASTER_ADMIN_EMAILS.map((em) => em.toLowerCase()).includes(lowerId);

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
        throw new Error(data.message || "Invalid login ID or password.");
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

  const [copied, setCopied] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 relative overflow-x-hidden selection:bg-cyan-500/20">
      {/* Ambient Multi-Color Gradient Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Top back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-5 left-5 z-20 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer backdrop-blur-md shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}

      {/* Main Container - Vibrant Multi-Color Glowing Border Card */}
      <div className="w-full max-w-[460px] p-[1px] bg-gradient-to-br from-cyan-500/40 via-purple-500/30 to-amber-500/40 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10 transition-all max-h-[92vh] flex flex-col">
        <div className="w-full bg-[#0b101d]/95 rounded-[23px] p-5 sm:p-7 backdrop-blur-2xl overflow-y-auto max-h-[92vh]">
          {/* Brand Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/25 via-cyan-500/20 to-purple-500/25 border border-amber-400/40 flex items-center justify-center mx-auto mb-2.5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <span className="text-2xl">🪙</span>
            </div>
            <h1 className="text-base sm:text-lg font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
              Aladdin Trade Manager
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Institutional Binary & Forex VIP Suite
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          {!submittedApp && activeTab !== "password" && (
            <div className="grid grid-cols-2 p-1.5 bg-[#060a14] border border-slate-800 rounded-xl mb-5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("key");
                  setError("");
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "key"
                    ? "bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm"
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
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "signup"
                    ? "bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-purple-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Get VIP Access</span>
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl mb-4 text-xs flex items-center gap-2 animate-in fade-in duration-200 leading-snug">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: ACCESS KEY SIGN IN */}
          {activeTab === "key" && !submittedApp && (
            <form onSubmit={handleKeySubmit} className="space-y-3.5">
              <div className="flex flex-col items-center">
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2 text-center">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enter Cryptographic Access Key</span>
                </label>

                {/* Ultra-Compact Rectangular Box Tailored Snugly to 7 Keys & Horizontally Centered */}
                <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md border border-slate-600/90 bg-[#18233c] hover:bg-[#1c2946] hover:border-slate-500 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500/40 transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] mx-auto w-fit">
                  {/* Button-like ATM Prefix Tab (Non-clickable, Visual Tag) */}
                  <div className="px-2 py-0.5 rounded bg-gradient-to-b from-emerald-500/25 to-teal-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] tracking-wider select-none pointer-events-none shadow-sm flex items-center gap-0.5 shrink-0">
                    <span>ATM</span>
                    <span className="text-emerald-500/70 font-semibold">-</span>
                  </div>

                  {/* Snug 7-Digit Key Input */}
                  <input
                    type="text"
                    required
                    maxLength={7}
                    placeholder="XXXXXXX"
                    value={keyCodeInput.toUpperCase().replace(/^ATM[-_\s]?/, '')}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase();
                      const clean = raw.replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '').slice(0, 7);
                      setKeyCodeInput(clean);
                    }}
                    className="w-[90px] sm:w-[98px] bg-transparent text-emerald-100 placeholder:text-slate-400 text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-center px-1 py-0.5 focus:outline-none uppercase"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-slate-400 w-full">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Hardware Anti-Piracy Lock:</span>
                  </span>
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 font-bold text-[10px]">
                    {shortDeviceId}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-lg shadow-md shadow-emerald-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock Aladdin VIP Suite</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("password");
                    setError("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Sign in with Password or Admin ID →
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: VIBRANT MULTI-COLOR VIP SIGN-UP FORM (EMBOSSED & DETAILED) */}
          {activeTab === "signup" && !submittedApp && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {/* Field 1: Full Name (Compulsory) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Legal Name</span>
                  <span className="text-rose-400 text-[11px] font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-3.5 py-2.5 rounded-md text-xs font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 transition-all placeholder:text-slate-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Field 2: Email Address (Compulsory) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Email Address</span>
                  <span className="text-rose-400 text-[11px] font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex.morgan@gmail.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-3.5 py-2.5 rounded-md text-xs font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40 transition-all placeholder:text-slate-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Field 3: Mobile / WhatsApp Number (Optional) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mobile / WhatsApp Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 234-5678 (Optional)"
                  value={studentMobile}
                  onChange={(e) => setStudentMobile(e.target.value)}
                  className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-3.5 py-2.5 rounded-md text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/40 transition-all placeholder:text-slate-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Field 3b: Country or City (Optional inside box) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Country or City</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dubai, UAE or Mumbai, India (Optional)"
                  value={studentLocation}
                  onChange={(e) => setStudentLocation(e.target.value)}
                  className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-3.5 py-2.5 rounded-md text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all placeholder:text-slate-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Two Relevant Trading Profiling Fields in a 2-Column Split */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Field 4: Trading Experience Level */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                    <TrendingUp className="w-3 h-3 text-sky-400" />
                    <span>Experience</span>
                  </label>
                  <select
                    value={studentExperience}
                    onChange={(e) => setStudentExperience(e.target.value)}
                    className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-2.5 py-2.5 rounded-md text-[11px] font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-500/40 transition-all cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                  >
                    <option value="Beginner (< 1 Year)">Beginner (&lt; 1 Year)</option>
                    <option value="Intermediate (1–3 Years)">Intermediate (1–3 Yrs)</option>
                    <option value="Advanced Trader (3+ Years)">Advanced Trader (3+ Yrs)</option>
                  </select>
                </div>

                {/* Field 5: Preferred Trading Market */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                    <BarChart3 className="w-3 h-3 text-violet-400" />
                    <span>Primary Market</span>
                  </label>
                  <select
                    value={studentMarket}
                    onChange={(e) => setStudentMarket(e.target.value)}
                    className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-2.5 py-2.5 rounded-md text-[11px] font-medium focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/40 transition-all cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                  >
                    <option value="Binary Options (1-Min Turbo)">Binary Options (Turbo)</option>
                    <option value="Forex & Gold (XAUUSD)">Forex & Commodities</option>
                    <option value="Both Binary & Forex">Both Binary & Forex</option>
                  </select>
                </div>
              </div>

              {/* Field 6: One-Click Collapsible VIP Access Plan Dropdown Accordion */}
              <div>
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select VIP Access Plan</span>
                    <span className="text-rose-400 text-[11px] font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {planCategory === "pocket" ? "Free with Broker Deposit" : "Direct License Key"}
                  </span>
                </label>

                {/* Collapsible Trigger Bar */}
                <button
                  type="button"
                  onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                  className={`w-full p-2.5 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] ${
                    isPlanDropdownOpen
                      ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40"
                      : "bg-[#18233c] hover:bg-[#1c2946] border-slate-600/90 hover:border-amber-400/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className={`p-1.5 rounded shrink-0 ${planCategory === "pocket" ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {planCategory === "pocket" ? <Sparkles className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate max-w-[190px] sm:max-w-[240px]">
                          {studentPlan.replace(" — Never Pay Again", "")}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                          planCategory === "pocket"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        }`}>
                          {planCategory === "pocket" ? "Broker Deposit" : "Direct Pro"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {planCategory === "pocket" ? "100% Free Software · Fund your own trading account" : "Instant 7-Digit Access Key · Single-device secure"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <span className="text-[10px] font-semibold text-amber-300 hidden sm:inline">
                      {isPlanDropdownOpen ? "Close" : "Change"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-amber-300 transition-transform duration-200 ${isPlanDropdownOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Collapsible Plan Drawer */}
                {isPlanDropdownOpen && (
                  <div className="mt-2 p-3 rounded-lg bg-[#090f1d] border border-amber-500/30 space-y-2.5 shadow-2xl animate-in fade-in duration-150">
                    {/* Category Switcher Tabs (Matching Screenshot) */}
                    <div className="grid grid-cols-2 p-1 bg-[#050811] border border-slate-800 rounded-xl shadow-inner">
                      <button
                        type="button"
                        onClick={() => {
                          setPlanCategory("pocket");
                          setStudentPlan("Lifetime VIP Access ($300 Pocket Option Deposit)");
                        }}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          planCategory === "pocket"
                            ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Pocket Option</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPlanCategory("direct");
                          setStudentPlan("Lifetime VIP Access ($247) — Never Pay Again");
                        }}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          planCategory === "direct"
                            ? "bg-gradient-to-r from-fuchsia-500/25 to-pink-500/25 text-pink-300 border border-fuchsia-400/50 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Key className="w-3 h-3 text-pink-400" />
                        <span>Direct License</span>
                      </button>
                    </div>

                    {/* Subheading header */}
                    <div className="flex items-center justify-between text-[11px] px-0.5">
                      <span className="text-slate-300 font-semibold">
                        {planCategory === "pocket" ? "Free Software Access via Deposit" : "Direct Pro License Key"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tap tier to select
                      </span>
                    </div>

                    {/* POCKET OPTION TIERS ($50, $100, $200, $300) */}
                    {planCategory === "pocket" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentPlan("1 Month VIP Access ($50 Pocket Option Deposit)")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            studentPlan.includes("$50")
                              ? "bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400/40 shadow-sm"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-bold text-white">$50</span>
                            <span className="text-[10px] text-cyan-300 font-medium">1 Month</span>
                          </div>
                          <p className="text-[9px] text-slate-400">Deposit required</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("3 Months VIP Access ($100 Pocket Option Deposit)")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            studentPlan.includes("$100")
                              ? "bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400/40 shadow-sm"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-bold text-white">$100</span>
                            <span className="text-[10px] text-cyan-300 font-bold">3 Mos · Popular</span>
                          </div>
                          <p className="text-[9px] text-slate-400">Deposit required</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("1 Year VIP Access ($200 Pocket Option Deposit)")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            studentPlan.includes("$200")
                              ? "bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400/40 shadow-sm"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-bold text-white">$200</span>
                            <span className="text-[10px] text-cyan-300 font-bold">1 Year · Best Value</span>
                          </div>
                          <p className="text-[9px] text-slate-400">Deposit required</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("Lifetime VIP Access ($300 Pocket Option Deposit)")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            studentPlan.includes("$300")
                              ? "bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/40 shadow-sm"
                              : "bg-gradient-to-b from-[#151c2f] to-[#0d1424] border-amber-500/40 hover:border-amber-400"
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-bold text-amber-300">$300</span>
                            <span className="text-[10px] text-amber-300 font-bold">Lifetime VIP</span>
                          </div>
                          <p className="text-[9px] text-amber-400/80 font-medium">Never Pay Again</p>
                        </button>
                      </div>
                    )}

                    {/* DIRECT LICENSE TIERS ($47, $97, $147, $197, $247) */}
                    {planCategory === "direct" && (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setStudentPlan("1 Month VIP Full Access ($47)")}
                          className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            studentPlan.includes("($47)")
                              ? "bg-pink-500/15 border-pink-400 ring-1 ring-pink-400/40"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <span className="text-[11px] font-medium text-slate-200">1 Month Access</span>
                          <span className="text-xs font-bold text-white font-mono">$47</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("3 Months VIP Full Access ($97)")}
                          className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            studentPlan.includes("($97)")
                              ? "bg-pink-500/15 border-pink-400 ring-1 ring-pink-400/40"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-200">3 Months Access</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Save 30%</span>
                          </div>
                          <span className="text-xs font-bold text-white font-mono">$97</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("6 Months VIP Full Access ($147)")}
                          className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            studentPlan.includes("($147)")
                              ? "bg-pink-500/15 border-pink-400 ring-1 ring-pink-400/40"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-200">6 Months Access</span>
                            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">Save 45%</span>
                          </div>
                          <span className="text-xs font-bold text-white font-mono">$147</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("1 Year VIP Full Access ($197)")}
                          className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            studentPlan.includes("($197)")
                              ? "bg-pink-500/15 border-pink-400 ring-1 ring-pink-400/40"
                              : "bg-gradient-to-b from-[#121c32] to-[#0c1424] border-slate-700/80 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-200">1 Year Access</span>
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Save 65%</span>
                          </div>
                          <span className="text-xs font-bold text-white font-mono">$197</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentPlan("Lifetime VIP Access ($247) — Never Pay Again")}
                          className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            studentPlan.includes("($247)")
                              ? "bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.18)]"
                              : "bg-gradient-to-b from-[#151c2f] to-[#0d1424] border-amber-500/40 hover:border-amber-400/80"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-amber-300">Lifetime VIP</span>
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded uppercase">V4.0 Allocation</span>
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">Save $150</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-0.5">Never Pay Again · Instant 7-Digit Access Key</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 line-through block font-mono">$397</span>
                            <span className="text-xs font-black text-amber-300 font-mono">$247</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 7: One-Click Collapsible Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-emerald-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preferred Payment Method</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {planCategory === "pocket" ? "Broker Sponsored" : "Direct Checkout"}
                  </span>
                </label>

                {planCategory === "pocket" ? (
                  <div className="w-full p-2.5 rounded-md border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-blue-950/30 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-cyan-200 block">Broker Deposit Sponsored</span>
                        <p className="text-[10px] text-slate-400">Zero software fee · 100% credited to your live Pocket Option account</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded">
                      FREE
                    </span>
                  </div>
                ) : (
                  <div>
                    {/* Collapsible Trigger Bar */}
                    <button
                      type="button"
                      onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                      className={`w-full p-2.5 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] ${
                        isPaymentDropdownOpen
                          ? "bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400/40"
                          : "bg-[#18233c] hover:bg-[#1c2946] border-slate-600/90 hover:border-emerald-400/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate block">
                            {paymentMethod}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            Tap to view all available payment channels
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        <span className="text-[10px] font-semibold text-emerald-300 hidden sm:inline">
                          {isPaymentDropdownOpen ? "Close" : "Change"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${isPaymentDropdownOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {/* Collapsible Payment Options Drawer */}
                    {isPaymentDropdownOpen && (
                      <div className="mt-2 p-2 rounded-lg bg-[#090f1d] border border-emerald-500/30 space-y-1.5 shadow-2xl animate-in fade-in duration-150">
                        {[
                          {
                            id: "UPI / Google Pay / PhonePe",
                            title: "UPI / Google Pay / PhonePe",
                            subtitle: "Instant QR & VPA Payment (India / INR)",
                            badge: "Fastest",
                          },
                          {
                            id: "Crypto / USDT (TRC20, BEP20)",
                            title: "Crypto / USDT (TRC20, BEP20, Solana)",
                            subtitle: "Zero Fees · USDT, BTC, ETH, Solana",
                            badge: "Global",
                          },
                          {
                            id: "Credit / Debit Card (Visa, Mastercard)",
                            title: "Credit / Debit Card (Visa, MasterCard)",
                            subtitle: "Instant online card activation",
                            badge: "Instant",
                          },
                          {
                            id: "PayPal / International Card",
                            title: "PayPal / International Cards",
                            subtitle: "Buyer Protection & International USD",
                            badge: "Global",
                          },
                          {
                            id: "Bank Wire / IMPS / Wire Transfer",
                            title: "Bank Wire / IMPS Transfer",
                            subtitle: "Direct Account to Account Settlement",
                            badge: "Direct",
                          },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(opt.id);
                              setIsPaymentDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-md border flex items-center justify-between text-left transition-all cursor-pointer ${
                              paymentMethod === opt.id
                                ? "bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400/40"
                                : "bg-[#18233c] hover:bg-[#1c2946] border-slate-700/80 hover:border-slate-600"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-white">{opt.title}</span>
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  {opt.badge}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 mt-0.5">{opt.subtitle}</p>
                            </div>
                            {paymentMethod === opt.id && (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 7: Pocket Option UID (Optional - label clean, optional inside box) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Pocket Option UID</span>
                  </label>
                  <a
                    href="https://pocket-friends.co/r/mphdnyllo5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-0.5 font-medium"
                  >
                    <span>Need UID? Register Free</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 143702223 (Optional)"
                  value={studentTraderId}
                  onChange={(e) => setStudentTraderId(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 text-slate-100 px-3.5 py-2.5 rounded-md text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 transition-all placeholder:text-slate-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs py-3.5 px-4 rounded-md shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Proceed to VIP Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* APPLICATION RECEIVED SUCCESS STATE - COMPREHENSIVE DOSSIER & IRRESISTIBLE SUBMIT BUTTON */}
          {submittedApp && (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-teal-500/15 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  VIP Application Ready
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your VIP request has been registered for Aladdin (ATM).
                </p>
              </div>

              {/* Detailed Structured Dossier Card */}
              <div className="bg-gradient-to-b from-[#121c32] to-[#0c1424] border border-slate-700/90 rounded-2xl p-4 text-xs text-left space-y-3 font-mono shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)]">
                {/* Plan Badge Header */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans font-bold">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selected Plan:</span>
                  </span>
                  <span className="text-amber-300 font-bold text-xs truncate max-w-[210px]">
                    {submittedApp.plan}
                  </span>
                </div>

                {/* Detailed Applicant Grid */}
                <div className="space-y-1.5 pt-1 text-[11px] border-b border-slate-800 pb-2.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Trader Name:</span>
                    <span className="text-white font-bold font-sans">{submittedApp.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Email Address:</span>
                    <span className="text-purple-300 truncate max-w-[190px]">{submittedApp.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>WhatsApp / Phone:</span>
                    <span className="text-emerald-300">
                      {submittedApp.contact && submittedApp.contact !== "Not provided" ? submittedApp.contact : "Not provided"}
                    </span>
                  </div>
                  {submittedApp.location && (
                    <div className="flex justify-between text-slate-400">
                      <span>Location / Country:</span>
                      <span className="text-rose-300 font-medium">{submittedApp.location}</span>
                    </div>
                  )}
                </div>

                {/* Trading & Subscription Category */}
                <div className="space-y-1.5 text-[11px] border-b border-slate-800 pb-2.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Subscription Type:</span>
                    <span className="text-cyan-300 font-bold">
                      {submittedApp.plan?.toLowerCase().includes("deposit") ? "Pocket Option Deposit" : "Direct VIP License"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Mode:</span>
                    <span className="text-emerald-300 font-semibold">{submittedApp.paymentMethod || "Broker Deposit Sponsored"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Experience Level:</span>
                    <span className="text-slate-200">{submittedApp.experience || "Beginner (< 1 Year)"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Primary Market:</span>
                    <span className="text-slate-200">{submittedApp.market || "Binary Options"}</span>
                  </div>
                  {submittedApp.traderId && (
                    <div className="flex justify-between text-slate-400">
                      <span>Broker UID:</span>
                      <span className="text-teal-300 font-bold">{submittedApp.traderId}</span>
                    </div>
                  )}
                </div>

                {/* Hardware Security Details */}
                <div className="space-y-1 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Hardware Lock:</span>
                    <span className="text-emerald-400 font-bold">{shortDeviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Device Model:</span>
                    <span className="text-slate-300 truncate max-w-[190px]">
                      {submittedApp.deviceName || getDeviceHumanName()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Irresistible, Minimal Professional Action Button - Directs to Aladdin Support without writing Telegram */}
              {(() => {
                const comprehensiveDossierMsg = `🪙 *ALADDIN TRADE MANAGER | VIP APPLICATION*
━━━━━━━━━━━━━━━━━━━━━
👤 *Trader*: ${submittedApp.name}
📱 *Contact*: ${submittedApp.contact || 'Not provided'}
📧 *Email*: ${submittedApp.email}
${submittedApp.location ? `📍 *Location*: ${submittedApp.location}\n` : ''}📊 *Experience*: ${submittedApp.experience || 'Beginner (< 1 Year)'}
🎯 *Market*: ${submittedApp.market || 'Both Binary & Forex'}
📦 *Plan*: ${submittedApp.plan}
💳 *Payment Mode*: ${submittedApp.paymentMethod || 'Broker Deposit Sponsored'}
🆔 *Broker UID*: ${submittedApp.traderId || 'Direct License'}
🛡️ *Device Lock*: ${shortDeviceId}
━━━━━━━━━━━━━━━━━━━━━
_“Dear Admin and Aladdin AI Support Desk, my candidate application has been submitted. Kindly review my details and issue my VIP Access Key & Password.”_`;

                return (
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => openTelegramSupport(comprehensiveDossierMsg)}
                      className="group relative w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] border border-emerald-300/40"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-950 animate-pulse" />
                      <span>Submit Application & Request Key</span>
                      <ArrowRight className="w-4 h-4 text-slate-950 transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* Subtle Backup Action: Copy Summary */}
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(comprehensiveDossierMsg);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch {}
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Dossier Copied to Clipboard</span>
                        </>
                      ) : (
                        <span>Copy Application Summary</span>
                      )}
                    </button>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  setSubmittedApp(null);
                  setActiveTab("key");
                  setError("");
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer block w-full text-center font-medium pt-1"
              >
                Already received your key? Enter Key →
              </button>
            </div>
          )}

          {/* TAB 3: PASSWORD LOGIN (ADMIN / ADVANCED) */}
          {activeTab === "password" && !submittedApp && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Login ID or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="name@example.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-[#0f172a]/95 border border-slate-700/80 text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0f172a]/95 border border-slate-700/80 text-white pl-3.5 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Sign In
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("key");
                    setError("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Back to Access Key Login
                </button>
              </div>
            </form>
          )}

          {/* Official Customer Support Desk */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center flex flex-col items-center">
            <span className="text-xs sm:text-sm font-semibold text-cyan-400 mb-2.5">
              Having trouble?
            </span>
            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full border border-emerald-500/70 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 font-semibold text-xs sm:text-sm transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.18)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official Customer Support Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Risk Warning, FTC Disclaimer & Refund Policy Cards */}
      <div className="w-full max-w-[460px] space-y-3 mt-4 relative z-10">
        {/* Card 1: RISK WARNING */}
        <div className="bg-[#0b101d]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-left shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider uppercase mb-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>RISK WARNING</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Trading foreign Exchange, Cryptocurrency, Forex, Decentralized Trading and Commodities on margin carries a high level of risk and may not be suitable for all traders & investors.
          </p>
        </div>

        {/* Card 2: FTC RISK DISCLAIMER */}
        <div className="bg-[#0b101d]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-left shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider uppercase mb-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>FTC RISK DISCLAIMER</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Trading involves substantial risk, and you may lose all of the funds you invest.
          </p>
        </div>

        {/* Card 3: REFUND AND CHARGEBACK POLICY */}
        <div className="bg-[#0b101d]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-left shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider uppercase mb-2">
            <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>REFUND AND CHARGEBACK POLICY</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Refunds are not available under any condition.
          </p>
        </div>
      </div>

      {/* Subtle Copyright */}
      <div className="mt-5 pb-6 text-center relative z-10">
        <p className="text-slate-500 text-[10px] tracking-wide">
          © Aladdin AI Organization · www.aladdin.org.in
        </p>
      </div>

      {/* Aladdin AI Support Form Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        defaultMessage="Hello Aladdin AI Support Desk, I need assistance with Aladdin Trade Manager VIP access."
      />
    </div>
  );
};

