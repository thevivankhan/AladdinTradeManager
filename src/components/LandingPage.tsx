import React, { useState, useRef, useEffect } from 'react';
import { SupportModal } from './SupportModal';
import { validateLicenseCode, saveActiveSession, MASTER_ADMIN_EMAILS } from '../lib/licenseEngine';
import {
  Key,
  User,
  User as UserIcon,
  Menu,
  X,
  Globe,
  BookOpen,
  MessageCircle,
  Play,
  Pause,
  VolumeX,
  Maximize,
  Minimize,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Bot,
  Zap,
  TrendingUp,
  ShieldCheck,
  Send,
  HelpCircle,
  Smartphone,
  Monitor,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Film,
  Clock,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDirectLogin?: (user: any) => void;
}

type TabMode = 'code' | 'id';

interface AccessLevel {
  level: number;
  managedTrades: number;
  defaultEfficiency: number;
  colorClass: string;
  solidColor: string;
  baseCapital: number;
}

const ACCESS_LEVELS: AccessLevel[] = [
  {
    level: 1,
    managedTrades: 10,
    defaultEfficiency: 70,
    colorClass: 'text-pink-400',
    solidColor: '#ec4899',
    baseCapital: 50,
  },
  {
    level: 2,
    managedTrades: 15,
    defaultEfficiency: 75,
    colorClass: 'text-indigo-400',
    solidColor: '#6366f1',
    baseCapital: 100,
  },
  {
    level: 3,
    managedTrades: 25,
    defaultEfficiency: 82,
    colorClass: 'text-sky-400',
    solidColor: '#0ea5e9',
    baseCapital: 200,
  },
  {
    level: 4,
    managedTrades: 40,
    defaultEfficiency: 90,
    colorClass: 'text-teal-400',
    solidColor: '#14b8a6',
    baseCapital: 500,
  },
  {
    level: 5,
    managedTrades: 75,
    defaultEfficiency: 98,
    colorClass: 'text-amber-400',
    solidColor: '#eab308',
    baseCapital: 1000,
  },
];

const CANDLESTICKS = [
  { isGreen: true, height: 42, wickTop: 10, wickBottom: 8 },
  { isGreen: false, height: 35, wickTop: 6, wickBottom: 12 },
  { isGreen: true, height: 56, wickTop: 14, wickBottom: 6 },
  { isGreen: true, height: 68, wickTop: 12, wickBottom: 10 },
  { isGreen: false, height: 48, wickTop: 8, wickBottom: 16 },
  { isGreen: false, height: 38, wickTop: 12, wickBottom: 8 },
  { isGreen: true, height: 60, wickTop: 10, wickBottom: 12 },
  { isGreen: true, height: 75, wickTop: 16, wickBottom: 6 },
  { isGreen: false, height: 45, wickTop: 8, wickBottom: 14 },
  { isGreen: true, height: 52, wickTop: 12, wickBottom: 10 },
  { isGreen: false, height: 40, wickTop: 6, wickBottom: 10 },
  { isGreen: true, height: 64, wickTop: 14, wickBottom: 8 },
  { isGreen: true, height: 70, wickTop: 10, wickBottom: 12 },
  { isGreen: false, height: 50, wickTop: 12, wickBottom: 14 },
  { isGreen: true, height: 58, wickTop: 8, wickBottom: 8 },
  { isGreen: false, height: 36, wickTop: 10, wickBottom: 12 },
  { isGreen: true, height: 72, wickTop: 14, wickBottom: 10 },
  { isGreen: true, height: 48, wickTop: 8, wickBottom: 6 },
  { isGreen: false, height: 42, wickTop: 10, wickBottom: 14 },
  { isGreen: true, height: 62, wickTop: 12, wickBottom: 8 },
];

const PLATFORM_FEATURES = [
  { label: 'Advance Trade Manager', color: 'bg-cyan-400', shadow: 'shadow-[0_0_8px_rgba(6,182,212,0.8)]' },
  { label: 'Smart Trading Journal', color: 'bg-purple-400', shadow: 'shadow-[0_0_8px_rgba(192,132,252,0.8)]' },
  { label: 'Chart AI Scanner', color: 'bg-indigo-400', shadow: 'shadow-[0_0_8px_rgba(129,140,248,0.8)]' },
  { label: 'Chart AI Reader', color: 'bg-fuchsia-400', shadow: 'shadow-[0_0_8px_rgba(232,121,249,0.8)]' },
  { label: 'Calculator', color: 'bg-emerald-400', shadow: 'shadow-[0_0_8px_rgba(52,211,153,0.8)]' },
  { label: 'Currency Calculator', color: 'bg-amber-400', shadow: 'shadow-[0_0_8px_rgba(251,191,36,0.8)]' },
  { label: 'Compounding Calculator', color: 'bg-pink-400', shadow: 'shadow-[0_0_8px_rgba(244,114,182,0.8)]' },
  { label: 'Currency Convertor', color: 'bg-teal-400', shadow: 'shadow-[0_0_8px_rgba(45,212,191,0.8)]' },
  { label: 'Live Currency Rate', color: 'bg-lime-400', shadow: 'shadow-[0_0_8px_rgba(163,230,53,0.8)]' },
  { label: '30-Day Growth Planner', color: 'bg-emerald-400', shadow: 'shadow-[0_0_8px_rgba(52,211,153,0.8)]' },
  { label: 'Anti-Tilt & Streak Shield', color: 'bg-amber-400', shadow: 'shadow-[0_0_8px_rgba(251,191,36,0.8)]' },
  { label: 'Real-Time Performance Analytics', color: 'bg-sky-400', shadow: 'shadow-[0_0_8px_rgba(56,189,248,0.8)]' },
  { label: 'Automated Recovery Matrix', color: 'bg-teal-400', shadow: 'shadow-[0_0_8px_rgba(45,212,191,0.8)]' },
  { label: 'Daily Loss & Profit Lockout', color: 'bg-rose-400', shadow: 'shadow-[0_0_8px_rgba(251,113,133,0.8)]' },
  { label: 'Forward Sequence Simulator', color: 'bg-indigo-400', shadow: 'shadow-[0_0_8px_rgba(129,140,248,0.8)]' },
  { label: 'Multi-Timeframe Market Bias', color: 'bg-fuchsia-400', shadow: 'shadow-[0_0_8px_rgba(232,121,249,0.8)]' },
  { label: 'Win Rate & Drawdown Tracker', color: 'bg-lime-400', shadow: 'shadow-[0_0_8px_rgba(163,230,53,0.8)]' },
  { label: 'Premium Community Access', color: 'bg-amber-300', shadow: 'shadow-[0_0_8px_rgba(252,211,77,0.8)]' },
  { label: 'Dedicated Priority Customer Support', color: 'bg-blue-400', shadow: 'shadow-[0_0_8px_rgba(96,165,250,0.8)]' },
];

export interface TutorialClip {
  id: string;
  slotNumber: number;
  title: string;
  duration: string;
  durationSeconds: number;
  tag: string;
  tagColor: string;
  videoUrl: string;
  isReady: boolean;
  summary: string;
}

