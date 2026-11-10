import React, { useState, useEffect, useRef, useMemo } from "react";
import { debounce } from 'lodash';
import {
  Settings,
  Target,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  RefreshCw,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Copy,
  Info,
  CheckCircle2,
  XCircle,
  Calculator,
  Zap,
  Coins,
  ArrowRightCircle,
  Trash2,
  Activity,
  History,
  Hash,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Share2,
  Lock,
  ShieldAlert,
  Calendar,
  TestTube,
  DownloadCloud,
  Mail,
  Send,
  Crown,
  Globe,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  MonitorSmartphone,
  Edit2,
  Cloud,
  CloudOff,
  Image,
  X,
  CheckSquare,
  Bot,
  Award,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  ExternalLink,
  GraduationCap,
  Move,
  Smartphone,
  SplitSquareVertical,
  MessageCircle,
} from "lucide-react";
import { ChartScannerAI } from "./components/TradingRoom/ChartScannerAI";
import { AnalyticsDashboard } from "./components/TradingRoom/AnalyticsDashboard";
import { SmartJournal } from "./components/TradingRoom/SmartJournal";
import { DailyTradingPlan } from "./components/TradingRoom/DailyTradingPlan";
import { PositionCalculator } from "./components/TradingRoom/PositionCalculator";
import { StrategyAI } from "./components/TradingRoom/StrategyAI";

import { CompoundingPlanner } from "./components/CompoundingPlanner";
import { SlowButSureStrategy } from "./components/TradingRoom/SlowButSureStrategy";
import { ParadoxStrategy } from "./components/TradingRoom/ParadoxStrategy";
import { OlOlODailyCalculator } from "./components/TradingRoom/OlOlODailyCalculator";

import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { openTelegramSupport } from "./lib/telegram";

import LandingPage from "./components/LandingPage";
import { getIssuedLicenses, saveIssuedLicenses } from "./lib/licenseEngine";

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return await factory();
    }
  });
}

const LoginScreen = lazyWithRetry(() => import("./components/LoginScreen").then(m => ({ default: m.LoginScreen })));
const PaywallScreen = lazyWithRetry(() => import("./components/PaywallScreen").then(m => ({ default: m.PaywallScreen })));
const PendingScreen = lazyWithRetry(() => import("./components/PaywallScreen").then(m => ({ default: m.PendingScreen })));
const AdminPanel = lazyWithRetry(() => import("./components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const PendingApprovalScreen = lazyWithRetry(() => import("./components/PendingApprovalScreen").then(m => ({ default: m.PendingApprovalScreen })));

const SuspendedScreen = ({ onLogout }: { onLogout: () => void }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className="w-full max-w-md p-8 bg-slate-900/80 border border-rose-500/20 rounded-2xl shadow-2xl text-center">
      <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Account Suspended</h2>
      <p className="text-slate-400 mb-6">
        Your account has been deactivated by the administrator. Please contact support to reactivate your account.
      </p>
      <button
        onClick={onLogout}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
      >
        Sign Out
      </button>
    </div>
  </div>
);

// Types
type TradeResult = "-" | "W" | "L";

interface TradeJournal {
  notes: string;
  emotion?: string;
  setup?: string;
  checklist?: string[];
  screenshot?: string;
}

interface TradeState {
  id: number;
  result: TradeResult;
  customAmount: string;
  journal?: TradeJournal;
}

interface PastSession {
  id: number;
  date: string;
  startingCapital: number;
  endingCapital: number;
  profit: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  strategyMode: "TARGET" | "CAPITAL";
  notes?: string;
  maxPeak?: number;
  maxDrawdown?: number;
  maxConsecutiveWins?: number;
  maxConsecutiveLosses?: number;
}

// --- HELPER COMPONENTS ---
const evaluateMath = (expr: string): number => {
  if (!expr) return 0;
  try {
    const clean = expr.replace(/\s+/g, "");
    if (!/^[0-9+\-*/.()]+$/.test(clean)) {
      return parseFloat(clean) || 0;
    }
    const tokens = clean.match(/(\d+(\.\d+)?|[+\-*/()])/g);
    if (!tokens) return parseFloat(clean) || 0;

    let pos = 0;
    const parsePrimary = (): number => {
      const tok = tokens[pos++];
      if (tok === '(') {
        const val = parseExpr();
        if (tokens[pos] === ')') pos++;
        return val;
      }
      if (tok === '-' || tok === '+') {
        const next = parsePrimary();
        return tok === '-' ? -next : next;
      }
      return parseFloat(tok) || 0;
    };
    const parseFactor = (): number => {
      let val = parsePrimary();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const right = parsePrimary();
        val = op === '*' ? val * right : (right !== 0 ? val / right : 0);
      }
      return val;
    };
    const parseExpr = (): number => {
      let val = parseFactor();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseFactor();
        val = op === '+' ? val + right : val - right;
      }
      return val;
    };
    const res = parseExpr();
    return isNaN(res) ? 0 : Number(res);
  } catch {
    return parseFloat(expr) || 0;
  }
};

const Card = ({
  children,
  title,
  icon: Icon,
  action,
}: {
  children: React.ReactNode;
  title: string;
  icon?: any;
  action?: React.ReactNode;
}) => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
    <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
        <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase">
          {title}
        </h2>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const InputRow = ({
  label,
  value,
  onChange,
  type = "text",
  suffix = "",
}: any) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white w-24 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
      />
      {suffix && <span className="text-sm text-slate-500 w-4">{suffix}</span>}
    </div>
  </div>
);

const StatRow = ({
  label,
  value,
  highlight = false,
  color = "text-white",
}: any) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span
      className={`text-sm font-mono ${highlight ? "font-bold" : ""} ${color}`}
    >
      {value}
    </span>
  </div>
);

const STORAGE_KEY = "binary_options_tracker_state";

const getSavedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved state", e);
  }
  return null;
};

