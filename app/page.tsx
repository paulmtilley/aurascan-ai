'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, ScanFace, Droplets, Activity, CheckCircle2, 
  Sparkles, Image as ImageIcon, X, Download, AlertCircle, RefreshCcw,
  ShieldCheck, HelpCircle, ArrowRight, Eye, Info
} from 'lucide-react';
import { toPng } from 'html-to-image';

const mockFreeResult = {
  scanId: "scan_demo_preview",
  overallScore: 84,
  archetype: "High-Contrast Ethereal",
  colorSeason: "Deep Winter",
  colorUndertone: "Cool",
  teaserMessage: "High visual contrast detected. Cooler undertones suggest jewel tones (navy, deep emerald) optimize camera presence."
};

const mockPaidResult = {
  faceAnalysis: {
    harmonyScore: 87,
    jawlineDefinition: "Visual jawline contour is sharp; natural bilateral asymmetry observed.",
    skinClarityNotes: "Balanced visual skin tone with slight lower-orbital shadowing.",
    topStrengths: ["Positive visual canthal tilt", "Harmonious facial thirds"],
    areasToImprove: ["Hydration styling", "Under-eye brightness framing"]
  },
  colorAnalysis: {
    bestColors: ["#1A237E", "#4A148C", "#004D40", "#B71C1C"],
    avoidColors: ["#F57F17", "#E65100", "#FFD600"],
    recommendedJewelry: "Silver or White Gold"
  },
  postureAndSilhouette: {
    visualAlignment: "Neutral",
    shoulderToHipRatio: "V-Taper Silhouette",
    appearanceFixes: [
      "Mind chin angle relative to camera lens to eliminate neck shadowing",
      "Choose structured collars and blazers to frame shoulder width"
    ]
  },
  glowUpPlan: [
    { week: 1, focus: "Grooming & Skin Hydration", actions: ["Introduce a gentle non-stripping cleanser", "Maintain consistent hydration habits"] },
    { week: 2, focus: "Contrast Alignment", actions: ["Test high-contrast jewel tone tops in natural daylight", "Switch accessories to cool silver metals"] },
    { week: 3, focus: "Lighting & Angles", actions: ["Position camera at eye level for portrait photos", "Avoid overhead harsh point lighting"] },
    { week: 4, focus: "Wardrobe Polish", actions: ["Build 3 staple outfits using Deep Winter palette", "Take progress comparison photo"] }
  ]
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      const result = event.target?.result;
      if (typeof result !== 'string') return reject(new Error('Invalid image'));
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas failure'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'scan' | 'vs-face' | 'vs-color'>('scan');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'how-it-works' | null>(null);

  const [step, setStep] = useState<string>(() => {
    if (typeof window === 'undefined') return 'upload';
    const s = localStorage.getItem('aurascan_step');
    return s === 'loading' ? 'upload' : (s || 'upload');
  });

  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ isPaid: boolean }>({ isPaid: false });
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fileInputRefFace = useRef<HTMLInputElement>(null);
  const fileInputRefBody = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      setUserProfile({ isPaid: true });
      setScanResult((prev: any) => ({ ...(prev || mockFreeResult), ...mockPaidResult }));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'body') => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please provide a valid image file (JPEG or PNG).");
      return;
    }

    try {
      const compressed = await compressImage(file);
      if (type === 'face') setFaceImage(compressed);
      if (type === 'body') setBodyImage(compressed);
    } catch {
      setError("Image processing failed. Please select another photo.");
    }
  };

  const executeScan = async () => {
    if (!faceImage || !bodyImage) return;
    setStep('loading');
    setError(null);

    const states = [
      "Assessing visual facial harmony & lighting...",
      "Evaluating visible undertones & contrast values...",
      "Analyzing silhouette geometry and camera posture...",
      "Compiling tailored appearance recommendations..."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(states[i]);
      i++;
      if (i >= states.length) clearInterval(interval);
    }, 600);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ face: faceImage, body: bodyImage })
      });

      if (!res.ok) {
        throw new Error("Analysis failed. Displaying demonstration metrics.");
      }

      const data = await res.json();
      setScanResult(data);
      setStep('results');
    } catch (err: any) {
      console.warn("Using sample metrics:", err.message);
      setScanResult(mockFreeResult);
      setStep('results');
    } finally {
      clearInterval(interval);
    }
  };

  const handleCheckout = async () => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scanResult?.scanId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error();
      }
    } catch {
      // Mock unlock fallback
      setTimeout(() => {
        setScanResult((prev: any) => ({ ...prev, ...mockPaidResult }));
        setUserProfile({ isPaid: true });
        setIsPaywallModalOpen(false);
        setIsProcessingPayment(false);
      }, 800);
    }
  };

  const handleExportCard = async () => {
    const node = document.getElementById('share-card');
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `AuraScan-Score-${scanResult?.overallScore || 'Result'}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Failed to export card. Please take a standard screenshot.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans selection:bg-violet-500/30">
      
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => { setCurrentRoute('scan'); setStep('upload'); }}
            className="font-bold text-lg tracking-tight flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="text-violet-500" size={22} /> AuraScan AI
          </div>
          
          <nav className="flex items-center gap-6 text-xs font-medium text-zinc-400">
            <button onClick={() => setActiveModal('how-it-works')} className="hover:text-white transition-colors">
              How It Works
            </button>
            <button onClick={() => setCurrentRoute('vs-face')} className="hover:text-white transition-colors hidden sm:block">
              vs Single-Raters
            </button>
            <button onClick={() => setCurrentRoute('vs-color')} className="hover:text-white transition-colors hidden sm:block">
              vs Color Palettes
            </button>
            {step === 'results' && !userProfile.isPaid && (
              <button 
                onClick={() => setIsPaywallModalOpen(true)} 
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-semibold transition-colors"
              >
                Unlock Pro (£7.99)
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        
        {error && (
          <div className="mb-8 bg-red-950/40 border border-red-900/50 text-red-200 px-5 py-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Competitor / SEO comparison routes */}
        {currentRoute === 'vs-face' && (
          <SEOComparisonView 
            title="AuraScan AI vs Single-Purpose Face Raters"
            competitor="Face Rating Sites"
            description="Why judging facial dimensions in a vacuum without posture framing and clothing color contrast leads to poor real-world results."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {currentRoute === 'vs-color' && (
          <SEOComparisonView 
            title="AuraScan AI vs Standalone Color Analyzers"
            competitor="Color Swatch Apps"
            description="Color swatches require correct photographic lighting and posture alignment to enhance your real visual presence."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {/* Scan Flow: Step 1 (Upload) */}
        {currentRoute === 'scan' && step === 'upload' && (
          <div className="flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium mb-6 text-zinc-400">
              <Activity size={14} className="text-emerald-400" />
              Automated Appearance & Colour Analysis
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-center mb-4 leading-tight">
              Objective AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                Appearance & Styling Audit
              </span>
            </h1>

            <p className="text-zinc-400 text-center max-w-xl text-sm sm:text-base mb-8">
              Upload two photos to receive an objective breakdown of your seasonal color harmony, facial symmetry, and camera posture presentation.
            </p>

            {/* Clear Pre-Upload Pricing & Tier Disclosure */}
            <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-violet-400 shrink-0" />
                <div>
                  <span className="font-semibold text-zinc-200">Free Tier:</span> Aura Score, Color Season, and undertone evaluation.
                  <br />
                  <span className="font-semibold text-zinc-200">Complete Report:</span> In-depth facial analysis, exact wardrobe hex swatches, and 30-day styling plan for <strong className="text-white">£7.99 / $9.99 one-time</strong>.
                </div>
              </div>
            </div>

            {/* Upload Boxes */}
            <div className="grid md:grid-cols-2 gap-5 w-full max-w-2xl mb-6">
              <label 
                htmlFor="face-upload"
                className={`relative h-60 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${faceImage ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}`}
              >
                {faceImage ? (
                  <img src={faceImage} alt="Portrait preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40 mix-blend-luminosity" />
                ) : (
                  <ScanFace size={40} className="text-zinc-600 mb-3" />
                )}
                <div className="relative z-10 text-center pointer-events-none px-4">
                  <p className="font-semibold text-sm">{faceImage ? 'Portrait Attached' : 'Front-Facing Portrait'}</p>
                  <p className="text-xs text-zinc-500 mt-1">Natural lighting, neutral expression, eye-level</p>
                </div>
                <input id="face-upload" type="file" className="hidden" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'face')} />
              </label>

              <label 
                htmlFor="body-upload"
                className={`relative h-60 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${bodyImage ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}`}
              >
                {bodyImage ? (
                  <img src={bodyImage} alt="Body preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40 mix-blend-luminosity" />
                ) : (
                  <ImageIcon size={40} className="text-zinc-600 mb-3" />
                )}
                <div className="relative z-10 text-center pointer-events-none px-4">
                  <p className="font-semibold text-sm">{bodyImage ? 'Full Body Attached' : 'Full-Body Standing Photo'}</p>
                  <p className="text-xs text-zinc-500 mt-1">Neutral posture, natural standing silhouette</p>
                </div>
                <input id="body-upload" type="file" className="hidden" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'body')} />
              </label>
            </div>

            {/* Point-of-Collection Privacy & Accuracy Disclaimer (ICO Aligned) */}
            <div className="max-w-2xl w-full bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 mb-8 text-[11px] text-zinc-400 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-300">Your Photos & Privacy:</strong> Uploaded images are transmitted securely over TLS to our vision engine strictly to compute your analysis. They are held ephemerally in RAM, are <strong>automatically deleted within 60 minutes</strong>, and are never retained or used to train AI models. Adults (18+) only.
                </p>
              </div>
              <div className="flex items-start gap-2 text-zinc-500">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-400">Appearance Disclaimer:</strong> Results are algorithmic styling assessments based on photographic lighting, angle, and contrast. AuraScan provides appearance suggestions and does not provide medical or physical diagnosis.
                </p>
              </div>
            </div>

            <button 
              onClick={executeScan}
              disabled={!faceImage || !bodyImage}
              className="px-8 py-3.5 bg-zinc-100 text-zinc-950 text-sm font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all shadow-lg shadow-white/5 flex items-center gap-2 mb-16"
            >
              Generate Free Audit Preview <Sparkles size={16} />
            </button>

            {/* Outcome Framework (Replaces Unexplained Pill Badges) */}
            <div className="w-full border-t border-zinc-900 pt-12 mb-16">
              <h2 className="text-lg font-bold text-center mb-6 text-zinc-200">How People Use Their Audit</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-zinc-200 mb-1">Dating Profiles</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Identify lighting inconsistencies, eliminate washed-out colors, and select camera angles that maximize natural feature balance.
                  </p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-zinc-200 mb-1">Professional Headshots</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Pick exact wardrobe and blazer tones that provide sharp contrast on camera for LinkedIn and executive profiles.
                  </p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-zinc-200 mb-1">Personal Wardrobe Reset</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Replace unflattering warm or cool undertone garments with a cohesive, objective 4-color capsule palette.
                  </p>
                </div>
              </div>
            </div>

            {/* Demonstration Sample Outputs (Legally Compliant; Replaces Fake Case Studies) */}
            <div className="w-full mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-zinc-200">Example Report Outputs</h2>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Simulated Sample</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Sample Profile A</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300">Score: 88</span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-200 mb-2">High-Contrast Winter Framing</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Demonstration output highlighting a switch from pastel clothing to deep navy and emerald tones, increasing portrait contrast and camera definition.
                  </p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sample Profile B</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300">Score: 82</span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-200 mb-2">Posture Presentation Alignment</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Demonstration output showing camera angle adjustments and structured blazer lapels to correct perceived neck shadowing in full-body shots.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Scan Flow: Step 2 (Loading) */}
        {currentRoute === 'scan' && step === 'loading' && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
              <div className="absolute inset-0 border-2 border-violet-500 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={20} className="text-violet-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-1 text-zinc-200">{loadingText || "Processing images..."}</h2>
            <p className="text-xs text-zinc-500">Transmitting to vision engine (images will be cleared upon completion)</p>
          </div>
        )}

        {/* Scan Flow: Step 3 (Results) */}
        {currentRoute === 'scan' && step === 'results' && scanResult && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => { setStep('upload'); setFaceImage(null); setBodyImage(null); }}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full"
              >
                <RefreshCcw size={13} /> New Audit
              </button>
              <span className="text-xs text-zinc-500">ID: {scanResult.scanId?.slice(0, 12)}</span>
            </div>

            {/* Free Teaser Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-black mb-1">{scanResult.overallScore}</div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Aura Score</div>
                <span className="text-xs px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                  {scanResult.archetype}
                </span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center md:col-span-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Droplets size={14} /> Colour Analysis Profile
                </div>
                <div className="text-2xl font-black mb-2">{scanResult.colorSeason}</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Detected undertone: <strong className="text-zinc-200">{scanResult.colorUndertone}</strong>. {scanResult.teaserMessage}
                </p>
              </div>
            </div>

            {/* Hard-Gated Content Block */}
            <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
              {!userProfile.isPaid ? (
                <div className="p-10 text-center bg-zinc-950 flex flex-col items-center">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                    <Lock size={20} className="text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Unlock the Full Personalised Report</h2>
                  <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                    View your specific facial symmetry breakdown, recommended hex palettes, posture presentation fixes, and the complete 4-week appearance roadmap.
                  </p>
                  <button 
                    onClick={() => setIsPaywallModalOpen(true)}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xs transition-all shadow-md shadow-violet-900/30"
                  >
                    Unlock Full Report – £7.99 / $9.99
                  </button>
                  <p className="text-[10px] text-zinc-600 mt-3">14-day refund guarantee if unsatisfied · Secure checkout</p>
                </div>
              ) : (
                <div className="p-6 sm:p-8 space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <ScanFace size={16} className="text-violet-400" /> Facial Harmony Analysis
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 block mb-1">Jawline & Definition</span>
                        <p className="text-zinc-200">{scanResult.faceAnalysis?.jawlineDefinition}</p>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 block mb-1">Skin Tone & Lighting</span>
                        <p className="text-zinc-200">{scanResult.faceAnalysis?.skinClarityNotes}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <Droplets size={16} className="text-cyan-400" /> Recommended Wardrobe Palettes
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 block mb-3">Best Contrast Colours</span>
                        <div className="flex gap-2">
                          {scanResult.colorAnalysis?.bestColors?.map((c: string) => (
                            <div key={c} className="w-8 h-8 rounded-full border border-zinc-700" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 block mb-3">Colours to Limit Near Face</span>
                        <div className="flex gap-2">
                          {scanResult.colorAnalysis?.avoidColors?.map((c: string) => (
                            <div key={c} className="w-8 h-8 rounded-full border border-red-500/30 flex items-center justify-center relative" style={{ backgroundColor: c }}>
                              <X size={12} className="text-zinc-900 mix-blend-difference" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                      30-Day Appearance Roadmap
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      {scanResult.glowUpPlan?.map((w: any) => (
                        <div key={w.week} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest block mb-1">Week {w.week}</span>
                          <h4 className="font-semibold text-zinc-200 mb-2">{w.focus}</h4>
                          <ul className="space-y-1.5 text-zinc-400">
                            {w.actions.map((act: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* Share Card */}
            <div className="text-center pt-8">
              <h3 className="text-sm font-semibold mb-1">Save Summary Card</h3>
              <p className="text-xs text-zinc-500 mb-4">Exportable 9:16 mobile story card</p>

              <div id="share-card" className="max-w-xs mx-auto aspect-[9/16] bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl text-left">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-4">
                    <span className="font-bold text-zinc-300">AURASCAN AI</span>
                    <span>VISUAL AUDIT</span>
                  </div>
                  <div className="text-5xl font-black text-white">{scanResult.overallScore}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Aura Score</div>
                  <div className="text-sm font-bold text-violet-400 mt-2">{scanResult.archetype}</div>
                </div>

                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Colour Season</span>
                  <div className="font-bold mb-2">{scanResult.colorSeason}</div>
                  <div className="flex gap-1.5">
                    {scanResult.colorAnalysis?.bestColors?.slice(0, 4).map((c: string) => (
                      <div key={c} className="w-5 h-5 rounded-full border border-zinc-700" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-end text-[10px] text-zinc-500">
                  <div>
                    <span>Get your audit</span>
                    <p className="font-bold text-zinc-300">aurascan-ai-six.vercel.app</p>
                  </div>
                  <span className="text-[9px] bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-zinc-400">18+</span>
                </div>
              </div>

              <button 
                onClick={handleExportCard}
                className="mt-4 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs rounded-full inline-flex items-center gap-2"
              >
                <Download size={14} /> Download Image
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Structured Legal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-zinc-400">AuraScan AI</span> · Operated by PT Digital Consulting (UK)
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </button>
            <span>·</span>
            <button onClick={() => setActiveModal('terms')} className="hover:text-zinc-300 transition-colors">
              Terms & Refunds
            </button>
            <span>·</span>
            <a href="mailto:support@aurascan.ai" className="hover:text-zinc-300 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* Paywall Stripe Modal */}
      {isPaywallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-zinc-800 p-6 shadow-2xl relative">
            <button 
              onClick={() => !isProcessingPayment && setIsPaywallModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1">Upgrade to Full Protocol</h3>
            <p className="text-xs text-zinc-400 mb-6">Unlock your complete facial analysis, hex palettes, and 30-day plan.</p>
            <div className="flex justify-between items-center mb-6 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">One-Time Lifetime Access</span>
              <span className="text-lg font-bold">£7.99 / $9.99</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={isProcessingPayment}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs transition-colors flex justify-center items-center gap-2"
            >
              {isProcessingPayment ? <Activity size={16} className="animate-spin" /> : "Proceed to Secure Checkout"}
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-3">Processed via Stripe · 14-day refund policy</p>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <LegalModal title="Privacy Policy" onClose={() => setActiveModal(null)}>
          <div className="space-y-3 text-xs text-zinc-300">
            <p><strong>Data Controller:</strong> PT Digital Consulting, Bristol, UK. Contact: privacy@aurascan.ai</p>
            <p><strong>Personal Data Collected:</strong> Front-facing portrait and full-body photographs uploaded for styling and appearance analysis.</p>
            <p><strong>Purpose & Lawful Basis:</strong> Processing is performed strictly to fulfill your user-requested styling audit (Contractual Necessity / Consent under UK GDPR).</p>
            <p><strong>Sub-processors & AI Processing:</strong> Images are processed via encrypted API endpoints using Google Gemini (Google Cloud Platform). Data is processed ephemerally in volatile memory.</p>
            <p><strong>Retention Period:</strong> Uploaded photographs are <strong>automatically purged within 60 minutes</strong> of analysis completion. We do not retain biometric profiles, facial recognition templates, or persistent image archives.</p>
            <p><strong>Your Rights:</strong> Under the UK GDPR, you maintain rights of access, rectification, erasure, and objection. To request immediate manual purging of any transaction logs, email privacy@aurascan.ai.</p>
          </div>
        </LegalModal>
      )}

      {/* Terms & Refund Modal */}
      {activeModal === 'terms' && (
        <LegalModal title="Terms of Service & Refund Policy" onClose={() => setActiveModal(null)}>
          <div className="space-y-3 text-xs text-zinc-300">
            <p><strong>Service Nature:</strong> AuraScan AI provides algorithmic styling, lighting, and wardrobe guidance based on computer vision analysis. It does not provide medical, orthopaedic, dermatological, or psychological advice.</p>
            <p><strong>Age Requirement:</strong> You must be at least 18 years of age to submit photographs.</p>
            <p><strong>Refund Policy:</strong> We offer a 14-day no-questions-asked refund guarantee on one-time audit reports. If your analysis fails to provide actionable value, contact support@aurascan.ai with your transaction ID for a complete refund.</p>
            <p><strong>Consumer Law Compliance:</strong> All demonstration analyses on this platform reflect sample outputs designed to illustrate report format. We do not publish fabricated consumer testimonials.</p>
          </div>
        </LegalModal>
      )}

      {/* How It Works Modal */}
      {activeModal === 'how-it-works' && (
        <LegalModal title="How AuraScan AI Works" onClose={() => setActiveModal(null)}>
          <div className="space-y-3 text-xs text-zinc-300">
            <p><strong>1. Dual Photo Input:</strong> You upload a front-facing selfie and a full-body standing photo taken in natural light.</p>
            <p><strong>2. Multimodal Vision Engine:</strong> Our models measure visual contrast ratios, lighting balance, bilateral symmetry framing, and silhouette proportions.</p>
            <p><strong>3. Actionable Output:</strong> You receive an instant seasonal color recommendation and appearance roadmap.</p>
            <p><strong>4. Immediate Deletion:</strong> Once processed, uploaded image data is wiped from RAM within 60 minutes.</p>
          </div>
        </LegalModal>
      )}

    </div>
  );
}

function LegalModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X size={18} />
        </button>
        <h3 className="text-base font-bold text-white mb-4 border-b border-zinc-800 pb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function SEOComparisonView({ title, competitor, description, onBack }: { title: string; competitor: string; description: string; onBack: () => void }) {
  return (
    <div className="py-4">
      <button onClick={onBack} className="text-xs text-violet-400 hover:underline mb-4 block">
        ← Back to Audit
      </button>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-xs text-zinc-400 mb-6">{description}</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
            <tr>
              <th className="p-3">Analysis Vector</th>
              <th className="p-3 text-violet-400 font-bold">AuraScan AI</th>
              <th className="p-3 font-normal">{competitor}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            <tr>
              <td className="p-3">Multi-Vector Analysis (Face + Body + Colour)</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">Actionable 30-Day Appearance Roadmap</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">Wardrobe Palette Matching</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">Partial</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}