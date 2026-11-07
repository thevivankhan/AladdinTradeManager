import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Sparkles, X, Activity, TrendingUp, TrendingDown, AlertTriangle, Clock, Zap, Crosshair, Percent, Image as ImageIcon, Timer, ShieldAlert, MonitorUp, Crop as CropIcon, Video, Bot, Settings, Eye, EyeOff, CheckCircle2, Key, ExternalLink, Trash2, RefreshCw, Plus, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GoogleGenAI, Type } from "@google/genai";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface BotAnalysis {
  condition: string;
  signal: 'BUY' | 'SELL' | 'WAIT';
  strength: number;
  expiry: string;
  reasoning: string;
  riskAdvice?: string;
  trend?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  volatility?: 'HIGH' | 'MEDIUM' | 'LOW';
  keyLevel?: string;
  pattern?: string;
  nextCandle?: 'GREEN' | 'RED' | 'UNCERTAIN';
  exactPriceLevels?: string;
  setupGrade?: 'A++' | 'A' | 'B' | 'C';
  martingale?: string;
  mtfContext?: string;
  deepAnalysis?: string;
  confluenceScore?: string;
  sessionOrPhase?: string;
  trapDetected?: string;
  winRateEstimate?: string;
  wickToBodyRatio?: string;
  candleSequence?: string[];
  detectedPair?: string;
}

const QUICK_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];
const LIVE_TIMEFRAMES = ['1m', '2m', '3m', '5m', '10m', '15m', '30m', '1h', '4h', '1d'];
const OTC_TIMEFRAMES = ['5s', '10s', '15s', '30s', '1m', '2m', '3m', '5m'];

export const ACTIVE_AI_MODEL = 'gemini-flash-latest';

import Pica from 'pica';

// Initialize Pica with WASM support for ultra-fast, high-quality image processing
const pica = new Pica({ features: ['js', 'wasm', 'cib'] });

// Helper to compress images using WASM (WebAssembly) for maximum accuracy and speed
const compressImage = async (base64Str: string): Promise<string> => {
  try {
    const img = new Image();
    img.src = base64Str;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Determine target dimensions (max 800px for best AI OCR readability)
    const MAX_SIZE = 800;
    let targetWidth = img.width;
    let targetHeight = img.height;

    if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
      targetWidth = Math.round(img.width * ratio);
      targetHeight = Math.round(img.height * ratio);
    } else {
      // If image is already small, return as is to save processing time
      return base64Str;
    }

    const fromCanvas = document.createElement('canvas');
    fromCanvas.width = img.width;
    fromCanvas.height = img.height;
    const ctx = fromCanvas.getContext('2d');
    if (!ctx) return base64Str;
    ctx.drawImage(img, 0, 0);

    const toCanvas = document.createElement('canvas');
    toCanvas.width = targetWidth;
    toCanvas.height = targetHeight;

    // Use WASM-accelerated resizing with Unsharp Mask to enhance chart candles & text
    await pica.resize(fromCanvas, toCanvas, {
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2
    });

    const blob = await pica.toBlob(toCanvas, 'image/jpeg', 0.7);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  } catch (error) {
    console.error("WASM Compression failed, returning original:", error);
    return base64Str;
  }
};