export default function App() {
  const isRestoringRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const [savedState] = useState(() => getSavedState());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    try {
      // If user was previously authenticated or active inside the app, NEVER show landing page on refresh
      const hasSavedUser = !!(localStorage.getItem("mock_dbUser") || localStorage.getItem("mock_firebaseUser"));
      const wasInsideApp = localStorage.getItem("aladdin_in_app") === "true";
      if (hasSavedUser || wasInsideApp) {
        return false;
      }
    } catch {}
    return true;
  });
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<"login" | "signup">("login");
  const [isInstalled, setIsInstalled] = useState(false);

  const handleToggleDocPiP = async () => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 440,
          height: 720,
        });
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
            const style = document.createElement("style");
            style.textContent = rules;
            pip.document.head.appendChild(style);
          } catch {
            if (sheet.href) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = sheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });
        const appEl = document.getElementById("aladdin-main-wrapper");
        if (appEl) {
          pip.document.body.className = "bg-slate-950 text-slate-300";
          pip.document.body.appendChild(appEl);
          pip.addEventListener("pagehide", () => {
            const target = document.getElementById("aladdin-root-container");
            if (target && appEl) {
              target.appendChild(appEl);
            }
          });
        }
      } catch (err) {
        console.warn("PiP error:", err);
      }
    } else {
      showToast("Document PiP is active on Chrome/Edge Desktop. Mobile floating mode is active!", "success");
    }
  };

  // --- Auth & Sync States with LocalStorage Persistence ---
  const [firebaseUser, setFirebaseUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("mock_firebaseUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [dbUser, setDbUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("mock_dbUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(() => {
    try {
      return !!(localStorage.getItem("mock_dbUser") || localStorage.getItem("mock_firebaseUser"));
    } catch {
      return false;
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "student" | "paywall">(() => {
    try {
      const saved = localStorage.getItem("aladdin_admin_view_mode");
      if (saved === "student" || saved === "admin" || saved === "paywall") {
        return saved as "admin" | "student" | "paywall";
      }
    } catch {}
    return "student"; // Default to student / Trade Manager so Admin stays in Trade Manager across refreshes!
  });

  const handleSetAdminViewMode = (mode: "admin" | "student" | "paywall") => {
    setAdminViewMode(mode);
    try {
      localStorage.setItem("aladdin_admin_view_mode", mode);
    } catch {}
  };



  const isAdmin = dbUser?.role === "admin";
  const userId = firebaseUser?.uid;

  const handleLogout = () => {
    setFirebaseUser(null);
    setDbUser(null);
    try {
      localStorage.removeItem("mock_firebaseUser");
      localStorage.removeItem("mock_dbUser");
      localStorage.removeItem("aladdin_in_app");
      localStorage.removeItem("aladdin_admin_view_mode");
    } catch {}
    setShowLandingPage(true);
  };

  useEffect(() => {
    // Restore session from our proprietary internal authentication engine
    try {
      const savedDbUser = localStorage.getItem("mock_dbUser");
      const savedUser = localStorage.getItem("mock_firebaseUser");
      const token = localStorage.getItem("atm_auth_token");
      const clientDeviceId = localStorage.getItem("atm_client_device_id") || "";

      if (savedDbUser) {
        const parsed = JSON.parse(savedDbUser);
        // Instant revocation if user unlocked with old demo keys
        if (
          parsed.uid === 'lic-C3XU78M' ||
          parsed.activeCryptoKey?.includes('C3XU78M') ||
          parsed.uid === 'lic-9B2X74M' ||
          parsed.activeCryptoKey?.includes('9B2X74M')
        ) {
          localStorage.removeItem('mock_dbUser');
          localStorage.removeItem('mock_firebaseUser');
          localStorage.removeItem('atm_auth_token');
          localStorage.removeItem('atm_active_license_session');
          setDbUser(null);
          setFirebaseUser(null);
          setShowLandingPage(true);
          setIsAuthReady(true);
          return;
        }

        setDbUser(parsed);
        setFirebaseUser(savedUser ? JSON.parse(savedUser) : { uid: parsed.uid, email: parsed.email });
        setShowLandingPage(false);

        // Server-Authoritative Cryptographic Token Handshake (Immune to DevTools tampering)
        if (token) {
          fetch("/api/auth/verify-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, deviceId: clientDeviceId }),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res && res.valid && res.user) {
                setDbUser(res.user);
                setFirebaseUser({ uid: res.user.uid, email: res.user.email });
                try {
                  localStorage.setItem("mock_dbUser", JSON.stringify(res.user));
                } catch {}
              } else if (res && res.valid === false) {
                // Tampered or revoked session
                handleLogout();
              }
            })
            .catch(() => {
              // Network offline: maintain offline resilient session
            });
        }
      } else {
        if (isInitialLoadRef.current) {
          setShowLandingPage(true);
        }
      }
    } catch (e) {
      console.warn("Session restore error:", e);
    }
    setIsAuthReady(true);
    isInitialLoadRef.current = false;
  }, []);



  // Live remote sync for Crypto VIP licenses (enforces admin kill-switch, auto-expiry, and instant renewal)
  useEffect(() => {
    if (!dbUser?.activeCryptoKey) return;
    const checkLicense = () => {
      try {
        const licenses = getIssuedLicenses();
        const cleanKey = dbUser.activeCryptoKey?.replace(/^ATM[-_\s]?/, '').toUpperCase().slice(0, 7);
        const found = licenses.find(l => l.key === dbUser.activeCryptoKey || l.cleanKey === cleanKey);
        if (found) {
          const expirationTime = found.expiresAt ? new Date(found.expiresAt).toISOString() : null;
          if (found.status !== dbUser.status || expirationTime !== dbUser.subscriptionEndDate) {
            setDbUser((prev: any) => ({
              ...prev,
              status: found.status,
              isLifetimePaid: !found.expiresAt,
              subscriptionEndDate: expirationTime,
            }));
          }
        }
      } catch {}
    };

    const syncServerLicense = async () => {
      try {
        const cleanKey = dbUser.activeCryptoKey?.replace(/^ATM[-_\s]?/, '').toUpperCase().slice(0, 7);
        if (!cleanKey || cleanKey.length !== 7) return;
        const clientDevId = localStorage.getItem('atm_client_device_id') || 'dev_active';
        const res = await fetch('/api/auth/verify-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: `ATM-${cleanKey}`, deviceId: clientDevId })
        });
        const data = await res.json();
        if (data?.success && data?.license) {
          const expirationTime = data.license.expiresAt ? new Date(data.license.expiresAt).toISOString() : null;
          setDbUser((prev: any) => ({
            ...prev,
            status: data.license.status,
            isLifetimePaid: !data.license.expiresAt,
            subscriptionEndDate: expirationTime,
          }));
          const existing = getIssuedLicenses();
          const idx = existing.findIndex((l: any) => l.cleanKey === cleanKey || l.id === data.license.id);
          if (idx !== -1) {
            existing[idx] = data.license;
          } else {
            existing.unshift(data.license);
          }
          saveIssuedLicenses(existing);
        } else if (!data?.success && (res.status === 403 || res.status === 404)) {
          // Suspended, expired or revoked by admin on server
          setDbUser((prev: any) => ({
            ...prev,
            status: 'suspended',
            subscriptionEndDate: new Date(Date.now() - 1000).toISOString(),
            isLifetimePaid: false
          }));
        }
      } catch {}
    };

    checkLicense();
    syncServerLicense();
    const interval = setInterval(checkLicense, 3000);
    const serverInterval = setInterval(syncServerLicense, 25000);
    window.addEventListener("storage", checkLicense);
    window.addEventListener("focus", syncServerLicense);
    return () => {
      clearInterval(interval);
      clearInterval(serverInterval);
      window.removeEventListener("storage", checkLicense);
      window.removeEventListener("focus", syncServerLicense);
    };
  }, [dbUser?.activeCryptoKey, dbUser?.status, dbUser?.subscriptionEndDate]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install popup if not already running in standalone mode
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowInstallPopup(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also listen for successful installation
    window.addEventListener("appinstalled", () => {
      setShowInstallPopup(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      showToast("ALADDIN TRADE MANAGER installed successfully!", "success");
    });

    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    } else {
      // Check for iOS
      const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
      };

      if (isIos()) {
        setShowInstallPopup(true);
      }
    }

    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallPopup(false);
      }
    } else {
      showToast(
        "To install: Tap browser menu (⋮) or Share (iOS) and select 'Add to Home Screen'",
        "warning",
      );
    }
  };

  const dismissInstallPopup = () => {
    setShowInstallPopup(false);
    // Remember dismissal for a day
    localStorage.setItem("installPromptDismissed", "true");
    setTimeout(
      () => localStorage.removeItem("installPromptDismissed"),
      24 * 60 * 60 * 1000,
    );
  };

  // --- STATE ---

  // Global / Accumulated Stats
  const [accumulatedStats, setAccumulatedStats] = useState(
    savedState?.accumulatedStats ?? {
      trades: 0,
      wins: 0,
      losses: 0,
      startingCapital: 100.0, // The very first capital of Day 1
    },
  );

  const [pastSessions, setPastSessions] = useState<PastSession[]>(
    savedState?.pastSessions ?? [],
  );
  const [showPastSessions, setShowPastSessions] = useState(false);

  // Current Session Settings
  const [initialCapital, setInitialCapital] = useState<number>(
    savedState?.initialCapital ?? 100.0,
  ); // Capital at start of current session
  const [payout, setPayout] = useState<number>(savedState?.payout ?? 92);
  const [currency, setCurrency] = useState<string>(savedState?.currency ?? "$");
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(
    savedState?.maxDailyLoss ?? 10,
  ); // Default 10% max daily loss
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState<number>(
    savedState?.maxConsecutiveLosses ?? 3,
  ); // Default 3 consecutive losses

  const [activeHeaderTab, setActiveHeaderTab] = useState<
    | "NONE"
    | "PLANNER"
    | "SIMULATOR"
    | "RISK_LOCK"
    | "CALCULATOR"
    | "CONVERTER"
    | "JOURNAL"
    | "CHART_SCANNER"
  >("NONE");
  const [plannerStartCapital, setPlannerStartCapital] = useState<number>(100);
  const [plannerDailyTarget, setPlannerDailyTarget] = useState<number>(5);
  const [simSequence, setSimSequence] = useState<string>("");

  // Trade Log Rows Setting
  const [maxTrades, setMaxTrades] = useState<number>(
    savedState?.maxTrades ?? 20,
  );

  // Trades Input State
  const [tradesInput, setTradesInput] = useState<TradeState[]>(
    savedState?.tradesInput ??
      Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        result: "-",
        customAmount: "",
      })),
  );

  const [isTradingClubOpen, setIsTradingClubOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [activeJournalTradeId, setActiveJournalTradeId] = useState<
    number | null
  >(null);

  // Dynamically adjust trade rows when maxTrades changes
  useEffect(() => {
    setTradesInput((prev) => {
      if (prev.length === maxTrades) return prev;
      if (prev.length < maxTrades) {
        const newRows = Array.from(
          { length: maxTrades - prev.length },
          (_, i) => ({
            id: prev.length + i + 1,
            result: "-" as TradeResult,
            customAmount: "",
          }),
        );
        return [...prev, ...newRows];
      } else {
        return prev.slice(0, maxTrades);
      }
    });
  }, [maxTrades]);

  // Session Target Settings
  const [stopLossPercent, setStopLossPercent] = useState<number>(
    savedState?.stopLossPercent ?? 20,
  );
  const [maxLossLimit, setMaxLossLimit] = useState<number>(
    savedState?.maxLossLimit ?? 8,
  );

  // Daily Goals Settings
  const [profitTarget, setProfitTarget] = useState<number>(
    savedState?.profitTarget ?? 2,
  );
  const [dailyGoalFormat, setDailyGoalFormat] = useState<string>(
    savedState?.dailyGoalFormat ?? "%",
  );
  const [sessionsRequired, setSessionsRequired] = useState<number>(
    savedState?.sessionsRequired ?? 1,
  );

  // Macro Goals Settings (New)
  const [macroGoalTarget, setMacroGoalTarget] = useState<number>(
    savedState?.macroGoalTarget ?? 2,
  );
  const [macroGoalFormat, setMacroGoalFormat] = useState<string>(
    savedState?.macroGoalFormat ?? "%",
  );
  const [stopLossAlertPct, setStopLossAlertPct] = useState<number>(
    savedState?.stopLossAlertPct ?? 20,
  );

  // Strategy Settings
  const [strategyMode, setStrategyMode] = useState<"TARGET" | "CAPITAL" | "COMPOUND">(
    savedState?.strategyMode ?? "TARGET",
  );
  const [capTotalSteps, setCapTotalSteps] = useState<number>(
    savedState?.capTotalSteps ?? 10,
  );
  const [capRecoveryWins, setCapRecoveryWins] = useState<number>(
    savedState?.capRecoveryWins ?? 1,
  );
  const [capBaseTrade, setCapBaseTrade] = useState<number>(
    savedState?.capBaseTrade ?? 1,
  );
  const [compoundCashoutStep, setCompoundCashoutStep] = useState<number>(
    savedState?.compoundCashoutStep ?? 3,
  );
  const [compoundReinvestRatio, setCompoundReinvestRatio] = useState<number>(
    savedState?.compoundReinvestRatio ?? 100,
  );
  const [compoundRecoveryTrades, setCompoundRecoveryTrades] = useState<number>(
    savedState?.compoundRecoveryTrades ?? 5,
  );
  const [compoundRecoveryWins, setCompoundRecoveryWins] = useState<number>(
    savedState?.compoundRecoveryWins ?? 2,
  );
  const [compoundRewardRatio, setCompoundRewardRatio] = useState<number>(
    savedState?.compoundRewardRatio ?? 0.92,
  );
  
  const formatRRR = (val: number) => {
    if (val < 1) return `${Math.round(val * 100)}%`;
    if (Number.isInteger(val)) return `1:${val}`;
    return val.toString();
  };

  const [rrrInput, setRrrInput] = useState<string>(
    savedState?.compoundRewardRatio ? formatRRR(savedState.compoundRewardRatio) : "92%",
  );

  const [assumedWinRate, setAssumedWinRate] = useState<number>(savedState?.assumedWinRate ?? 60);
  const [winRateInput, setWinRateInput] = useState<string>(
    savedState?.assumedWinRate ? `${savedState.assumedWinRate}%` : "60%",
  );

  const handleWinRateUpdate = (val: number | string) => {
    if (typeof val === 'number') {
      const fixedVal = Math.max(0.5, Math.min(100, val));
      setAssumedWinRate(fixedVal);
      setWinRateInput(`${fixedVal.toFixed(1)}%`);
    } else {
      setWinRateInput(val);
      const n = parseFloat(val.replace('%', ''));
      if (!isNaN(n)) {
        setAssumedWinRate(Math.max(0.5, Math.min(100, n)));
      }
    }
  };

  const handleRRRUpdate = (val: number | string) => {
    if (typeof val === 'number') {
      setCompoundRewardRatio(val);
      setRrrInput(formatRRR(val));
    } else {
      setRrrInput(val);
      if (val.includes(':')) {
        const parts = val.split(':');
        if (parts.length === 2) {
          const r1 = parseFloat(parts[0]);
          const r2 = parseFloat(parts[1]);
          if (r1 > 0 && r2 >= 0) {
            setCompoundRewardRatio(r2 / r1);
          }
        }
      } else if (val.endsWith('%')) {
        const p = parseFloat(val.replace('%', ''));
        if (!isNaN(p)) {
          setCompoundRewardRatio(p / 100);
        }
      } else {
        const n = parseFloat(val);
        if (!isNaN(n)) {
          setCompoundRewardRatio(n);
        }
      }
    }
  };
  const [compoundConfigOpen, setCompoundConfigOpen] = useState<boolean>(false);
  const [compoundGuideOpen, setCompoundGuideOpen] = useState<boolean>(false);
  const [compoundDisclaimerOpen, setCompoundDisclaimerOpen] = useState<boolean>(false);
  const [recoveryConfigOpen, setRecoveryConfigOpen] = useState<boolean>(false);
  const [minTradeAmount, setMinTradeAmount] = useState<number>(
    savedState?.minTradeAmount ?? 1,
  );
  const [compoundSteps, setCompoundSteps] = useState<number>(
    savedState?.compoundSteps ?? 5,
  );
  const [automatedWins, setAutomatedWins] = useState<number>(
    savedState?.automatedWins ?? 2,
  );

  // Options
  const [options, setOptions] = useState({
    autoCompleteSession: savedState?.options?.autoCompleteSession ?? false,
    sessionEndAlert: savedState?.options?.sessionEndAlert ?? true,
    autoCopyBalance: savedState?.options?.autoCopyBalance ?? true,
    autoCountSession: savedState?.options?.autoCountSession ?? true,
    autoSaveSession: savedState?.options?.autoSaveSession ?? true,
    lowTradeAlert: savedState?.options?.lowTradeAlert ?? false,
    autoSyncLiveData: savedState?.options?.autoSyncLiveData ?? false,
  });

  // Session Counter
  const [sessionCount, setSessionCount] = useState<number>(
    savedState?.sessionCount ?? 0,
  );

  // Session Notes
  const [sessionNotes, setSessionNotes] = useState<string>(
    savedState?.sessionNotes ?? "",
  );

  // 30 Day Compounding Tool State
  const [showCompoundingTool, setShowCompoundingTool] = useState<boolean>(
    savedState?.showCompoundingTool ?? false,
  );
  const [compoundingStartCapital, setCompoundingStartCapital] =
    useState<number>(savedState?.compoundingStartCapital ?? 100);
  const [compoundingDailyTarget, setCompoundingDailyTarget] = useState<number>(
    savedState?.compoundingDailyTarget ?? 5,
  );
  const [compoundingActuals, setCompoundingActuals] = useState<
    Record<number, string>
  >(savedState?.compoundingActuals ?? {});

  // New Features State
  const [calcInput, setCalcInput] = useState<string>(
    savedState?.calcInput ?? "",
  );
  const [calcHistory, setCalcHistory] = useState<
    { equation: string; result: string }[]
  >(savedState?.calcHistory ?? []);
  const [convAmount, setConvAmount] = useState<string>(
    savedState?.convAmount ?? "100",
  );
  const [convRate, setConvRate] = useState<string>(
    savedState?.convRate ?? "83.5",
  );
  const [convFrom, setConvFrom] = useState<string>(
    savedState?.convFrom ?? "USD",
  );
  const [convTo, setConvTo] = useState<string>(savedState?.convTo ?? "INR");
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveRateLoading, setIsLiveRateLoading] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [useLiveRate, setUseLiveRate] = useState<boolean>(
    savedState?.useLiveRate ?? true,
  );
  const [journalText, setJournalText] = useState<string>(
    savedState?.journalText ?? "",
  );
  const [appTheme, setAppTheme] = useState<'dark' | 'light' | 'neon'>(
    savedState?.appTheme ?? 'dark'
  );

  useEffect(() => {
    document.body.className = `theme-${appTheme}`;
  }, [appTheme]);

  const lastWrittenStateRef = useRef<string | null>(null);
  const pendingSyncRef = useRef(false);

  const debouncedSync = useMemo(() => debounce((uid: string, state: string) => {
    lastWrittenStateRef.current = state;
    pendingSyncRef.current = false;
  }, 1000), []);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  // Completion Modal State
  const [completionModal, setCompletionModal] = useState<{
    show: boolean;
    type: string;
    message: string;
  }>({ show: false, type: "", message: "" });
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [shareModal, setShareModal] = useState<{
    show: boolean;
    session: PastSession | null;
    theme: 'dark' | 'light' | 'neon' | 'gold';
    hideCapital: boolean;
    customUsername: string;
    customLink: string;
  }>({ show: false, session: null, theme: 'dark', hideCapital: false, customUsername: "", customLink: "" });
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: "", message: "", onConfirm: () => {} });
  const [alertedStatuses, setAlertedStatuses] = useState<string[]>([]);

  const showToast = (
    message: string,
    type: "success" | "warning" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmAction = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  // Auto-save state to localStorage
  useEffect(() => {
    if (!options.autoSaveSession) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const stateToSave = {
      accumulatedStats,
      pastSessions,
      initialCapital,
      payout,
      currency,
      maxTrades,
      tradesInput,
      stopLossPercent,
      maxLossLimit,
      profitTarget,
      dailyGoalFormat,
      sessionsRequired,
      strategyMode,
      capTotalSteps,
      capRecoveryWins,
      capBaseTrade,
      compoundCashoutStep,
      compoundReinvestRatio,
      compoundRecoveryTrades,
      compoundRecoveryWins,
      compoundRewardRatio,
      minTradeAmount,
      compoundSteps,
      automatedWins,
      options,
      sessionCount,
      sessionNotes,
      showCompoundingTool,
      compoundingStartCapital,
      compoundingDailyTarget,
      compoundingActuals,
      maxDailyLoss,
      maxConsecutiveLosses,
      calcInput,
      calcHistory,
      convAmount,
      convRate,
      convFrom,
      convTo,
      useLiveRate,
      journalText,
      appTheme,
      macroGoalTarget,
      macroGoalFormat,
      stopLossAlertPct,
      assumedWinRate,
    };

    try {
      const stateString = JSON.stringify(stateToSave);
      const previousString = localStorage.getItem(STORAGE_KEY);

      if (stateString !== previousString) {
        localStorage.setItem(STORAGE_KEY, stateString);

        if (
          options.autoSyncLiveData &&
          firebaseUser &&
          !isRestoringRef.current &&
          !isInitialLoadRef.current
        ) {
          pendingSyncRef.current = true;
          debouncedSync(firebaseUser.uid, stateString);
        }
      }
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [
    accumulatedStats,
    pastSessions,
    initialCapital,
    payout,
    currency,
    maxTrades,
    tradesInput,
    stopLossPercent,
    maxLossLimit,
    profitTarget,
    dailyGoalFormat,
    sessionsRequired,
    strategyMode,
    capTotalSteps,
    capRecoveryWins,
    capBaseTrade,
    compoundCashoutStep,
    compoundReinvestRatio,
    compoundRecoveryTrades,
    compoundRecoveryWins,
    compoundRewardRatio,
    minTradeAmount,
    compoundSteps,
    options,
    sessionCount,
    sessionNotes,
    showCompoundingTool,
    compoundingStartCapital,
    compoundingDailyTarget,
    compoundingActuals,
    maxDailyLoss,
    maxConsecutiveLosses,
    calcInput,
    calcHistory,
    convAmount,
    convRate,
    convFrom,
    convTo,
    useLiveRate,
    journalText,
    macroGoalTarget,
    macroGoalFormat,
    stopLossAlertPct,
    assumedWinRate,
    firebaseUser,
  ]);

  // Auto-update Max Loss Limit based on Martingale safe losses
  useEffect(() => {
    if (strategyMode === "CAPITAL") {
      setMaxLossLimit(capTotalSteps);
      return;
    }
    const target =
      dailyGoalFormat === "%"
        ? initialCapital * (profitTarget / 100)
        : profitTarget;
    const safeP = payout > 0 ? payout / 100 : 0.01;
    let tempBalance = initialCapital;
    let tempCumLoss = 0;
    let maxLosses = 0;

    if (target > 0 && initialCapital > 0) {
      for (let i = 0; i < 20; i++) {
        let amt = (target + tempCumLoss) / safeP;
        if (amt > tempBalance) break;
        tempCumLoss += amt;
        tempBalance -= amt;
        maxLosses++;
      }
    }
    setMaxLossLimit(maxLosses);
  }, [
    initialCapital,
    profitTarget,
    dailyGoalFormat,
    payout,
    strategyMode,
    capTotalSteps,
  ]);

  // --- REAL-TIME SPREADSHEET ENGINE (Derived State) ---
  const {
    targetMoney,
    stopLossMoney,
    safePayout,
    runningBalance,
    wCount,
    lCount,
    tCount,
    currentStatus,
    calculatedTrades,
    winRate,
    winProfit,
    accountGain,
    overallTrades,
    overallWins,
    overallLosses,
    overallWinRate,
    overallProfit,
    overallGain,
    macroTargetAmount,
    macroAccountGain,
    macroCapitalFinal,
    expectedSessionProfit,
    capReqCapital,
    calculatedSessionsRequired,
    activeTrade,
    nextTradeAmt,
    simSeq,
    isTargetHit,
    maxPeak,
    maxDrawdown,
    maxConsecutiveWins,
    maxConsecutiveLosses: sessionMaxConsecutiveLosses
  } = useMemo(() => {
    // 1. Calculate Targets
    // Tiered Gain Logic: For stability, auto-reduce target for larger capital
    let effectiveTargetMoney = profitTarget;
    if (dailyGoalFormat === "%") {
      let appliedPercent = profitTarget;
      if (initialCapital >= 10000 && profitTarget > 1) {
        appliedPercent = 1; // Drop to 1% automatically
      }
      effectiveTargetMoney = initialCapital * (appliedPercent / 100);
    }
    const targetMoney = effectiveTargetMoney;
    const stopLossMoney = initialCapital * (1 - stopLossPercent / 100);
    const safePayout = payout > 0 ? payout / 100 : 0.01;

    // Dynamic Capital Mode base target
    let baseCapitalTarget = 0;
    if (strategyMode === "CAPITAL") {
      const M = 1 + 1 / (capRecoveryWins * safePayout);
      const L = Math.max(0, capTotalSteps - capRecoveryWins);
      baseCapitalTarget = initialCapital / (Math.pow(M, L + 1) - 1);
    }

    // 2. Process Trades Row by Row
    let runningBalance = initialCapital;
    let wCount = 0;
    let lCount = 0;
    let tCount = 0;
    let currentStatus = "ACTIVE";
    
    let maxPeak = initialCapital;
    let maxDrawdown = initialCapital;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;

    // DP Memoization Table for WWA Mathematical Engine
    const payoutMult = 1 + safePayout;
    const maxT = strategyMode === "CAPITAL" ? capTotalSteps : maxTrades;
    const reqW = strategyMode === "CAPITAL" ? capRecoveryWins : automatedWins;
    
    const dpMem: number[][] = Array.from({ length: maxT + 1 }, () => Array(reqW + 1).fill(-1));
    const getDP = (t: number, w: number): number => {
      if (w >= reqW) return 1.0;
      if (reqW - w === maxT - t) return Math.pow(payoutMult, maxT - t);
      if (reqW - w > maxT - t) return Infinity; 
      if (dpMem[t][w] !== -1) return dpMem[t][w];
      
      const nextL = getDP(t + 1, w);
      const nextW = getDP(t + 1, w + 1);
      
      let val = Infinity;
      if (isFinite(nextL) && isFinite(nextW)) {
          val = (payoutMult * nextL * nextW) / (nextL + (payoutMult - 1) * nextW);
      }
      dpMem[t][w] = val;
      return val;
    };

    let currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
    let currentCompoundStreak = 0;
    let compoundLossAccumulator = 0;
    let recTCount = 0;
    let recWCount = 0;
    
    // For projecting future steps in empty rows
    let projectedCompoundAmount = currentCompoundAmount;
    let projectedCompoundStreak = currentCompoundStreak;
    let projectedLossAccumulator = 0;
    let projectedRecTCount = 0;
    let projectedRecWCount = 0;

    const calculatedTrades = tradesInput.map((trade, index) => {
      let recommendedAmount = 0;
      
      if (currentStatus === "ACTIVE") {
          if (strategyMode === "COMPOUND") {
             if (trade.result === "-") {
               if (projectedLossAccumulator > 0) {
                 let remainingW = compoundRecoveryWins - projectedRecWCount;
                 if (compoundRecoveryTrades - projectedRecTCount <= remainingW) {
                     remainingW = Math.max(1, compoundRecoveryTrades - projectedRecTCount);
                 }
                 if (remainingW <= 0) remainingW = 1;
                 recommendedAmount = projectedLossAccumulator / (remainingW * compoundRewardRatio);
                 if (recommendedAmount > 0 && recommendedAmount < minTradeAmount) {
                     recommendedAmount = minTradeAmount;
                 }
                 
                 let simProfit = recommendedAmount * compoundRewardRatio;
                 projectedLossAccumulator -= simProfit;
                 projectedRecWCount++;
                 projectedRecTCount++;
                 
                 if (projectedLossAccumulator <= 0.001 || projectedRecTCount >= compoundRecoveryTrades || projectedRecWCount >= compoundRecoveryWins) {
                     projectedLossAccumulator = 0;
                     projectedRecTCount = 0;
                     projectedRecWCount = 0;
                     projectedCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                     projectedCompoundStreak = 0;
                 }
               } else {
                 recommendedAmount = projectedCompoundAmount;
                 if (recommendedAmount > 0 && recommendedAmount < minTradeAmount) {
                     recommendedAmount = minTradeAmount;
                 }
                 let simulatedReturnVal = recommendedAmount * compoundRewardRatio;
                 projectedCompoundStreak++;
                 if (projectedCompoundStreak >= compoundSteps) {
                   projectedCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                   projectedCompoundStreak = 0;
                 } else {
                   const reinvestmentProfit = simulatedReturnVal * (compoundReinvestRatio / 100);
                   projectedCompoundAmount = recommendedAmount + reinvestmentProfit;
                   if (projectedCompoundStreak === compoundCashoutStep) {
                     const safeAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                     if (projectedCompoundAmount > safeAmount * 1.2) {
                       projectedCompoundAmount -= safeAmount;
                     }
                   }
                 }
               }
             } else {
               if (compoundLossAccumulator > 0) {
                 let remainingW = compoundRecoveryWins - recWCount;
                 if (compoundRecoveryTrades - recTCount <= remainingW) {
                     remainingW = Math.max(1, compoundRecoveryTrades - recTCount);
                 }
                 if (remainingW <= 0) remainingW = 1;
                 recommendedAmount = compoundLossAccumulator / (remainingW * safePayout);
                 if (recommendedAmount > 0 && recommendedAmount < minTradeAmount) {
                     recommendedAmount = minTradeAmount;
                 }
               } else {
                 recommendedAmount = currentCompoundAmount;
                 if (recommendedAmount > 0 && recommendedAmount < minTradeAmount) {
                     recommendedAmount = minTradeAmount;
                 }
               }
             }
          } else {
            const nextL = getDP(tCount + 1, wCount);
            const nextW = getDP(tCount + 1, wCount + 1);
            
            if (isFinite(nextW)) {
               if (isFinite(nextL)) {
                  const multiplier = 1 - ((payoutMult * nextW) / (nextL + (payoutMult - 1) * nextW));
                  recommendedAmount = multiplier * runningBalance;
               } else {
                  // Must win case - logically corresponds to multiplier 1.0 (bet everything)
                  // to reach the target defined by the DP sequence.
                  recommendedAmount = runningBalance;
               }
            } else if (strategyMode === "CAPITAL") {
               const remainingWins = Math.max(1, capRecoveryWins - wCount);
               const currentNet = runningBalance - initialCapital;
               const remCapTarget = baseCapitalTarget - currentNet;
               recommendedAmount = remCapTarget > 0 ? remCapTarget / (remainingWins * safePayout) : 0;
            } else {
               const currentNet = runningBalance - initialCapital;
               const remainingTarget = targetMoney - currentNet;
               if (remainingTarget > 0) {
                  recommendedAmount = remainingTarget / safePayout;
               }
            }
          }
      }

      const isAutoCalculated = trade.customAmount === "";
      const actualAmount = isAutoCalculated
        ? recommendedAmount
        : evaluateMath(trade.customAmount);

      let returnVal = 0;
      if (trade.result === "W") {
        returnVal = actualAmount * (strategyMode === "COMPOUND" ? compoundRewardRatio : safePayout);
        wCount++;
        tCount++;
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak;
        
        if (strategyMode === "COMPOUND") {
          if (compoundLossAccumulator > 0) {
            compoundLossAccumulator -= returnVal;
            recWCount++;
            recTCount++;
            if (compoundLossAccumulator <= 0.001 || recTCount >= compoundRecoveryTrades || recWCount >= compoundRecoveryWins) {
                compoundLossAccumulator = 0;
                recTCount = 0;
                recWCount = 0;
                currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                currentCompoundStreak = 0;
            }
          } else {
            currentCompoundStreak++;
            if (currentCompoundStreak >= compoundSteps) {
              currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
              currentCompoundStreak = 0;
            } else {
              const reinvestmentProfit = returnVal * (compoundReinvestRatio / 100);
              currentCompoundAmount = actualAmount + reinvestmentProfit;
              if (currentCompoundStreak === compoundCashoutStep) {
                const safeAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                if (currentCompoundAmount > safeAmount * 1.2) {
                  currentCompoundAmount -= safeAmount;
                }
              }
            }
          }
          projectedCompoundAmount = currentCompoundAmount;
          projectedCompoundStreak = currentCompoundStreak;
          projectedLossAccumulator = compoundLossAccumulator;
          projectedRecTCount = recTCount;
          projectedRecWCount = recWCount;
        }
      } else if (trade.result === "L") {
        returnVal = -actualAmount;
        lCount++;
        tCount++;
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
        
        if (strategyMode === "COMPOUND") {
          let wasInRecovery = compoundLossAccumulator > 0;
          compoundLossAccumulator += actualAmount;
          if (wasInRecovery) {
            recTCount++;
          }
          if (wasInRecovery && recTCount >= compoundRecoveryTrades) {
             compoundLossAccumulator = 0;
             recTCount = 0;
             recWCount = 0;
             currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
             currentCompoundStreak = 0;
          } else {
             currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
             currentCompoundStreak = 0;
          }
          projectedCompoundAmount = currentCompoundAmount;
          projectedCompoundStreak = 0;
          projectedLossAccumulator = compoundLossAccumulator;
          projectedRecTCount = recTCount;
          projectedRecWCount = recWCount;
        }
      }

      runningBalance += returnVal;
      if (runningBalance > maxPeak) maxPeak = runningBalance;
      if (runningBalance < maxDrawdown) maxDrawdown = runningBalance;

      if (
        (strategyMode === "TARGET" || strategyMode === "COMPOUND") &&
        runningBalance >= initialCapital + targetMoney - 0.001
      ) {
        currentStatus = "TARGET_HIT";
      } else if (
        strategyMode === "CAPITAL" &&
        wCount >= capRecoveryWins
      ) {
        currentStatus = "TARGET_HIT";
      } else if (runningBalance <= stopLossMoney + 0.001) {
        currentStatus = "STOP_LOSS";
      } else if (
        (strategyMode === "TARGET" || strategyMode === "COMPOUND") && maxLossLimit > 0 && lCount >= maxLossLimit
      ) {
        currentStatus = "MAX_LOSS";
      } else if (
        strategyMode === "CAPITAL" && tCount >= capTotalSteps && wCount < capRecoveryWins
      ) {
        currentStatus = "MAX_LOSS";
      }

      const isActive =
        trade.result === "-" &&
        (index === 0 || tradesInput[index - 1].result !== "-");

      return {
        ...trade,
        recommendedAmount,
        actualAmount,
        isAutoCalculated,
        returnVal,
        balance: runningBalance,
        isActive,
        rowStatus: currentStatus,
      };
    });

    // 3. Aggregate Stats (Current Session)
    const winRate = tCount > 0 ? (wCount / tCount) * 100 : 0;
    const winProfit = runningBalance - initialCapital;
    const accountGain =
      initialCapital > 0 ? (winProfit / initialCapital) * 100 : 0;

    // 4. Aggregate Stats (Overall / Global)
    const overallTrades = accumulatedStats.trades + tCount;
    const overallWins = accumulatedStats.wins + wCount;
    const overallLosses = accumulatedStats.losses + lCount;
    const overallWinRate =
      overallTrades > 0 ? (overallWins / overallTrades) * 100 : 0;
    const overallProfit = runningBalance - accumulatedStats.startingCapital;
    const overallGain =
      accumulatedStats.startingCapital > 0
        ? (overallProfit / accumulatedStats.startingCapital) * 100
        : 0;

    // Daily Goals Estimation (Macro)
    const macroTargetAmount =
      macroGoalFormat === "%"
        ? initialCapital * (macroGoalTarget / 100)
        : macroGoalTarget;
    const macroAccountGain =
      initialCapital > 0 ? (macroTargetAmount / initialCapital) * 100 : 0;
    const macroCapitalFinal = initialCapital + macroTargetAmount;

    let expectedSessionProfit = 0;
    let capReqCapital = 0;
    if (strategyMode === "CAPITAL") {
      const dpFull = getDP(0, 0);
      expectedSessionProfit = isFinite(dpFull) ? initialCapital * (dpFull - 1) : 0;
      
      const dpL_first = getDP(1, 0);
      const dpW_first = getDP(1, 1);
      if (isFinite(dpL_first) && isFinite(dpW_first)) {
        const firstTradeMult = 1 - ((payoutMult * dpW_first) / (dpL_first + (payoutMult - 1) * dpW_first));
        capReqCapital = firstTradeMult > 0 ? capBaseTrade / firstTradeMult : 0;
      }
    } else {
      expectedSessionProfit = targetMoney;
    }
    let calculatedSessionsRequired =
      expectedSessionProfit > 0
        ? Math.ceil(macroTargetAmount / expectedSessionProfit)
        : 0;
        
    // Bad Streak Simulation: E.g., Har 3 din baad ek loss
    if (calculatedSessionsRequired > 0 && expectedSessionProfit > 0) {
        const cycleNet = (expectedSessionProfit * 3) - (initialCapital * (stopLossPercent / 100));
        if (cycleNet > 0) {
            const cycles = Math.ceil(macroTargetAmount / cycleNet);
            calculatedSessionsRequired = cycles * 4;
        }
    }

    const activeTrade = calculatedTrades.find((t) => t.isActive);
    const nextTradeAmt = activeTrade ? activeTrade.recommendedAmount : 0;

    // 5. Simulate Forward-Looking Sequence
    let simBalance = runningBalance;
    let simSeq: {
      step: number | string;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      totalRisked: number;
      profitIfWon: number;
    }[] = [];

    if (currentStatus === "ACTIVE") {
      if (strategyMode === "COMPOUND") {
        let compoundAmt = 0;
        let cStreak = currentCompoundStreak;
        let cLossAcc = compoundLossAccumulator;
        let cRecT = recTCount;
        let cRecW = recWCount;
        let bal = simBalance;
        let startBal = runningBalance - (currentCompoundAmount - (capBaseTrade > 0 ? capBaseTrade : initialCapital)); // Rough estimate of cycle start

        for (let i = 0; i < Math.min(15, compoundSteps + 2); i++) {
          if (cLossAcc > 0) {
             let remainingW = compoundRecoveryWins - cRecW;
             if (compoundRecoveryTrades - cRecT <= remainingW) {
                 remainingW = Math.max(1, compoundRecoveryTrades - cRecT);
             }
             if (remainingW <= 0) remainingW = 1;
             compoundAmt = cLossAcc / (remainingW * compoundRewardRatio);
             if (compoundAmt > 0 && compoundAmt < minTradeAmount) {
                 compoundAmt = minTradeAmount;
             }
          } else {
             compoundAmt = (i === 0 && nextTradeAmt > 0) ? nextTradeAmt : (cStreak === 0 ? (capBaseTrade > 0 ? capBaseTrade : initialCapital) : compoundAmt);
             if (compoundAmt > 0 && compoundAmt < minTradeAmount) {
                 compoundAmt = minTradeAmount;
             }
          }

          if (compoundAmt <= 0 || compoundAmt > bal) break;

          let balanceBefore = bal;
          let profitIfWon = compoundAmt * compoundRewardRatio;
          let balanceAfterWin = bal + profitIfWon;
          
          simSeq.push({
            step: cLossAcc > 0 ? `R${cRecT + 1}` : cStreak + 1,
            amount: compoundAmt,
            balanceBefore: bal,
            balanceAfter: balanceAfterWin,
            totalRisked: compoundAmt, 
            profitIfWon,
          });
          
          bal = balanceAfterWin; 
          
          if (cLossAcc > 0) {
              cLossAcc -= profitIfWon;
              cRecT++;
              cRecW++;
              if (cLossAcc <= 0.001 || cRecT >= compoundRecoveryTrades || cRecW >= compoundRecoveryWins) {
                  cLossAcc = 0;
                  cRecT = 0;
                  cRecW = 0;
                  cStreak = 0;
                  compoundAmt = capBaseTrade > 0 ? capBaseTrade : initialCapital;
              }
          } else {
              cStreak++;
              if (cStreak >= compoundSteps) {
                  break; 
              } else {
                  let reinvestProfit = profitIfWon * (compoundReinvestRatio / 100);
                  compoundAmt = compoundAmt + reinvestProfit;
                  if (cStreak === compoundCashoutStep) {
                      const safeAmt = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                      if (compoundAmt > safeAmt * 1.2) {
                          compoundAmt -= safeAmt;
                      }
                  }
              }
          }
        }
      } else {
        let cumLoss = 0;
        let tempBalance = simBalance;
        const maxRemainingSteps = maxT - tCount;
        
        for (let i = 0; i < Math.min(15, maxRemainingSteps); i++) {
          const nextL = getDP(tCount + i + 1, wCount);
          const nextW = getDP(tCount + i + 1, wCount + 1);
          
          let amt = 0;
          if (isFinite(nextW)) {
            if (isFinite(nextL)) {
              const multiplier = 1 - ((payoutMult * nextW) / (nextL + (payoutMult - 1) * nextW));
              amt = multiplier * tempBalance;
            } else {
              // Must win
              amt = tempBalance;
            }
          } else if (strategyMode === "CAPITAL") {
            const currentNet = tempBalance - initialCapital;
            const remainingWins = Math.max(1, capRecoveryWins - wCount);
            const remCapTarget = baseCapitalTarget - currentNet;
            amt = remCapTarget > 0 ? remCapTarget / (remainingWins * safePayout) : 0;
          } else {
            const currentNet = tempBalance - initialCapital;
            const remainingTarget = targetMoney - currentNet;
            amt = (remainingTarget + cumLoss) / safePayout;
          }

          if (amt <= 0 || amt > tempBalance) break;
          
          let balanceBefore = tempBalance;
          cumLoss += amt;
          tempBalance -= amt;
          let profitIfWon = amt * safePayout;
          
          simSeq.push({
            step: i + 1,
            amount: amt,
            balanceBefore,
            balanceAfter: tempBalance,
            totalRisked: cumLoss,
            profitIfWon,
          });
        }
      }
    }

    const isTargetHit =
      strategyMode === "TARGET"
        ? runningBalance >= initialCapital + targetMoney - 0.001
        : runningBalance >= initialCapital + targetMoney - 0.001;

    return {
      targetMoney,
      stopLossMoney,
      safePayout,
      runningBalance,
      wCount,
      lCount,
      tCount,
      currentStatus,
      calculatedTrades,
      winRate,
      winProfit,
      accountGain,
      overallTrades,
      overallWins,
      overallLosses,
      overallWinRate,
      overallProfit,
      overallGain,
      macroTargetAmount,
      macroAccountGain,
      macroCapitalFinal,
      expectedSessionProfit,
      capReqCapital,
      calculatedSessionsRequired,
      activeTrade,
      nextTradeAmt,
      simSeq,
      isTargetHit,
      maxPeak,
      maxDrawdown,
      maxConsecutiveWins,
      maxConsecutiveLosses
    };
  }, [
    dailyGoalFormat,
    initialCapital,
    profitTarget,
    stopLossPercent,
    payout,
    strategyMode,
    capRecoveryWins,
    capTotalSteps,
    tradesInput,
    maxLossLimit,
    accumulatedStats,
    macroGoalFormat,
    macroGoalTarget,
    capBaseTrade,
    automatedWins
  ]);

  // --- HANDLERS ---
  const handleTradeChange = (
    id: number,
    field: keyof TradeState,
    value: any,
  ) => {
    setTradesInput((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handleDeleteTrade = (id: number) => {
    setTradesInput((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      const newRows = [
        ...filtered,
        { id: maxTrades, result: "-", customAmount: "" },
      ];
      return newRows.map((t, index) => ({ ...t, id: index + 1 }));
    });
    showToast(`Trade ${id} removed`, "success");
  };

  // Clears ONLY the trade log, keeps history and session count
  const clearBoard = (showNotification = true) => {
    setTradesInput(
      Array.from({ length: maxTrades }, (_, i) => ({
        id: i + 1,
        result: "-",
        customAmount: "",
      })),
    );
    if (showNotification)
      showToast("Trade log cleared. History preserved.", "success");
  };

  // Hard Reset: Clears EVERYTHING back to Day 1
  const hardReset = () => {
    confirmAction(
      "Hard Reset",
      "Are you sure you want to hard reset? This will clear ALL history, sessions, and reset everything back to Day 1.",
      () => {
        setTradesInput(
          Array.from({ length: maxTrades }, (_, i) => ({
            id: i + 1,
            result: "-",
            customAmount: "",
          })),
        );
        setSessionCount(0);
        setInitialCapital(accumulatedStats.startingCapital);
        setAccumulatedStats((prev) => ({
          trades: 0,
          wins: 0,
          losses: 0,
          startingCapital: prev.startingCapital,
        }));
        setPastSessions([]);
        setSessionNotes("");
        showToast("Hard Reset Complete. Back to Session 0.", "success");
      },
    );
  };

  // Reset Current Session: Clears trade log and resets capital to start of session
  const resetCurrentSession = () => {
    confirmAction(
      "Reset Session",
      "Are you sure you want to reset the current session? This will clear your current trades and reset the session capital without affecting history.",
      () => {
        setTradesInput(
          Array.from({ length: maxTrades }, (_, i) => ({
            id: i + 1,
            result: "-",
            customAmount: "",
          })),
        );

        // Reset initial capital to what it was at the start of this session
        if (pastSessions.length > 0) {
          setInitialCapital(pastSessions[0].endingCapital);
        } else {
          setInitialCapital(accumulatedStats.startingCapital);
        }

        setAlertedStatuses([]);
        setSessionNotes("");
        setCompletionModal({ show: false, type: "", message: "" });
        showToast("Current session reset", "success");
      },
    );
  };

  const handleCompleteSession = () => {
    setShowSessionSummary(true);
  };

  const executeCompleteSession = () => {
    const newCapital = parseFloat(runningBalance.toFixed(2));

    // Save to past sessions
    const sessionRecord: PastSession = {
      id: sessionCount,
      date: new Date().toISOString(),
      startingCapital: initialCapital,
      endingCapital: newCapital,
      profit: newCapital - initialCapital,
      trades: tCount,
      wins: wCount,
      losses: lCount,
      winRate: tCount > 0 ? (wCount / tCount) * 100 : 0,
      strategyMode: strategyMode,
      notes: sessionNotes,
      maxPeak: maxPeak,
      maxDrawdown: maxDrawdown,
      maxConsecutiveWins: maxConsecutiveWins,
      maxConsecutiveLosses: sessionMaxConsecutiveLosses,
    };
    setPastSessions((prev) => [sessionRecord, ...prev]);

    // 1. Save current session stats to global history
    setAccumulatedStats((prev) => ({
      ...prev,
      trades: prev.trades + tCount,
      wins: prev.wins + wCount,
      losses: prev.losses + lCount,
    }));

    // 2. Auto-Compound: Set new running balance as initial capital for next session
    setInitialCapital(newCapital);

    // 3. Auto-Upgrade Session
    if (options.autoCountSession) {
      setSessionCount((prev) => prev + 1);
    }

    // 4. Clear Board
    setTradesInput(
      Array.from({ length: maxTrades }, (_, i) => ({
        id: i + 1,
        result: "-",
        customAmount: "",
      })),
    );

    // 5. Auto-Copy Balance
    if (options.autoCopyBalance) {
      try {
        navigator.clipboard.writeText(newCapital.toString());
      } catch (err) {
        console.error("Failed to copy balance to clipboard", err);
      }
    }

    // 6. Reset Alerts & Notes
    setAlertedStatuses([]);
    setSessionNotes("");
    setCompletionModal({ show: false, type: "", message: "" });
    setShowSessionSummary(false);

    showToast(
      `Session Logged! Capital compounded to ${currency}${newCapital}`,
      "success",
    );
  };

  const handleCompleteSessionRef = useRef(executeCompleteSession);
  useEffect(() => {
    handleCompleteSessionRef.current = executeCompleteSession;
  });

  // --- LIVE CURRENCY FETCH ---
  useEffect(() => {
    if (activeHeaderTab !== "CONVERTER" || !useLiveRate) return;

    const fetchLiveRate = async () => {
      setIsLiveRateLoading(true);
      try {
        const res = await fetch(
          `https://api.coinbase.com/v2/exchange-rates?currency=${convFrom}`,
        );
        const data = await res.json();
        if (data && data.data && data.data.rates && data.data.rates[convTo]) {
          setLiveRate(Number(data.data.rates[convTo]));
          setConvRate(data.data.rates[convTo]);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Failed to fetch live rate", err);
      } finally {
        setIsLiveRateLoading(false);
      }
    };

    fetchLiveRate();
    const intervalId = setInterval(fetchLiveRate, 10000); // Every 10 seconds

    return () => clearInterval(intervalId);
  }, [activeHeaderTab, convFrom, convTo, useLiveRate]);

  // --- ALERTS & AUTO-COMPLETE ENGINE ---
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (tCount > 0) {
      let alertType = "";
      let alertMessage = "";

      if (
        currentStatus === "STOP_LOSS" ||
        runningBalance <= stopLossMoney + 0.001
      ) {
        alertType = "STOP_LOSS";
        alertMessage = `Stop Loss Reached! Balance dropped to ${currency}${runningBalance.toFixed(2)}`;
      } else if (
        currentStatus === "MAX_LOSS" ||
        (maxLossLimit > 0 && lCount >= maxLossLimit)
      ) {
        alertType = "MAX_LOSS";
        alertMessage = `Max Loss Limit Reached! (${lCount} losses)`;
      } else if (isTargetHit && currentStatus === "TARGET_HIT") {
        alertType = "TARGET_HIT";
        alertMessage = `Target Hit! Profit goal achieved.`;
      } else if (tCount >= maxTrades) {
        alertType = "MAX_TRADES";
        alertMessage = `Max Trades Reached!`;
      } else {
        const allowedLoss = initialCapital - stopLossMoney;
        const currentLoss = initialCapital - runningBalance;
        if (
          allowedLoss > 0 &&
          currentLoss >= allowedLoss * (stopLossAlertPct / 100)
        ) {
          alertType = "STOP_LOSS_WARNING";
          alertMessage = `Warning: You have reached ${stopLossAlertPct}% of your Stop Loss limit!`;
        } else if (
          options.lowTradeAlert &&
          tCount >= Math.ceil(maxTrades / 2) &&
          maxTrades - tCount > 0
        ) {
          alertType = "LOW_TRADES_WARNING";
          alertMessage = `Halfway Point: 50% trades used! Only ${maxTrades - tCount} remaining.`;
        }
      }

      if (alertType && !alertedStatuses.includes(alertType)) {
        if (alertType.includes("WARNING")) {
          showToast(alertMessage, "warning");
          setAlertedStatuses((prev) => [...prev, alertType]);
        } else if (options.autoCompleteSession) {
          showToast(
            `${alertMessage} Auto-completing...`,
            alertType === "TARGET_HIT" ? "success" : "warning",
          );
          setAlertedStatuses((prev) => [...prev, alertType]);
          timeoutId = setTimeout(
            () => handleCompleteSessionRef.current(),
            2000,
          );
        } else if (options.sessionEndAlert) {
          setCompletionModal({
            show: true,
            type: alertType,
            message: alertMessage,
          });
          setAlertedStatuses((prev) => [...prev, alertType]);
        }
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isTargetHit,
    currentStatus,
    tCount,
    lCount,
    maxTrades,
    options.autoCompleteSession,
    options.sessionEndAlert,
    options.lowTradeAlert,
    alertedStatuses,
    currency,
    runningBalance,
    stopLossMoney,
    maxLossLimit,
    stopLossAlertPct,
    initialCapital,
  ]);

  function restoreStateFromCloud(parsed: any, rawStateString?: string) {
    isRestoringRef.current = true;
    
    // Save to local storage immediately to prevent infinite loops with onSnapshot
    try {
      if (rawStateString) {
        localStorage.setItem(STORAGE_KEY, rawStateString);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.error("Failed to save restored state to localStorage", e);
    }

    setInitialCapital(parsed.initialCapital ?? 100);
    setCurrency(parsed.currency ?? "$");
    setStrategyMode(parsed.strategyMode ?? "TARGET");
    setProfitTarget(parsed.profitTarget ?? 10);
    setDailyGoalFormat(parsed.dailyGoalFormat ?? "%");
    setMacroGoalTarget(parsed.macroGoalTarget ?? 100);
    setMacroGoalFormat(parsed.macroGoalFormat ?? "%");
    setStopLossPercent(parsed.stopLossPercent ?? 10);
    setMaxLossLimit(parsed.maxLossLimit ?? 0);
    setMaxTrades(parsed.maxTrades ?? 10);
    setCapTotalSteps(parsed.capTotalSteps ?? 5);
    setCapRecoveryWins(parsed.capRecoveryWins ?? 1);
    setAutomatedWins(parsed.automatedWins ?? 2);
    setOptions(parsed.options ?? options);
    setSessionCount(parsed.sessionCount ?? 0);
    setAppTheme(parsed.appTheme ?? 'dark');
    setTradesInput(
      parsed.tradesInput ??
        Array(10)
          .fill({ id: 0, result: "-", customAmount: "" })
          .map((_, i) => ({ id: i + 1, result: "-", customAmount: "" })),
    );
    setPastSessions(parsed.pastSessions ?? []);
    setAccumulatedStats(
      parsed.accumulatedStats ?? { trades: 0, wins: 0, losses: 0, profit: 0 },
    );
    setStopLossAlertPct(parsed.stopLossAlertPct ?? 20);

    // Give React time to render and run the save effect before allowing new saves
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 1000);
  };

  const toggleOption = async (key: keyof typeof options) => {
    if (typeof options[key] === "boolean") {
      setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleCopyBalance = () => {
    navigator.clipboard.writeText(runningBalance.toFixed(2));
    showToast(
      `Balance ${currency}${runningBalance.toFixed(2)} copied to clipboard!`,
      "success",
    );
  };

  const exportCurrentLogCSV = () => {
    const completedTrades = calculatedTrades.filter((t) => t.result !== "-");
    if (completedTrades.length === 0) {
      showToast("No completed trades to export.", "warning");
      return;
    }

    const headers = ["Trade #", "Result", "Amount", "Profit/Loss", "Balance"];
    const rows = completedTrades.map((t) => [
      t.id,
      t.result,
      t.actualAmount.toFixed(2),
      (t.result === "W" ? t.returnVal : -t.actualAmount).toFixed(2),
      t.balance.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `trade_log_session_${sessionCount}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Trade Log exported as CSV", "success");
  };

  const exportCurrentLogPDF = () => {
    const completedTrades = calculatedTrades.filter((t) => t.result !== "-");
    if (completedTrades.length === 0) {
      showToast("No completed trades to export.", "warning");
      return;
    }

    import("jspdf").then(({ default: jsPDF }) => {
      import("jspdf-autotable").then(({ default: autoTable }) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Trade Log - Session ${sessionCount}`, 14, 22);

        doc.setFontSize(11);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(
          `Initial Capital: ${currency}${initialCapital.toFixed(2)}`,
          14,
          36,
        );
        doc.text(
          `Ending Balance: ${currency}${runningBalance.toFixed(2)}`,
          14,
          42,
        );
        doc.text(
          `Profit: ${currency}${(runningBalance - initialCapital).toFixed(2)}`,
          14,
          48,
        );
        doc.text(
          `Win Rate: ${winRate.toFixed(1)}% (${wCount}W - ${lCount}L)`,
          14,
          54,
        );

        const tableColumn = [
          "Trade #",
          "Result",
          "Amount",
          "Profit/Loss",
          "Balance",
        ];
        const tableRows = completedTrades.map((t) => [
          t.id.toString(),
          t.result,
          `${currency}${t.actualAmount.toFixed(2)}`,
          `${t.result === "W" ? "+" : "-"}${currency}${Math.abs(t.result === "W" ? t.returnVal : t.actualAmount).toFixed(2)}`,
          `${currency}${t.balance.toFixed(2)}`,
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 60,
          theme: "grid",
          styles: { fontSize: 10 },
          headStyles: { fillColor: [15, 23, 42] },
        });

        doc.save(`trade_log_session_${sessionCount}.pdf`);
        showToast("Trade Log exported as PDF", "success");
      });
    });
  };

  const generateShareText = async (session: PastSession | null, theme: string, hideCapital: boolean, customUsername: string, customLink: string) => {
    const promoText = `\n\n🔗 Join Saify Khan Academy 🎓 Channel for more aggressively growth\nhttps://t.me/SaifyKhanAcademy${customLink ? `\n${customLink}` : ''}`;
    const brandName = "🪙 ALADDIN TRADE MANAGER";
    const username = customUsername ? `By ${customUsername}` : "";
    
    let text = "";
    if (session) {
      const isProfit = session.profit >= 0;
      const profitSign = isProfit ? "+" : "";
      const startBal = hideCapital ? "Hidden" : `${currency}${session.startingCapital.toFixed(2)}`;
      const endBal = hideCapital ? "Hidden" : `${currency}${session.endingCapital.toFixed(2)}`;
      const profitVal = hideCapital ? "Hidden" : `${profitSign}${currency}${session.profit.toFixed(2)}`;

      text = `${brandName}${username ? `\n${username}` : ''}\n\nSession #${session.id} - ${formatDate(session.date)}\nMode: ${session.strategyMode}\nStart Balance: ${startBal}\nEnd Balance: ${endBal}\nProfit: ${profitVal}\nWin Rate: ${session.winRate.toFixed(1)}% (${session.wins}W / ${session.losses}L)\nMax Peak: ${hideCapital ? "Hidden" : `${currency}${session.maxPeak?.toFixed(2) || '0.00'}`}\nMax Drawdown: ${hideCapital ? "Hidden" : `${currency}${session.maxDrawdown?.toFixed(2) || '0.00'}`}\nMax Win Streak: ${session.maxConsecutiveWins || 0}\nMax Loss Streak: ${session.maxConsecutiveLosses || 0}\n${session.notes ? `Notes: ${session.notes}` : ''}${promoText}`;
    } else {
      const isProfit = overallProfit >= 0;
      const profitSign = isProfit ? "+" : "";
      const startBal = hideCapital ? "Hidden" : `${currency}${accumulatedStats.startingCapital.toFixed(2)}`;
      const currentBal = hideCapital ? "Hidden" : `${currency}${runningBalance.toFixed(2)}`;
      const profitVal = hideCapital ? "Hidden" : `${profitSign}${currency}${overallProfit.toFixed(2)}`;
      const gainVal = `${profitSign}${overallGain.toFixed(1)}%`;

      text = `${brandName}${username ? `\n${username}` : ''}\n\n📊 Overall Portfolio Performance\nStart Balance: ${startBal}\nCurrent Balance: ${currentBal}\nTotal Profit: ${profitVal} (${gainVal})\nWin Rate: ${overallWinRate.toFixed(1)}% (${overallWins}W / ${overallLosses}L)\nTotal Sessions: ${sessionCount}${promoText}`;
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Trade Session',
          text: text,
        });
        showToast("Shared successfully!", "success");
      } catch (err) {
        navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!", "success");
      }
    } else {
      navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!", "success");
    }
  };

  const generateShareImage = async (session: PastSession | null, theme: string, hideCapital: boolean, customUsername: string, customLink: string) => {
    const escapeHtml = (unsafe: string) => {
      return unsafe
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
    }
    const promoText = `\n\n🔗 Join Saify Khan Academy 🎓 Channel for more aggressively growth\nhttps://t.me/SaifyKhanAcademy${customLink ? `\n${customLink}` : ''}`;
    const brandName = "🪙 ALADDIN TRADE MANAGER";
    const username = customUsername;

    const bgColor = theme === 'light' ? '#f8fafc' : theme === 'blue' ? '#1e3a8a' : '#0f172a';
    const textColor = theme === 'light' ? '#0f172a' : '#f8fafc';
    const cardBg = theme === 'light' ? '#ffffff' : theme === 'blue' ? '#1e40af' : '#1e293b';
    const borderColor = theme === 'light' ? '#e2e8f0' : theme === 'blue' ? '#3b82f6' : '#334155';
    const mutedColor = theme === 'light' ? '#64748b' : '#94a3b8';

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '400px';
    container.style.backgroundColor = bgColor;
    container.style.color = textColor;
    container.style.padding = '24px';
    container.style.borderRadius = '16px';
    container.style.fontFamily = 'system-ui, sans-serif';

    if (session) {
      const isProfit = session.profit >= 0;
      const profitSign = isProfit ? "+" : "";
      const profitColor = isProfit ? "#34d399" : "#fb7185";
      
      const startBal = hideCapital ? "Hidden" : `${currency}${session.startingCapital.toFixed(2)}`;
      const endBal = hideCapital ? "Hidden" : `${currency}${session.endingCapital.toFixed(2)}`;
      const profitVal = hideCapital ? "Hidden" : `${profitSign}${currency}${session.profit.toFixed(2)}`;
      const maxPeakVal = hideCapital ? "Hidden" : `${currency}${session.maxPeak?.toFixed(2) || '0.00'}`;
      const maxDrawdownVal = hideCapital ? "Hidden" : `${currency}${session.maxDrawdown?.toFixed(2) || '0.00'}`;

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #fbbf24;">${brandName}</h1>
          ${username ? `<p style="font-size: 16px; font-weight: 600; margin: 4px 0 0 0; color: #ffffff;">By ${escapeHtml(username)}</p>` : ''}
          <p style="color: ${mutedColor}; margin: 4px 0 0 0; font-size: 14px;">Session #${session.id} • ${formatDate(session.date)}</p>
        </div>
        <div style="background: ${cardBg}; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Strategy Mode</span>
            <span style="font-weight: bold; color: #60a5fa;">${session.strategyMode}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Start Balance</span>
            <span style="font-family: monospace; font-weight: bold;">${startBal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">End Balance</span>
            <span style="font-family: monospace; font-weight: bold;">${endBal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid ${borderColor};">
            <span style="color: ${mutedColor};">Net Profit</span>
            <span style="font-family: monospace; font-weight: bold; font-size: 18px; color: ${hideCapital ? textColor : profitColor};">${profitVal}</span>
          </div>
        </div>
        <div style="background: ${cardBg}; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Win Rate</span>
            <span style="font-weight: bold;">${session.winRate.toFixed(1)}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Trades (W/L)</span>
            <span style="font-weight: bold;">${session.trades} (<span style="color: #34d399;">${session.wins}</span> / <span style="color: #fb7185;">${session.losses}</span>)</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Max Peak</span>
            <span style="font-family: monospace; font-weight: bold; color: #34d399;">${maxPeakVal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Max Drawdown</span>
            <span style="font-family: monospace; font-weight: bold; color: #fb7185;">${maxDrawdownVal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Max Win Streak</span>
            <span style="font-weight: bold; color: #34d399;">${session.maxConsecutiveWins || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: ${mutedColor};">Max Loss Streak</span>
            <span style="font-weight: bold; color: #fb7185;">${session.maxConsecutiveLosses || 0}</span>
          </div>
        </div>
        ${session.notes ? `<div style="margin-top: 16px; padding: 12px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; font-size: 14px; color: ${textColor}; font-style: italic;">"${session.notes}"</div>` : ''}
        <div style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px dashed ${borderColor};">
          <div>
            <p style="margin: 0; font-size: 14px; color: ${textColor};">🔗 Join <strong style="color: #60a5fa;">Saify Khan Academy 🎓</strong> Channel</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: ${mutedColor};">for more aggressively growth</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #38bdf8; font-weight: bold;">t.me/SaifyKhanAcademy</p>
            ${customLink ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: #fbbf24; font-weight: bold;">${escapeHtml(customLink)}</p>` : ''}
          </div>
          <div id="qr-code-container" style="background: white; padding: 4px; border-radius: 8px;"></div>
        </div>
      `;
    } else {
      const isProfit = overallProfit >= 0;
      const profitSign = isProfit ? "+" : "";
      const profitColor = isProfit ? "#34d399" : "#fb7185";
      
      const startBal = hideCapital ? "Hidden" : `${currency}${accumulatedStats.startingCapital.toFixed(2)}`;
      const currentBal = hideCapital ? "Hidden" : `${currency}${runningBalance.toFixed(2)}`;
      const profitVal = hideCapital ? "Hidden" : `${profitSign}${currency}${overallProfit.toFixed(2)}`;
      const gainVal = `${profitSign}${overallGain.toFixed(1)}%`;

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #fbbf24;">${brandName}</h1>
          ${username ? `<p style="font-size: 16px; font-weight: 600; margin: 4px 0 0 0; color: #ffffff;">By ${escapeHtml(username)}</p>` : ''}
          <p style="color: ${mutedColor}; margin: 4px 0 0 0; font-size: 14px;">📊 Overall Portfolio Performance</p>
        </div>
        <div style="background: ${cardBg}; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Start Balance</span>
            <span style="font-family: monospace; font-weight: bold;">${startBal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Current Balance</span>
            <span style="font-family: monospace; font-weight: bold;">${currentBal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid ${borderColor};">
            <span style="color: ${mutedColor};">Total Profit</span>
            <span style="font-family: monospace; font-weight: bold; font-size: 18px; color: ${hideCapital ? textColor : profitColor};">${profitVal} <span style="font-size: 14px; opacity: 0.8;">(${gainVal})</span></span>
          </div>
        </div>
        <div style="background: ${cardBg}; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Total Sessions</span>
            <span style="font-weight: bold;">${sessionCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: ${mutedColor};">Overall Win Rate</span>
            <span style="font-weight: bold;">${overallWinRate.toFixed(1)}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: ${mutedColor};">Total Trades (W/L)</span>
            <span style="font-weight: bold;">${overallTrades} (<span style="color: #34d399;">${overallWins}</span> / <span style="color: #fb7185;">${overallLosses}</span>)</span>
          </div>
        </div>
        <div style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px dashed ${borderColor};">
          <div>
            <p style="margin: 0; font-size: 14px; color: ${textColor};">🔗 Join <strong style="color: #60a5fa;">Saify Khan Academy 🎓</strong> Channel</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: ${mutedColor};">for more aggressively growth</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #38bdf8; font-weight: bold;">t.me/SaifyKhanAcademy</p>
            ${customLink ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: #fbbf24; font-weight: bold;">${escapeHtml(customLink)}</p>` : ''}
          </div>
          <div id="qr-code-container" style="background: white; padding: 4px; border-radius: 8px;"></div>
        </div>
      `;
    }

    document.body.appendChild(container);
    
    // Render QR Code
    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer) {
      const qrCanvas = document.createElement('canvas');
      qrContainer.appendChild(qrCanvas);
      try {
        const QRCode = await import('qrcode');
        await new Promise((resolve, reject) => {
          QRCode.toCanvas(qrCanvas, 'https://t.me/SaifyKhanAcademy', { width: 64, margin: 0 }, (error) => {
            if (error) reject(error);
            else resolve(true);
          });
        });
      } catch (e) {
        console.error("QR Code generation failed:", e);
      }
    }

    try {
      // Generate Image
      const canvas = await html2canvas(container, { backgroundColor: bgColor, scale: 2, logging: false });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      
      if (blob) {
        const fileName = session ? `trade-session-${session.id}.png` : `portfolio-performance.png`;
        const shareTitle = session ? 'My Trade Session' : 'My Portfolio Performance';
        const shareText = session 
          ? `${brandName}${username ? `\nBy ${username}` : ''}\n\nCheck out my latest trading session!${promoText}`
          : `${brandName}${username ? `\nBy ${username}` : ''}\n\nCheck out my overall portfolio performance!${promoText}`;
          
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText
          });
          showToast("Shared successfully!", "success");
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          showToast("Image downloaded!", "success");
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("User cancelled share");
      } else {
        console.error("Error generating image:", err);
        showToast("Error generating image. Please try again.", "error");
      }
    } finally {
      document.body.removeChild(container);
    }
  };

  const shareTrade = (session: PastSession, format: 'text' | 'image') => {
    setShareModal({
      show: true,
      session: session,
      theme: 'dark',
      hideCapital: false,
      customUsername: "",
    });
  };

  const exportHistoryCSV = () => {
    if (pastSessions.length === 0) {
      showToast("No history to export.", "warning");
      return;
    }

    const headers = [
      "Session #",
      "Date",
      "Mode",
      "Start Capital",
      "End Capital",
      "Profit",
      "Wins",
      "Losses",
      "Win Rate",
      "Notes",
    ];
    const rows = pastSessions.map((s) => [
      s.id,
      formatDate(s.date),
      s.strategyMode,
      s.startingCapital.toFixed(2),
      s.endingCapital.toFixed(2),
      s.profit.toFixed(2),
      s.wins,
      s.losses,
      s.winRate.toFixed(1) + "%",
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "trading_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("History exported as CSV", "success");
  };

  const exportHistoryPDF = () => {
    if (pastSessions.length === 0) {
      showToast("No history to export.", "warning");
      return;
    }

    import("jspdf").then(({ default: jsPDF }) => {
      import("jspdf-autotable").then(({ default: autoTable }) => {
        const doc = new jsPDF("landscape");

        doc.setFontSize(18);
        doc.text("Trading History", 14, 22);

        const tableColumn = [
          "Session",
          "Date",
          "Mode",
          "Start Bal",
          "End Bal",
          "Profit",
          "W/L",
          "Win Rate",
          "Notes",
        ];
        const tableRows = pastSessions.map((s) => [
          `#${s.id}`,
          formatDate(s.date),
          s.strategyMode,
          `${currency}${s.startingCapital.toFixed(2)}`,
          `${currency}${s.endingCapital.toFixed(2)}`,
          `${s.profit >= 0 ? "+" : ""}${currency}${s.profit.toFixed(2)}`,
          `${s.wins}W - ${s.losses}L`,
          `${s.winRate.toFixed(1)}%`,
          s.notes || "-",
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          theme: "grid",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [15, 23, 42] },
        });

        doc.save("trading_history.pdf");
        showToast("History exported as PDF", "success");
      });
    });
  };

  // --- FORMATTERS ---
  const formatMoney = (val: number) => `${currency}${val.toFixed(2)}`;
  const formatPercent = (val: number) => `${val.toFixed(2)}%`;
  const formatDate = (dateString: string) => {
    let d = dateString ? new Date(dateString) : new Date();
    if (isNaN(d.getTime())) {
      d = new Date();
    }
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // --- SIMULATOR ---
  const runDetailedSimulation = (sequence: string) => {
    let effectiveTargetMoney = profitTarget;
    if (dailyGoalFormat === "%") {
      let appliedPercent = profitTarget;
      if (initialCapital >= 10000 && profitTarget > 1) {
        appliedPercent = 1;
      }
      effectiveTargetMoney = initialCapital * (appliedPercent / 100);
    }
    const targetMoney = effectiveTargetMoney;
    const stopLossMoney = initialCapital * (1 - stopLossPercent / 100);
    const safePayout = payout > 0 ? payout / 100 : 0.01;

    const payoutMult = 1 + safePayout;
    const maxT = strategyMode === "CAPITAL" ? capTotalSteps : maxTrades;
    const reqW = strategyMode === "CAPITAL" ? capRecoveryWins : automatedWins;
    
    // DP Memoization for Backtester
    const dpMem: number[][] = Array.from({ length: maxT + 1 }, () => Array(reqW + 1).fill(-1));
    const getDP = (t: number, w: number): number => {
      if (w >= reqW) return 1.0;
      if (reqW - w === maxT - t) return Math.pow(payoutMult, maxT - t);
      if (reqW - w > maxT - t) return Infinity; 
      if (dpMem[t][w] !== -1) return dpMem[t][w];
      const nextL = getDP(t + 1, w);
      const nextW = getDP(t + 1, w + 1);
      let val = Infinity;
      if (isFinite(nextL) && isFinite(nextW)) {
          val = (payoutMult * nextL * nextW) / (nextL + (payoutMult - 1) * nextW);
      }
      dpMem[t][w] = val;
      return val;
    };

    let baseCapitalTarget = 0;
    if (strategyMode === "CAPITAL") {
      const M = 1 + 1 / (capRecoveryWins * safePayout);
      const L = Math.max(0, capTotalSteps - capRecoveryWins);
      baseCapitalTarget = initialCapital / (Math.pow(M, L + 1) - 1);
    }

    let simBalance = initialCapital;
    let tCount = 0;
    let wCount = 0;
    let maxDrawdown = initialCapital;
    let status = "ACTIVE";
    let lCount = 0;

    let currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
    let currentCompoundStreak = 0;
    let compoundLossAccumulator = 0;
    let recTCount = 0;
    let recWCount = 0;

    const trades = [];

    for (let i = 0; i < sequence.length; i++) {
      const result = sequence[i];
      const currentNet = simBalance - initialCapital;
      const remainingTarget = targetMoney - currentNet;
      
      let recommendedAmount = 0;
      if (status === "ACTIVE") {
        if (strategyMode === "COMPOUND") {
          if (compoundLossAccumulator > 0) {
             let remainingW = compoundRecoveryWins - recWCount;
             if (compoundRecoveryTrades - recTCount <= remainingW) {
                 remainingW = Math.max(1, compoundRecoveryTrades - recTCount);
             }
             if (remainingW <= 0) remainingW = 1;
             recommendedAmount = compoundLossAccumulator / (remainingW * compoundRewardRatio);
             if (recommendedAmount > 0 && recommendedAmount < minTradeAmount) {
                 recommendedAmount = minTradeAmount;
             }
          } else {
            recommendedAmount = currentCompoundAmount;
            if (recommendedAmount > 0 && recommendedAmount < minTradeAmount) {
                recommendedAmount = minTradeAmount;
            }
          }
        } else {
          const nextL = getDP(tCount + 1, wCount);
          const nextW = getDP(tCount + 1, wCount + 1);
          
          if (isFinite(nextW)) {
             if (isFinite(nextL)) {
                const multiplier = 1 - ((payoutMult * nextW) / (nextL + (payoutMult - 1) * nextW));
                recommendedAmount = multiplier * simBalance;
             } else {
                recommendedAmount = simBalance;
             }
          } else if (strategyMode === "CAPITAL") {
             const remainingWins = Math.max(1, capRecoveryWins - wCount);
             const currentNet = simBalance - initialCapital;
             const remCapTarget = baseCapitalTarget - currentNet;
             recommendedAmount = remCapTarget > 0 ? remCapTarget / (remainingWins * safePayout) : 0;
          } else {
             const currentNet = simBalance - initialCapital;
             const remainingTarget = targetMoney - currentNet;
             if (remainingTarget > 0) {
                recommendedAmount = remainingTarget / safePayout;
             }
          }
        }
      }

      if (status !== "ACTIVE" || recommendedAmount <= 0) {
        break;
      }

      let profit = 0;
      if (result === "W") {
        profit = recommendedAmount * (strategyMode === "COMPOUND" ? compoundRewardRatio : safePayout);
        simBalance += profit;
        wCount++;
        if (strategyMode === "COMPOUND") {
          if (compoundLossAccumulator > 0) {
            compoundLossAccumulator -= profit;
            recWCount++;
            recTCount++;
            if (compoundLossAccumulator <= 0.001 || recTCount >= compoundRecoveryTrades || recWCount >= compoundRecoveryWins) {
                compoundLossAccumulator = 0;
                recTCount = 0;
                recWCount = 0;
                currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                currentCompoundStreak = 0;
            }
          } else {
            currentCompoundStreak++;
            if (currentCompoundStreak >= compoundSteps) {
              currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
              currentCompoundStreak = 0;
            } else {
              const reinvestmentProfit = profit * (compoundReinvestRatio / 100);
              currentCompoundAmount = recommendedAmount + reinvestmentProfit;
              if (currentCompoundStreak === compoundCashoutStep) {
                const safeAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
                if (currentCompoundAmount > safeAmount * 1.2) {
                  currentCompoundAmount -= safeAmount;
                }
              }
            }
          }
        }
      } else if (result === "L") {
        profit = -recommendedAmount;
        simBalance -= recommendedAmount;
        lCount++;
        if (strategyMode === "COMPOUND") {
          let wasInRecovery = compoundLossAccumulator > 0;
          compoundLossAccumulator += recommendedAmount;
          if (wasInRecovery) {
              recTCount++;
          }
          if (wasInRecovery && recTCount >= compoundRecoveryTrades) {
              compoundLossAccumulator = 0;
              recTCount = 0;
              recWCount = 0;
              currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
              currentCompoundStreak = 0;
          } else {
              currentCompoundAmount = capBaseTrade > 0 ? capBaseTrade : initialCapital;
              currentCompoundStreak = 0;
          }
        }
      }
      tCount++;

      if (simBalance < maxDrawdown) {
        maxDrawdown = simBalance;
      }

      trades.push({
        step: i + 1,
        result,
        amount: recommendedAmount,
        profit,
        balanceAfter: simBalance,
      });

      if (
        strategyMode === "TARGET" &&
        simBalance >= initialCapital + targetMoney - 0.001
      ) {
        status = "TARGET_HIT";
      } else if (
        strategyMode === "CAPITAL" &&
        wCount >= capRecoveryWins
      ) {
        status = "TARGET_HIT";
      } else if (simBalance <= stopLossMoney + 0.001) {
        status = "STOP_LOSS";
      } else if (strategyMode === "TARGET" && maxLossLimit > 0 && lCount >= maxLossLimit) {
        status = "MAX_LOSS";
      } else if (strategyMode === "CAPITAL" && tCount >= capTotalSteps && wCount < capRecoveryWins) {
        status = "MAX_LOSS";
      }
    }

    return {
      finalBalance: simBalance,
      netProfit: simBalance - initialCapital,
      maxDrawdown,
      trades,
      status,
    };
  };

  const currentConsecutiveLosses = useMemo(() => {
    let count = 0;
    let lastFilledIndex = -1;
    for (let i = tradesInput.length - 1; i >= 0; i--) {
      if (tradesInput[i].result !== "-") {
        lastFilledIndex = i;
        break;
      }
    }
    if (lastFilledIndex !== -1) {
      for (let i = lastFilledIndex; i >= 0; i--) {
        if (tradesInput[i].result === "L") {
          count++;
        } else if (tradesInput[i].result === "W") {
          break;
        }
      }
    }
    return count;
  }, [tradesInput]);


  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex shadow-inner items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading ALADDIN TRADE MANAGER...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl border animate-in slide-in-from-top-5 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-500/50 text-emerald-100"
              : toast.type === "error"
                ? "bg-rose-900/90 border-rose-500/50 text-rose-100"
                : "bg-amber-900/90 border-amber-500/50 text-amber-100"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : toast.type === "error" ? (
            <XCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          )}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* INSTALL APP POPUP */}
      {showInstallPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl shadow-2xl shadow-emerald-900/20 animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl leading-none">🪙</span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg leading-tight">
                Install App
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                {deferredPrompt
                  ? "Add ALADDIN TRADE MANAGER to your home screen for a better experience."
                  : 'To install on iOS: Tap the Share button below and select "Add to Home Screen".'}
              </p>
            </div>
            <button
              onClick={dismissInstallPopup}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {deferredPrompt && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleInstallApp}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" /> Install Now
              </button>
            </div>
          )}
        </div>
      )}

      <React.Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        {!isAuthReady && !dbUser ? (
          <div className="min-h-screen bg-[#05070e] flex flex-col items-center justify-center text-white select-none">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                🪙
              </div>
            </div>
            <div className="mt-4 text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              ALADDIN TRADE MANAGER
            </div>
            <div className="mt-2 w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 animate-pulse w-full rounded-full"></div>
            </div>
          </div>
        ) : showLandingPage ? (
          <LandingPage 
            onGetStarted={() => { setInitialAuthMode("signup"); setShowLandingPage(false); }} 
            onLogin={() => { setInitialAuthMode("login"); setShowLandingPage(false); }}
            onDirectLogin={(userData) => {
              setDbUser(userData);
              if (userData.role === "admin") {
                setAdminViewMode("admin");
              }
              setShowLandingPage(false);
            }}
          />
        ) : !dbUser ? (
          <LoginScreen
            initialMode={initialAuthMode}
            onLogin={(user, dbUser) => {
              localStorage.setItem("mock_firebaseUser", JSON.stringify(user));
              localStorage.setItem("mock_dbUser", JSON.stringify(dbUser));
              localStorage.setItem("aladdin_in_app", "true");
              setFirebaseUser(user);
              setDbUser(dbUser);
              setShowLandingPage(false);
            }}
            onBack={() => setShowLandingPage(true)}
            authError={authError}
            setAuthError={setAuthError}
          />
        ) : dbUser.role === "admin" && adminViewMode === "admin" ? (
          <AdminPanel
            onClose={() => handleSetAdminViewMode("student")}
            onPreviewLanding={() => setShowLandingPage(true)}
            onPreviewLogin={() => {
              setDbUser(null);
              setShowLandingPage(false);
            }}
            onPreviewPaywall={() => handleSetAdminViewMode("paywall")}
          />
        ) : dbUser.role === "admin" && adminViewMode === "paywall" ? (
          <div className="relative">
            <PaywallScreen />
            <button
              onClick={() => handleSetAdminViewMode("admin")}
              className="fixed bottom-6 right-6 z-50 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full border border-slate-700 shadow-2xl flex items-center gap-2 font-bold transition-all hover:scale-105"
            >
              <XCircle className="w-5 h-5 text-rose-400" /> Exit Paywall Preview
            </button>
          </div>
        ) : dbUser.status === "suspended" ? (
          <SuspendedScreen onLogout={handleLogout} />
        ) : dbUser.status === "pending" ? (
          <PendingApprovalScreen 
            user={dbUser}
            onLogout={handleLogout}
            onActivated={(activatedUser: any) => {
              setDbUser(activatedUser);
              try {
                localStorage.setItem("mock_dbUser", JSON.stringify(activatedUser));
                localStorage.setItem("aladdin_in_app", "true");
              } catch {}
            }}
          />
        ) : !dbUser.isLifetimePaid && (!dbUser.subscriptionEndDate || new Date(dbUser.subscriptionEndDate) < new Date()) ? (
          dbUser.hasPendingPayment ? (
            <PendingScreen />
          ) : (
            <PaywallScreen onPaymentSubmitted={() => setDbUser({ ...dbUser, hasPendingPayment: true })} />
          )
        ) : (
          <div id="aladdin-root-container" className="w-full min-h-screen bg-slate-950 text-slate-100 relative">
            <div
              id="aladdin-main-wrapper"
              className="w-full min-h-screen bg-slate-950 text-slate-300 p-3 sm:p-4 md:p-6 font-sans selection:bg-emerald-500/30 relative flex flex-col"
            >
              {/* Container Content: full width, high responsiveness */}
              <div className="w-full">
                {/* HEADER */}
                <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <span className="text-2xl leading-none">🪙</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight whitespace-nowrap">
                          <span className="text-green-400">ALADDIN</span> <span className="text-white">TRADE MANAGER</span>
                        </h1>
                        {options.autoSyncLiveData && (
                          <div
                            className="flex items-center gap-1 px-1.5 py-[1px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[8px] font-bold uppercase tracking-wider whitespace-nowrap"
                            title="Live Auto Sync is Active (Local Storage)"
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Sync ON
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-emerald-400 font-medium tracking-widest uppercase mt-0.5">
                        ATM™ V4.0 ° Session {sessionCount}
                      </p>
                      {pastSessions.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Session {pastSessions[0].id}: Profit{" "}
                          <span
                            className={
                              pastSessions[0].profit >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {pastSessions[0].profit >= 0 ? "+" : ""}
                            {formatMoney(pastSessions[0].profit)}
                          </span>
                          , Win Rate {pastSessions[0].winRate.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                    {isAdmin && (
                      <button
                        onClick={() => handleSetAdminViewMode("admin")}
                        className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        title="Switch to Admin Dashboard"
                      >
                        <ShieldCheck className="w-4 h-4" />{" "}
                        <span className="hidden sm:inline">SWITCH TO ADMIN</span>
                        <span className="sm:hidden">ADMIN</span>
                      </button>
                    )}

                    {!isInstalled && (
                      <button
                        onClick={handleInstallApp}
                        className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold px-3 py-2 rounded-xl text-sm transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                        title="Install ALADDIN TRADE MANAGER App on your phone/desktop"
                      >
                        <DownloadCloud className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">INSTALL APP</span>
                        <span className="sm:hidden">INSTALL</span>
                      </button>
                    )}

                    <button
                      onClick={() => clearBoard(true)}
                className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">CLEAR BOARD</span>
                <span className="sm:hidden">CLEAR</span>
              </button>
              <button
                onClick={hardReset}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-rose-500/20"
              >
                <RotateCcw className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">HARD RESET</span>
                <span className="sm:hidden">RESET</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-500/20"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">LOGOUT</span>
                <span className="sm:hidden">EXIT</span>
              </button>
            </div>
          </header>

          {/* TARGET HIT BANNER */}
          {isTargetHit && !options.autoCompleteSession && (
            <div className="max-w-7xl mx-auto mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <button
                onClick={handleCompleteSession}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] rounded-xl p-4 md:p-5 flex items-center justify-between transition-all transform hover:scale-[1.01] active:scale-[0.99] border border-emerald-400/50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl md:text-2xl font-black tracking-wide uppercase drop-shadow-md">
                      Target Hit! Complete Session {sessionCount}
                    </div>
                    <div className="text-sm font-medium text-emerald-50 mt-1">
                      Click to auto-compound balance to{" "}
                      <span className="font-bold bg-black/20 px-2 py-0.5 rounded">
                        {formatMoney(runningBalance)}
                      </span>{" "}
                      and start Session {sessionCount + 1}
                    </div>
                  </div>
                </div>
                <ArrowRightCircle className="w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all hidden sm:block" />
              </button>
            </div>
          )}

          <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* LEFT COLUMN: TRADE LOG */}
            <div className="xl:col-span-7 space-y-6">
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                  {/* OlOlO TRADING ROOM - Main Educational Folder */}
                  <div className="bg-slate-900 border-b border-slate-700 p-2">
                    <div className="border border-emerald-500/30 rounded-lg p-1 bg-slate-950 shadow-lg">
                      <button
                        onClick={() => setIsTradingClubOpen(!isTradingClubOpen)}
                        className="w-full py-3 flex items-center justify-center gap-3 text-sm font-bold text-emerald-400 uppercase tracking-[0.2em] bg-slate-900/50 rounded-md border border-slate-800 hover:bg-slate-800 transition-all"
                      >
                        <BrainCircuit className="w-5 h-5" />
                        Aladdin TRADING ROOM
                        {isTradingClubOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isTradingClubOpen && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 bg-slate-950 rounded-b-md border-t border-slate-800">
                          {[
                            { name: "Analytics Dashboard", icon: Activity },
                            { name: "Smart Journal", icon: FileText },
                            { name: "Daily Plan", icon: CheckSquare },
                            { name: "Position Size", icon: Calculator },
                            { name: "Strategy AI", icon: Bot },
                            { name: "Daily Compounding", icon: Calculator },
                            { name: "Slow But Sure", icon: BrainCircuit },
                            { name: "Paradox Strategy", icon: BrainCircuit },
                          ].map((feature) => (
                            <button
                              key={feature.name}
                              onClick={() => setActiveFeature(feature.name)}
                              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                activeFeature === feature.name
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                              }`}
                            >
                              <feature.icon className="w-5 h-5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{feature.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Active Feature Display */}
                    {activeFeature && (
                      <div className="fixed inset-0 z-[100] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
                        <div className="bg-[#050B14] w-full h-full max-w-[1400px] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />
                          <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/50 relative z-10">
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                              {activeFeature}
                            </h3>
                            <button onClick={() => setActiveFeature(null)} className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 relative z-10">
                            {activeFeature === 'Analytics Dashboard' && (
                              <AnalyticsDashboard trades={tradesInput} pastSessions={pastSessions} startCapital={initialCapital} />
                            )}
                            {activeFeature === 'Smart Journal' && (
                              <SmartJournal 
                                trade={tradesInput[0] || {}} 
                                trades={tradesInput}
                                onSave={(journal) => {
                                  showToast("Journal saved!", "success");
                                }}
                              />
                            )}
                            {activeFeature === 'Daily Plan' && <DailyTradingPlan />}
                            {activeFeature === 'Position Size' && <PositionCalculator />}
                            {activeFeature === 'Strategy AI' && <StrategyAI />}
                            {activeFeature === 'Daily Compounding' && <OlOlODailyCalculator currentCapital={runningBalance} />}
                            {activeFeature === 'Slow But Sure' && <SlowButSureStrategy />}
                            {activeFeature === 'Paradox Strategy' && <ParadoxStrategy />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700 flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-3 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto min-w-0">
                    <div className="flex items-center gap-4">
                      <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2 whitespace-nowrap">
                        <Target className="w-4 h-4 text-emerald-500" /> TRADE
                        LOG
                      </h2>
                      {!isInstalled && (
                        <button
                          onClick={handleInstallApp}
                          className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 animate-pulse whitespace-nowrap"
                        >
                          <DownloadCloud className="w-3 h-3" /> Install App
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700 w-full sm:w-auto max-w-full overflow-x-auto custom-scrollbar">
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "PLANNER"
                              ? "NONE"
                              : "PLANNER",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "PLANNER" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <Target className="w-3 h-3" /> 30-Day Planner
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "CHART_SCANNER"
                              ? "NONE"
                              : "CHART_SCANNER",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "CHART_SCANNER" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <Sparkles className="w-3 h-3" /> Chart AI Scanner
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "RISK_LOCK"
                              ? "NONE"
                              : "RISK_LOCK",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "RISK_LOCK" ? "bg-rose-500/20 text-rose-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <Lock className="w-3 h-3" /> Risk Lock
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "SIMULATOR"
                              ? "NONE"
                              : "SIMULATOR",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "SIMULATOR" ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <TestTube className="w-3 h-3" /> Simulator
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "CALCULATOR"
                              ? "NONE"
                              : "CALCULATOR",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "CALCULATOR" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <Calculator className="w-3 h-3" /> Calculator
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "CONVERTER"
                              ? "NONE"
                              : "CONVERTER",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "CONVERTER" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <RefreshCw className="w-3 h-3" /> Converter
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeaderTab(
                            activeHeaderTab === "JOURNAL" ? "NONE" : "JOURNAL",
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 justify-center whitespace-nowrap ${activeHeaderTab === "JOURNAL" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      >
                        <FileText className="w-3 h-3" /> Journal
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto justify-start xl:justify-end mt-2 xl:mt-0 pt-2 xl:pt-0 border-t border-slate-700/50 xl:border-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportCurrentLogCSV}
                        className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600 transition-colors flex items-center gap-1"
                        title="Export CSV"
                      >
                        <Download className="w-3 h-3" /> CSV
                      </button>
                      <button
                        onClick={exportCurrentLogPDF}
                        className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600 transition-colors flex items-center gap-1"
                        title="Export PDF"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400/70 uppercase tracking-widest">
                      <Zap className="w-3 h-3" /> Auto-Calculating
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded border ${runningBalance >= initialCapital ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}
                    >
                      P/L: {runningBalance >= initialCapital ? "+" : ""}
                      {formatMoney(runningBalance - initialCapital)}
                    </span>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                      Bal:{" "}
                      <span className="text-white font-bold">
                        {formatMoney(runningBalance)}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        confirmAction(
                          "Clear Trade Log",
                          "Are you sure you want to clear the trade log? This will reset the current session.",
                          () => {
                            setTradesInput(
                              Array.from({ length: maxTrades }, (_, i) => ({
                                id: i + 1,
                                result: "-",
                                customAmount: "",
                              })),
                            );
                            setAlertedStatuses([]);
                            setCompletionModal({
                              show: false,
                              type: "",
                              message: "",
                            });
                            showToast("Trade log cleared", "success");
                          },
                        );
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors border border-slate-700 hover:border-rose-500/30"
                      title="Clear Trade Log"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Active Header Tab Content */}

                {activeHeaderTab === "PLANNER" && (
                  <div className="bg-slate-900/90 px-4 py-4 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <CompoundingPlanner
                      compoundingStartCapital={compoundingStartCapital}
                      setCompoundingStartCapital={setCompoundingStartCapital}
                      compoundingDailyTarget={compoundingDailyTarget}
                      setCompoundingDailyTarget={setCompoundingDailyTarget}
                      compoundingActuals={compoundingActuals}
                      setCompoundingActuals={setCompoundingActuals}
                      runningBalance={runningBalance}
                      initialCapital={initialCapital}
                      setInitialCapital={setInitialCapital}
                      showToast={showToast}
                      confirmAction={confirmAction}
                      currency={currency}
                      formatMoney={formatMoney}
                      onClose={() => setActiveHeaderTab("NONE")}
                    />
                  </div>
                )}

                {activeHeaderTab === "CHART_SCANNER" && (
                  <div className="bg-slate-900/90 px-4 py-4 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Chart AI Scanner
                      </h3>
                      <button 
                        onClick={() => setActiveHeaderTab("NONE")}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <ChartScannerAI />
                  </div>
                )}

                {activeHeaderTab === "RISK_LOCK" && (
                  <div className="bg-slate-900/90 px-4 py-4 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    {(() => {
                      const lockThreshold =
                        accumulatedStats.startingCapital *
                        (1 - maxDailyLoss / 100);
                      const currentDrawdown = Math.max(
                        0,
                        accumulatedStats.startingCapital - runningBalance,
                      );
                      const maxDrawdownAmount =
                        accumulatedStats.startingCapital * (maxDailyLoss / 100);
                      const drawdownPercentage =
                        maxDrawdownAmount > 0
                          ? Math.min(
                              100,
                              (currentDrawdown / maxDrawdownAmount) * 100,
                            )
                          : 0;

                      const isDrawdownLocked = runningBalance <= lockThreshold;
                      const isConsecutiveLossLocked =
                        currentConsecutiveLosses >= maxConsecutiveLosses;
                      const isLocked =
                        isDrawdownLocked || isConsecutiveLossLocked;

                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                              <Lock className="w-4 h-4" /> Risk Lock & Enforcer
                            </h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  confirmAction(
                                    "How Risk Lock Works",
                                    "1. Set your Max Daily Loss % and Max Consecutive Losses.\n2. The app monitors your balance and losing streaks in real-time.\n3. If you hit either limit, the trading interface will be LOCKED.\n4. This prevents revenge trading and protects your capital.\n5. To unlock, you must manually increase your limits or reset the session (not recommended if you are tilted!).",
                                    () => {},
                                  );
                                }}
                                className="text-slate-400 hover:text-blue-400 transition-colors"
                                title="How it works"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setActiveHeaderTab("NONE")}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Status Dashboard */}
                          <div
                            className={`mb-4 rounded-xl border p-4 relative overflow-hidden ${isLocked ? "bg-rose-900/20 border-rose-500/50" : "bg-slate-800/80 border-slate-700/50"}`}
                          >
                            {isLocked && (
                              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none animate-pulse" />
                            )}
                            <div className="flex justify-between items-end mb-3 relative z-10">
                              <div>
                                <div className="text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1 text-slate-400">
                                  Status
                                </div>
                                <div
                                  className={`text-2xl font-black tracking-wider flex items-center gap-2 ${isLocked ? "text-rose-500" : "text-emerald-400"}`}
                                >
                                  {isLocked ? (
                                    <>
                                      <Lock className="w-6 h-6" /> LOCKED
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-6 h-6" /> SAFE
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                  Current Drawdown
                                </div>
                                <div
                                  className={`text-xl font-bold font-mono flex items-baseline gap-1 justify-end ${drawdownPercentage > 80 ? "text-rose-400" : "text-amber-400"}`}
                                >
                                  {formatMoney(currentDrawdown)}{" "}
                                  <span className="text-xs text-slate-500 font-medium font-sans">
                                    / {formatMoney(maxDrawdownAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Drawdown Progress Bar */}
                            <div className="w-full bg-slate-900 rounded-full h-2 mt-2 border border-slate-700/50 overflow-hidden relative z-10">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${drawdownPercentage > 80 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : drawdownPercentage > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${drawdownPercentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Settings Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">
                                Max Daily Loss %
                              </label>
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={maxDailyLoss}
                                    onChange={(e) =>
                                      setMaxDailyLoss(Number(e.target.value))
                                    }
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                    %
                                  </span>
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <div className="text-[9px] text-slate-500 uppercase">
                                    Lock At
                                  </div>
                                  <div className="text-sm font-mono font-bold text-rose-400">
                                    {formatMoney(lockThreshold)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">
                                Max Consecutive Losses
                              </label>
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={maxConsecutiveLosses}
                                    onChange={(e) =>
                                      setMaxConsecutiveLosses(
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                                  />
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <div className="text-[9px] text-slate-500 uppercase">
                                    Current
                                  </div>
                                  <div
                                    className={`text-sm font-mono font-bold ${currentConsecutiveLosses >= maxConsecutiveLosses ? "text-rose-500" : currentConsecutiveLosses > 0 ? "text-amber-400" : "text-emerald-400"}`}
                                  >
                                    {currentConsecutiveLosses}{" "}
                                    <span className="text-slate-500 text-xs">
                                      / {maxConsecutiveLosses}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {activeHeaderTab === "SIMULATOR" && (
                  <div className="bg-slate-900/90 px-4 py-4 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                        <TestTube className="w-4 h-4" /> STRATEGY BACKTESTER
                      </h3>
                      <button
                        onClick={() => setActiveHeaderTab("NONE")}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Test your current Martingale/Compound settings without
                      risking real money. Enter a sequence of W (Win) and L
                      (Loss).
                    </p>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={simSequence}
                        onChange={(e) =>
                          setSimSequence(
                            e.target.value.toUpperCase().replace(/[^WL]/g, ""),
                          )
                        }
                        placeholder="e.g. WLLWL"
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono tracking-widest uppercase focus:border-purple-500 outline-none"
                      />
                      <button
                        onClick={() => setSimSequence("")}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    {simSequence.length > 0 &&
                      (() => {
                        const simResult = runDetailedSimulation(simSequence);
                        return (
                          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Simulation Result
                              </div>
                              {simResult.status !== "ACTIVE" && (
                                <div
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    simResult.status === "TARGET_HIT"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-rose-500/20 text-rose-400"
                                  }`}
                                >
                                  {simResult.status.replace("_", " ")}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="text-xs text-slate-400">
                                  Final Balance
                                </div>
                                <div className="text-lg font-mono font-bold text-white">
                                  {formatMoney(simResult.finalBalance)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-slate-400">
                                  Net Profit
                                </div>
                                <div
                                  className={`text-lg font-mono font-bold ${simResult.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                  {simResult.netProfit >= 0 ? "+" : ""}
                                  {formatMoney(simResult.netProfit)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-400">
                                  Max Drawdown
                                </div>
                                <div className="text-lg font-mono font-bold text-amber-400">
                                  {formatMoney(simResult.maxDrawdown)}
                                </div>
                              </div>
                            </div>

                            {simResult.trades.length > 0 && (
                              <div className="mt-4 border-t border-slate-700 pt-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">
                                  Trade Breakdown
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 border border-slate-700/50 rounded-xl bg-slate-900/50 p-2">
                                  <table className="w-full text-xs text-left">
                                    <thead className="text-slate-400 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 shadow-sm">
                                      <tr>
                                        <th className="pb-2 pt-1 px-2 font-medium border-b border-slate-700/50">
                                          #
                                        </th>
                                        <th className="pb-2 pt-1 px-2 font-medium border-b border-slate-700/50">
                                          Result
                                        </th>
                                        <th className="pb-2 pt-1 px-2 font-medium text-right border-b border-slate-700/50">
                                          Amount
                                        </th>
                                        <th className="pb-2 pt-1 px-2 font-medium text-right border-b border-slate-700/50">
                                          Balance
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/30">
                                      {simResult.trades.map((t, i) => (
                                        <tr
                                          key={i}
                                          className="hover:bg-slate-800/50 transition-colors"
                                        >
                                          <td className="py-2 px-2 text-slate-500 font-mono">
                                            {t.step}
                                          </td>
                                          <td className="py-2 px-2">
                                            {t.result === "W" ? (
                                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                                WIN
                                              </span>
                                            ) : (
                                              <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                                LOSS
                                              </span>
                                            )}
                                          </td>
                                          <td
                                            className={`py-2 px-2 text-right font-mono ${t.result === "W" ? "text-emerald-400" : "text-rose-400"}`}
                                          >
                                            {t.result === "W" ? "+" : "-"}
                                            {formatMoney(t.amount)}
                                          </td>
                                          <td className="py-2 px-2 text-right font-mono text-white">
                                            {formatMoney(t.balanceAfter)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                )}

                {activeHeaderTab === "CALCULATOR" &&
                  (() => {
                    let preview = "";
                    if (
                      calcInput &&
                      !calcInput.endsWith("+") &&
                      !calcInput.endsWith("-") &&
                      !calcInput.endsWith("*") &&
                      !calcInput.endsWith("/")
                    ) {
                      try {
                        const res = evaluateMath(calcInput);
                        if (!isNaN(res) && String(res) !== calcInput) {
                          preview = String(res);
                        }
                      } catch (e) {}
                    }

                    const handleCalcBtn = (btn: string) => {
                      if (calcInput === "Error") {
                        setCalcInput(btn === "AC" ? "" : btn);
                        return;
                      }

                      if (btn === "AC") setCalcInput("");
                      else if (btn === "DEL")
                        setCalcInput((prev) => prev.slice(0, -1));
                      else if (btn === "=") {
                        if (!calcInput) return;
                        try {
                          const res = evaluateMath(calcInput);
                          if (!isNaN(res)) {
                            const resStr = String(res);
                            if (calcInput !== resStr) {
                              setCalcHistory((prev) =>
                                [
                                  { equation: calcInput, result: resStr },
                                  ...prev,
                                ].slice(0, 20),
                              );
                            }
                            setCalcInput(resStr);
                          } else {
                            setCalcInput("Error");
                          }
                        } catch {
                          setCalcInput("Error");
                        }
                      } else {
                        setCalcInput((prev) => prev + btn);
                      }
                    };

                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xl px-4 py-6 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2 shadow-2xl">
                        <div className="max-w-sm mx-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-widest">
                              <Calculator className="w-4 h-4" /> Advanced
                              Calculator
                            </h3>
                            <button
                              onClick={() => setActiveHeaderTab("NONE")}
                              className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                            {/* Display */}
                            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 mb-5 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <input
                                type="text"
                                value={calcInput}
                                onChange={(e) => setCalcInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCalcBtn("=");
                                  if (e.key === "Escape") handleCalcBtn("AC");
                                  if (
                                    e.key === "Backspace" &&
                                    calcInput === "Error"
                                  ) {
                                    e.preventDefault();
                                    handleCalcBtn("AC");
                                  }
                                }}
                                className="w-full bg-transparent text-right text-3xl text-white font-mono focus:outline-none tracking-wider"
                                placeholder="0"
                              />
                              <div className="h-6 mt-1 text-right text-cyan-500/70 font-mono text-sm tracking-widest">
                                {preview ? `= ${preview}` : ""}
                              </div>
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-4 gap-3">
                              {/* Row 1 */}
                              <button
                                onClick={() => handleCalcBtn("AC")}
                                className="col-span-2 py-3 rounded-xl font-bold text-sm transition-all bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                              >
                                AC
                              </button>
                              <button
                                onClick={() => handleCalcBtn("DEL")}
                                className="py-3 rounded-xl font-bold text-sm transition-all bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              >
                                DEL
                              </button>
                              <button
                                onClick={() => handleCalcBtn("/")}
                                className="py-3 rounded-xl font-bold text-lg transition-all bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                              >
                                ÷
                              </button>

                              {/* Row 2 */}
                              {["7", "8", "9"].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => handleCalcBtn(n)}
                                  className="py-3 rounded-xl font-medium text-xl transition-all bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                                >
                                  {n}
                                </button>
                              ))}
                              <button
                                onClick={() => handleCalcBtn("*")}
                                className="py-3 rounded-xl font-bold text-lg transition-all bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                              >
                                ×
                              </button>

                              {/* Row 3 */}
                              {["4", "5", "6"].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => handleCalcBtn(n)}
                                  className="py-3 rounded-xl font-medium text-xl transition-all bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                                >
                                  {n}
                                </button>
                              ))}
                              <button
                                onClick={() => handleCalcBtn("-")}
                                className="py-3 rounded-xl font-bold text-lg transition-all bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                              >
                                −
                              </button>

                              {/* Row 4 */}
                              {["1", "2", "3"].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => handleCalcBtn(n)}
                                  className="py-3 rounded-xl font-medium text-xl transition-all bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                                >
                                  {n}
                                </button>
                              ))}
                              <button
                                onClick={() => handleCalcBtn("+")}
                                className="py-3 rounded-xl font-bold text-lg transition-all bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                              >
                                +
                              </button>

                              {/* Row 5 */}
                              <button
                                onClick={() => handleCalcBtn("0")}
                                className="col-span-2 py-3 rounded-xl font-medium text-xl transition-all bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                              >
                                0
                              </button>
                              <button
                                onClick={() => handleCalcBtn(".")}
                                className="py-3 rounded-xl font-bold text-xl transition-all bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                              >
                                .
                              </button>
                              <button
                                onClick={() => handleCalcBtn("=")}
                                className="py-3 rounded-xl font-bold text-xl transition-all bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                              >
                                =
                              </button>
                            </div>

                            {/* History */}
                            {calcHistory.length > 0 && (
                              <div className="mt-5 pt-4 border-t border-slate-800/80">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <History className="w-3 h-3" /> History
                                  </span>
                                  <button
                                    onClick={() => setCalcHistory([])}
                                    className="text-[10px] uppercase tracking-wider font-bold text-rose-500/70 hover:text-rose-400 transition-colors"
                                  >
                                    Clear All
                                  </button>
                                </div>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                                  {calcHistory.map((item, i) => (
                                    <div
                                      key={i}
                                      className="text-right bg-slate-900/50 rounded-lg p-2 border border-slate-800/50 hover:border-slate-700 transition-colors cursor-pointer"
                                      onClick={() => setCalcInput(item.result)}
                                    >
                                      <div className="text-slate-500 font-mono text-xs mb-0.5">
                                        {item.equation}
                                      </div>
                                      <div className="text-cyan-400/90 font-mono text-sm font-bold">
                                        = {item.result}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {activeHeaderTab === "CONVERTER" && (
                  <div className="bg-slate-900/90 px-4 py-4 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> CURRENCY CONVERTER
                      </h3>
                      <button
                        onClick={() => setActiveHeaderTab("NONE")}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-md mx-auto">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700">
                          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useLiveRate}
                              onChange={(e) => setUseLiveRate(e.target.checked)}
                              className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                            />
                            Use Live Market Rate (Updates every 10s)
                          </label>
                          {useLiveRate && lastUpdated && (
                            <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                              {isLiveRateLoading ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {lastUpdated.toLocaleTimeString()}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              From
                            </label>
                            <select
                              value={convFrom}
                              onChange={(e) => setConvFrom(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                            >
                              {[
                                "USD",
                                "EUR",
                                "GBP",
                                "INR",
                                "JPY",
                                "AUD",
                                "CAD",
                                "CHF",
                                "CNY",
                                "SGD",
                                "NZD",
                                "ZAR",
                                "AED",
                                "BRL",
                              ].map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              To
                            </label>
                            <select
                              value={convTo}
                              onChange={(e) => setConvTo(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                            >
                              {[
                                "USD",
                                "EUR",
                                "GBP",
                                "INR",
                                "JPY",
                                "AUD",
                                "CAD",
                                "CHF",
                                "CNY",
                                "SGD",
                                "NZD",
                                "ZAR",
                                "AED",
                                "BRL",
                              ].map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            Amount ({convFrom})
                          </label>
                          <input
                            type="number"
                            value={convAmount}
                            onChange={(e) => setConvAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none font-mono"
                            placeholder="e.g. 100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            Exchange Rate
                          </label>
                          <input
                            type="number"
                            value={convRate}
                            onChange={(e) => setConvRate(e.target.value)}
                            disabled={useLiveRate}
                            className={`w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none font-mono ${useLiveRate ? "opacity-70 cursor-not-allowed" : "focus:border-emerald-500"}`}
                            placeholder="e.g. 83.5"
                          />
                        </div>
                        <div className="pt-4 border-t border-slate-700">
                          <div className="text-xs text-slate-400 mb-1">
                            Converted Amount ({convTo})
                          </div>
                          <div className="text-2xl font-bold text-emerald-400 font-mono">
                            {convAmount &&
                            convRate &&
                            !isNaN(Number(convAmount)) &&
                            !isNaN(Number(convRate))
                              ? (
                                  Number(convAmount) * Number(convRate)
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "0.00"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeHeaderTab === "JOURNAL" && (
                  <div className="bg-slate-900/90 px-4 py-4 border-b border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> JOURNAL
                      </h3>
                      <button
                        onClick={() => setActiveHeaderTab("NONE")}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <textarea
                        value={journalText}
                        onChange={(e) => setJournalText(e.target.value)}
                        className="w-full h-48 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none resize-y custom-scrollbar"
                        placeholder="Write your trading notes, observations, or rules here... (Auto-saved)"
                      />
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
                          Auto-saved locally
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-time Session Progress Indicator */}
                <div className="bg-slate-900/60 px-4 py-4 border-b border-slate-700/50 flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-400" />{" "}
                        Session Pulse
                      </span>
                      <div className="flex items-baseline gap-2">
                        {strategyMode === "CAPITAL" ? (
                          <>
                            <span className="text-2xl font-black text-white leading-none">
                              {Math.max(0, capRecoveryWins - wCount)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              Wins needed out of{" "}
                              <span className="text-slate-200">
                                {Math.max(0, capTotalSteps - tCount)}
                              </span>{" "}
                              Remaining Trades
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-white leading-none">
                              {wCount}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              Wins out of{" "}
                              <span className="text-slate-200">{tCount}</span>{" "}
                              Trades
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {strategyMode === "CAPITAL" ? "Target" : "Win Rate"}
                      </span>
                      {strategyMode === "CAPITAL" ? (
                        <span className="text-sm font-bold text-emerald-400 leading-none bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          {capRecoveryWins} / {capTotalSteps}
                        </span>
                      ) : (
                        <span
                          className={`text-lg font-bold leading-none ${winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {tCount > 0 ? `${winRate.toFixed(0)}%` : "0%"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative pt-4 pb-2">
                    <div className="flex items-center w-full overflow-x-auto custom-scrollbar pb-4">
                      <div className="flex items-center min-w-max w-full justify-between px-2">
                        {Array.from({
                          length:
                            strategyMode === "CAPITAL"
                              ? capTotalSteps
                              : maxTrades,
                        }).map((_, i) => {
                          const trade = calculatedTrades[i];
                          const stepNum = i + 1;

                          let bgColor =
                            "bg-slate-800 border-slate-700 text-slate-500";
                          let glow = "";
                          let lineClass = "bg-slate-800";

                          if (trade && trade.result === "W") {
                            bgColor =
                              "bg-emerald-500 border-emerald-400 text-white";
                            glow = "shadow-[0_0_8px_rgba(16,185,129,0.6)]";
                            lineClass = "bg-emerald-500/50";
                          } else if (trade && trade.result === "L") {
                            bgColor = "bg-rose-500 border-rose-400 text-white";
                            glow = "shadow-[0_0_8px_rgba(244,63,94,0.6)]";
                            lineClass = "bg-rose-500/50";
                          } else if (trade && trade.isActive) {
                            bgColor =
                              "bg-blue-500 border-blue-400 text-white animate-pulse";
                            glow = "shadow-[0_0_8px_rgba(59,130,246,0.6)]";
                          }

                          return (
                            <React.Fragment key={i}>
                              <div className="relative flex flex-col items-center group cursor-default">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border z-10 transition-all duration-300 ${bgColor} ${glow}`}
                                >
                                  {stepNum}
                                </div>

                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded pointer-events-none transition-opacity whitespace-nowrap z-20 border border-slate-600 shadow-xl">
                                  {trade && trade.result !== "-"
                                    ? `T${trade.id}: ${trade.result}`
                                    : trade && trade.isActive
                                      ? "Active"
                                      : "Upcoming"}
                                </div>
                              </div>

                              {/* Connecting Line */}
                              {i <
                                (strategyMode === "CAPITAL"
                                  ? capTotalSteps
                                  : maxTrades) -
                                  1 && (
                                <div
                                  className={`flex-1 h-1.5 mx-1.5 min-w-[24px] sm:min-w-[32px] rounded-full transition-all duration-300 ${lineClass}`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SESSION COUNTER & ACTIONS */}
                <div className="bg-slate-900/40 px-4 py-3 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />{" "}
                        Session Counter
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white font-mono leading-none">
                          {sessionCount}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setSessionCount((prev) => Math.max(0, prev - 1))
                            }
                            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-white transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSessionCount((prev) => prev + 1)}
                            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-white transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSessionCount(0)}
                            className="w-7 h-7 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 rounded flex items-center justify-center transition-colors ml-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleCopyBalance}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20 text-sm"
                    >
                      <Copy className="w-4 h-4" /> COPY BAL
                    </button>
                    <button
                      onClick={handleCompleteSession}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 text-sm"
                    >
                      <Save className="w-4 h-4" /> LOG SESSION
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[580px] custom-scrollbar relative">
                  {(runningBalance <=
                    accumulatedStats.startingCapital *
                      (1 - maxDailyLoss / 100) ||
                    currentConsecutiveLosses >= maxConsecutiveLosses) && (
                    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 border-t border-rose-500/30">
                      <div className="bg-rose-500/20 p-5 rounded-full mb-4 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                        <Lock className="w-12 h-12 text-rose-500" />
                      </div>
                      <h3 className="text-2xl font-black text-rose-500 uppercase tracking-widest mb-2 drop-shadow-md">
                        Risk Lock Active
                      </h3>
                      <p className="text-slate-300 max-w-md text-sm leading-relaxed">
                        {runningBalance <=
                        accumulatedStats.startingCapital *
                          (1 - maxDailyLoss / 100) ? (
                          <>
                            You have hit your daily maximum loss limit of{" "}
                            <span className="font-bold text-white bg-rose-500/20 px-1.5 py-0.5 rounded">
                              {maxDailyLoss}%
                            </span>
                            .
                          </>
                        ) : (
                          <>
                            You have hit your maximum consecutive loss limit of{" "}
                            <span className="font-bold text-white bg-rose-500/20 px-1.5 py-0.5 rounded">
                              {maxConsecutiveLosses}
                            </span>
                            .
                          </>
                        )}
                        <br />
                        <br />
                        Trading is locked to protect your capital from revenge
                        trading. Take a break and come back tomorrow.
                      </p>
                    </div>
                  )}
                  <table className="w-full text-sm text-left relative">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-20 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">NO.</th>
                        <th className="px-4 py-3 w-36 text-center">RESULT</th>
                        <th className="px-4 py-3 text-right">TRADE AMOUNT</th>
                        <th className="px-4 py-3 text-right">RETURN</th>
                        <th className="px-4 py-3 text-right">CURRENT BAL</th>
                        <th className="px-4 py-3 text-center">STATUS</th>
                        <th className="px-4 py-3 w-32 text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {calculatedTrades.map((trade) => {
                        return (
                          <tr
                            key={trade.id}
                            className={`transition-all duration-200 ${trade.isActive ? "bg-emerald-900/20 border-l-4 border-l-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]" : "hover:bg-slate-700/20 border-l-4 border-l-transparent"} ${trade.result === "W" ? "bg-emerald-900/5" : trade.result === "L" ? "bg-rose-900/5" : ""}`}
                          >
                            <td className="px-4 py-2 text-center font-mono text-slate-500 relative">
                              {trade.isActive && (
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              )}
                              {trade.id}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-center gap-1.5 w-32 mx-auto">
                                <button
                                  onClick={() =>
                                    handleTradeChange(trade.id, "result", "W")
                                  }
                                  className={`flex-1 h-9 rounded font-bold transition-all ${trade.result === "W" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-500 hover:bg-slate-700 border border-slate-700"}`}
                                >
                                  W
                                </button>
                                <button
                                  onClick={() =>
                                    handleTradeChange(trade.id, "result", "-")
                                  }
                                  className={`flex-1 h-9 rounded font-bold transition-all ${trade.result === "-" ? "bg-slate-600 text-white" : "bg-slate-900 text-slate-500 hover:bg-slate-700 border border-slate-700"}`}
                                >
                                  -
                                </button>
                                <button
                                  onClick={() =>
                                    handleTradeChange(trade.id, "result", "L")
                                  }
                                  className={`flex-1 h-9 rounded font-bold transition-all ${trade.result === "L" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-slate-900 text-slate-500 hover:bg-slate-700 border border-slate-700"}`}
                                >
                                  L
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1 relative group">
                                <span className="text-slate-500">
                                  {currency}
                                </span>
                                <input
                                  type="text"
                                  value={
                                    trade.customAmount !== ""
                                      ? trade.customAmount
                                      : trade.recommendedAmount > 0
                                        ? trade.recommendedAmount.toFixed(2)
                                        : ""
                                  }
                                  onChange={(e) =>
                                    handleTradeChange(
                                      trade.id,
                                      "customAmount",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={(e) => {
                                    if (/[+\-*/()]/.test(e.target.value)) {
                                      const result = evaluateMath(
                                        e.target.value,
                                      );
                                      if (result > 0) {
                                        handleTradeChange(
                                          trade.id,
                                          "customAmount",
                                          String(result),
                                        );
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (
                                        /[+\-*/()]/.test(e.currentTarget.value)
                                      ) {
                                        const result = evaluateMath(
                                          e.currentTarget.value,
                                        );
                                        if (result > 0) {
                                          handleTradeChange(
                                            trade.id,
                                            "customAmount",
                                            String(result),
                                          );
                                        }
                                      }
                                    }
                                  }}
                                  className={`bg-slate-900 border rounded px-2 py-1.5 text-right w-24 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono transition-all
                                ${trade.isActive && trade.isAutoCalculated && trade.recommendedAmount > 0 ? "border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-emerald-400 font-bold" : "border-slate-700 text-white"}
                                ${!trade.isAutoCalculated ? "border-blue-500/50 text-blue-400" : ""}
                              `}
                                  placeholder={
                                    trade.isActive &&
                                    trade.recommendedAmount === 0
                                      ? "DONE"
                                      : "0.00"
                                  }
                                  disabled={
                                    trade.result !== "-" &&
                                    trade.isAutoCalculated
                                  }
                                />
                                {!trade.isAutoCalculated &&
                                  /[+\-*/()]/.test(trade.customAmount) && (
                                    <div className="absolute -bottom-5 right-0 text-[10px] text-emerald-400 font-mono whitespace-nowrap bg-slate-900/80 px-1 rounded border border-emerald-500/20">
                                      ={" "}
                                      {formatMoney(
                                        evaluateMath(trade.customAmount),
                                      )}
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-mono ${trade.result === "W" ? "text-emerald-400" : trade.result === "L" ? "text-rose-400" : "text-slate-500"}`}
                            >
                              {trade.result !== "-"
                                ? (trade.result === "W" ? "+" : "") +
                                  formatMoney(trade.returnVal)
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-white font-medium">
                              {formatMoney(trade.balance)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {trade.result !== "-" ? (
                                trade.result === "W" ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-full shadow-sm">
                                    <CheckCircle2 className="w-3 h-3" /> Passed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-rose-400 text-[10px] font-black tracking-wider uppercase bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-full shadow-sm">
                                    <XCircle className="w-3 h-3" /> Failed
                                  </span>
                                )
                              ) : (
                                <span
                                  className={`inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${trade.isActive ? "text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-full shadow-sm" : "text-slate-600"}`}
                                >
                                  {trade.isActive ? (
                                    <>
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                      </span>
                                      Active
                                    </>
                                  ) : (
                                    <span className="opacity-50">-</span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    if (trade.result === "W") {
                                      handleTradeChange(
                                        trade.id,
                                        "result",
                                        "-",
                                      );
                                    } else {
                                      handleTradeChange(
                                        trade.id,
                                        "result",
                                        "W",
                                      );
                                      showToast(
                                        `Trade ${trade.id} marked as Done`,
                                        "success",
                                      );
                                    }
                                  }}
                                  className={`p-1.5 rounded-md transition-all ${trade.result === "W" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 hover:text-slate-300"}`}
                                  title={
                                    trade.result === "W"
                                      ? "Undo"
                                      : "Mark as Done (Win)"
                                  }
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setActiveJournalTradeId(trade.id)
                                  }
                                  className={`p-1.5 rounded-md transition-all ${trade.journal && (trade.journal.notes || trade.journal.emotion || trade.journal.setup) ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/30"}`}
                                  title="Trade Journal"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTrade(trade.id)}
                                  className="p-1.5 rounded-md transition-all bg-slate-800 text-slate-500 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30"
                                  title="Delete Trade"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SESSION NOTES */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700">
                  <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Reminder &
                    Preview
                  </h2>
                </div>
                <div className="p-4">
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Write your reminders, rules, or market previews here..."
                    className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-y custom-scrollbar"
                  />
                </div>
              </div>

              {/* PAST SESSIONS */}
              {pastSessions.length > 0 && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                  <div
                    className="bg-slate-900/80 px-4 py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-slate-800/80 transition-colors"
                    onClick={() => setShowPastSessions(!showPastSessions)}
                  >
                    <div className="flex justify-between items-center w-full sm:w-auto">
                      <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-500" /> PAST
                        SESSIONS ({pastSessions.length})
                      </h2>
                      <div className="sm:hidden">
                        {showPastSessions ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={exportHistoryCSV}
                          className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600 transition-colors flex items-center gap-1"
                          title="Export History CSV"
                        >
                          <Download className="w-3 h-3" /> CSV
                        </button>
                        <button
                          onClick={exportHistoryPDF}
                          className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600 transition-colors flex items-center gap-1"
                          title="Export History PDF"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                          Total Profit:{" "}
                          <span
                            className={`font-bold ${pastSessions.reduce((sum, s) => sum + s.profit, 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {formatMoney(
                              pastSessions.reduce(
                                (sum, s) => sum + s.profit,
                                0,
                              ),
                            )}
                          </span>
                        </span>
                        <div className="hidden sm:block">
                          {showPastSessions ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {showPastSessions && (
                    <div className="overflow-x-auto max-h-96 custom-scrollbar">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-center">SESSION</th>
                            <th className="px-4 py-3 text-center">DATE</th>
                            <th className="px-4 py-3 text-center">MODE</th>
                            <th className="px-4 py-3 text-right">START BAL</th>
                            <th className="px-4 py-3 text-right">END BAL</th>
                            <th className="px-4 py-3 text-right">PROFIT</th>
                            <th className="px-4 py-3 text-center">W/L</th>
                            <th className="px-4 py-3 text-right">WIN RATE</th>
                            <th className="px-4 py-3 text-center">NOTES</th>
                            <th className="px-4 py-3 text-center">SHARE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {pastSessions.map((session, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="px-4 py-3 text-center font-mono text-slate-300">
                                #{session.id}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                                {formatDate(session.date)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${session.strategyMode === "CAPITAL" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}
                                >
                                  {session.strategyMode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-400">
                                {formatMoney(session.startingCapital)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-white">
                                {formatMoney(session.endingCapital)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-mono font-bold ${session.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {session.profit >= 0 ? "+" : ""}
                                {formatMoney(session.profit)}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-400">
                                <span className="text-emerald-400">
                                  {session.wins}W
                                </span>{" "}
                                -{" "}
                                <span className="text-rose-400">
                                  {session.losses}L
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-mono font-bold ${session.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {session.winRate.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                {session.notes ? (
                                  <div className="group relative inline-block">
                                    <FileText className="w-4 h-4 text-slate-400 hover:text-emerald-400 cursor-help transition-colors" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal text-left">
                                      {session.notes}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => shareTrade(session, 'text')}
                                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                    title="Share Session"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STATS & SETTINGS */}
            <div className="xl:col-span-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
                {/* OVERALL PERFORMANCE (Global Stats) */}
                <Card 
                  title="Overall Performance" 
                  icon={TrendingUp}
                  action={
                    <button
                      onClick={() => setShareModal({
                        show: true,
                        session: null,
                        theme: 'dark',
                        hideCapital: false,
                        customUsername: ""
                      })}
                      className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded transition-colors border border-slate-700 hover:border-blue-500/30"
                      title="Share Portfolio"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  }
                >
                  <InputRow
                    label="Starting Capital (Day 1)"
                    type="number"
                    value={accumulatedStats.startingCapital}
                    onChange={(e: any) => {
                      const val = parseFloat(e.target.value) || 0;
                      setAccumulatedStats((prev) => ({
                        ...prev,
                        startingCapital: val,
                      }));
                      // If we are on session 0, also update the current session capital
                      if (sessionCount === 0) setInitialCapital(val);
                    }}
                    suffix={currency}
                  />
                  <StatRow label="Overall Trades" value={overallTrades} />
                  <StatRow
                    label="Overall Wins"
                    value={overallWins}
                    color="text-emerald-400"
                  />
                  <StatRow
                    label="Overall Win Rate"
                    value={formatPercent(overallWinRate)}
                    color={
                      overallWinRate >= 50
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }
                  />
                  <StatRow
                    label="Total Net Profit"
                    value={formatMoney(overallProfit)}
                    color={
                      overallProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                    highlight
                  />
                  <StatRow
                    label="Total Account Gain"
                    value={formatPercent(overallGain)}
                    color={
                      overallGain >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  />

                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <InputRow
                      label="Payout %"
                      type="number"
                      value={payout}
                      onChange={(e: any) =>
                        setPayout(parseFloat(e.target.value) || 0)
                      }
                      suffix="%"
                    />
                    <div className="flex justify-between items-center py-1.5 pt-3 mt-1 border-t border-slate-700/50">
                      <span className="text-sm text-slate-400">Currency</span>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                        <option value="₹">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* SESSION TARGET (Current Session) */}
                <Card title={`Session ${sessionCount} Target`} icon={Target}>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">
                      Strategy Mode
                    </span>
                    <select
                      value={strategyMode}
                      onChange={(e: any) =>
                        setStrategyMode(e.target.value as "TARGET" | "CAPITAL" | "COMPOUND")
                      }
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="TARGET">Target Based</option>
                      <option value="CAPITAL">Capital Protection</option>
                      <option value="COMPOUND">Compound Reinvestment</option>
                    </select>
                  </div>

                  {strategyMode === "CAPITAL" && (
                    <div className="bg-emerald-900/20 p-2 rounded border border-emerald-500/30 mb-2 mt-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-emerald-300">
                          Total Steps (Max Trades)
                        </span>
                        <select
                          value={capTotalSteps}
                          onChange={(e: any) => {
                            const val = parseInt(e.target.value);
                            setCapTotalSteps(val);
                            if (capRecoveryWins > val) {
                              setCapRecoveryWins(val);
                            }
                          }}
                          className="bg-slate-900 border border-emerald-600/50 rounded px-2 py-0.5 text-xs text-white outline-none"
                        >
                          {Array.from({ length: 100 }, (_, i) => i + 1).map(
                            (n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-emerald-300">
                          Wins to Recover
                        </span>
                        <select
                          value={capRecoveryWins}
                          onChange={(e: any) =>
                            setCapRecoveryWins(parseInt(e.target.value))
                          }
                          className="bg-slate-900 border border-emerald-600/50 rounded px-2 py-0.5 text-xs text-white outline-none"
                        >
                          {Array.from(
                            { length: capTotalSteps },
                            (_, i) => i + 1,
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Required Capital Calculator (Premium Planner) */}
                      <div className="mt-5 bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-emerald-500/30 relative overflow-hidden shadow-lg transition-all duration-300">
                        {/* Decorative background glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>

                        {/* Clickable Header */}
                        <div
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors ${isPlannerOpen ? "border-b border-emerald-500/20" : ""}`}
                          onClick={() => setIsPlannerOpen(!isPlannerOpen)}
                        >
                          <div className="flex items-center gap-1.5">
                            <Calculator className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              Smart Capital Planner
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                              Optional
                            </span>
                            {isPlannerOpen ? (
                              <ChevronUp className="w-4 h-4 text-emerald-400/70" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-emerald-400/70" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isPlannerOpen && (
                          <div className="p-4 pt-2">
                            <div className="flex justify-end mb-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCapBaseTrade(1);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-[9px] text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-full transition-colors"
                                title="Reset to Default ($1)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                RESET
                              </button>
                            </div>

                            {/* Quick Selectors */}
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs text-slate-300">
                                1st Trade Amount:
                              </span>
                              <div className="flex gap-1">
                                {[1, 2, 5, 10].map((amt) => (
                                  <button
                                    key={amt}
                                    onClick={() => setCapBaseTrade(amt)}
                                    className={`text-[10px] px-2 py-1 rounded transition-colors ${capBaseTrade === amt ? "bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/30" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/80"}`}
                                  >
                                    {currency}
                                    {amt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between items-center py-1 mb-2">
                              <span className="text-xs text-slate-400">
                                Custom Amount:
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-emerald-500">
                                  {currency}
                                </span>
                                <input
                                  type="number"
                                  value={capBaseTrade}
                                  onChange={(e) =>
                                    setCapBaseTrade(
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="bg-slate-900/80 border border-emerald-600/50 rounded px-2 py-1 text-xs text-white outline-none w-16 text-right focus:border-emerald-400 transition-colors"
                                />
                              </div>
                            </div>

                            {/* Results Box */}
                            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-700/50 mt-3 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[11px] text-slate-400">
                                  Expected Profit / Win:
                                </span>
                                <span className="text-xs font-bold text-emerald-400">
                                  +{formatMoney(capBaseTrade * safePayout)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                                <span className="text-xs font-medium text-slate-200">
                                  Required Capital:
                                </span>
                                <span className="text-lg font-black text-emerald-300 drop-shadow-md">
                                  {formatMoney(capReqCapital)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setInitialCapital(Math.ceil(capReqCapital));
                              }}
                              className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              SET AS SESSION CAPITAL
                            </button>

                            <p className="text-[9px] text-slate-400 text-center mt-2.5 opacity-80">
                              Covers {capTotalSteps} steps with{" "}
                              {capRecoveryWins}-win recovery.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {strategyMode === "COMPOUND" && (
                    <div className="space-y-4">
                      {/* COMPOUND SETTINGS - REFINED FUTURISTIC */}
                      <div className="relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-purple-500/30 rounded-xl blur-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-slate-900/90 border border-white/5 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
                          <button 
                            onClick={() => setCompoundConfigOpen(!compoundConfigOpen)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 transition-transform duration-500 ${compoundConfigOpen ? 'rotate-90' : ''}`}>
                                <Settings className="w-5 h-5 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
                              </div>
                              <div className="text-left">
                                <span className="block text-[10px] text-purple-400 font-black uppercase tracking-[0.2em] mb-0.5 opacity-80">Strategic Unit</span>
                                <span className="block text-base font-black text-white leading-none tracking-tight">Compound Matrix</span>
                              </div>
                            </div>
                            <div className={`p-1.5 rounded-full bg-slate-800 border border-white/5 text-slate-400 transition-all ${compoundConfigOpen ? 'rotate-180 text-purple-400 border-purple-500/40' : ''}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </button>

                          <AnimatePresence>
                            {compoundConfigOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="border-t border-white/5 bg-slate-950/40"
                              >
                                <div className="p-5 space-y-6">
                                  {/* Steps & Initial Risk Grid */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Hash className="w-3 h-3 text-blue-400" /> Max Trades
                                      </span>
                                      <select
                                        value={maxTrades}
                                        onChange={(e) => setMaxTrades(parseInt(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white font-black outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                      >
                                        {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                                          <option key={n} value={n}>{n} Trades</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-2">
                                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Target className="w-3 h-3 text-purple-400" /> Target Wins
                                      </span>
                                      <select
                                        value={compoundSteps}
                                        onChange={(e: any) => {
                                          const newSteps = parseInt(e.target.value);
                                          setCompoundSteps(newSteps);
                                          if (compoundCashoutStep > newSteps) setCompoundCashoutStep(newSteps);
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white font-black outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                                      >
                                        {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                                          <option key={n} value={n}>{n} Wins</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Coins className="w-3 h-3 text-emerald-400" /> Initial Risk
                                      </span>
                                      <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">{currency}</div>
                                        <input
                                          type="number"
                                          value={capBaseTrade}
                                          onChange={(e) => setCapBaseTrade(parseFloat(e.target.value) || 0)}
                                          className="w-full bg-slate-900 border border-slate-700/50 rounded-lg pl-6 pr-3 py-2 text-sm text-white font-mono font-bold outline-none focus:border-emerald-500/50 transition-all text-right"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reinvest Ratio: Slider + Box */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Reinvest Ratio</span>
                                        <span className="text-[9px] text-purple-400/60 font-bold font-mono">Profit Allocation</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="50"
                                          max="100"
                                          value={compoundReinvestRatio}
                                          onChange={(e) => setCompoundReinvestRatio(Math.min(100, Math.max(50, parseInt(e.target.value) || 0)))}
                                          className="w-14 bg-slate-900 border border-purple-500/30 rounded px-2 py-1 text-xs font-bold text-white text-center focus:border-purple-500 outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-purple-400">%</span>
                                      </div>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                      <div className="absolute inset-0 h-1.5 bg-slate-800 rounded-full my-auto" />
                                      <div 
                                        className="absolute h-1.5 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full my-auto shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                                        style={{ width: `${((compoundReinvestRatio - 50) / 50) * 100}%` }}
                                      />
                                      <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        step="5"
                                        value={compoundReinvestRatio}
                                        onChange={(e) => setCompoundReinvestRatio(parseInt(e.target.value))}
                                        className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                      />
                                    </div>
                                  </div>

                                  {/* Safe Cashout Step: Slider + Box */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Safe Exit Point</span>
                                        <span className="text-[9px] text-emerald-400/60 font-bold font-mono">Principal Protection</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-emerald-400">STEP</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max={compoundSteps}
                                          value={compoundCashoutStep}
                                          onChange={(e) => setCompoundCashoutStep(Math.min(compoundSteps, Math.max(1, parseInt(e.target.value) || 1)))}
                                          className="w-12 bg-slate-900 border border-emerald-500/30 rounded px-2 py-1 text-xs font-bold text-white text-center focus:border-emerald-500 outline-none"
                                        />
                                      </div>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                      <div className="absolute inset-0 h-1.5 bg-slate-800 rounded-full my-auto" />
                                      <div 
                                        className="absolute h-1.5 bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-full my-auto shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                        style={{ width: `${((compoundCashoutStep - 1) / (compoundSteps - 1)) * 100}%` }}
                                      />
                                      <input
                                        type="range"
                                        min="1"
                                        max={compoundSteps}
                                        step="1"
                                        value={compoundCashoutStep > compoundSteps ? compoundSteps : compoundCashoutStep}
                                        onChange={(e) => setCompoundCashoutStep(parseInt(e.target.value))}
                                        className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                      />
                                    </div>
                                  </div>

                                  {/* RRR & Market Selection: Versatile & Polished */}
                                  <div className="pt-3 border-t border-white/5 space-y-4">
                                    {/* Win Rate Row */}
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-0.5">Assumed Win Rate</span>
                                        <span className="text-[8px] text-emerald-400/60 font-bold font-mono">Probabilistic Success</span>
                                      </div>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          inputMode="text"
                                          value={winRateInput}
                                          onChange={(e) => handleWinRateUpdate(e.target.value)}
                                          placeholder="60%"
                                          className="bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-black w-24 text-right focus:border-emerald-500/50 outline-none transition-all"
                                        />
                                      </div>
                                    </div>

                                    {/* Win Rate Slider */}
                                    <div className="space-y-1.5 px-1">
                                      <div className="relative h-4 flex items-center">
                                        <div className="absolute inset-0 h-1 bg-slate-800 rounded-full my-auto" />
                                        <div 
                                          className="absolute h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full my-auto"
                                          style={{ width: `${assumedWinRate}%` }}
                                        />
                                        <input
                                          type="range"
                                          min="0.5"
                                          max="100"
                                          step="0.1"
                                          value={assumedWinRate}
                                          onChange={(e) => handleWinRateUpdate(parseFloat(e.target.value))}
                                          className="relative w-full h-1 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                                      {/* Success Probability Analytics */}
                                      <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-500/10 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Strategy Probability</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-mono font-black text-indigo-400">
                                              {(Math.pow(assumedWinRate / 100, compoundSteps) * 100).toFixed(2)}%
                                            </span>
                                            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                                          </div>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                                          <motion.div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.pow(assumedWinRate / 100, compoundSteps) * 100}%` }}
                                            transition={{ duration: 1 }}
                                          />
                                        </div>
                                        <p className="text-[8px] text-slate-600 font-medium leading-tight">
                                          Chance of hitting {compoundSteps} consecutive wins with a {assumedWinRate}% win rate.
                                        </p>
                                        
                                        <button 
                                          onClick={() => {
                                            const sequence = Array.from({ length: maxTrades }, () => Math.random() * 100 <= assumedWinRate ? 'W' : 'L').join('');
                                            const sim = runDetailedSimulation(sequence);
                                            confirmAction(
                                              "Live Simulation Result",
                                              `Simulated ${maxTrades} trades with your ${assumedWinRate}% Win Rate.\n\nStatus: ${sim.status}\nFinal Balance: ${currency}${sim.finalBalance.toFixed(2)}\nTotal PnL: ${currency}${sim.netProfit.toFixed(2)}\n\nWould you like to apply this specific sequence to your active trade log?`,
                                              () => {
                                                const newTrades = [...tradesInput];
                                                sim.trades.forEach((t, i) => {
                                                  if (newTrades[i]) {
                                                    newTrades[i] = {
                                                      ...newTrades[i],
                                                      result: t.result as TradeResult,
                                                      customAmount: t.amount.toFixed(2)
                                                    };
                                                  }
                                                });
                                                setTradesInput(newTrades);
                                                showToast("Simulation sequence applied", "success");
                                              }
                                            );
                                          }}
                                          className="w-full mt-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 py-2 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                          <Activity className="w-3 h-3 text-indigo-400" /> Run Proof Simulation
                                        </button>
                                      </div>

                                      <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-0.5">Risk Reward Ratio (RRR)</span>
                                          <span className="text-[9px] text-indigo-400/60 font-bold font-mono">Target Multiplier</span>
                                        </div>
                                        <div className="relative group/manual">
                                          <span className="absolute left-2 inset-y-0 flex items-center text-[10px] text-slate-500 font-bold">x</span>
                                          <input
                                            type="text"
                                            inputMode="text"
                                            value={rrrInput}
                                            onChange={(e) => handleRRRUpdate(e.target.value)}
                                            placeholder="1:2 or 92%"
                                            className="bg-slate-900 border border-slate-700/50 rounded-lg pl-2 pr-2 py-1.5 text-xs text-white font-mono font-black w-24 text-right focus:border-indigo-500/50 outline-none transition-all"
                                          />
                                        </div>
                                      </div>

                                      {/* Manual RRR Slider */}
                                      <div className="space-y-2 px-1">
                                        <div className="relative h-6 flex items-center">
                                          <div className="absolute inset-0 h-1 bg-slate-800 rounded-full my-auto" />
                                          <div 
                                            className="absolute h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full my-auto"
                                            style={{ width: `${Math.min(100, (compoundRewardRatio / 100) * 100)}%` }}
                                          />
                                          <input
                                            type="range"
                                            min="0.5"
                                            max="100"
                                            step="0.01"
                                            value={compoundRewardRatio}
                                            onChange={(e) => handleRRRUpdate(parseFloat(e.target.value))}
                                            className="relative w-full h-1 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                          />
                                        </div>
                                        <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] opacity-40">
                                          <span>Min (0.5x)</span>
                                          <span>Manual Control Matrix</span>
                                          <span>Max (100x)</span>
                                        </div>
                                      </div>

                                      {/* Presets Grid */}
                                      <div className="space-y-2">
                                        {/* BINARY PRESETS */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black text-emerald-500/70 uppercase tracking-tighter w-12 shrink-0">Binary</span>
                                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                            {[0.80, 0.85, 0.90, 0.92, 0.95, 1.0].map((val) => (
                                              <button 
                                                key={val}
                                                onClick={() => handleRRRUpdate(val)}
                                                className={`text-[9px] px-2 py-1 rounded-md border font-black whitespace-nowrap transition-all ${compoundRewardRatio === val ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                              >
                                                {Math.round(val * 100)}%
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* FOREX PRESETS */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black text-indigo-500/70 uppercase tracking-tighter w-12 shrink-0">Forex</span>
                                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                            {[1.0, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0].map((val) => (
                                              <button 
                                                key={val}
                                                onClick={() => handleRRRUpdate(val)}
                                                className={`text-[9px] px-2 py-1 rounded-md border font-black whitespace-nowrap transition-all ${compoundRewardRatio === val ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                              >
                                                1:{Math.round(val)}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* CRYPTO PRESETS */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black text-amber-500/70 uppercase tracking-tighter w-12 shrink-0">Crypto</span>
                                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                            {[1.0, 5.0, 10.0, 25.0, 50.0, 75.0, 100.0].map((val) => (
                                              <button 
                                                key={val}
                                                onClick={() => handleRRRUpdate(val)}
                                                className={`text-[9px] px-2 py-1 rounded-md border font-black whitespace-nowrap transition-all ${compoundRewardRatio === val ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                              >
                                                1:{Math.round(val)}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Locked Min Trade</span>
                                        <span className="text-[8px] text-slate-600 font-medium">Safety Floor</span>
                                      </div>
                                      <div className="relative">
                                        <span className="absolute left-2 inset-y-0 flex items-center text-[10px] text-slate-500 font-bold">{currency}</span>
                                        <input
                                          type="number"
                                          value={minTradeAmount}
                                          onChange={(e) => setMinTradeAmount(parseFloat(e.target.value) || 0)}
                                          className="bg-slate-900 border border-slate-700/50 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-mono font-black w-24 text-right focus:border-indigo-500/50 outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Result Panel */}
                                  <div className="bg-slate-900 rounded-lg p-4 border border-indigo-500/20 relative overflow-hidden group/result">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover/result:bg-indigo-500/20 transition-all duration-1000" />
                                    <div className="relative z-10">
                                      <div className="flex justify-between items-end mb-3">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1 opacity-80">Max Projected Outcome</span>
                                          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-mono tracking-tighter">
                                            {simSeq.length > 0 && typeof simSeq[simSeq.length-1].step === 'number' && simSeq[simSeq.length-1].step >= compoundSteps
                                              ? `+${formatMoney(simSeq[simSeq.length-1].balanceAfter - runningBalance)}`
                                              : "Calculating..."}
                                          </span>
                                        </div>
                                        <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                          <TrendingUp className="w-5 h-5 text-indigo-400" />
                                        </div>
                                      </div>
                                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: '100%' }}
                                          transition={{ duration: 1.5, ease: "circOut" }}
                                          className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                                        />
                                      </div>
                                      <div className="flex justify-between items-center text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3 opacity-60">
                                        <span>Matrix Confirmed</span>
                                        <span>Secure Cycle</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* MASTERCLASS GUIDE & DISCLAIMER */}
                                  <div className="space-y-3 pt-2">
                                    {/* GUIDE DROPDOWN */}
                                    <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl overflow-hidden transition-all duration-300">
                                      <button 
                                        onClick={() => setCompoundGuideOpen(!compoundGuideOpen)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform ${compoundGuideOpen ? 'rotate-12' : ''}`}>
                                            <BookOpen className="w-4 h-4" />
                                          </div>
                                          <div className="text-left">
                                            <span className="block text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-0.5">Learn Strategy</span>
                                            <span className="block text-xs font-bold text-white leading-none">Masterclass Guide</span>
                                          </div>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${compoundGuideOpen ? 'rotate-180 text-white' : ''}`} />
                                      </button>
                                      
                                      <AnimatePresence>
                                        {compoundGuideOpen && (
                                          <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4 bg-indigo-500/5 border-t border-white/5"
                                          >
                                              <div className="space-y-4 mt-3">
                                                <div className="space-y-2">
                                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Zap className="w-3 h-3" /> 01. The Core Philosophy
                                                  </h4>
                                                  <p className="text-[10px] text-slate-400 leading-relaxed">
                                                    Compound Matrix is not just trading; it's a mathematical engine. It takes a small seed and uses the market's own momentum to build a snowball effect. The goal is to survive long enough for exponential growth to kick in.
                                                  </p>
                                                </div>

                                                <div className="space-y-3">
                                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Target className="w-3 h-3 text-emerald-400" /> 02. Execution Roadmap
                                                  </h4>
                                                  <div className="grid grid-cols-1 gap-2">
                                                    <div className="p-2 bg-slate-950/40 rounded border border-white/5">
                                                      <span className="block text-[9px] font-bold text-white uppercase mb-0.5">Phase A: The Survival Stage</span>
                                                      <p className="text-[9px] text-slate-500 leading-tight">During the first few wins, your focus is purely on hitting the "Safe Exit" point. Do not skip this! This is where you pull back your initial risk.</p>
                                                    </div>
                                                    <div className="p-2 bg-slate-950/40 rounded border border-white/5">
                                                      <span className="block text-[9px] font-bold text-white uppercase mb-0.5">Phase B: The House Money Era</span>
                                                      <p className="text-[9px] text-slate-500 leading-tight">After the Safe Exit, your initial capital is back in your wallet. Every trade from here is pure profit. This psychological advantage allows you to hold for bigger compound wins.</p>
                                                    </div>
                                                    <div className="p-2 bg-slate-950/40 rounded border border-white/5">
                                                      <span className="block text-[9px] font-bold text-white uppercase mb-0.5">Phase C: The Multiplier Peak</span>
                                                      <p className="text-[9px] text-slate-500 leading-tight">As you approach your target wins (e.g., 5-7 wins), the amounts grow rapidly. Stay disciplined. If the streak breaks, you only lose profit, not your principal.</p>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 space-y-2">
                                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                    Golden Rules for Success
                                                  </h4>
                                                  <ul className="text-[9px] text-slate-400 space-y-1 list-disc pl-3">
                                                    <li>Never start a cycle during high-impact news.</li>
                                                    <li>If you lose at Stage 1, reset immediately.</li>
                                                    <li>Use a Reinvest Ratio of 80% if you want a balance of growth vs partial profit locking.</li>
                                                    <li>Stop the session once you reach your target wins or hit 3 consecutive cycles of loss.</li>
                                                  </ul>
                                                </div>

                                                <p className="text-[9px] text-indigo-400/80 font-bold italic text-center px-4">
                                                  "Compounding is the 8th wonder of the world. He who understands it, earns it... he who doesn't, pays it."
                                                </p>
                                              </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    {/* RISK DISCLAIMER DROPDOWN */}
                                    <div className="bg-rose-950/20 border border-rose-500/10 rounded-xl overflow-hidden transition-all duration-300">
                                      <button 
                                        onClick={() => setCompoundDisclaimerOpen(!compoundDisclaimerOpen)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-rose-500/5 transition-colors group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform ${compoundDisclaimerOpen ? 'rotate-12' : ''}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                          </div>
                                          <div className="text-left">
                                            <span className="block text-[9px] text-rose-500/60 uppercase font-black tracking-widest leading-none mb-0.5">Critical Notice</span>
                                            <span className="block text-xs font-bold text-rose-400/90 leading-none">Risk & Author Disclaimer</span>
                                          </div>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-rose-500/50 transition-transform duration-300 ${compoundDisclaimerOpen ? 'rotate-180 text-rose-400' : ''}`} />
                                      </button>
                                      
                                      <AnimatePresence>
                                        {compoundDisclaimerOpen && (
                                          <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4 bg-rose-500/5 border-t border-rose-500/10"
                                          >
                                            <div className="space-y-3 mt-3">
                                              <p className="text-[10px] text-rose-200/60 leading-relaxed font-bold uppercase tracking-tight text-center">
                                                By using this system, you acknowledge and agree to the following terms:
                                              </p>
                                              
                                              <div className="p-3 bg-slate-950/50 rounded-lg border border-rose-500/20 text-[9px] text-slate-400 space-y-2 leading-relaxed">
                                                <p><span className="text-rose-500 font-black tracking-widest">01. SOLE RESPONSIBILITY:</span> All financial activities, trades, and strategy selections are your own decision. You carry 100% of the risk associated with capital loss.</p>
                                                <p><span className="text-rose-500 font-black tracking-widest">02. NO LIABILITY:</span> The Creator, Author, Developer, and System Owner of this application shall NOT be held responsible for any losses, missed profits, or psychological stress incurred through the use of these tools.</p>
                                                <p><span className="text-rose-500 font-black tracking-widest">03. EDUCATIONAL ONLY:</span> This app provides mathematical projections and calculations for informational/educational purposes only. It is NOT financial advice or a guarantee of future performance.</p>
                                                <p><span className="text-rose-500 font-black tracking-widest">04. MARKET RISK:</span> Trading involving compounding is high-risk. Market volatility can bypass logic calculations. Never trade with capital you cannot afford to lose.</p>
                                              </div>

                                              <div className="flex items-center justify-center gap-2 py-1 text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] opacity-80">
                                                <ShieldAlert className="w-3 h-3" /> STRICT PROTOCOL ENGAGED
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* RECOVERY SETTINGS - REFINED FUTURISTIC */}
                      <div className="relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-rose-500/30 via-red-500/20 to-rose-500/30 rounded-xl blur-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-slate-900/90 border border-white/5 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
                          <button 
                            onClick={() => setRecoveryConfigOpen(!recoveryConfigOpen)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 transition-transform duration-500 ${recoveryConfigOpen ? 'rotate-90' : ''}`}>
                                <ShieldAlert className="w-5 h-5 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
                              </div>
                              <div className="text-left">
                                <span className="block text-[10px] text-rose-400 font-black uppercase tracking-[0.2em] mb-0.5 opacity-80">Security Phase</span>
                                <span className="block text-base font-black text-white leading-none tracking-tight">Recovery Protocols</span>
                              </div>
                            </div>
                            <div className={`p-1.5 rounded-full bg-slate-800 border border-white/5 text-slate-400 transition-all ${recoveryConfigOpen ? 'rotate-180 text-rose-400' : ''}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </button>

                          <AnimatePresence>
                            {recoveryConfigOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="border-t border-white/5 bg-slate-950/40"
                              >
                                <div className="p-5 space-y-6">
                                  {/* Recovery Steps: Slider + Box */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Recovery Depth</span>
                                        <span className="text-[9px] text-rose-400/60 font-bold font-mono">Operational Buffer</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max="100"
                                          value={compoundRecoveryTrades}
                                          onChange={(e) => {
                                            const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                                            setCompoundRecoveryTrades(val);
                                            if (compoundRecoveryWins > val) setCompoundRecoveryWins(val);
                                          }}
                                          className="w-12 bg-slate-900 border border-rose-500/30 rounded px-2 py-1 text-xs font-bold text-white text-center focus:border-rose-500 outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-rose-400">TRADES</span>
                                      </div>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                      <div className="absolute inset-0 h-1.5 bg-slate-800 rounded-full my-auto" />
                                      <div 
                                        className="absolute h-1.5 bg-gradient-to-r from-rose-600 to-red-500 rounded-full my-auto shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                        style={{ width: `${((compoundRecoveryTrades - 1) / 99) * 100}%` }}
                                      />
                                      <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        step="1"
                                        value={compoundRecoveryTrades}
                                        onChange={(e: any) => {
                                          const newMax = parseInt(e.target.value);
                                          setCompoundRecoveryTrades(newMax);
                                          if (compoundRecoveryWins > newMax) setCompoundRecoveryWins(newMax);
                                        }}
                                        className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                      />
                                    </div>
                                  </div>

                                  {/* Recovery Wins Needed: Slider + Box */}
                                  <div className="space-y-3 pt-1">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Target Sync</span>
                                        <span className="text-[9px] text-rose-400/60 font-bold font-mono">Restoration Goal</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max={compoundRecoveryTrades}
                                          value={compoundRecoveryWins}
                                          onChange={(e) => setCompoundRecoveryWins(Math.min(compoundRecoveryTrades, Math.max(1, parseInt(e.target.value) || 1)))}
                                          className="w-12 bg-slate-900 border border-rose-500/30 rounded px-2 py-1 text-xs font-bold text-white text-center focus:border-rose-500 outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-rose-400">WINS</span>
                                      </div>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                      <div className="absolute inset-0 h-1.5 bg-slate-800 rounded-full my-auto" />
                                      <div 
                                        className="absolute h-1.5 bg-gradient-to-r from-rose-600 to-red-500 rounded-full my-auto shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                        style={{ width: `${((compoundRecoveryWins - 1) / (Math.max(1, compoundRecoveryTrades) - 1)) * 100}%` }}
                                      />
                                      <input
                                        type="range"
                                        min="1"
                                        max={Math.max(1, compoundRecoveryTrades)}
                                        step="1"
                                        value={compoundRecoveryWins}
                                        onChange={(e: any) => setCompoundRecoveryWins(parseInt(e.target.value))}
                                        className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                      />
                                    </div>
                                  </div>

                                  <div className="bg-rose-500/5 rounded-xl border border-rose-500/20 p-4 relative overflow-hidden group/alert">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform duration-700 group-hover/alert:scale-110">
                                      <ShieldAlert className="w-16 h-16 text-rose-500" />
                                    </div>
                                    <p className="text-[11px] text-rose-300 leading-relaxed text-center font-medium relative z-10">
                                      <span className="block font-black text-[10px] mb-2 tracking-[0.2em] uppercase text-rose-500 opacity-80 underline underline-offset-4 decoration-rose-500/30">Auto-Mitigation Active</span>
                                      Operational risk diluted across <strong>{compoundRecoveryWins}</strong> precision wins within <strong>{compoundRecoveryTrades}</strong> cycles. Multi-layer account protection engaged.
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}


                  <InputRow
                    label="Session Start Capital"
                    type="number"
                    value={initialCapital}
                    onChange={(e: any) =>
                      setInitialCapital(parseFloat(e.target.value) || 0)
                    }
                    suffix={currency}
                  />
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">
                      {strategyMode === "CAPITAL"
                        ? "Expected Win Profit"
                        : "Session Profit Target"}
                    </span>
                    {strategyMode === "CAPITAL" ? (
                      <span className="text-sm font-bold text-emerald-400">
                        {formatMoney(expectedSessionProfit)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={profitTarget}
                          onChange={(e) =>
                            setProfitTarget(parseFloat(e.target.value) || 0)
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white w-20 focus:border-emerald-500 outline-none"
                        />
                        <select
                          value={dailyGoalFormat}
                          onChange={(e) => setDailyGoalFormat(e.target.value)}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="%">%</option>
                          <option value="$">$</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <StatRow label="Session Trades" value={tCount} />
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">Winning Goal (Wins)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={automatedWins}
                        onChange={(e) => setAutomatedWins(parseInt(e.target.value) || 1)}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white w-20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  {strategyMode === "TARGET" && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                      <span className="text-sm text-slate-400">Martingale Steps</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={maxTrades}
                          onChange={(e) => setMaxTrades(parseInt(e.target.value) || 1)}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white w-20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                  <StatRow
                    label="Session Win Rate"
                    value={formatPercent(winRate)}
                    color={
                      winRate >= 50 ? "text-emerald-400" : "text-amber-400"
                    }
                  />
                  <StatRow
                    label="Session Profit"
                    value={formatMoney(winProfit)}
                    color={
                      winProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  />
                  <StatRow
                    label="Current Balance"
                    value={formatMoney(runningBalance)}
                    highlight
                    color="text-emerald-400 text-lg"
                  />

                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <InputRow
                      label="Stop Loss %"
                      type="number"
                      value={stopLossPercent}
                      onChange={(e: any) =>
                        setStopLossPercent(parseFloat(e.target.value) || 0)
                      }
                      suffix="%"
                    />
                    <StatRow
                      label="Stop Loss Amount"
                      value={formatMoney(stopLossMoney)}
                      color="text-rose-400"
                    />
                    <InputRow
                      label="Max Loss Limit"
                      type="number"
                      value={maxLossLimit}
                      onChange={(e: any) =>
                        setMaxLossLimit(parseInt(e.target.value) || 0)
                      }
                    />
                    <p className="text-[10px] text-slate-500 text-right mt-1">
                      Auto-updated based on Max Safe Losses
                    </p>
                  </div>
                </Card>

                {/* DAILY GOALS (est.) */}
                <Card title="DAILY GOALS (est.)" icon={Target}>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">
                      Profit Target
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={macroGoalTarget}
                        onChange={(e) =>
                          setMacroGoalTarget(parseFloat(e.target.value) || 0)
                        }
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-sm text-white w-20 focus:border-emerald-500 outline-none"
                      />
                      <select
                        value={macroGoalFormat}
                        onChange={(e) => setMacroGoalFormat(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                    </div>
                  </div>
                  <StatRow
                    label="Sessions Required"
                    value={calculatedSessionsRequired}
                    color="text-amber-400"
                  />
                  <StatRow
                    label="Account Gain"
                    value={formatPercent(macroAccountGain)}
                    color="text-emerald-400"
                  />
                  <StatRow
                    label="Capital Final"
                    value={formatMoney(macroCapitalFinal)}
                    color="text-emerald-400"
                  />
                </Card>

                {/* SMART STRATEGY ANALYZER */}
                <Card title="Smart Strategy Analyzer" icon={Calculator}>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                      <div className="text-xs text-slate-400 mb-1">
                        Next Recommended Trade
                      </div>
                      <div className="text-3xl font-black text-emerald-400 font-mono">
                        {nextTradeAmt > 0
                          ? formatMoney(nextTradeAmt)
                          : "TARGET HIT"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-500" /> Auto-fills
                        in the active row
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/50 p-2 rounded border border-slate-700 text-center">
                        <div className="text-[10px] text-slate-400 uppercase">
                          {strategyMode === "COMPOUND" ? "Remaining Wins" : "Max Safe Losses"}
                        </div>
                        <div className="text-xl font-bold text-white">
                          {simSeq.length > 0 ? simSeq.length : 0}
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded border border-slate-700 text-center">
                        <div className="text-[10px] text-slate-400 uppercase">
                          {strategyMode === "COMPOUND" ? "Target Profit" : "Total Capital at Risk"}
                        </div>
                        <div className="text-xl font-bold text-emerald-400">
                          {strategyMode === "COMPOUND" && simSeq.length > 0
                            ? formatMoney(simSeq[simSeq.length - 1].balanceAfter - runningBalance)
                            : simSeq.length > 0
                            ? formatMoney(simSeq[simSeq.length - 1].totalRisked)
                            : formatMoney(0)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" /> {strategyMode === "COMPOUND" ? "Compound Sequence (Wins)" : "Martingale Sequence (Losses)"}
                      </div>
                      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar relative">
                        {/* Vertical connecting line */}
                        {simSeq.length > 1 && (
                          <div className="absolute left-[11px] top-3 bottom-8 w-[2px] bg-slate-700/50 z-0"></div>
                        )}

                        <div className="flex flex-col gap-0 relative z-10">
                          {simSeq.map((step, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === simSeq.length - 1;
                            const isRecovery = typeof step.step === "string" && step.step.startsWith("R");

                            return (
                              <div
                                key={idx}
                                className="flex items-stretch gap-3 group pb-3 last:pb-0"
                              >
                                {/* Node Indicator */}
                                <div className="flex flex-col items-center pt-1 relative">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 z-10 transition-colors ${
                                      isRecovery
                                        ? "bg-rose-500/20 border-rose-500 text-rose-300" 
                                        : isFirst
                                        ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        : isLast
                                          ? "bg-purple-900 border-purple-500 text-purple-200"
                                          : "bg-slate-800 border-slate-600 text-slate-400 group-hover:border-slate-500"
                                    }`}
                                  >
                                    {step.step}
                                  </div>
                                </div>

                                {/* Content Card */}
                                <div
                                  className={`flex-1 flex justify-between items-center p-2.5 rounded-lg border text-xs font-mono transition-all relative group/card ${
                                    isFirst
                                      ? "bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                      : isLast
                                        ? "bg-rose-950/30 border-rose-900/50"
                                        : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/50"
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                                      Trade Amount
                                    </span>
                                    <span
                                      className={
                                        isFirst
                                          ? "text-emerald-400 font-bold text-sm"
                                          : isLast
                                            ? "text-rose-400 font-bold text-sm"
                                            : "text-slate-300 font-medium text-sm"
                                      }
                                    >
                                      {formatMoney(step.amount)}
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                                      {strategyMode === "COMPOUND" ? "Bal After Win" : "Bal After Loss"}
                                    </span>
                                    <span
                                      className={
                                        isFirst
                                          ? "text-emerald-200"
                                          : isLast
                                            ? (strategyMode === "COMPOUND" ? "text-emerald-300" : "text-rose-300")
                                            : "text-slate-400"
                                      }
                                    >
                                      {formatMoney(step.balanceAfter)}
                                    </span>
                                  </div>

                                  {/* Tooltip */}
                                  <div className="opacity-0 group-hover/card:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-600 pointer-events-none transition-opacity z-50 w-52">
                                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1 flex justify-between">
                                      <span>Step {step.step} Details</span>
                                      <span className={isRecovery ? "text-rose-400" : "text-emerald-400 text-[10px]"}>
                                        {isRecovery ? "Recovery" : `Step ${idx + 1}/${simSeq.length}`}
                                      </span>
                                    </div>
                                    <div className="flex justify-between mb-1 text-[10px]">
                                      <span className="text-slate-400">Bal Before:</span>
                                      <span className="font-mono">{formatMoney(step.balanceBefore)}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-slate-400">Trade Amt:</span>
                                      <span className="font-mono text-rose-400">-{formatMoney(step.amount)}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-slate-400">If Won:</span>
                                      <span className="font-mono text-emerald-400">+{formatMoney(step.profitIfWon)}</span>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-1 border-t border-slate-700/50">
                                      <span className="text-slate-400 font-bold">Bal If Won:</span>
                                      <span className="font-mono font-bold text-emerald-400">{formatMoney(step.balanceAfter)}</span>
                                    </div>
                                    {strategyMode === "COMPOUND" && (
                                       <div className="flex justify-between mt-1 pt-1 border-t border-slate-700/50 text-[10px]">
                                         <span className={step.balanceAfter - runningBalance >= 0 ? "text-emerald-500/70" : "text-rose-500/70"}>
                                           Net Session:
                                         </span>
                                         <span className={`font-mono ${step.balanceAfter - runningBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                           {formatMoney(step.balanceAfter - runningBalance)}
                                         </span>
                                       </div>
                                    )}
                                    {/* Tooltip Arrow */}
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-b border-r border-slate-600 rotate-45"></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {simSeq.length === 0 && (
                          <div className="text-xs text-rose-400 w-full text-center py-4 bg-rose-500/10 rounded-lg border border-rose-500/20 flex flex-col items-center gap-2 mt-2">
                            <AlertCircle className="w-5 h-5" />
                            Capital too low to continue sequence
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* OPTIONS & ACTIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
                  <Card title="Options" icon={Settings}>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-400">
                        Trade Log Rows (1-100)
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={maxTrades}
                          onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) return;
                            if (val > 100) val = 100;
                            setMaxTrades(val);
                          }}
                          onBlur={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val) || val < 1) setMaxTrades(1);
                          }}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-center text-sm text-white w-16 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-400">
                        Stop Loss Alert %
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={stopLossAlertPct}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) return;
                            if (val > 100) val = 100;
                            setStopLossAlertPct(val);
                          }}
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val) || val < 1) setStopLossAlertPct(20);
                          }}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-center text-sm text-white w-16 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-400">
                        App Theme
                      </span>
                      <div className="flex items-center gap-1">
                        <select
                          value={appTheme}
                          onChange={(e) => setAppTheme(e.target.value as 'dark' | 'light' | 'neon')}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="neon">Neon</option>
                        </select>
                      </div>
                    </div>
                    {[
                      {
                        key: "autoCompleteSession",
                        label: "Auto-Complete Session",
                      },
                      { key: "sessionEndAlert", label: "Session End Alert" },
                      { key: "autoCopyBalance", label: "Auto-Copy Balance" },
                      { key: "autoCountSession", label: "Auto-Count Session" },
                      { key: "autoSaveSession", label: "Auto-Save Session" },
                      { key: "lowTradeAlert", label: "Low Trade Alert" },
                      { key: "autoSyncLiveData", label: "Auto Sync - Live Mode" },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-sm text-slate-400">{label}</span>
                        <button
                          onClick={() =>
                            toggleOption(key as keyof typeof options)
                          }
                          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${options[key as keyof typeof options] ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}
                        >
                          {options[key as keyof typeof options] ? "ON" : "OFF"}
                        </button>
                      </div>
                    ))}
                    <div className="pt-4 mt-2 border-t border-slate-700/50">
                      <button
                        onClick={resetCurrentSession}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border border-amber-500/20"
                      >
                        <RefreshCw className="w-4 h-4" /> RESET CURRENT SESSION
                      </button>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    {/* ABOUT / FOOTER */}
                    <div className="relative mt-4 group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-amber-500/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center shadow-2xl overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>

                        <div className="mb-5 relative z-10">
                          <div className="inline-flex items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700/50 mb-3 shadow-inner">
                            <span className="text-2xl leading-none">🪙</span>
                          </div>
                          <h3 className="text-lg font-black tracking-wide">
                            <span className="text-green-400">ALADDIN</span> <span className="text-white">TRADE MANAGER</span>
                          </h3>
                          <div className="flex items-center justify-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                              Version 4.0
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              System Online
                            </span>
                          </div>
                        </div>

                        <div className="py-5 border-y border-slate-700/50 bg-gradient-to-b from-slate-800/20 to-transparent rounded-xl mb-5 relative z-10">
                          <div className="flex items-center justify-center gap-1.5 mb-2">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                              Project
                            </p>
                          </div>
                          <h4 className="text-base font-black text-white tracking-tight text-center">
                            BY : SAIFY KHAN
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-bold tracking-widest uppercase">
                            The 1% W🌐rld
                          </p>

                          <div className="mt-4 flex flex-col items-center gap-2.5">
                            <a
                              href="https://www.cocabellie.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 border border-rose-400/40 px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.45)] hover:shadow-[0_0_28px_rgba(225,29,72,0.7)] hover:-translate-y-0.5 cursor-pointer active:scale-95"
                            >
                              <GraduationCap className="w-4 h-4 text-white" />
                              ACADEMY
                            </a>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
                          <button
                            type="button"
                            onClick={() => openTelegramSupport()}
                            className="inline-flex items-center gap-2 text-[11px] font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> Aladdin AI Support
                          </button>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-end gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" /> © 2026 ALADDIN TRADE MANAGER
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5 text-center sm:text-right">
                              All Rights Reserved © Aladdin AI Organization  - www.Aladdin.Org.In
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW FOOTER */}
            <div className="max-w-7xl mx-auto mt-2 mb-2 px-2">
              <div className="bg-[#0b131e]/90 backdrop-blur-xl border border-slate-800/60 rounded-lg py-2.5 px-2 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                {/* Grid background effect */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBWMGgtLjV2NDBIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-40"></div>

                <div
                  className="relative z-10 flex flex-col items-center gap-1.5 w-full overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  <div className="border border-[#00d084]/80 bg-[#00d084]/10 text-[#00d084] px-3.5 py-0.5 rounded-md font-sans text-xs sm:text-sm md:text-base font-black tracking-[0.15em] sm:tracking-[0.2em] shadow-[0_0_10px_rgba(0,208,132,0.15)] whitespace-nowrap uppercase">
                    - ALADDIN AI ORGANIZATION -
                  </div>

                  <p className="text-slate-400 text-[8px] md:text-[10px] whitespace-nowrap">
                    All Rights Reserved © Aladdin AI Organization  - <a href="https://www.Aladdin.Org.In" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">www.Aladdin.Org.In</a>
                  </p>
                </div>
              </div>
            </div>

            {activeJournalTradeId !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      Trade #{activeJournalTradeId} Journal
                    </h3>
                    <button
                      onClick={() => setActiveJournalTradeId(null)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {(() => {
                      const trade = tradesInput.find(
                        (t) => t.id === activeJournalTradeId,
                      );
                      const journal = trade?.journal || {
                        notes: "",
                        emotion: "",
                        setup: "",
                      };

                      const updateJournal = (
                        field: keyof TradeJournal,
                        value: string,
                      ) => {
                        handleTradeChange(activeJournalTradeId, "journal", {
                          ...journal,
                          [field]: value,
                        });
                      };

                      return (
                        <>
                          {/* Emotion */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Emotion
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { emoji: "🚀", label: "Confident" },
                                { emoji: "😰", label: "Anxious" },
                                { emoji: "😡", label: "FOMO/Revenge" },
                                { emoji: "😐", label: "Neutral" },
                                { emoji: "🧠", label: "Disciplined" },
                              ].map((emo) => (
                                <button
                                  key={emo.label}
                                  onClick={() =>
                                    updateJournal("emotion", emo.label)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border ${journal.emotion === emo.label ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}
                                >
                                  <span>{emo.emoji}</span> {emo.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Setup/Strategy */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Setup / Strategy
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                "Breakout",
                                "Reversal",
                                "Trend Follow",
                                "Scalp",
                                "News",
                                "Other",
                              ].map((setup) => (
                                <button
                                  key={setup}
                                  onClick={() => updateJournal("setup", setup)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${journal.setup === setup ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}
                                >
                                  {setup}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Detailed Notes
                            </label>
                            <textarea
                              value={journal.notes}
                              onChange={(e) =>
                                updateJournal("notes", e.target.value)
                              }
                              placeholder="What went well? What went wrong? Lessons learned..."
                              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-y custom-scrollbar"
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
                    <button
                      onClick={() => setActiveJournalTradeId(null)}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {completionModal.show && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <h2
                    className={`text-2xl font-bold mb-2 ${completionModal.type === "TARGET_HIT" ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {completionModal.type === "TARGET_HIT"
                      ? "🎯 Target Reached!"
                      : completionModal.type === "MAX_TRADES"
                        ? "📊 Max Trades Reached"
                        : "⚠️ Limit Reached"}
                  </h2>
                  <p className="text-slate-300 mb-6">
                    {completionModal.message}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setCompletionModal({
                          show: false,
                          type: "",
                          message: "",
                        })
                      }
                      className="flex-1 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Keep Trading
                    </button>
                    <button
                      onClick={() => {
                        setCompletionModal({
                          show: false,
                          type: "",
                          message: "",
                        });
                        handleCompleteSession();
                      }}
                      className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Log Session
                    </button>
                  </div>
                </div>
              </div>
            )}
            {confirmModal.show && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <h2 className="text-xl font-bold mb-2 text-white">
                    {confirmModal.title}
                  </h2>
                  <p className="text-slate-300 mb-6">{confirmModal.message}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setConfirmModal({
                          show: false,
                          title: "",
                          message: "",
                          onConfirm: () => {},
                        })
                      }
                      className="flex-1 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal({
                          show: false,
                          title: "",
                          message: "",
                          onConfirm: () => {},
                        });
                      }}
                      className="flex-1 py-2.5 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-500/20"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {shareModal.show && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-blue-400" />
                      {shareModal.session ? "Share Session" : "Share Portfolio"}
                    </h2>
                    <button
                      onClick={() => setShareModal({ ...shareModal, show: false })}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Theme</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShareModal({ ...shareModal, theme: 'dark' })}
                          className={`flex-1 py-2 rounded-lg border ${shareModal.theme === 'dark' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                          Dark
                        </button>
                        <button
                          onClick={() => setShareModal({ ...shareModal, theme: 'light' })}
                          className={`flex-1 py-2 rounded-lg border ${shareModal.theme === 'light' ? 'bg-slate-100 border-blue-500 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setShareModal({ ...shareModal, theme: 'blue' })}
                          className={`flex-1 py-2 rounded-lg border ${shareModal.theme === 'blue' ? 'bg-blue-900 border-blue-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                          Blue
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <p className="text-white font-medium text-sm">Hide Capital</p>
                        <p className="text-slate-400 text-xs">Show percentages only</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={shareModal.hideCapital}
                          onChange={(e) => setShareModal({ ...shareModal, hideCapital: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Custom Username (Optional)</label>
                      <input
                        type="text"
                        value={shareModal.customUsername}
                        onChange={(e) => setShareModal({ ...shareModal, customUsername: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Custom Link (Optional)</label>
                      <input
                        type="text"
                        value={shareModal.customLink}
                        onChange={(e) => setShareModal({ ...shareModal, customLink: e.target.value })}
                        placeholder="https://yourlink.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        generateShareText(shareModal.session, shareModal.theme, shareModal.hideCapital, shareModal.customUsername, shareModal.customLink);
                        setShareModal({ ...shareModal, show: false });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-700"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </button>
                    <button
                      onClick={() => {
                        generateShareImage(shareModal.session, shareModal.theme, shareModal.hideCapital, shareModal.customUsername, shareModal.customLink);
                        setShareModal({ ...shareModal, show: false });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <Image className="w-4 h-4" />
                      Share Image
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showSessionSummary && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-emerald-500/20 p-3 rounded-full">
                      <Save className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-center text-white mb-2">
                    Log Session?
                  </h2>
                  <p className="text-center text-slate-400 mb-6 text-sm">
                    Please review your session performance before logging.
                  </p>

                  <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">
                        Total Trades
                      </span>
                      <span className="text-white font-mono font-bold">
                        {tCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">
                        Wins / Losses
                      </span>
                      <span className="font-mono font-bold">
                        <span className="text-emerald-400">{wCount}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-rose-400">{lCount}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Win Rate</span>
                      <span className="text-white font-mono font-bold">
                        {winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-px bg-slate-700/50 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Net Profit</span>
                      <span
                        className={`font-mono font-bold text-lg ${winProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {winProfit >= 0 ? "+" : ""}
                        {formatMoney(winProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSessionSummary(false)}
                      className="flex-1 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeCompleteSession}
                      className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Confirm & Log
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )}
    </React.Suspense>
</>
);
}
