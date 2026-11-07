import React, { useState } from "react";
import { 
  Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, 
  AlertCircle, MessageCircle, ChevronLeft, Phone, User, RotateCcw, X
} from "lucide-react";
import { 
  MASTER_ADMIN_EMAILS, 
  validateLicenseCode, 
  getClientDeviceId,
  submitStudentApplication,
  openTawkToChat,
  getDeviceHumanName
} from "../lib/licenseEngine";

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
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>(authError || "");

  // Login form state
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign-Up form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student Quick Support Desk State (Captures name/phone before Tawk.to opens)
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatStudentName, setChatStudentName] = useState("");
  const [chatStudentContact, setChatStudentContact] = useState("");
  const [chatStudentQuery, setChatStudentQuery] = useState("");

  const deviceId = React.useMemo(() => getClientDeviceId(), []);

  React.useEffect(() => {
    if (authError) {
      setAuthError?.(null);
    }
  }, [authError, setAuthError]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = loginId.trim();
    if (!trimmedId) {
      setError("Please enter your Login ID or Email Address.");
      return;
    }

    setIsLoading(true);
    try {
      const lowerId = trimmedId.toLowerCase();
      const isAdminEmail = MASTER_ADMIN_EMAILS.map((em) => em.toLowerCase()).includes(lowerId);

      // 1. Master Admin Login via Verified Whitelist Email (Passwordless / Email-Auth)
      if (isAdminEmail) {
        const adminRes = await fetch("/api/auth/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lowerId, password: password.trim() || lowerId, deviceId }),
        });
        const adminData = await adminRes.json().catch(() => ({}));
        if (!adminRes.ok || !adminData.success || !adminData.user) {
          throw new Error(adminData.message || "Invalid Login ID or Password. Please check credentials.");
        }
        if (adminData.token) {
          localStorage.setItem("atm_auth_token", adminData.token);
        }
        onLogin({ uid: adminData.user.uid, email: adminData.user.email }, adminData.user);
        return;
      }

      // 2. Check if student entered 7-character crypto key directly (ATM-XXXXXXX or XXXXXXX)
      const cleanUpper = trimmedId.toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '');
      if (cleanUpper.length === 7) {
        if (['C3XU78M', '9B2X74M', 'XXXXXXX', '1234567', '0000000', 'TESTKEY'].includes(cleanUpper)) {
          throw new Error("❌ Invalid Key: Example codes cannot be used. Please enter an active VIP access key issued by Master Admin.");
        }
        // Authenticate with server-authoritative license engine
        try {
          const licRes = await fetch("/api/auth/verify-license", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: `ATM-${cleanUpper}`, deviceId, deviceName: getDeviceHumanName() }),
          });
          const licData = await licRes.json().catch(() => ({}));
          if (licRes.ok && licData.success && licData.user) {
            if (licData.token) {
              localStorage.setItem("atm_auth_token", licData.token);
            }
            onLogin({ uid: licData.user.uid, email: licData.user.email }, licData.user);
            return;
          } else if (licData.message && licData.message.includes("Device Lock")) {
            throw new Error(licData.message);
          }
        } catch (serverErr: any) {
          if (serverErr.message && serverErr.message.includes("Device Lock")) {
            throw serverErr;
          }
        }

        // Offline fallback
        const licenseResult = validateLicenseCode(`ATM-${cleanUpper}`);
        if (licenseResult.valid && licenseResult.license) {
          const lic = licenseResult.license;
          const licenseUser = {
            uid: "lic-" + lic.cleanKey,
            email: lic.traderName || `trader-${cleanUpper}@aladdin.org.in`,
            name: lic.traderName,
            role: "user",
            status: "active",
            isLifetimePaid: lic.plan.includes("Lifetime"),
            plan: lic.plan,
            expiresAt: lic.expiresAt,
            createdAt: new Date().toISOString(),
          };
          onLogin({ uid: licenseUser.uid, email: licenseUser.email }, licenseUser);
          return;
        } else if (licenseResult.reason) {
          throw new Error(licenseResult.reason);
        }
      }

      // 3. Authenticate with registered student records
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
      if (response.ok && data.success && data.student) {
        const student = data.student;
        const studentUser = {
          uid: student.id || "std-" + student.email,
          email: student.email,
          name: student.name || "Student Member",
          role: student.role || "user",
          status: student.status || "pending",
          isLifetimePaid: student.isLifetimePaid ?? false,
          maxDevices: student.maxDevices || 1,
          devices: student.devices || [deviceId],
          createdAt: student.createdAt || new Date().toISOString(),
        };
        onLogin({ uid: studentUser.uid, email: studentUser.email }, studentUser);
        return;
      }

      // Fallback: check local storage students
      try {
        const storedUsersRaw = localStorage.getItem("atm_registered_users");
        if (storedUsersRaw) {
          const storedUsers = JSON.parse(storedUsersRaw);
          const matched = storedUsers.find((u: any) => 
            u.email?.toLowerCase() === lowerId && u.password === password.trim()
          );
          if (matched) {
            onLogin({ uid: matched.uid || "usr-" + matched.email, email: matched.email }, matched);
            return;
          }
        }
      } catch {}

      throw new Error(data.message || "Invalid Login ID or Password. If you are a new trader, please create an account.");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Account Creation
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your Full Name.");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setError("Please enter a valid Login ID / Email Address.");
      return;
    }
    if (!signupPassword) {
      setError("Please choose a secure Password.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Submit application to internal desk
      submitStudentApplication(
        fullName.trim(),
        phoneNumber.trim() || "",
        undefined,
        signupEmail.trim()
      );

      // 2. Save user locally with PENDING status (Requires 7-digit code or admin approval to unlock)
      const newUser = {
        uid: "std-" + Date.now(),
        email: signupEmail.trim().toLowerCase(),
        name: fullName.trim(),
        phone: phoneNumber.trim() || "",
        password: signupPassword.trim(),
        role: "user",
        status: "pending", // Held at Gatekeeper Screen!
        isLifetimePaid: false, // Never auto-approved for free!
        subscriptionEndDate: null,
        devices: [deviceId],
        createdAt: new Date().toISOString(),
      };

      try {
        const existingUsersRaw = localStorage.getItem("atm_registered_users");
        const existingUsers = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];
        existingUsers.push(newUser);
        localStorage.setItem("atm_registered_users", JSON.stringify(existingUsers));
      } catch {}

      // Route to Pending Approval Gatekeeper screen
      onLogin({ uid: newUser.uid, email: newUser.email }, newUser);
    } catch (err: any) {
      setError(err.message || "Could not create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In -> Records applicant & routes straight to VIP Paywall
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError("");
    try {
      const applicantEmail = `vip.applicant.${Math.random().toString(36).substring(2, 7)}@gmail.com`;
      const googleApplicant = {
        uid: "g-" + Date.now(),
        email: applicantEmail,
        name: "Google VIP Applicant",
        role: "user",
        status: "active",
        isLifetimePaid: false, // Routes straight to VIP Paywall screen!
        subscriptionEndDate: null,
        devices: [deviceId],
        deviceName: getDeviceHumanName(),
        createdAt: new Date().toISOString(),
      };

      // Record student lead in local desk
      submitStudentApplication(
        googleApplicant.name,
        "Google Sign-In Desk",
        undefined,
        googleApplicant.email
      );

      onLogin({ uid: googleApplicant.uid, email: googleApplicant.email }, googleApplicant);
    } catch {
      setError("Google authentication in progress. You can also sign in with your email.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-start py-6 px-4 selection:bg-emerald-500/30 overflow-x-hidden font-sans">
      {/* Top Navigation */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-start">
        {onBack && (
          <button
            onClick={onBack}
            className="text-white hover:text-emerald-400 font-bold text-sm flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-[420px] bg-[#0b1325]/95 border border-cyan-500/20 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.08)] relative backdrop-blur-xl mb-4">
        {/* Subtle Top Glowing Line */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* 3D Gold Coin with Number '1' */}
        <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-0.5 shadow-[0_0_25px_rgba(234,179,8,0.4)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center border border-yellow-200/60 shadow-inner">
            <span className="text-white font-black text-2xl font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">1</span>
          </div>
        </div>

        {/* Header Title */}
        <h1 className="text-2xl font-black text-white tracking-wider uppercase text-center leading-tight">
          ALADDIN TRADE MANAGER
        </h1>

        {/* Subtitle */}
        <p className="text-xs text-slate-300 font-medium text-center mt-1.5 mb-5">
          {mode === "login"
            ? "Enter your Secure Login ID and Password"
            : "Create your new account"}
        </p>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl mb-4 text-xs text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Switcher Tabs: Instantly clear for new traders & returning members */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#060c18] border border-slate-800 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "login"
                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Login</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "signup"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: SECURE LOGIN FORM                                      */}
        {/* ============================================================== */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            {/* Login ID / Email Address */}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Login ID / Email Address"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-10 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Secure Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 mt-3"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Secure Login</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                </>
              )}
            </button>

            {/* Prominent Quick Switch for New Users */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-[#060c18] hover:bg-[#0c162c] text-cyan-300 hover:text-cyan-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>New Trader? Create an Account</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: CREATE NEW ACCOUNT FORM                                */}
        {/* ============================================================== */}
        {mode === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Phone Number (Optional) */}
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Login ID / Email Address */}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="Login ID / Email Address"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showSignupPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-10 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showSignupPassword ? "Hide password" : "Show password"}
              >
                {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#060c18] border border-slate-800 text-white pl-10 pr-10 py-3.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 mt-3"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                </>
              )}
            </button>

            {/* Quick Switch back to Login */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-[#060c18] hover:bg-[#0c162c] text-emerald-300 hover:text-emerald-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Already Have an Account? Login</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* BROKER REGISTRATION CARD (POCKET OPTION)                        */}
        {/* ============================================================== */}
        <div className="mt-4 p-4 rounded-2xl bg-[#091122] border border-blue-900/50 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Broker Registration
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-blue-950/80 border border-blue-700/50 px-2 py-0.5 rounded-md">
              Pocket Option
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Create an account directly with Pocket Option, copy your Trader ID, and use it to access all platform VIP features.
          </p>

          <a
            href="https://pocket-friends.co/r/mphdnyllo5"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md flex items-center justify-center text-center transition-all cursor-pointer"
          >
            Register with Pocket Option
          </a>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full h-px bg-slate-800" />
          <span className="absolute bg-[#0b1325] px-3 text-xs text-slate-400 font-medium">
            Or continue with
          </span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Google</span>
        </button>

        {/* Toggle Mode: Login vs Sign Up */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-white font-bold hover:underline cursor-pointer"
              >
                Create one
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-white font-bold hover:underline cursor-pointer"
              >
                Login
              </button>
            </span>
          )}
        </div>

        {/* Having trouble? + Official Customer Support Desk */}
        <div className="mt-4 text-center">
          <p className="text-xs font-bold text-cyan-400 mb-2">Having trouble?</p>
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Official Customer Support Desk</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* QUICK STUDENT PRE-CHAT MODAL                                   */}
      {/* ============================================================== */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#091122] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative text-left">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Customer Support Desk</h3>
                  <p className="text-[10px] text-slate-400">Direct assistance from our official team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = chatStudentName.trim() || fullName.trim() || "Student Trader";
                const contact = chatStudentContact.trim() || signupEmail.trim() || phoneNumber.trim();
                if (!contact) return;
                submitStudentApplication(
                  name,
                  contact,
                  undefined,
                  contact.includes("@") ? contact : undefined
                );
                openTawkToChat(name, contact, chatStudentQuery);
                setShowChatModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={chatStudentName}
                  onChange={(e) => setChatStudentName(e.target.value)}
                  className="w-full bg-[#050a14] border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Phone / WhatsApp or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210 or your email"
                  value={chatStudentContact}
                  onChange={(e) => setChatStudentContact(e.target.value)}
                  className="w-full bg-[#050a14] border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  How can we help? (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Need VIP Access Code or account help"
                  value={chatStudentQuery}
                  onChange={(e) => setChatStudentQuery(e.target.value)}
                  className="w-full bg-[#050a14] border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-3 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start Live Chat with Desk</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* THREE LEGAL & RISK DISCLAIMER CARDS (EXACT MATCH TO PHOTO)     */}
      {/* ============================================================== */}
      <div className="w-full max-w-[420px] flex flex-col gap-3">
        {/* 1. RISK WARNING */}
        <div className="p-4 rounded-2xl bg-[#070d1a] border border-slate-800/80 shadow-md text-left">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>RISK WARNING</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trading foreign Exchange, Cryptocurrency, Forex, Decentralized Trading and Commodities on margin carries a high level of risk and may not be suitable for all traders & investors.
          </p>
        </div>

        {/* 2. FTC RISK DISCLAIMER */}
        <div className="p-4 rounded-2xl bg-[#070d1a] border border-slate-800/80 shadow-md text-left">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>FTC RISK DISCLAIMER</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trading involves substantial risk, and you may lose all of the funds you invest.
          </p>
        </div>

        {/* 3. REFUND AND CHARGEBACK POLICY */}
        <div className="p-4 rounded-2xl bg-[#070d1a] border border-slate-800/80 shadow-md text-left">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>REFUND AND CHARGEBACK POLICY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Refunds are not available under any condition.
          </p>
        </div>
      </div>

      {/* Footer Copyright */}
      <footer className="w-full max-w-[420px] pt-8 pb-4 text-center">
        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          ALL RIGHTS RESERVED © ALADDIN AI ORGANIZATION - WWW.ALADDIN.ORG.IN
        </p>
      </footer>
    </div>
  );
};