export const TUTORIAL_CLIPS: TutorialClip[] = [
  {
    id: 'overview',
    slotNumber: 0,
    title: 'ATM™ Core Ecosystem & Smart Journal Overview',
    duration: '0:33',
    durationSeconds: 33,
    tag: 'Core Demo',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    videoUrl: '/assets/aistudio/VID-20261028-WA0005_101341a5.mp4',
    isReady: true,
    summary: 'Full platform walkthrough, risk management matrix, and live execution interface.',
  },
  {
    id: 'slot-1',
    slotNumber: 1,
    title: 'Chart AI Scanner & Neural Precision In Action',
    duration: '0:40',
    durationSeconds: 40,
    tag: 'AI Scanner',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0001_74f47e0d.mp4',
    isReady: true,
    summary: 'Live AI Scanner demo: Live & OTC sync, camera & upload chart scanning, and multi-candle predictive price action analysis.',
  },
  {
    id: 'slot-2',
    slotNumber: 2,
    title: 'Risk Lock Controller & Daily Loss Lockout',
    duration: '0:46',
    durationSeconds: 46,
    tag: 'Discipline Shield',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0002_52f34ad6.mp4',
    isReady: true,
    summary: 'Live Risk Lock demo: Max daily loss threshold, trade emotion journaling, and automated terminal lockout against revenge trading.',
  },
  {
    id: 'slot-3',
    slotNumber: 3,
    title: '30-Day Growth Planner & Compounding Engine',
    duration: '0:38',
    durationSeconds: 38,
    tag: 'Growth Matrix',
    tagColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0000_1602a761.mp4',
    isReady: true,
    summary: 'Comprehensive 30-Day Planner walkthrough: Daily target compounding, milestone projections, and session trade pulse tracking.',
  },
  {
    id: 'slot-4',
    slotNumber: 4,
    title: 'Strategy Backtester & Risk Simulator',
    duration: '0:30',
    durationSeconds: 30,
    tag: 'Simulator',
    tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0003_13a46953.mp4',
    isReady: true,
    summary: 'Live Strategy Simulator: Enter win/loss sequences (W/L), test Martingale compound settings risk-free, and verify drawdown targets.',
  },
  {
    id: 'slot-5',
    slotNumber: 5,
    title: 'Advanced Trading Calculator & Position Sizer',
    duration: '0:33',
    durationSeconds: 33,
    tag: 'Calculator',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0004_8ea2b3de.mp4',
    isReady: true,
    summary: 'Instant position sizing: In-app math, rapid ratio & capital breakdown, and calculation history log.',
  },
  {
    id: 'slot-6',
    slotNumber: 6,
    title: 'Live Multi-Currency Exchange Converter',
    duration: '0:30',
    durationSeconds: 30,
    tag: 'Converter',
    tagColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0005_f1e02d0d.mp4',
    isReady: true,
    summary: 'Global Forex conversions: Live market rates updated every 10 seconds, multi-fiat pairs, and real-time converted totals.',
  },
  {
    id: 'slot-7',
    slotNumber: 7,
    title: 'Basic Trade Journal & Mindset Notes',
    duration: '0:44',
    durationSeconds: 44,
    tag: 'Journal',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0006_f29e0ed2.mp4',
    isReady: true,
    summary: 'In-app trade journaling: Record trading psychology, discipline notes, and lessons learned with automatic local autosave.',
  },
  {
    id: 'slot-8',
    slotNumber: 8,
    title: 'Performance Analytics Dashboard & Equity Curve',
    duration: '0:21',
    durationSeconds: 21,
    tag: 'Analytics',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0007_6c7fa597.mp4',
    isReady: true,
    summary: 'Institutional metrics: Win rate %, profit factor, interactive equity curve, and 30-day performance calendar grid.',
  },
  {
    id: 'slot-9',
    slotNumber: 9,
    title: 'Smart Trade Journal & Psychology Analysis',
    duration: '0:47',
    durationSeconds: 47,
    tag: 'Smart Journal',
    tagColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0008_e2efcaf5.mp4',
    isReady: true,
    summary: 'Comprehensive trade logging: Sentiment tracking, chart screenshot uploads, mistake violation audit, and weekly AI insights.',
  },
  {
    id: 'slot-10',
    slotNumber: 10,
    title: 'Daily Trading Plan & Pre-Market Discipline',
    duration: '0:31',
    durationSeconds: 31,
    tag: 'Daily Plan',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0009_db77b907.mp4',
    isReady: true,
    summary: 'Pre-market routine: 5-point readiness checklist, daily profit & max loss limits, and end-of-day grading review.',
  },
  {
    id: 'slot-11',
    slotNumber: 11,
    title: 'Advanced Position Sizing & Risk Parameters',
    duration: '0:35',
    durationSeconds: 35,
    tag: 'Position Size',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0010_4182d1e2.mp4',
    isReady: true,
    summary: 'Precision risk management: Crypto, Forex, Stocks, and Binary sizing with automatic stop loss % and R:R ratios.',
  },
  {
    id: 'slot-12',
    slotNumber: 12,
    title: 'Strategy AI Assistant & Institutional Playbooks',
    duration: '0:17',
    durationSeconds: 17,
    tag: 'Strategy AI',
    tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0011_c61338ef.mp4',
    isReady: true,
    summary: 'AI trading edge optimization: Automated setup detection, best asset pair matching, and institutional trend-following strategies.',
  },
  {
    id: 'slot-13',
    slotNumber: 13,
    title: 'Daily Compounding Calculator & Win Matrix',
    duration: '0:37',
    durationSeconds: 37,
    tag: 'Compounding',
    tagColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0012_eafe8c5d.mp4',
    isReady: true,
    summary: 'Exponential growth modeling: Reinvest vs withdraw slider, consecutive win steps, broker payout %, and milestone trajectory.',
  },
  {
    id: 'slot-14',
    slotNumber: 14,
    title: 'Paradox Strategy & Stochastic Oscillator',
    duration: '0:30',
    durationSeconds: 30,
    tag: 'Paradox FX',
    tagColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    videoUrl: '/assets/aistudio/VID-20261109-WA0013_ccb5628d.mp4',
    isReady: true,
    summary: 'Counter-trend overextension strategy: Bollinger Bands (20, 2), Stochastic (14, 3, 3) momentum exhaustion, and precise entry rules.',
  },
];