export const ChartScannerAI: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketType, setMarketType] = useState<'Live' | 'OTC'>('Live');
  const [currencyPair, setCurrencyPair] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [result, setResult] = useState<BotAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New States for Advanced Features
  const [streamedText, setStreamedText] = useState<string>("");
  const [previousAnalysis, setPreviousAnalysis] = useState<BotAnalysis | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [traderStyle, setTraderStyle] = useState<'SAFE' | 'AGGRESSIVE'>('SAFE');
  const [predictionHorizon, setPredictionHorizon] = useState<'1' | '2' | '3' | '5' | '7'>('1');
  const [isMultiCameraOpen, setIsMultiCameraOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  // New States for Cropping & Video
  const [isCropping, setIsCropping] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  // BYOK (Bring Your Own Key) States
  type KeyStatus = 'ready' | 'active' | 'exhausted' | 'error';
  interface ApiKeyObj {
    key: string;
    status: KeyStatus;
  }
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyObj[]>([]);
  const [tempKeysList, setTempKeysList] = useState<string[]>(['']);
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [keyStatusMsg, setKeyStatusMsg] = useState('');
  
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaResetTime, setQuotaResetTime] = useState<number | null>(null);
  const [countdownText, setCountdownText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Initialize API Keys from local storage
  useEffect(() => {
    const savedKeysStr = localStorage.getItem('gemini_api_keys_v2');
    if (savedKeysStr) {
      try {
        const parsed = JSON.parse(savedKeysStr);
        setApiKeys(parsed);
        setTempKeysList(parsed.length > 0 ? parsed.map((k: ApiKeyObj) => k.key) : ['']);
      } catch (e) {}
    } else {
      // Fallback for users upgrading from v1
      const oldKey = localStorage.getItem('custom_gemini_api_key');
      if (oldKey) {
        const newFormat = [{ key: oldKey, status: 'ready' as KeyStatus }];
        setApiKeys(newFormat);
        setTempKeysList([oldKey]);
        localStorage.setItem('gemini_api_keys_v2', JSON.stringify(newFormat));
      }
    }
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Quota Countdown Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quotaExceeded && quotaResetTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = quotaResetTime - now;
        if (diff <= 0) {
          setQuotaExceeded(false);
          setQuotaResetTime(null);
          setCountdownText("");
          
          // Reset exhausted keys back to ready
          setApiKeys(prev => {
            const resetKeys = prev.map(k => k.status === 'exhausted' ? { ...k, status: 'ready' as KeyStatus } : k);
            localStorage.setItem('gemini_api_keys_v2', JSON.stringify(resetKeys));
            return resetKeys;
          });
          
          clearInterval(interval);
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdownText(`${h}h ${m}m ${s}s`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quotaExceeded, quotaResetTime]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setIsCameraOpen(true);
      // Wait for state to update and videoRef to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video play error:", e));
          };
        }
      }, 100);
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback to native input if permission denied or error
      cameraInputRef.current?.click();
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureFromCamera = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError("Camera is still initializing. Please wait a second and try again.");
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 1.0);
      
      if (base64 === 'data:,') {
        setError("Failed to capture image. Please try again.");
        closeCamera();
        return;
      }
      
      closeCamera();
      const compressedBase64 = await compressImage(base64);
      setImage(compressedBase64);
      setResult(null);
      setError(null);
      setStreamedText("");
      analyzeChart(compressedBase64);
    }
  };

  const handleCropComplete = async () => {
    if (!imageRef.current || !crop.width || !crop.height) {
      // If no crop, just use the raw image
      if (rawImage) {
        const compressedBase64 = await compressImage(rawImage);
        setImage(compressedBase64);
        setIsCropping(false);
        setRawImage(null);
        setResult(null);
        setError(null);
        setStreamedText("");
        analyzeChart(compressedBase64);
      }
      return;
    }
    
    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    try {
      const compressedBase64 = await compressImage(base64);
      setImage(compressedBase64);
      setIsCropping(false);
      setRawImage(null);
      setResult(null);
      setError(null);
      setStreamedText("");
      analyzeChart(compressedBase64);
    } catch (err) {
      console.error("Compression error:", err);
      setError("Failed to process cropped image.");
    }
  };

  const startMultiCamera = async () => {
    setCapturedImages([]);
    setIsMultiCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video play error:", e));
          };
        }
      }, 100);
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or unavailable.");
      setIsMultiCameraOpen(false);
    }
  };

  const closeMultiCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsMultiCameraOpen(false);
    setIsRecording(false);
  };

  const initiateVideoScan = async () => {
    setCapturedImages([]);
    setIsMultiCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              // Start capturing frames after video starts playing
              startVideoScan();
            }).catch(e => console.error("Video play error:", e));
          };
        }
      }, 100);
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or unavailable.");
      setIsMultiCameraOpen(false);
    }
  };

  const startVideoScan = () => {
    if (!videoRef.current) return;
    setIsRecording(true);
    setCapturedImages([]);
    
    let frames: string[] = [];
    let captures = 0;
    
    const captureInterval = setInterval(async () => {
      if (videoRef.current && captures < 5) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.5);
        const compressed = await compressImage(base64);
        frames.push(compressed);
        setCapturedImages([...frames]);
        captures++;
      }
      
      if (captures >= 5) {
        clearInterval(captureInterval);
        setIsRecording(false);
        closeMultiCamera();
        setImage(frames[0]);
        setResult(null);
        setError(null);
        setStreamedText("");
        analyzeChart(frames);
      }
    }, 1000); // 5 frames over 5 seconds
  };

  const captureMultiImage = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.5);
      
      try {
        const compressedBase64 = await compressImage(base64);
        const newImages = [...capturedImages, compressedBase64];
        setCapturedImages(newImages);

        if (newImages.length === 5) {
          closeMultiCamera();
          setImage(newImages[0]); // Set the first image as the main display image
          setResult(null);
          setError(null);
          setStreamedText("");
          analyzeChart(newImages);
        }
      } catch (err) {
        console.error("Compression error:", err);
      }
    }
  };

  const processFile = async (file?: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressedBase64 = await compressImage(base64);
        setImage(compressedBase64);
        setResult(null);
        setError(null);
        setStreamedText("");
        analyzeChart(compressedBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Screen Capture Feature
  const captureScreen = async () => {
    try {
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen capture is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "browser" },
        audio: false 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/png');
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      setImage(base64Image);
      setResult(null);
      setError(null);
      setStreamedText("");
      
      analyzeChart(base64Image);
    } catch (err: any) {
      console.error("Screen capture failed:", err);
      // Only show error if it's not a user cancellation
      if (err.name !== 'NotAllowedError') {
        setError(err.message || "Screen capture failed.");
      }
    }
  };

  const testAndSaveApiKey = async () => {
    const rawKeys = tempKeysList.map(k => k.trim()).filter(k => k.length > 0);
    const uniqueKeys = Array.from(new Set(rawKeys)) as string[];

    if (uniqueKeys.length === 0) {
      setKeyStatus('error');
      setKeyStatusMsg('Please enter at least one valid API key.');
      return;
    }

    // Always reset status to 'ready' when saving so users can retry keys
    // that might have failed previously due to temporary issues or invalid model names
    const newApiKeys: ApiKeyObj[] = uniqueKeys.map(k => {
      return { key: k, status: 'ready' };
    });

    setApiKeys(newApiKeys);
    setTempKeysList(uniqueKeys); // Clean up any empty boxes from the UI
    localStorage.setItem('gemini_api_keys_v2', JSON.stringify(newApiKeys));
    setKeyStatus('success');
    setKeyStatusMsg(`Successfully saved ${uniqueKeys.length} key(s)!`);
    
    // Reset quota state when new valid keys are provided
    setQuotaExceeded(false);
    setQuotaResetTime(null);
    setCountdownText("");
    
    setTimeout(() => {
      setShowApiKeyModal(false);
      setKeyStatus('idle');
    }, 1500);
  };

  const clearAllKeys = () => {
    setApiKeys([]);
    setTempKeysList(['']);
    localStorage.removeItem('gemini_api_keys_v2');
    localStorage.removeItem('custom_gemini_api_key');
    setKeyStatus('idle');
    setKeyStatusMsg('');
    
    setQuotaExceeded(false);
    setQuotaResetTime(null);
    setCountdownText("");
  };

  const fetchHistory = async () => {
    const dbUserStr = localStorage.getItem('mock_dbUser');
    if (!dbUserStr) {
      alert("Please log in to view your scan history.");
      return;
    }
    
    setIsLoadingHistory(true);
    setShowHistoryModal(true);
    
    try {
      const dbUserStr = localStorage.getItem('mock_dbUser');
      if (!dbUserStr) return;
      const user = JSON.parse(dbUserStr);

      const allScansStr = localStorage.getItem('mock_scans') || "[]";
      const allScans = JSON.parse(allScansStr);
      
      let historyData = allScans.filter((s: any) => s.userId === user.uid);
      
      historyData.sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
      
      historyData = historyData.slice(0, 20);
      setScanHistory(historyData);
    } catch (err) {
      console.error("Error fetching history:", err);
      alert("Failed to load history. Please try again.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const analyzeChart = async (imgDataToAnalyze?: string | string[]) => {
    if (apiKeys.length === 0) {
      setShowApiKeyModal(true);
      setError("Please enter at least one free Gemini API Key to start scanning.");
      return;
    }

    const targetImages = imgDataToAnalyze || (image ? [image] : null);
    if (!targetImages || targetImages.length === 0) return;
    
    const imageArray = Array.isArray(targetImages) ? targetImages : [targetImages];

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setStreamedText("");

    let availableKeys = apiKeys.filter(k => k.status !== 'exhausted' && k.status !== 'error');
    
    if (availableKeys.length === 0) {
      setQuotaExceeded(true);
      setError("All API keys have exceeded their quota or are invalid. Please add new keys.");
      setIsAnalyzing(false);
      return;
    }

    let attempt = 0;
    let success = false;
    let currentKeysState = [...apiKeys];

    while (attempt < availableKeys.length && !success) {
      const currentKeyObj = availableKeys[attempt];
      const currentKey = currentKeyObj.key;

      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        
        const imageParts = imageArray.map((img) => {
          const mimeType = img.match(/data:(.*?);/)?.[1] || 'image/jpeg';
          const base64Data = img.split(',')[1];
          return { inlineData: { data: base64Data, mimeType: mimeType } };
        });
        
        let memoryContext = "";
        if (previousAnalysis) {
          memoryContext = `Previous Analysis Context: You previously analyzed this asset and suggested a ${previousAnalysis.signal} with ${previousAnalysis.strength}% confidence. Consider if the market has shifted or continued that trend.`;
        }

        const multiImageContext = imageArray.length > 1 
          ? `\nDEEP SCAN MODE ACTIVE (${imageArray.length} Images Provided):\nImage 1 is the CURRENT live chart.\nImage ${imageArray.length} is the oldest.\nAnalyze the historical progression from Image ${imageArray.length} -> Image 1 to understand the deep pattern memory, momentum shift, and true trend. Look for exhaustion in the older images leading to reversals in the current image.`
          : "";

        const configParams: any = {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condition: { type: Type.STRING },
              signal: { type: Type.STRING },
              strength: { type: Type.NUMBER },
              expiry: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              riskAdvice: { type: Type.STRING },
              trend: { type: Type.STRING },
              volatility: { type: Type.STRING },
              keyLevel: { type: Type.STRING },
              pattern: { type: Type.STRING },
              nextCandle: { type: Type.STRING },
              exactPriceLevels: { type: Type.STRING },
              setupGrade: { type: Type.STRING },
              martingale: { type: Type.STRING },
              mtfContext: { type: Type.STRING },
              confluenceScore: { type: Type.STRING },
              sessionOrPhase: { type: Type.STRING },
              trapDetected: { type: Type.STRING },
              winRateEstimate: { type: Type.STRING },
              wickToBodyRatio: { type: Type.STRING },
              candleSequence: { type: Type.ARRAY, items: { type: Type.STRING } },
              deepAnalysis: { type: Type.STRING },
              detectedPair: { type: Type.STRING }
            },
            required: ["condition", "signal", "strength", "expiry", "reasoning", "trend", "volatility", "nextCandle", "setupGrade", "detectedPair"]
          }
        };

        // Removed googleSearch tool as it can conflict with responseSchema in preview models
        // and cause "invalid request" errors for standard API keys.

        // We use stream to show real-time typing effect
        const responseStream = await ai.models.generateContentStream({
          model: ACTIVE_AI_MODEL,
          contents: {
            parts: [
              ...imageParts,
              {
                text: `Act as a ruthless, highly disciplined institutional quant algorithm for binary options (${marketType} Market). 
                Asset: ${currencyPair || 'Unknown (Please detect from image)'}, Timeframe: ${timeframe}.
                Trader Style: ${traderStyle} (If SAFE, ONLY give A++ setups. If AGGRESSIVE, allow A and B setups).
                Prediction Horizon: ${predictionHorizon} Candle(s).
                ${memoryContext}
                ${multiImageContext}

                CRITICAL RULE FOR MAXIMUM ACCURACY:
                You are currently failing at sequence prediction. You MUST stop guessing. 
                Perform a hyper-accurate visual analysis. Look for CLEAR Price Action, Support/Resistance, Trendlines, and Momentum.
                If the chart is choppy, in the middle of a range, or lacks a clear trigger (like a strong rejection pinbar at a key level or a clean breakout), YOU MUST OUTPUT "WAIT". 
                DO NOT FORCE A TRADE. Capital preservation is priority #1.
                
                SEQUENCE PREDICTION RULES:
                - If Prediction Horizon > 1, you MUST analyze the momentum and structure to predict the next ${predictionHorizon} candles.
                - DO NOT just alternate GREEN/RED randomly. Look at the current trend strength. If it's a strong breakout, the sequence should reflect continuation (e.g., GREEN, GREEN, GREEN). If it's a rejection at resistance, it should reflect reversal (e.g., RED, RED, RED).
                - If you are unsure about the sequence, output "WAIT" for the main signal.

                ${marketType === 'OTC' ? `
                OTC SPECIFIC ALGORITHM HUNTING:
                1. OTC Pattern Memory: Identify if this exact pattern repeated in the recent cycle.
                2. Liquidity Trap/Fakeout Detector: Spot broker traps (fake breakouts at key levels).
                3. Fractal Micro-Trend: Align momentum.
                4. Wick-to-Body Momentum: High rejection wicks at S/R are the ONLY reliable triggers in OTC.
                ` : `
                LIVE MARKET CONFLUENCE:
                1. Confluence Engine: Combine Price Action with visual RSI/EMA estimates if visible.
                2. Trend is Friend: Never predict a reversal unless there is massive climax volume/wick rejection.
                3. Momentum: Look at the size of the last 3 candles. Are they getting smaller? (Exhaustion).
                4. News Filter: Use Google Search to check for any high-impact economic news right now for ${currencyPair} that might cause erratic spikes. If there is news, output WAIT.
                `}
                
                EXPIRY RULES:
                - If Market is "Live": Suggested expiry MUST be between 1 Minute and 1 Hour.
                - If Market is "OTC": Suggested expiry MUST be between 5 Seconds and 5 Minutes.

                IMPORTANT LOGIC: 
                - Read the Asset Pair name directly from the chart image (usually at the top left or watermark). Include "OTC" if visible. Output this in the 'detectedPair' field. If you cannot see it, output "Unknown".
                - If you output "WAIT", the "strength" MUST be below 70. 
                - If the "strength" is 70 or higher, you MUST output "BUY" or "SELL".
                - For a "BUY" or "SELL", you MUST clearly identify a Key Level (Support/Resistance) in the image. If you can't see one, output "WAIT".
                
                Respond EXACTLY in the requested JSON schema. Keep ALL text fields extremely short (MAX 2-4 WORDS) EXCEPT for 'deepAnalysis' which should be a detailed 3-4 sentence explanation of market psychology.
                If Prediction Horizon > 1, provide the exact sequence of the next ${predictionHorizon} candles in the 'candleSequence' array (e.g., ["GREEN", "RED", "GREEN"]).`
              },
            ],
          },
          config: configParams
        });

        // If we get here, connection succeeded!
        success = true;
        
        // Update key status to active
        currentKeysState = currentKeysState.map(k => k.key === currentKey ? { ...k, status: 'active' } : (k.status === 'active' ? { ...k, status: 'ready' } : k));
        setApiKeys(currentKeysState);
        localStorage.setItem('gemini_api_keys_v2', JSON.stringify(currentKeysState));

        let fullText = "";
        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            setStreamedText(fullText);
          }
        }

        let jsonStr = fullText.trim();
        // Extract JSON from markdown blocks if present
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonStr) as BotAnalysis;
        setResult(parsed);
        setPreviousAnalysis(parsed); // Save to memory
        
        const finalPair = currencyPair || (parsed.detectedPair !== 'Unknown' ? parsed.detectedPair : 'Unknown Pair');
        if (!currencyPair && parsed.detectedPair && parsed.detectedPair !== 'Unknown') {
          setCurrencyPair(parsed.detectedPair);
        }
        
        // Save to Firestore Trade Journal
        try {
          import('../../lib/firebase').then(async ({ auth, db }) => {
            const user = auth.currentUser;
            if (user) {
              const { collection, addDoc } = await import('firebase/firestore');
              await addDoc(collection(db, 'scans'), {
                userId: user.uid,
                timestamp: new Date().toISOString(),
                marketType,
                currencyPair: finalPair,
                timeframe,
                traderStyle,
                predictionHorizon,
                analysis: parsed,
              });
            }
          });
        } catch (dbErr) {
          console.error("Failed to save scan to journal:", dbErr);
        }
      } catch (err: any) {
        console.error(`Key ${currentKey.substring(0, 8)}... failed:`, err);
        const errorMessage = err.message || String(err);
        
        if (err.status === 429 || errorMessage.toLowerCase().includes('quota')) {
          // Mark this key as exhausted
          currentKeysState = currentKeysState.map(k => k.key === currentKey ? { ...k, status: 'exhausted' } : k);
          setApiKeys(currentKeysState);
          localStorage.setItem('gemini_api_keys_v2', JSON.stringify(currentKeysState));
          attempt++; // Try next key
        } else {
          // Other error (e.g. invalid key, bad request)
          currentKeysState = currentKeysState.map(k => k.key === currentKey ? { ...k, status: 'error' } : k);
          setApiKeys(currentKeysState);
          localStorage.setItem('gemini_api_keys_v2', JSON.stringify(currentKeysState));
          
          // If it's the last key and it failed with a non-quota error, show the actual error
          if (attempt === availableKeys.length - 1) {
            setError(`API Error: ${errorMessage}. Please check your key or try again.`);
            setIsAnalyzing(false);
            return;
          }
          attempt++; // Try next key
        }
      }
    }

    if (!success) {
      const allExhausted = currentKeysState.every(k => k.status === 'exhausted' || k.status === 'error');
      if (allExhausted) {
        setQuotaExceeded(true);
        setError("All API keys have exceeded their quota or are invalid. Please add new keys.");
        const d = new Date();
        d.setUTCHours(24, 0, 0, 0);
        setQuotaResetTime(d.getTime());
      } else {
        setError("Failed to analyze chart with available keys. Please check your keys.");
      }
    }

    setIsAnalyzing(false);
  };

  const resetScanner = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setStreamedText("");
    setRawImage(null);
    setCapturedImages([]);
    setIsCropping(false);
    setPreviousAnalysis(null);
    
    // Clear file inputs so the same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] p-4 sm:p-6 space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay" />
      
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowApiKeyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">API Key Required</h3>
                <p className="text-xs text-slate-400">Please enter your own free key to use the scanner.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <label>Gemini API Keys</label>
                <div className="flex items-center gap-3">
                  <span className="text-indigo-400">{apiKeys.length} Saved</span>
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {tempKeysList.map((key, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-8 h-10 rounded-xl bg-[#0f172a] border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type={showKey ? "text" : "password"}
                      value={key}
                      onChange={(e) => {
                        const newList = [...tempKeysList];
                        newList[index] = e.target.value;
                        setTempKeysList(newList);
                      }}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-[#1e293b] border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                    <button
                      onClick={() => {
                        if (tempKeysList.length > 1) {
                          const newList = tempKeysList.filter((_, i) => i !== index);
                          setTempKeysList(newList);
                        } else {
                          setTempKeysList(['']);
                        }
                      }}
                      className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0 border border-transparent hover:border-rose-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTempKeysList([...tempKeysList, ''])}
                className="w-full py-2.5 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors text-xs font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Key
              </button>

              {apiKeys.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active: {apiKeys.filter(k => k.status === 'active').length}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Ready: {apiKeys.filter(k => k.status === 'ready').length}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Exhausted: {apiKeys.filter(k => k.status === 'exhausted').length}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Error: {apiKeys.filter(k => k.status === 'error').length}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Active Model: {ACTIVE_AI_MODEL}</span>
              </div>

              {keyStatus !== 'idle' && (
                <div className={cn(
                  "p-3 rounded-lg text-xs font-bold flex items-center gap-2",
                  keyStatus === 'testing' ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                  keyStatus === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                  "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                )}>
                  {keyStatus === 'testing' && <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
                  {keyStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {keyStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                  {keyStatusMsg}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={testAndSaveApiKey}
                  disabled={keyStatus === 'testing'}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Save Keys
                </button>
                {apiKeys.length > 0 && (
                  <button
                    onClick={clearAllKeys}
                    className="px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold transition-colors flex items-center justify-center"
                    title="Clear All Keys"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">How to get a free key?</h4>
                <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside mb-3">
                  <li>Go to Google AI Studio</li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Create API Key"</li>
                  <li>Copy and paste it here</li>
                </ol>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Scan History</h3>
                  <p className="text-xs text-slate-400">Your recent AI chart analyses</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                  <p className="text-sm font-bold">Loading history...</p>
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold">No scan history found.</p>
                  <p className="text-xs mt-1">Your future scans will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3 hover:border-indigo-500/30 transition-colors cursor-pointer" onClick={() => {
                      setResult(scan.analysis);
                      setImage('HISTORY_MODE');
                      setShowHistoryModal(false);
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            scan.analysis.signal === 'BUY' ? "bg-emerald-500/20 text-emerald-400" :
                            scan.analysis.signal === 'SELL' ? "bg-rose-500/20 text-rose-400" :
                            "bg-amber-500/20 text-amber-400"
                          )}>
                            {scan.analysis.signal || 'WAIT'}
                          </span>
                          <span className="text-xs font-bold text-slate-300">{scan.currencyPair || 'Unknown Pair'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {scan.timestamp?.toDate ? new Date(scan.timestamp.toDate()).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-[#0f172a] p-2 rounded-lg border border-slate-700">
                          <span className="text-slate-500 block mb-0.5">Strength</span>
                          <span className="font-mono text-slate-300">{scan.analysis.strength || 0}%</span>
                        </div>
                        <div className="bg-[#0f172a] p-2 rounded-lg border border-slate-700">
                          <span className="text-slate-500 block mb-0.5">Expiry</span>
                          <span className="font-mono text-indigo-400">{scan.analysis.expiry || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {scan.analysis.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-wide">
              AI CHART SCANNER
            </h2>
            <p className="text-xs text-indigo-300/70 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {marketType === 'Live' ? 'Live Market Sync Active' : 'Pro Engine Active'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetScanner}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-2"
            title="Fresh Start"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-2 relative"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">
              {quotaExceeded ? <span className="text-rose-400">Reset in {countdownText}</span> : 'API Keys'}
            </span>
            <span className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0f172a]", 
              apiKeys.length === 0 ? "bg-yellow-500 animate-pulse" : 
              (apiKeys.length > 0 && apiKeys.every(k => k.status === 'exhausted' || k.status === 'error')) ? "bg-rose-500 animate-pulse" : 
              "bg-emerald-500"
            )} />
          </button>
          <button 
            onClick={fetchHistory}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">History</span>
          </button>
        </div>
      </div>
      <p className="text-[10px] text-indigo-500/50 italic text-center">
        Disclaimer: AI analysis is for informational purposes only. Market analysis is probabilistic; 100% accuracy is not possible. Trade at your own risk.
      </p>

      <div className="space-y-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Market</label>
            <div className="flex bg-[#1e293b] rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => {
                  setMarketType('Live');
                  if (!LIVE_TIMEFRAMES.includes(timeframe)) setTimeframe('1m');
                }}
                className={cn(
                  "flex-1 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all",
                  marketType === 'Live' ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-400"
                )}
              >
                LIVE
              </button>
              <button
                onClick={() => {
                  setMarketType('OTC');
                  if (!OTC_TIMEFRAMES.includes(timeframe)) setTimeframe('1m');
                }}
                className={cn(
                  "flex-1 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all",
                  marketType === 'OTC' ? "bg-amber-500/20 text-amber-400 shadow-sm" : "text-slate-400"
                )}
              >
                OTC
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Timer className="w-3 h-3" /> Timeframe
            </label>
            <div className="flex bg-[#1e293b] rounded-xl p-1 border border-slate-700 overflow-x-auto custom-scrollbar">
              {(marketType === 'Live' ? LIVE_TIMEFRAMES : OTC_TIMEFRAMES).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "flex-1 py-2 px-2 text-xs sm:text-sm rounded-lg font-bold transition-all min-w-[40px]",
                    timeframe === tf ? "bg-indigo-500/20 text-indigo-400 shadow-sm" : "text-slate-400"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Trader Style
          </label>
          <div className="flex bg-[#1e293b] rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setTraderStyle('SAFE')}
              className={cn(
                "flex-1 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all",
                traderStyle === 'SAFE' ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-400"
              )}
            >
              SAFE (A++ Only)
            </button>
            <button
              onClick={() => setTraderStyle('AGGRESSIVE')}
              className={cn(
                "flex-1 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all",
                traderStyle === 'AGGRESSIVE' ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-slate-400"
              )}
            >
              AGGRESSIVE (A/B Allowed)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3" /> Prediction Horizon
          </label>
          <div className="flex bg-[#1e293b] rounded-xl p-1 border border-slate-700">
            {['1', '2', '3', '5', '7'].map(horizon => (
              <button
                key={horizon}
                onClick={() => setPredictionHorizon(horizon as any)}
                className={cn(
                  "flex-1 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all",
                  predictionHorizon === horizon ? "bg-indigo-500/20 text-indigo-400 shadow-sm" : "text-slate-400"
                )}
              >
                {horizon} {horizon === '1' ? 'Candle' : 'Candles'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Asset Pair</label>
          <input
            type="text"
            value={currencyPair}
            onChange={(e) => setCurrencyPair(e.target.value.toUpperCase())}
            placeholder={marketType === 'Live' ? "e.g., EURUSD" : "e.g., EURUSD OTC"}
            className="w-full bg-[#1e293b] border border-indigo-500/30 text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors uppercase shadow-inner"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_PAIRS.map(pair => (
              <button
                key={pair}
                onClick={() => setCurrencyPair(marketType === 'OTC' ? `${pair} OTC` : pair)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
              >
                {pair}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!image ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

          {/* Screen Capture - Hidden on mobile, visible on desktop */}
          <button 
            onClick={captureScreen}
            className="hidden sm:flex flex-col items-center justify-center gap-2 p-4 bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500/50 rounded-2xl transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <MonitorUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400">Screen</span>
          </button>

          <button 
            onClick={startCamera}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-600/20 hover:bg-indigo-600/30 border-2 border-indigo-500/50 rounded-2xl transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xs font-bold text-indigo-400">Camera</span>
          </button>

          <button 
            onClick={initiateVideoScan}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-600/20 hover:bg-purple-600/30 border-2 border-purple-500/50 rounded-2xl transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-400" />
              <span className="absolute top-1 right-1 text-[8px] font-black bg-purple-500 text-white rounded-full w-3 h-3 flex items-center justify-center">5s</span>
            </div>
            <span className="text-xs font-bold text-purple-400">Video Scan</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 rounded-2xl transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-xs font-bold text-slate-400">Upload</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] group">
            {image === 'HISTORY_MODE' ? (
              <div className="w-full h-48 bg-slate-900 flex flex-col items-center justify-center text-slate-500 border-b border-indigo-500/30">
                <History className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-bold">Historical Scan loaded</p>
                <p className="text-xs">Original image is not saved to save space.</p>
              </div>
            ) : (
              <img src={image} alt="Chart" className="w-full h-auto max-h-[350px] object-contain bg-slate-950" />
            )}
            
            {isAnalyzing && (
              <>
                {/* Scanning Laser Animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]" />
                
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                  <Activity className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                  <div className="w-full max-w-xs bg-black/50 rounded-lg p-3 border border-indigo-500/30 h-32 overflow-y-auto font-mono text-[10px] text-indigo-300 text-left">
                    {streamedText ? streamedText : "Initializing Neural Engine...\nConnecting to Market Data...\nScanning Price Action..."}
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </>
            )}

            {!isAnalyzing && (
              <button onClick={resetScanner} className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-rose-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl text-sm flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
          <button 
            onClick={() => analyzeChart()} 
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg text-xs transition-colors border border-rose-500/30 self-start"
          >
            Retry Scan
          </button>
        </div>
      )}

      {result && !isAnalyzing && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-5 relative z-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Confidence Filter Warning */}
          {result.strength < 70 && (
            <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-3 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase">Low Confidence Warning</p>
                <p className="text-[10px] text-amber-200/70 mt-0.5">Signal strength is below 70%. Market is highly unpredictable. Trading is not recommended right now.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1">Market Condition</p>
              <p className="text-sm font-bold text-indigo-300">{result.condition}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1">Recommended Expiry</p>
              <p className="text-sm font-bold text-cyan-400 flex items-center justify-end gap-1">
                <Clock className="w-4 h-4" /> {result.expiry}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className={cn(
              "p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center",
              result.strength < 70 ? "bg-amber-500/10 border-amber-500/50" :
              result.signal === 'BUY' ? "bg-emerald-500/10 border-emerald-500/50" :
              result.signal === 'SELL' ? "bg-rose-500/10 border-rose-500/50" :
              "bg-amber-500/10 border-amber-500/50"
            )}>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-2">Action Signal</p>
              <div className="flex items-center gap-2">
                {result.strength < 70 ? (
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                ) : (
                  <>
                    {result.signal === 'BUY' && <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
                    {result.signal === 'SELL' && <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />}
                    {result.signal === 'WAIT' && <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />}
                  </>
                )}
                <span className={cn(
                  "text-2xl sm:text-3xl font-black tracking-widest",
                  result.strength < 70 ? "text-amber-500" :
                  result.signal === 'BUY' ? "text-emerald-400" :
                  result.signal === 'SELL' ? "text-rose-400" :
                  "text-amber-400"
                )}>
                  {result.strength < 70 ? 'WAIT' : result.signal}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-2">Signal Strength</p>
              <div className="flex items-end gap-1">
                <span className={cn(
                  "text-3xl sm:text-4xl font-black",
                  result.strength >= 85 ? "text-emerald-400" :
                  result.strength >= 50 ? "text-amber-400" : "text-rose-400"
                )}>
                  {result.strength}
                </span>
                <Percent className="w-4 h-4 sm:w-6 sm:h-6 text-slate-500 mb-1" />
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    result.strength >= 85 ? "bg-emerald-500" :
                    result.strength >= 50 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${result.strength}%` }}
                />
              </div>
            </div>
          </div>

          {/* Advanced Pro Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Market Trend</p>
              <p className={cn(
                "text-xs sm:text-sm font-bold",
                result.trend === 'BULLISH' ? "text-emerald-400" :
                result.trend === 'BEARISH' ? "text-rose-400" : "text-amber-400"
              )}>{result.trend || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Volatility</p>
              <p className={cn(
                "text-xs sm:text-sm font-bold",
                result.volatility === 'HIGH' ? "text-rose-400" :
                result.volatility === 'LOW' ? "text-slate-400" : "text-amber-400"
              )}>{result.volatility || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Next Candle</p>
              <p className={cn(
                "text-xs sm:text-sm font-bold",
                result.nextCandle === 'GREEN' ? "text-emerald-400" :
                result.nextCandle === 'RED' ? "text-rose-400" : "text-amber-400"
              )}>{result.nextCandle || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Setup Grade</p>
              <p className={cn(
                "text-xs sm:text-sm font-bold",
                result.setupGrade === 'A++' ? "text-emerald-400" :
                result.setupGrade === 'A' ? "text-emerald-300" :
                result.setupGrade === 'B' ? "text-amber-400" : "text-rose-400"
              )}>{result.setupGrade || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Key Level / Pattern</p>
              <p className="text-xs sm:text-sm font-bold text-indigo-300 truncate">
                {result.keyLevel || 'N/A'} <br className="hidden sm:block" />
                <span className="text-slate-400 font-normal text-[10px] sm:text-xs">{result.pattern || 'No clear pattern'}</span>
              </p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Martingale Safety</p>
              <p className={cn(
                "text-xs sm:text-sm font-bold truncate",
                result.martingale?.includes('SAFE') ? "text-emerald-400" : "text-rose-400"
              )}>{result.martingale || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Exact Price Levels</p>
              <p className="text-xs sm:text-sm font-bold text-cyan-400">{result.exactPriceLevels || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">MTF Context</p>
              <p className="text-xs sm:text-sm font-bold text-indigo-300">{result.mtfContext || 'N/A'}</p>
            </div>
          </div>

          {/* Institutional Metrics Grid (New 5 Features) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confluence</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-400">{result.confluenceScore || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Session / Phase</p>
              <p className="text-xs sm:text-sm font-bold text-purple-400">{result.sessionOrPhase || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Trap Detector</p>
              <p className={cn(
                "text-xs sm:text-sm font-bold",
                result.trapDetected?.toLowerCase().includes('none') ? "text-emerald-400" : "text-rose-400"
              )}>{result.trapDetected || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Win Rate Est.</p>
              <p className="text-xs sm:text-sm font-bold text-cyan-400">{result.winRateEstimate || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-center sm:col-span-2">
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Wick/Body Analysis</p>
              <p className="text-xs sm:text-sm font-bold text-indigo-300">{result.wickToBodyRatio || 'N/A'}</p>
            </div>
          </div>

          {result.candleSequence && result.candleSequence.length > 0 && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 shadow-inner">
              <p className="text-[10px] sm:text-xs text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-bold">
                <Activity className="w-4 h-4" /> Prediction Sequence ({predictionHorizon} Candles)
              </p>
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
                {result.candleSequence.map((candle, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 min-w-[40px]">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border",
                      candle === 'GREEN' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                      candle === 'RED' ? "bg-rose-500/20 border-rose-500/50 text-rose-400" :
                      "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    )}>
                      {idx + 1}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{candle.substring(0, 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.deepAnalysis && (
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 p-5 sm:p-6 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <p className="text-[10px] sm:text-xs text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2 font-black">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Deep Market Psychology
              </p>
              <p className="text-sm sm:text-base text-indigo-50 leading-relaxed font-medium">
                {result.deepAnalysis}
              </p>
            </div>
          )}

          {result.reasoning && (
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <p className="text-[10px] sm:text-xs text-amber-400/80 uppercase tracking-widest mb-3 flex items-center gap-2 font-black">
                <Zap className="w-4 h-4 text-amber-400" /> Technical Reasoning
              </p>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                {result.reasoning}
              </p>
            </div>
          )}

          {result.riskAdvice && (
            <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20">
              <p className="text-[10px] sm:text-xs text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Risk Management
              </p>
              <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                {result.riskAdvice}
              </p>
            </div>
          )}

          <button 
            onClick={resetScanner}
            className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Scan Another Chart
          </button>
        </div>
      )}

      {/* In-App Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-12">
            <button 
              onClick={closeCamera}
              className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-white backdrop-blur-sm border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            
            <button 
              onClick={captureFromCamera}
              className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>
            
            <div className="w-12 h-12" /> {/* Spacer for centering */}
          </div>
          
          {/* Viewfinder Frame */}
          <div className="absolute inset-0 pointer-events-none border-[2px] border-white/20 m-4 rounded-3xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/30 rounded-xl flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-white/50" />
            </div>
          </div>
        </div>
      )}

      {/* Cropping Overlay */}
      {isCropping && rawImage && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-white font-bold flex items-center gap-2">
                <CropIcon className="w-5 h-5 text-indigo-400" />
                Crop to Candlesticks
              </h3>
              <button onClick={() => { setIsCropping(false); setRawImage(null); }} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s', transformOrigin: 'center center' }}>
                <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={undefined}>
                  <img ref={imageRef} src={rawImage} alt="Crop me" className="max-w-full max-h-[60vh] object-contain" />
                </ReactCrop>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded-md"
                >
                  -
                </button>
                <span className="text-xs font-bold text-slate-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button 
                  onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded-md"
                >
                  +
                </button>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsCropping(false); setRawImage(null); setZoom(1); }}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropComplete}
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Camera Overlay */}
      {isMultiCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          <div className="absolute top-8 left-0 right-0 flex justify-center">
            <div className="bg-purple-600/80 backdrop-blur-md px-6 py-3 rounded-full border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <p className="text-white font-black text-sm tracking-widest uppercase">
                {isRecording ? "Recording Video Scan..." : `Deep Scan: ${capturedImages.length + 1} / 5`}
              </p>
              <p className="text-purple-200 text-[10px] text-center mt-1">
                {isRecording ? "Hold camera steady or pan slowly for 5 seconds" : (capturedImages.length === 0 ? "Capture CURRENT Chart" : `Capture HISTORY (Scroll Back ${capturedImages.length})`)}
              </p>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-12">
            <button 
              onClick={closeMultiCamera}
              className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-white backdrop-blur-sm border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            
            {!isRecording && (
              <button 
                onClick={captureMultiImage}
                className="w-20 h-20 rounded-full bg-purple-500/20 border-4 border-purple-400 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 bg-purple-500 rounded-full" />
              </button>
            )}
            
            <div className="w-12 h-12 flex items-center justify-center">
              {/* Mini preview of captured images */}
              {capturedImages.length > 0 && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-400">
                  <img src={capturedImages[capturedImages.length - 1]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{capturedImages.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Viewfinder Frame */}
          <div className="absolute inset-0 pointer-events-none border-[2px] border-purple-500/30 m-4 rounded-3xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-purple-500/50 rounded-xl flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-purple-400/50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BotIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);