const VideoShowcase: React.FC<{ aboutUsTitle: string }> = React.memo(({ aboutUsTitle }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isShutterOpen, setIsShutterOpen] = useState<boolean>(false);
  const [activeClipId, setActiveClipId] = useState<string>('overview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const isMuted = true;

  const activeClip = TUTORIAL_CLIPS.find((c) => c.id === activeClipId) || TUTORIAL_CLIPS[0];
  const activeMaxSeconds = activeClip.durationSeconds;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const container = playerContainerRef.current;
      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any)?.webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  // Auto-play on initial mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  // When active clip changes, auto-play next clip seamlessly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [activeClipId]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.muted = true;
        videoRef.current.volume = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Math.min(activeMaxSeconds, Math.max(0, Number(e.target.value)));
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setIsSeeking(false);
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  };

  const handleSelectClip = (clip: TutorialClip) => {
    setActiveClipId(clip.id);
    setCurrentTime(0);
    if (videoRef.current) {
      const targetSrc = clip.videoUrl || TUTORIAL_CLIPS[0].videoUrl;
      videoRef.current.src = targetSrc;
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const activeClipIndex = TUTORIAL_CLIPS.findIndex((c) => c.id === activeClipId);
  const currentClipIndex = activeClipIndex >= 0 ? activeClipIndex : 0;

  const handlePrevClip = () => {
    const prevIndex = currentClipIndex === 0 ? TUTORIAL_CLIPS.length - 1 : currentClipIndex - 1;
    handleSelectClip(TUTORIAL_CLIPS[prevIndex]);
  };

  const handleNextClip = () => {
    const nextIndex = currentClipIndex === TUTORIAL_CLIPS.length - 1 ? 0 : currentClipIndex + 1;
    handleSelectClip(TUTORIAL_CLIPS[nextIndex]);
  };

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // If touched on controls, slider or buttons, ignore swipe gestures completely
    if ((e.target as HTMLElement).closest('[data-controls], input, button')) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    if ((e.target as HTMLElement).closest('[data-controls], input, button')) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    
    // Check if horizontal swipe is dominant (more than 50px)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swiped left -> Next clip
        handleNextClip();
      } else {
        // Swiped right -> Previous clip
        handlePrevClip();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <section className="flex flex-col items-center">
      <h2 className="text-xl font-black text-cyan-400 tracking-wider mb-2.5 drop-shadow-[0_0_10px_rgba(6,182,212,0.35)]">
        {aboutUsTitle}
      </h2>

      <div 
        ref={playerContainerRef}
        className={`w-full rounded-2xl overflow-hidden bg-black border border-cyan-500/30 shadow-2xl relative select-none ${
          isFullscreen ? 'w-full h-full fixed inset-0 z-50 rounded-none border-none' : 'aspect-[4/5] sm:h-[480px]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Full-Card Video Player */}
        <video
          ref={videoRef}
          src={activeClip.videoUrl || TUTORIAL_CLIPS[0].videoUrl}
          className={`w-full h-full cursor-pointer ${isFullscreen ? 'object-contain' : 'object-cover'}`}
          playsInline
          autoPlay
          muted
          onLoadedMetadata={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.volume = 0;
            e.currentTarget.play().then(() => setIsPlaying(true)).catch(() => {});
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={() => {
            if (!isSeeking) {
              handleNextClip();
            }
          }}
          onClick={() => setShowControls((prev) => !prev)}
        />

        {/* Quiet Fullscreen Button In Corner (Visible by default when controls are hidden) */}
        {!showControls && !isFullscreen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="absolute bottom-3 right-3 z-30 p-2.5 rounded-xl bg-slate-950/75 hover:bg-cyan-500/30 text-white hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-md shadow-lg active:scale-95"
            title="Fullscreen"
            aria-label="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        )}

        {/* Fullscreen Navigation Arrows & Counter (In Fullscreen Mode) */}
        {isFullscreen && (
          <>
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono font-bold text-slate-300 shadow-2xl flex items-center gap-1.5 select-none pointer-events-none">
              <span className="text-cyan-400 font-black">#{currentClipIndex + 1}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200">{TUTORIAL_CLIPS.length}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevClip();
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3.5 rounded-full bg-slate-950/80 hover:bg-cyan-500/40 text-white hover:text-cyan-300 border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-md shadow-2xl active:scale-90 group"
              title="Previous Video Guide"
              aria-label="Previous Video"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextClip();
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3.5 rounded-full bg-slate-950/80 hover:bg-cyan-500/40 text-white hover:text-cyan-300 border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-md shadow-2xl active:scale-90 group"
              title="Next Video Guide"
              aria-label="Next Video"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="absolute bottom-4 right-4 z-40 p-2.5 sm:p-3 rounded-xl bg-slate-950/80 hover:bg-cyan-500/30 text-white hover:text-cyan-300 border border-slate-700 backdrop-blur-md shadow-2xl active:scale-95 cursor-pointer"
              title="Exit Fullscreen"
              aria-label="Exit Fullscreen"
            >
              <Minimize className="w-5 h-5" />
            </button>
          </>
        )}

        {/* When Video Is Clicked: ALL Controls & Details Instantly Visible */}
        {showControls && (
          <div 
            onClick={() => setShowControls(false)}
            className="absolute inset-0 z-30 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/40 backdrop-blur-xs flex flex-col justify-between p-3.5 sm:p-4 animate-in fade-in duration-200 cursor-pointer"
          >
            {/* Top Bar with Slot/Tag and Close Button */}
            <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-cyan-300">
                  {activeClip.slotNumber === 0 ? 'Overview' : `Slot #${activeClip.slotNumber}`}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeClip.tagColor}`}>
                  {activeClip.tag}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowControls(false);
                }}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Hide Controls (Clean Video Mode)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Center Play Button if Paused */}
            {!isPlaying && (
              <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-16 h-16 rounded-full bg-slate-900/90 border border-cyan-400 text-cyan-400 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                  aria-label="Play video"
                >
                  <Play className="w-8 h-8 fill-cyan-400 ml-1" />
                </button>
              </div>
            )}

            {/* Bottom Controls Card: Scrub Bar, Time, Title, Navigators, Dots */}
            <div 
              data-controls="true"
              onClick={(e) => e.stopPropagation()} 
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="flex flex-col gap-2.5 bg-slate-950/95 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md cursor-default"
            >
              {/* Scrub line dynamically mapped to duration with glowing cyan progress fill */}
              <input
                type="range"
                min={0}
                max={activeMaxSeconds}
                step={0.1}
                value={Math.min(activeMaxSeconds, currentTime)}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  handleSeekStart();
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleSeekEnd(e);
                }}
                style={{
                  background: `linear-gradient(to right, #06b6d4 ${(Math.min(activeMaxSeconds, currentTime) / (activeMaxSeconds || 1)) * 100}%, #334155 ${(Math.min(activeMaxSeconds, currentTime) / (activeMaxSeconds || 1)) * 100}%)`,
                }}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 py-1"
              />

              {/* Time, Play/Pause, Mute, Fullscreen */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="hover:text-cyan-400 transition-colors cursor-pointer p-0.5"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {formatTime(Math.min(activeMaxSeconds, currentTime))} / {formatTime(activeMaxSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-slate-500 flex items-center gap-1 cursor-default opacity-60" title="Audio Muted">
                    <VolumeX className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="hover:text-cyan-400 transition-colors cursor-pointer p-0.5"
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Title & Summary */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white tracking-wide truncate">
                    {activeClip.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeClip.summary}
                  </p>
                </div>
              </div>

              {/* 1-Click Prev, Counter, Next Video, and Vault Toggle (Compact Size) */}
              <div className="flex items-center gap-1.5 justify-between pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handlePrevClip}
                  className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap shrink-0 shadow-sm"
                  title="Previous Video Guide"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Prev</span>
                </button>

                <div className="px-1.5 py-0.5 rounded-md bg-[#060a14] border border-slate-800 text-[10px] font-mono font-bold text-cyan-300 whitespace-nowrap shrink-0">
                  {currentClipIndex + 1} / {TUTORIAL_CLIPS.length}
                </div>

                <button
                  type="button"
                  onClick={handleNextClip}
                  className="px-2.5 py-1 rounded-md text-[11px] font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_10px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap shrink-0"
                  title="Next Video Guide"
                >
                  <span>Next Video</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsShutterOpen(!isShutterOpen)}
                  className={`p-1 rounded-md text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    isShutterOpen
                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
                  }`}
                  title={`Browse All ${TUTORIAL_CLIPS.length} Guides in Vault`}
                >
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1 justify-center overflow-x-auto py-0.5 scrollbar-none">
                {TUTORIAL_CLIPS.map((clip, idx) => (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => handleSelectClip(clip)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentClipIndex
                        ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : 'w-2 bg-slate-700/60 hover:bg-slate-500'
                    }`}
                    title={`Guide ${idx + 1}: ${clip.title}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Masterclass Vault Drawer (inside card) */}
        {isShutterOpen && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-40 bg-[#070c18]/95 backdrop-blur-md p-3.5 flex flex-col justify-between animate-in fade-in duration-200"
          >
            {/* Shutter Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Know Aladdin ATM™ • 30s Masterclass Vault
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsShutterOpen(false)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shutter Items List */}
            <div className="space-y-2 my-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {TUTORIAL_CLIPS.map((clip) => {
                const isSelected = activeClip.id === clip.id;
                return (
                  <div
                    key={clip.id}
                    onClick={() => {
                      handleSelectClip(clip);
                      setIsShutterOpen(false);
                      setShowControls(false);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                          {clip.slotNumber === 0 ? 'Overview' : `Slot #${clip.slotNumber}`}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clip.tagColor}`}>
                          {clip.tag}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 animate-pulse">
                            <Play className="w-2.5 h-2.5 fill-cyan-400" /> Playing
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> {clip.duration}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white tracking-wide truncate">
                      {clip.title}
                    </h5>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Select any clip to auto-play</span>
              <button
                type="button"
                onClick={() => setIsShutterOpen(false)}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Close</span>
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onDirectLogin }) => {
  // Navigation & Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'ar' | 'es'>('en');
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSupportFormModal, setShowSupportFormModal] = useState(false);

  // Hero Card Modes
  const [activeTab, setActiveTab] = useState<TabMode>('code');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '', '']);
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [isVerifiedView, setIsVerifiedView] = useState<boolean>(false);
  const [isNotFoundView, setIsNotFoundView] = useState<boolean>(false);
  const [isVerifyingId, setIsVerifyingId] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pricingMode, setPricingMode] = useState<'pocket' | 'direct'>('pocket');
  const [selectedDirectPlan, setSelectedDirectPlan] = useState<string>('Lifetime VIP ($247)');
  const [selectedPocketTier, setSelectedPocketTier] = useState<string>('Pocket Option $100 Deposit (3 Mos)');

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Interactive Access Level Rates (Minimal Slider)
  const [levelRates, setLevelRates] = useState<Record<number, number>>({
    1: 70,
    2: 75,
    3: 80,
    4: 85,
    5: 90,
    6: 94,
    7: 98,
  });

  // Translations
  const texts = {
    en: {
      appName: 'ALADDIN TRADE MANAGER',
      subtitle: 'Advance Trading Ecosystem & Risk Management Engine',
      codeTab: 'Code',
      idTab: 'ID',
      codeLabel: 'Enter your 7-digit access code',
      accessDashboard: 'Access Dashboard',
      idLabel: 'Enter your User ID',
      idSubtext: 'ID you received after registration via affiliate link',
      idPlaceholder: 'Enter your ID...',
      loginWithId: 'Login with ID',
      registerAccount: 'Register New Account',
      registerPocketOption: 'Register on Pocket Option (Free)',
      noIdPrompt: "Don't have an ID? Register and get your unique User ID",
      aboutUs: 'About Us',
      accessLevels: 'Access Levels',
      chooseLevel: 'Choose your risk & trade management level',
      managedTrades: 'Disciplined Trades / Session',
      efficiencyRate: 'Risk Efficiency Rate',
      simulatedProfit: 'Projected Target Profit',
      tapToAdjust: 'Tap or drag bar to adjust simulation',
      platformFeatures: 'Platform Features',
      f1: 'Smart Journal',
      f2: 'Compounding Calculator',
      f3: '30-Day Planner',
      f4: 'Advance Trade Manager',
      f5: 'Anti-Tilt & Streak Shield',
      f6: 'Real-time Trading Analytics',
      accountVerified: 'Account Verified!',
      depositRequired: 'Account Verification & Funding',
      depositText: 'Your account is registered. Fund your trading account to activate automated risk limits and trade execution.',
      minDeposits: 'Minimum funding for level access:',
      levelAutoUpdate: 'After funding, your risk management level updates automatically.',
      traderId: 'Trader ID:',
      depositAmount: 'Account Capital:',
      accessLevel: 'Access Level:',
    },
    hi: {
      appName: 'ALADDIN TRADE MANAGER',
      subtitle: 'Advance Trading Ecosystem & Risk Management Engine',
      codeTab: 'कोड',
      idTab: 'आईडी',
      codeLabel: 'अपना 7-अंकों का एक्सेस कोड दर्ज करें',
      accessDashboard: 'डैशबोर्ड खोलें',
      idLabel: 'अपनी यूजर आईडी दर्ज करें',
      idSubtext: 'एफिलिएट लिंक के माध्यम से पंजीकरण के बाद प्राप्त आईडी',
      idPlaceholder: 'अपनी आईडी दर्ज करें...',
      loginWithId: 'आईडी से लॉगिन करें',
      registerAccount: 'नया खाता पंजीकृत करें',
      registerPocketOption: 'Register on Pocket Option (Free)',
      noIdPrompt: 'आईडी नहीं है? रजिस्टर करें और अपनी यूनिक यूजर आईडी प्राप्त करें',
      aboutUs: 'हमारे बारे में',
      accessLevels: 'एक्सेस स्तर',
      chooseLevel: 'अपना रिस्क व ट्रेड मैनेजमेंट स्तर चुनें',
      managedTrades: 'अनुशासित ट्रेड्स / सेशन',
      efficiencyRate: 'रिस्क एफिशिएंसी दर',
      simulatedProfit: 'अनुमानित टारगेट प्रॉफिट',
      tapToAdjust: 'सिम्युलेशन बदलने के लिए बार पर टच करें',
      platformFeatures: 'प्लेटफ़ॉर्म फीचर्स',
      f1: 'स्मार्ट जर्नल',
      f2: 'कंपाउंडिंग कैलकुलेटर',
      f3: '30-दिन प्लानर',
      f4: 'एडवांस ट्रेड मैनेजर',
      f5: 'एंटी-टिल्ट व स्ट्रीक शील्ड',
      f6: 'रियल-टाइम ट्रेडिंग एनालिटिक्स',
      accountVerified: 'खाता सत्यापित हो गया!',
      depositRequired: 'अकाउंट वेरिफिकेशन व फंडिंग',
      depositText: 'आपका खाता पंजीकृत है। ऑटोमेटेड रिस्क लिमिट्स और ट्रेड निष्पादन सक्रिय करने के लिए फंडिंग करें।',
      minDeposits: 'लेवल एक्सेस के लिए न्यूनतम फंडिंग:',
      levelAutoUpdate: 'फंडिंग के बाद, आपका स्तर अपने आप अपडेट हो जाएगा।',
      traderId: 'ट्रेडर आईडी:',
      depositAmount: 'अकाउंट कैपिटल:',
      accessLevel: 'एक्सेस स्तर:',
    },
    ar: {
      appName: 'ALADDIN TRADE MANAGER',
      subtitle: 'Advance Trading Ecosystem & Risk Management Engine',
      codeTab: 'الرمز',
      idTab: 'المعرف',
      codeLabel: 'أدخل رمز الوصول المكون من 7 أرقام',
      accessDashboard: 'دخول لوحة التحكم',
      idLabel: 'أدخل معرف المستخدم الخاص بك',
      idSubtext: 'المعرف الذي استلمته بعد التسجيل عبر الرابط التابع',
      idPlaceholder: 'أدخل معرفك...',
      loginWithId: 'تسجيل الدخول بالمعرف',
      registerAccount: 'تسجيل حساب جديد',
      registerPocketOption: 'التسجيل عبر Pocket Option (مجاناً)',
      noIdPrompt: 'ليس لديك معرف؟ سجل الآن واحصل على معرفك الفريد',
      aboutUs: 'من نحن',
      accessLevels: 'مستويات الوصول',
      chooseLevel: 'اختر مستوى إدارة المخاطر والتداول',
      managedTrades: 'الصفقات المنضبطة / الجلسة',
      efficiencyRate: 'كفاءة إدارة المخاطر',
      simulatedProfit: 'الربح المستهدف المتوقع',
      tapToAdjust: 'المس أو اسحب لتعديل المحاكاة',
      platformFeatures: 'ميزات المنصة',
      f1: 'دفتر اليومية الذكي',
      f2: 'حاسبة الفائدة المركبة',
      f3: 'مخطط 30 يومًا',
      f4: 'مدير التداول المتقدم',
      f5: 'درع الحماية من الانفعال',
      f6: 'تحليلات التداول الفورية',
      accountVerified: 'تم التحقق من الحساب بنجاح!',
      depositRequired: 'التحقق والتمويل مطلوب',
      depositText: 'حسابك مسجل. قم بتمويل حسابك لتفعيل حدود المخاطر التلقائية وإدارة الصفقات.',
      minDeposits: 'الحد الأدنى للتمويل للوصول:',
      levelAutoUpdate: 'بعد التمويل، سيتم تحديث مستواك تلقائيًا.',
      traderId: 'معرف المتداول:',
      depositAmount: 'رأس مال الحساب:',
      accessLevel: 'مستوى الوصول:',
    },
    es: {
      appName: 'ALADDIN TRADE MANAGER',
      subtitle: 'Advance Trading Ecosystem & Risk Management Engine',
      codeTab: 'Código',
      idTab: 'ID',
      codeLabel: 'Ingresa tu código de acceso de 7 dígitos',
      accessDashboard: 'Acceder al Panel',
      idLabel: 'Ingresa tu ID de Usuario',
      idSubtext: 'ID que recibiste tras registrarte vía enlace afiliado',
      idPlaceholder: 'Ingresa tu ID...',
      loginWithId: 'Iniciar Sesión con ID',
      registerAccount: 'Registrar Nueva Cuenta',
      registerPocketOption: 'Registrarse en Pocket Option (Gratis)',
      noIdPrompt: '¿No tienes un ID? Regístrate y obtén tu ID único',
      aboutUs: 'Sobre Nosotros',
      accessLevels: 'Niveles de Acceso',
      chooseLevel: 'Elige tu nivel de gestión de riesgo y trading',
      managedTrades: 'Operaciones Disciplinadas / Sesión',
      efficiencyRate: 'Tasa de Eficiencia de Riesgo',
      simulatedProfit: 'Ganancia Objetivo Proyectada',
      tapToAdjust: 'Toca o arrastra la barra para ajustar simulación',
      platformFeatures: 'Características de la Plataforma',
      f1: 'Diario Inteligente',
      f2: 'Calculadora de Interés Compuesto',
      f3: 'Planificador de 30 Días',
      f4: 'Advance Trade Manager',
      f5: 'Escudo Antiemocional y Rachas',
      f6: 'Analítica de Trading en Tiempo Real',
      accountVerified: '¡Cuenta Verificada!',
      depositRequired: 'Verificación y Fondeo de Cuenta',
      depositText: 'Tu cuenta está registrada. Fondea tu cuenta para activar los límites de riesgo automatizados.',
      minDeposits: 'Fondeo mínimo para acceso:',
      levelAutoUpdate: 'Tras fondear, tu nivel se actualizará automáticamente.',
      traderId: 'ID del Trader:',
      depositAmount: 'Capital de Cuenta:',
      accessLevel: 'Nivel de Acceso:',
    },
  };

  const t = texts[selectedLanguage];

  // Handle Crypto Key Digit Inputs (Alphanumeric A-Z, 0-9)
  const handleDigitChange = (index: number, val: string) => {
    // Strip ATM- prefix if user pastes the whole key
    const clean = val.replace(/^ATM[-_\s]?/i, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!clean && val !== '') return;

    const newDigits = [...codeDigits];

    if (clean.length > 1) {
      // User pasted multiple characters (e.g. "ATM-XXXXXXX" or "XXXXXXX")
      const pasted = clean.slice(0, 7).split('');
      pasted.forEach((char, i) => {
        if (i < 7) newDigits[i] = char;
      });
      setCodeDigits(newDigits);
      const nextIdx = Math.min(6, pasted.length);
      digitInputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = clean;
    setCodeDigits(newDigits);

    if (clean && index < 6) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const isCodeComplete = codeDigits.every((d) => d.trim().length === 1);

  const handleAdminEmailLogin = (overrideEmail?: string) => {
    const emailToUse = (overrideEmail || userIdInput).trim().toLowerCase();
    if (!emailToUse) {
      setErrorMessage('Please enter your registered ID or Email address.');
      return;
    }
    const isWhitelisted = MASTER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(emailToUse);
    if (!isWhitelisted) {
      setErrorMessage('Access Denied: Unrecognized credentials.');
      return;
    }

    const adminUser = {
      uid: 'admin-' + emailToUse,
      email: emailToUse,
      name: 'Master Admin (' + emailToUse.split('@')[0] + ')',
      role: 'admin',
      status: 'active',
      isLifetimePaid: true,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('mock_dbUser', JSON.stringify(adminUser));
      localStorage.setItem('mock_firebaseUser', JSON.stringify({ uid: adminUser.uid, email: adminUser.email }));
      localStorage.setItem('aladdin_admin_view_mode', 'true');
      localStorage.setItem('aladdin_in_app', 'true');
    } catch {}

    if (onDirectLogin) {
      onDirectLogin(adminUser);
    } else {
      onLogin();
    }
  };

  const handleAccessWithCode = () => {
    const raw = codeDigits.join('').toUpperCase();
    if (raw.length === 7) {
      const fullCode = `ATM-${raw}`;
      const res = validateLicenseCode(fullCode);
      if (res.valid) {
        if (res.role === 'admin') {
          handleAdminEmailLogin('thevivankhan@gmail.com');
        } else if (res.license) {
          saveActiveSession(res.license);
          const studentUser = {
            uid: 'lic-' + res.license.cleanKey,
            role: 'user',
            status: 'active',
            name: res.license.traderName,
            plan: res.license.plan,
            expiresAt: res.license.expiresAt,
            isLifetimePaid: !res.license.expiresAt,
            subscriptionEndDate: res.license.expiresAt ? new Date(res.license.expiresAt).toISOString() : null,
            activeCryptoKey: res.license.key,
          };
          try {
            localStorage.setItem('mock_dbUser', JSON.stringify(studentUser));
            localStorage.setItem('mock_firebaseUser', JSON.stringify({ uid: studentUser.uid, email: '' }));
            localStorage.setItem('aladdin_in_app', 'true');
          } catch {}
          if (onDirectLogin) {
            onDirectLogin(studentUser);
          } else {
            onLogin();
          }
        }
      } else {
        setErrorMessage(res.reason || 'Invalid Crypto Key. Please enter a valid 7-character license.');
      }
    } else {
      setErrorMessage('Please enter all 7 characters of your Crypto Key.');
    }
  };

  const handleLoginWithId = async () => {
    const rawVal = userIdInput.trim();
    if (!rawVal) {
      setErrorMessage('Please enter your Trader / User ID.');
      return;
    }

    // Check if user entered a Master Admin email!
    if (MASTER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(rawVal.toLowerCase())) {
      handleAdminEmailLogin(rawVal);
      return;
    }

    // If already in verified view: guide them to enter their 7-Digit Access Code in the Code tab
    if (isVerifiedView) {
      setActiveTab('code');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setErrorMessage('Trader ID verified! Please enter your 7-Digit Access Code below to open Trade Manager.');
      return;
    }

    // Real-time verification of entered Trader ID against central server affiliate records
    setIsVerifyingId(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/verify-trader-id?id=${encodeURIComponent(rawVal)}`);
      const data = await res.json().catch(() => ({}));
      if (data && data.verified) {
        setIsVerifiedView(true);
        setIsNotFoundView(false);
      } else {
        setIsNotFoundView(true);
        setIsVerifiedView(false);
      }
    } catch {
      setIsNotFoundView(true);
      setIsVerifiedView(false);
    } finally {
      setIsVerifyingId(false);
    }
  };

  const handleRegisterClick = () => {
    const plan = pricingMode === 'direct' ? selectedDirectPlan : selectedPocketTier;
    try {
      localStorage.setItem('atm_selected_plan', plan);
    } catch {}
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 relative overflow-x-hidden font-sans">
      <style>{`
        @keyframes scanReverse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        input.minimal-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #090f1d;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input.minimal-range::-webkit-slider-thumb:active {
          transform: scale(1.2);
        }
        input.minimal-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #090f1d;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input.minimal-range::-moz-range-thumb:active {
          transform: scale(1.2);
        }
      `}</style>
      {/* Background Cyber Vertical Laser Lines */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-around opacity-15">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-sky-400 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent"></div>
        <div className="w-px h-full bg-gradient-to-b from-transparent via-pink-500 to-transparent"></div>
      </div>

      {/* Top Navbar */}
      <header className="relative z-30 max-w-xl mx-auto w-full px-4 pt-6 pb-2 flex items-center justify-center">
        {/* Centered Brand Title & Subtitle */}
        <div className="text-center px-12">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase leading-tight select-none">
            {t.appName}
          </h1>
          <p className="text-[11px] sm:text-xs text-cyan-400 font-semibold tracking-wider mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Hamburger Menu Button */}
        <div className="absolute right-4 top-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 flex items-center justify-center shadow-lg hover:border-cyan-500/50 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Dropdown Menu Popup */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setShowLanguageModal(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-cyan-400 transition-colors text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-400" /> Language
                </span>
                <span className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  {selectedLanguage === 'en' ? '🇺🇸' : selectedLanguage === 'hi' ? '🇮🇳' : selectedLanguage === 'ar' ? '🇦🇪' : '🇪🇸'}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowBlogModal(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-cyan-400 transition-colors text-left"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" /> Blog & Guides
              </button>

              <button
                onClick={() => {
                  setShowSupportFormModal(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-cyan-400 transition-colors text-left cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" /> Support
              </button>

              <div className="h-px bg-slate-800 my-1.5" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogin();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 text-center cursor-pointer"
              >
                Member Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-[340px] w-full mx-auto px-2.5 py-2 flex flex-col gap-3.5 flex-1">
        {/* ============================================================== */}
        {/* HERO ACCESS CARD (CODE & ID MODES)                             */}
        {/* ============================================================== */}
        <section className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md">
          {/* Top Mode Switcher Pill */}
          <div className="bg-slate-950/80 p-1 rounded-xl flex border border-slate-800/80 mb-3.5">
            <button
              onClick={() => {
                setActiveTab('code');
                setIsVerifiedView(false);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{t.codeTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('id');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'id'
                  ? 'bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t.idTab}</span>
            </button>
          </div>

          {/* TAB 1: CODE INPUT MODE */}
          {activeTab === 'code' && (
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-400 font-medium text-center mb-3">
                {t.codeLabel}
              </p>

              {/* 7 Alphanumeric Access Key Boxes */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full mb-3.5">
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { digitInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-7.5 sm:w-8 h-9.5 sm:h-10 text-center text-sm font-mono font-bold uppercase bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-500/40 text-white rounded-lg outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="text-[11px] text-rose-400 mb-3 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg w-full text-center">
                  {errorMessage}
                </div>
              )}

              {/* Access Dashboard Button */}
              <button
                onClick={handleAccessWithCode}
                className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                  isCodeComplete
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-pink-500/25 active:scale-95'
                    : 'bg-[#182337] text-slate-400 hover:bg-[#1e2c44] hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {t.accessDashboard}
              </button>
            </div>
          )}

          {/* TAB 2: USER ID MODE (DEFAULT STATE) */}
          {activeTab === 'id' && !isVerifiedView && !isNotFoundView && (
            <div className="flex flex-col animate-in fade-in duration-150">
              {/* Minimalist Sub-Tab Switcher: Pocket Option vs Direct License */}
              <div className="bg-[#080e1c] p-1 rounded-xl flex border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setPricingMode('pocket')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pricingMode === 'pocket'
                      ? 'bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pocket Option</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('direct')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pricingMode === 'direct'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Direct License</span>
                </button>
              </div>

              {/* MODE 1: POCKET OPTION DEPOSIT ACCESS */}
              {pricingMode === 'pocket' ? (
                <>
                  <h3 className="text-sm font-semibold text-slate-100 text-center mb-0.5">
                    {t.idLabel}
                  </h3>
                  <p className="text-[11px] text-slate-400 text-center mb-3.5 leading-relaxed">
                    {t.idSubtext}
                  </p>

                  {/* ID Input Field */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={userIdInput}
                      onChange={(e) => {
                        setUserIdInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={t.idPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-slate-100 placeholder-slate-400 font-mono text-xs outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                    />
                  </div>

                  {errorMessage && (
                    <div className="text-xs text-rose-400 mb-3 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-center">
                      {errorMessage}
                    </div>
                  )}

                  {/* Minimalist 5-Tier Deposit Access Box */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 mb-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Free Software Access
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Tap tier to select</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      {[
                        { amount: '$50', duration: '1 Month', tag: '' },
                        { amount: '$100', duration: '3 Mos', tag: 'Popular' },
                        { amount: '$200', duration: '1 Year', tag: 'Best Value' },
                      ].map((tier) => {
                        const isSelected = selectedPocketTier.includes(`${tier.amount} `) || selectedPocketTier.includes(`${tier.amount} Deposit`);
                        return (
                          <button
                            key={tier.amount}
                            type="button"
                            onClick={() => {
                              const val = `Pocket Option ${tier.amount} Deposit (${tier.duration})`;
                              setSelectedPocketTier(val);
                              localStorage.setItem('atm_selected_plan', val);
                            }}
                            className={`p-2 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                                : 'bg-slate-900/90 border-slate-800/90 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="font-bold font-mono">{tier.amount}</span>
                            <span className="text-cyan-400 font-sans text-[9px]">
                              {tier.duration} {tier.tag && `· ${tier.tag}`}
                            </span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          const val = 'Pocket Option $300 Deposit (Lifetime VIP)';
                          setSelectedPocketTier(val);
                          localStorage.setItem('atm_selected_plan', val);
                        }}
                        className={`p-2 rounded-xl border text-left font-bold flex justify-between items-center px-2.5 transition-all cursor-pointer ${
                          selectedPocketTier.includes('$300')
                            ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.35)] ring-1 ring-amber-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400/50'
                        }`}
                      >
                        <span className="text-white font-mono">$300</span>
                        <span className="text-amber-300 font-sans text-[9px]">👑 Lifetime VIP</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* MODE 2: DIRECT LICENSE PLANS (Interactive Selectable) */
                <>
                  <div className="text-center mb-2.5">
                    <h3 className="text-sm font-bold text-white mb-0.5">
                      Direct Pro License Key
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tap a plan to choose your license tier:
                    </p>
                  </div>

                  {/* 5 Selectable Pricing Rows */}
                  <div className="space-y-1.5 mb-3.5">
                    {[
                      { id: '1m', name: '1 Month Access', price: '$47', save: '', color: 'bg-purple-400' },
                      { id: '3m', name: '3 Months Access', price: '$97', save: 'Save 30%', color: 'bg-pink-400' },
                      { id: '6m', name: '6 Months Access', price: '$147', save: 'Save 45%', color: 'bg-indigo-400' },
                      { id: '1y', name: '1 Year Access', price: '$197', save: 'Save 65%', color: 'bg-sky-400' },
                    ].map((plan) => {
                      const isSelected = selectedDirectPlan.includes(plan.price);
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => {
                            const val = `${plan.name} (${plan.price})`;
                            setSelectedDirectPlan(val);
                            localStorage.setItem('atm_selected_plan', val);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-purple-500/25 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)] ring-1 ring-purple-400'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${plan.color} ${isSelected ? 'scale-125' : ''}`}></span>
                            <div>
                              <span className="text-slate-200 font-semibold">{plan.name}</span>
                              {plan.save && (
                                <span className="text-[9px] text-emerald-400 ml-1.5 font-mono">
                                  {plan.save}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-white">{plan.price}</span>
                        </button>
                      );
                    })}

                    {/* Lifetime Institutional VIP Card (Sleek Compact & Ultra-Premium) */}
                    <button
                      type="button"
                      onClick={() => {
                        const val = 'Lifetime VIP Access ($247)';
                        setSelectedDirectPlan(val);
                        localStorage.setItem('atm_selected_plan', val);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                        selectedDirectPlan.includes('$247')
                          ? 'bg-gradient-to-b from-[#131b2e] via-[#0b1222] to-[#060a14] border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/60'
                          : 'bg-gradient-to-b from-[#0f172a]/90 to-[#060a14]/90 border-amber-500/35 hover:border-amber-400/60'
                      }`}
                    >
                      {/* Subtle Golden Ambient Glow on Top Edge */}
                      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

                      {/* Row 1: Title + Mini Allocation Badge + Save + Price ($397 -> $247) */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="text-xs font-bold text-white tracking-wide shrink-0">👑 Lifetime VIP</span>
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 uppercase tracking-wider whitespace-nowrap">
                            V4.0 Allocation
                          </span>
                          <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded whitespace-nowrap">
                            Save $150
                          </span>
                        </div>

                        <div className="flex items-baseline gap-1 font-mono shrink-0">
                          <span className="text-[10px] text-slate-400 line-through font-normal">$397</span>
                          <span className="text-sm font-black text-amber-300 tracking-tight">$247</span>
                        </div>
                      </div>

                      {/* Row 2: Sub-telemetry & Slim Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-1">
                          <span>Never Pay Again · <strong className="text-slate-200 font-semibold">84/100 Seats</strong></span>
                          <span className="text-amber-400 font-semibold">Only 16 Left</span>
                        </div>
                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-amber-500/20">
                          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full w-[84%]" />
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Action Buttons (Always visible on BOTH Pocket Option and Direct License sides) */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleLoginWithId}
                  disabled={isVerifyingId}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-[#182335] hover:bg-[#213048] text-white border border-slate-700/60 transition-all cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center text-center disabled:opacity-60"
                >
                  {isVerifyingId ? 'Verifying Trader ID...' : t.loginWithId}
                </button>

                <button
                  onClick={handleRegisterClick}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#ff007f] via-[#ff0099] to-[#d900ff] hover:opacity-95 text-white shadow-[0_4px_20px_rgba(255,0,128,0.35)] transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center text-center"
                >
                  {t.registerAccount}
                </button>

                {pricingMode === 'pocket' && (
                  <a
                    href="https://pocket-friends.co/r/mphdnyllo5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#0062ff] via-[#4054ff] to-[#00b4d8] hover:opacity-95 text-white shadow-[0_4px_20px_rgba(0,100,255,0.35)] transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center text-center"
                  >
                    {t.registerPocketOption || 'Register on Pocket Option (Free)'}
                  </a>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                {t.noIdPrompt}
              </p>
            </div>
          )}

          {/* TAB 2: ACCOUNT NOT FOUND / NOT REGISTERED STATE (Screenshots 3 & 4 Match) */}
          {activeTab === 'id' && isNotFoundView && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-slate-100 text-center mb-0.5">
                {t.idLabel}
              </h3>
              <p className="text-[11px] text-slate-400 text-center mb-3.5 leading-relaxed">
                {t.idSubtext}
              </p>

              {/* ID Input Field */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userIdInput}
                  onChange={(e) => {
                    setUserIdInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={t.idPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#18233c] hover:bg-[#1c2946] border border-slate-600/90 hover:border-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-slate-100 placeholder-slate-400 font-mono text-xs outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Red Container Card (Exact Screenshot Match) */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 shadow-[0_0_25px_rgba(244,63,94,0.12)] mb-4 text-left">
                {/* Header: Glowing icon + Account Not Found */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                  <h4 className="text-base font-bold text-rose-200">
                    Account Not Found
                  </h4>
                </div>

                {/* Nested Box */}
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <span>Account Not Registered</span>
                  </div>

                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    You need to close your old Pocket Option account and register a new one through our affiliate link to access signals.
                  </p>

                  {/* How to close account */}
                  <div>
                    <h5 className="text-xs font-bold text-rose-300 mb-2">How to close account:</h5>
                    <div className="space-y-1.5">
                      <div className="bg-rose-900/30 border border-rose-500/20 rounded-lg p-2 text-[11px] text-rose-200 flex items-center gap-2 font-medium">
                        <span className="text-rose-400 font-bold">1.</span>
                        <span>1. Contact Pocket Option support</span>
                      </div>
                      <div className="bg-rose-900/30 border border-rose-500/20 rounded-lg p-2 text-[11px] text-rose-200 flex items-center gap-2 font-medium">
                        <span className="text-rose-400 font-bold">2.</span>
                        <span>2. Request account closure</span>
                      </div>
                      <div className="bg-rose-900/30 border border-rose-500/20 rounded-lg p-2 text-[11px] text-rose-200 flex items-center gap-2 font-medium">
                        <span className="text-rose-400 font-bold">3.</span>
                        <span>3. After closure, register new account</span>
                      </div>
                    </div>
                  </div>

                  {/* Why new account needed */}
                  <div>
                    <h5 className="text-xs font-bold text-rose-300 mb-1.5">Why new account needed?</h5>
                    <p className="text-[11px] text-rose-200/80 leading-relaxed">
                      Our AI system requires accounts registered through our link to optimize server selection based on your region. This ensures the fastest execution and most accurate signals for your location.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons below Not Found Card */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleLoginWithId}
                  disabled={isVerifyingId}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 hover:opacity-95 shadow-[0_4px_20px_rgba(0,180,216,0.35)] transition-all cursor-pointer flex items-center justify-center text-center disabled:opacity-60"
                >
                  {isVerifyingId ? 'Verifying Trader ID...' : 'Login with ID'}
                </button>

                <a
                  href="https://pocket-friends.co/r/mphdnyllo5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#ff007f] via-[#ff0099] to-[#d900ff] hover:opacity-95 text-white shadow-[0_4px_20px_rgba(255,0,128,0.35)] transition-all cursor-pointer flex items-center justify-center text-center"
                >
                  Register New Account
                </a>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Don't have an ID? Register and get your unique User ID
              </p>
            </div>
          )}

          {/* TAB 2 VERIFIED PREVIEW STATE (Screenshot 7 Match) */}
          {activeTab === 'id' && isVerifiedView && (
            <div className="flex flex-col animate-in fade-in duration-200">
              {/* Account Verified Header */}
              <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl mb-4">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cyan-300">
                    {t.accountVerified}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {userIdInput || '143702223'}
                  </p>
                </div>
              </div>

              {/* Details Rows */}
              <div className="space-y-2 mb-4 text-xs font-mono">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">{t.traderId}</span>
                  <span className="text-cyan-400 font-bold">{userIdInput || '143702223'}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">{t.depositAmount}</span>
                  <span className="text-emerald-400 font-bold">$ 0</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">{t.accessLevel}</span>
                  <span className="text-amber-400 font-bold">Level 0</span>
                </div>
              </div>

              {/* Deposit Required Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 mb-4 text-left">
                {/* Switcher inside verified card */}
                <div className="flex bg-[#080e1c] p-1 rounded-xl border border-slate-800 mb-3">
                  <button
                    type="button"
                    onClick={() => setPricingMode('pocket')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                      pricingMode === 'pocket'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>Deposit Levels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('direct')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                      pricingMode === 'direct'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>Direct Plans</span>
                  </button>
                </div>

                {pricingMode === 'pocket' ? (
                  <>
                    <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{t.depositRequired}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-2.5 leading-relaxed">
                      {t.depositText}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 mb-2 text-[10px] font-mono">
                      {[
                        { level: 'Level 1:', amount: '$50', duration: '1 Month' },
                        { level: 'Level 2:', amount: '$100', duration: '3 Months' },
                        { level: 'Level 3:', amount: '$200', duration: '1 Year' },
                      ].map((tier) => {
                        const isSelected = selectedPocketTier.includes(`${tier.amount} `) || selectedPocketTier.includes(`${tier.amount} Deposit`);
                        return (
                          <button
                            key={tier.amount}
                            type="button"
                            onClick={() => {
                              const val = `Pocket Option ${tier.amount} Deposit (${tier.duration})`;
                              setSelectedPocketTier(val);
                              try {
                                localStorage.setItem('atm_selected_plan', val);
                              } catch {}
                            }}
                            className={`p-1.5 rounded-lg border text-left flex justify-between items-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                                : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:border-slate-600'
                            }`}
                          >
                            <span>{tier.level} <strong className="text-white">{tier.amount}</strong></span>
                            <span className="text-cyan-400 text-[9px] font-sans">{tier.duration}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const val = 'Pocket Option $300 Deposit (Lifetime VIP)';
                          setSelectedPocketTier(val);
                          try {
                            localStorage.setItem('atm_selected_plan', val);
                          } catch {}
                        }}
                        className={`p-1.5 rounded-lg border text-left font-bold flex justify-between items-center px-2 transition-all cursor-pointer ${
                          selectedPocketTier.includes('$300')
                            ? 'bg-amber-500/30 border-amber-400 text-white shadow-[0_0_12px_rgba(251,191,36,0.4)] ring-1 ring-amber-400'
                            : 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/40 text-amber-300 hover:border-amber-400/60'
                        }`}
                      >
                        <span>VIP: <strong className="text-white">$300</strong></span>
                        <span className="text-amber-300 font-extrabold text-[9px] font-sans">👑 Lifetime</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      ✓ {t.levelAutoUpdate}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-xs">
                      <Key className="w-4 h-4 shrink-0" />
                      <span>Direct License Plans (No Deposit Required)</span>
                    </div>
                    <div className="space-y-1 mb-2.5 text-[10px]">
                      {[
                        { name: '1 Month Access', price: '$47' },
                        { name: '3 Months Access', price: '$97' },
                        { name: '6 Months Access', price: '$147' },
                        { name: '1 Year Access', price: '$197' },
                      ].map((plan) => {
                        const isSelected = selectedDirectPlan.includes(plan.price);
                        return (
                          <button
                            key={plan.price}
                            type="button"
                            onClick={() => {
                              const val = `${plan.name} (${plan.price})`;
                              setSelectedDirectPlan(val);
                              try {
                                localStorage.setItem('atm_selected_plan', val);
                              } catch {}
                            }}
                            className={`w-full flex justify-between p-1.5 rounded-lg border transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-purple-500/25 border-purple-400 text-white ring-1 ring-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-slate-300">{plan.name}</span>
                            <strong className="text-white font-mono">{plan.price}</strong>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const val = 'Lifetime VIP Access ($247)';
                          setSelectedDirectPlan(val);
                          try {
                            localStorage.setItem('atm_selected_plan', val);
                          } catch {}
                        }}
                        className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                          selectedDirectPlan.includes('$247')
                            ? 'bg-gradient-to-b from-[#131b2e] via-[#0b1222] to-[#060a14] border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/70'
                            : 'bg-gradient-to-b from-[#0f172a] to-[#050811] border-amber-500/30 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">Lifetime VIP Access</span>
                            <span className="text-[8px] font-mono px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold rounded uppercase">
                              V4.0 ALLOCATION
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-slate-400 line-through text-[10px] font-normal">$397</span>
                            <strong className="text-amber-300 font-black text-sm">$247</strong>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-300">
                          <span>Never Pay Again · Save $150</span>
                          <span className="text-amber-400 font-mono font-semibold">16 Seats Left</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setActiveTab('code');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setErrorMessage('Please enter your 7-Digit Access Code below to open Trade Manager.');
                  }}
                  className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-[#00c6ff] via-[#00b4d8] to-[#0096c7] text-[#051329] shadow-[0_4px_20px_rgba(0,180,216,0.35)] hover:opacity-95 transition-all cursor-pointer flex items-center justify-center active:scale-[0.98] text-center"
                >
                  🔑 Enter 7-Digit Access Code to Open Dashboard
                </button>

                <button
                  onClick={handleRegisterClick}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-[#101726] border border-slate-700/70 hover:bg-[#162033] text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center active:scale-[0.98] text-center"
                >
                  {t.registerAccount}
                </button>

                {pricingMode === 'pocket' && (
                  <a
                    href="https://pocket-friends.co/r/mphdnyllo5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#0062ff] via-[#4054ff] to-[#00b4d8] hover:opacity-95 text-white shadow-[0_4px_20px_rgba(0,100,255,0.35)] transition-all cursor-pointer flex items-center justify-center active:scale-[0.98] text-center"
                  >
                    {t.registerPocketOption || 'Register on Pocket Option (Free)'}
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* ABOUT US SECTION WITH VIDEO & ROBOT SHOWCASE                   */}
        {/* ============================================================== */}
        <VideoShowcase aboutUsTitle={t.aboutUs} />

        {/* ============================================================== */}
        {/* ACCESS LEVELS SECTION (LEVELS 1 - 5)                            */}
        {/* ============================================================== */}
        <section className="flex flex-col">
          <div className="text-center mb-3">
            <h2 className="text-xl font-black text-white tracking-tight mb-0.5">
              {t.accessLevels}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {t.chooseLevel}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {ACCESS_LEVELS.map((lvl) => {
              const currentRate = levelRates[lvl.level] ?? lvl.defaultEfficiency;
              const estimatedProfit = (lvl.baseCapital * (currentRate / 100)).toFixed(0);
              const dynamicTrades = Math.round(lvl.managedTrades * (currentRate / lvl.defaultEfficiency));
              const percent = Math.max(0, Math.min(100, ((currentRate - 50) / 48) * 100));

              return (
                <div
                  key={lvl.level}
                  className="bg-[#0b1325]/90 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-3 transition-all shadow-sm"
                >
                  {/* Top Row: Level Title & Two Dots */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-sm font-bold ${lvl.colorClass}`}>
                      Level {lvl.level}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
                    </div>
                  </div>

                  {/* Middle Row: Disciplined Trades & Live Profit */}
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Disciplined Trades
                      </span>
                      <span className="text-base font-bold font-mono text-white">
                        {dynamicTrades}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Estimated Target
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]">
                        +${estimatedProfit}
                      </span>
                    </div>
                  </div>

                  {/* Rate Row */}
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
                    <span>Efficiency Rate</span>
                    <span className="text-white font-mono font-bold">{currentRate}%</span>
                  </div>

                  {/* Clean Slider with White Circular Knob */}
                  <div className="relative flex items-center py-1">
                    <input
                      type="range"
                      min="50"
                      max="98"
                      value={currentRate}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLevelRates((prev) => ({ ...prev, [lvl.level]: val }));
                      }}
                      className="minimal-range w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none transition-all"
                      style={{
                        background: `linear-gradient(to right, ${lvl.solidColor} 0%, ${lvl.solidColor} ${percent}%, #080d19 ${percent}%, #080d19 100%)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* PLATFORM FEATURES SECTION                                      */}
        {/* ============================================================== */}
        <section className="bg-[#0b1325]/90 border border-slate-800/90 rounded-xl p-4 sm:p-4.5 shadow-sm mb-3">
          <h3 className="text-base font-bold text-white mb-3.5 text-center">
            {t.platformFeatures || 'Platform Features'}
          </h3>

          <div className="space-y-2.5 text-xs text-slate-200">
            {PLATFORM_FEATURES.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 group transition-transform">
                <span className={`w-2.5 h-2.5 rounded-full ${feat.color} ${feat.shadow} shrink-0 group-hover:scale-125 transition-transform duration-200`}></span>
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors duration-200">{feat.label}</span>
              </div>
            ))}
          </div>

          {/* Cross-Platform Device Optimization Card */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-indigo-950/40 border border-cyan-500/30 shadow-md text-center relative overflow-hidden">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-cyan-400/10 blur-2xl pointer-events-none rounded-full" />
              
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold tracking-wide uppercase mb-2">
                <Monitor className="w-3 h-3" />
                <span>Cross-Platform Ready</span>
                <Smartphone className="w-3 h-3" />
              </div>

              <h4 className="text-sm sm:text-base font-black bg-gradient-to-r from-teal-300 via-cyan-200 to-sky-400 bg-clip-text text-transparent tracking-tight mb-1.5 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                Mobile-friendly and desktop-friendly with Android, iOS, and Windows support.
              </h4>

              <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl mx-auto">
                This platform offers a highly useful and beautiful interface that is fully optimized for mobile and desktop users across Android, iOS, and Windows.
              </p>

              {/* Supported Platforms Badges */}
              <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Android
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-sky-500/30 text-sky-300 text-[10px] font-mono flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> iOS
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Windows
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* CANDLESTICK SILHOUETTE FOOTER & FLOATING CHAT BUBBLE           */}
      {/* ============================================================== */}
      <footer className="relative z-20 w-full mt-auto pt-10 pb-6 overflow-visible">
        {/* Glowing Candlestick Silhouette along bottom */}
        <div className="w-full flex items-end justify-center gap-2 sm:gap-3 px-4 h-24 opacity-60 overflow-hidden">
          {CANDLESTICKS.map((candle, i) => (
            <div key={i} className="flex flex-col items-center">
              {/* Top Wick */}
              <div
                className={`w-[1.5px] ${candle.isGreen ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ height: `${candle.wickTop}px` }}
              />
              {/* Candle Body */}
              <div
                className={`w-2.5 sm:w-3.5 rounded-xs ${
                  candle.isGreen
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                }`}
                style={{ height: `${candle.height}px` }}
              />
              {/* Bottom Wick */}
              <div
                className={`w-[1.5px] ${candle.isGreen ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ height: `${candle.wickBottom}px` }}
              />
            </div>
          ))}
        </div>

        {/* Center Floating Support Icon Bubble & Upward Popup */}
        <div className="relative -mt-16 flex justify-center z-30">
          {/* Compact Popover directly above the Message Bubble */}
          {showSupportModal && (
            <>
              {/* Tap-outside backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
                onClick={() => setShowSupportModal(false)}
              />

              {/* Compact Card anchored directly above the message icon */}
              <div className="absolute bottom-16 sm:bottom-18 left-1/2 -translate-x-1/2 z-50 w-64 sm:w-72 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      Customer Support
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2 Compact Buttons */}
                <div className="space-y-2">
                  {/* Official Customer Support (Replaces Telegram Channel) */}
                  <button
                    onClick={() => {
                      setShowSupportModal(false);
                      setShowSupportFormModal(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-between shadow-md transition-all active:scale-95 group text-left border border-cyan-400/30 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-cyan-100 shrink-0" />
                      <span className="truncate">Official Customer Support</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-100 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                  </button>

                  {/* Sign In to Member Portal */}
                  <button
                    onClick={() => {
                      setShowSupportModal(false);
                      onLogin();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 flex items-center justify-between transition-all active:scale-95 group text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="truncate">Sign In to Member Portal</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-white transition-transform shrink-0 ml-1" />
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setShowSupportModal((prev) => !prev)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.6)] cursor-pointer transition-all hover:scale-110 active:scale-95 group"
            aria-label="24/7 Live Support Chat"
          >
            <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#060b17] rounded-full animate-ping"></span>
          </button>
        </div>

        {/* Quiet Copyright notice */}
        <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
          © {new Date().getFullYear()} Aladdin AI Organization · www.Aladdin.Org.In
        </p>
      </footer>

      {/* ============================================================== */}
      {/* MODAL: LANGUAGE SELECTOR                                       */}
      {/* ============================================================== */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" /> Choose Language
              </h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
                { code: 'ar', label: 'العربية (Arabic)', flag: '🇦🇪' },
                { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang.code as any);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-colors ${
                    selectedLanguage === lang.code
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {selectedLanguage === lang.code && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BLOG & GUIDES                                           */}
      {/* ============================================================== */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Trading Guides & Knowledge
              </h3>
              <button
                onClick={() => setShowBlogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="font-bold text-cyan-400 mb-1">
                  1. Disciplined Compounding Sizing
                </h4>
                <p>
                  Never trade more than your predetermined session risk. Use the
                  built-in position calculator to keep your drawdown controlled.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="font-bold text-pink-400 mb-1">
                  2. Pocket Option / Quotex OTC Strategy
                </h4>
                <p>
                  Align your entries with multi-timeframe candle scans and never chase
                  missed signals during high-volatility news.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="font-bold text-emerald-400 mb-1">
                  3. Emotional Tilt Protection
                </h4>
                <p>
                  When your loss limit is hit, the terminal locks out new bets to
                  safeguard accumulated profits.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowBlogModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: 24/7 OFFICIAL CUSTOMER SUPPORT FORM                    */}
      {/* ============================================================== */}
      <SupportModal
        isOpen={showSupportFormModal}
        onClose={() => setShowSupportFormModal(false)}
        defaultMessage="Hello, I need assistance with Aladdin Trade Manager."
      />

    </div>
  );
};

export default LandingPage;
