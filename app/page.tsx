'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Activity, CheckCircle2, 
  Sparkles, Image as ImageIcon, Download, AlertCircle, RefreshCcw,
  ShieldCheck, Info, FileText, Camera,
  Check, ChevronDown, ChevronUp, X, Printer, ArrowLeft
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

// Static demonstration model (Alex) - strictly 6 numbered sections
const alexSampleReport = {
  scanId: "demo_alex_sample",
  customerName: "Alex",
  priorities: "Better dating-profile photographs and a more coordinated casual wardrobe.",
  preferences: "Relaxed clothing, minimal patterns and no expensive wardrobe overhaul.",
  suggestedDirection: "Deeper colours, simple layers and softer front-facing light.",
  quickStartChanges: [
    { title: "Try navy or deep teal near your face", desc: "The pale beige top blends into the overall colouring of the portrait. A deeper colour provides clearer separation." },
    { title: "Use an open overshirt for structure", desc: "Builds on your preference for casual clothing without requiring formal tailoring." },
    { title: "Face a window at eye level", desc: "Overhead indoor lighting creates under-eye shadows; soft natural daylight clarifies skin tones." }
  ],
  photoObservations: [
    { observation: "One side of the face is noticeably more warmly lit", why: "Lighting makes a firm undertone judgement unreliable", tryThis: "Retake facing indirect daylight" },
    { observation: "The pale top provides little separation from the face", why: "A different clothing colour makes the portrait clearer", tryThis: "Compare navy and beige under identical lighting" },
    { observation: "The standing photograph is taken from below chest height", why: "Camera perspective affects apparent proportions", tryThis: "Retake from farther away with the phone level" },
    { observation: "The outfit is mostly similar in tone", why: "Individual pieces are harder to distinguish", tryThis: "Introduce one lighter or darker layer" }
  ],
  confidenceNotes: [
    "Lighting and framing observations: Clear in these sample images.",
    "Suggested clothing colours: Useful baseline to compare.",
    "Exact seasonal colour category: Subject to testing due to artificial key lighting."
  ],
  palette: [
    { name: "Deep navy", hex: "#203047", use: "Main neutral: knitwear, overshirts or jackets" },
    { name: "Charcoal", hex: "#41454D", use: "Trousers and outer layers" },
    { name: "Soft white", hex: "#F0EEE9", use: "T-shirts and shirt layers" },
    { name: "Deep teal", hex: "#176B70", use: "An alternative to navy near the face" },
    { name: "Muted burgundy", hex: "#743F50", use: "Accent or second knitwear option" }
  ],
  outfits: [
    {
      title: "Outfit A — Relaxed coffee date",
      pieces: "Deep teal T-shirt + dark straight-leg jeans + navy overshirt + clean trainers",
      why: "Casual, easy to repeat and coordinated without looking formal.",
      ownAlternative: "A navy T-shirt with a charcoal overshirt is another option.",
      checkBefore: "The overshirt should sit comfortably across the shoulders."
    },
    {
      title: "Outfit B — Dinner or an evening out",
      pieces: "Burgundy fine-knit jumper + charcoal trousers + dark shoes",
      why: "Straightforward change from daytime clothing without needing a suit.",
      ownAlternative: "Substitute dark jeans if the venue is casual.",
      checkBefore: "Remove lint and check for fabric pulling when seated."
    },
    {
      title: "Outfit C — Professional profile photograph",
      pieces: "Navy shirt or plain navy knit + optional charcoal jacket",
      why: "Restrained palette keeps attention on your face and expression.",
      ownAlternative: "A clean, well-fitting plain top works without a jacket.",
      checkBefore: "Smooth the collar and check for distracting creases."
    }
  ],
  photoChecklist: [
    "Face a window with indirect daylight.",
    "Switch off overhead lighting if it creates a colour cast.",
    "Place the phone at eye level on a stable support.",
    "Step back and avoid ultra-wide camera lenses up close.",
    "Leave 1–2 metres between yourself and the background.",
    "Wear your navy or teal top.",
    "Take 4–5 variations with small changes in expression."
  ],
  finishingDetails: [
    "Smooth any uneven collar fold before shooting.",
    "Check for fabric lint on dark clothing layers.",
    "Ensure glasses do not catch harsh window reflections across the eyes."
  ],
  shoppingPlan: [
    { priority: 1, item: "Plain navy or teal top", buyOnlyIf: "You do not already own a suitable dark casual option" },
    { priority: 2, item: "Navy or charcoal overshirt", buyOnlyIf: "It coordinates with at least three existing tops" },
    { priority: 3, item: "Charcoal trousers", buyOnlyIf: "You need an alternative to casual denim" }
  ],
  actionPlan: [
    { day: "Day 1", task: "Check existing clothes against the suggested palette." },
    { day: "Day 2", task: "Compare three top colours in consistent window daylight." },
    { day: "Day 3", task: "Assemble and photograph your first casual outfit." },
    { day: "Day 4", task: "Retake your profile portrait using the checklist." },
    { day: "Day 5", task: "Select the most natural, well-lit photo." },
    { day: "Day 6", task: "Test an evening combination for comfort." },
    { day: "Day 7", task: "Assess whether any clothing item actually needs buying." }
  ]
};

// Safe downscaling only (never upscale smaller photos)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return reject(new Error('Please upload a valid JPEG or PNG file.'));
    }
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error('File size exceeds the 15MB limit. Please choose a smaller photo.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      const result = event.target?.result;
      if (typeof result !== 'string') return reject(new Error('Invalid image file format.'));
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        // Downscale ONLY if wider than MAX_WIDTH; never upscale
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas failure.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to decode image data.'));
    };
    reader.onerror = () => reject(new Error('File reader failed.'));
  });
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'scan' | 'vs-face' | 'vs-color'>('scan');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'how-it-works' | null>(null);

  // User input states
  const [step, setStep] = useState<string>('upload');
  const [userPriorities, setUserPriorities] = useState<string>("Dating profile photos");
  const [userStylePref, setUserStylePref] = useState<string>("Relaxed & minimal patterns");
  const [userBudget, setUserBudget] = useState<string>("£0 (Use what I own)");

  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ isPaid: boolean }>({ isPaid: false });
  const [isDemoView, setIsDemoView] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSampleExpanded, setIsSampleExpanded] = useState(false);

  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Accessibility: Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) closeModal();
        if (isPaywallModalOpen && !isProcessingPayment) setIsPaywallModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, isPaywallModalOpen, isProcessingPayment]);

  const openModal = (name: 'privacy' | 'terms' | 'how-it-works') => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setActiveModal(name);
  };

  const closeModal = () => {
    setActiveModal(null);
    if (lastActiveElementRef.current) {
      lastActiveElementRef.current.focus();
    }
  };

  // Stripe Return & Persistent Report Recovery
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const scanId = params.get('scan_id');

    if (sessionId) {
      const verifyPaymentAndRestore = async () => {
        try {
          const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
          const data = await res.json();
          if (data.verified) {
            setUserProfile({ isPaid: true });
            setIsDemoView(false);

            // Recover user's stored analysis from sessionStorage
            const targetScanId = scanId || data.scanId;
            let restored = null;
            if (targetScanId) {
              const cached = sessionStorage.getItem(`aurascan_${targetScanId}`);
              if (cached) {
                try {
                  restored = JSON.parse(cached);
                } catch (e) {
                  console.error("Failed to parse cached scan", e);
                }
              }
            }

            if (restored) {
              setScanResult(restored);
              setStep('results');
            } else {
              setError("Payment verified! If your report does not display automatically, please re-run your photos to view your unlocked results.");
              setStep('upload');
            }
          } else {
            setError(data.error || "Payment session could not be verified. Access was not granted.");
            setUserProfile({ isPaid: false });
          }
        } catch (err) {
          setError("Failed to verify payment with the server.");
          setUserProfile({ isPaid: false });
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      verifyPaymentAndRestore();
    }
  }, []);

  // Comprehensive reset: clears all states and navigation
  const handleReset = () => {
    setCurrentRoute('scan');
    setStep('upload');
    setFaceImage(null);
    setBodyImage(null);
    setScanResult(null);
    setUserProfile({ isPaid: false });
    setIsDemoView(false);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'body') => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      if (type === 'face') setFaceImage(compressed);
      if (type === 'body') setBodyImage(compressed);
    } catch (err: any) {
      setError(err?.message || "Image upload failed. Please try a different photo.");
    }
  };

  const executeScan = async () => {
    if (!faceImage || !bodyImage) return;
    setStep('loading');
    setError(null);

    const states = [
      "Inspecting photo clarity and verifying image framing...",
      "Evaluating lighting direction and skin contrast...",
      "Checking clothing tones against your selected priorities...",
      "Drafting personal style recommendations..."
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
        body: JSON.stringify({ 
          face: faceImage, 
          body: bodyImage,
          priorities: userPriorities,
          stylePref: userStylePref,
          budget: userBudget
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to assess the uploaded images. Please ensure your photos are clear and show a real person.");
      }

      // Generate and attach a unique scan ID
      const generatedScanId = `scn_${Date.now()}`;
      data.scanId = generatedScanId;

      // Cache report to sessionStorage so Stripe redirect can recover it
      try {
        sessionStorage.setItem(`aurascan_${generatedScanId}`, JSON.stringify(data));
      } catch (storageErr) {
        console.warn("sessionStorage quota exceeded or disabled", storageErr);
      }

      setIsDemoView(false);
      setScanResult(data);
      setStep('results');
    } catch (err: any) {
      setError(err.message || "Failed to analyze photos. Please upload genuine, clear photographs taken in natural daylight.");
      setStep('upload');
    } finally {
      clearInterval(interval);
    }
  };

  const handleCheckout = async () => {
    setIsProcessingPayment(true);
    setError(null);
    try {
      const currentId = scanResult?.scanId || `rep_${Date.now()}`;
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: currentId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Could not initialise checkout.");
      }
    } catch (err: any) {
      setIsPaywallModalOpen(false);
      setIsProcessingPayment(false);
      setError(err.message || "Checkout is currently unavailable. Please try again.");
    }
  };

  const handleExportCard = async () => {
    const node = document.getElementById('share-card');
    if (!node) {
      setError("Unable to find summary card element.");
      return;
    }
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `AuraScan-Style-Summary.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError("Failed to export summary card image. Please take a manual screenshot.");
    }
  };

  const handlePrintReport = () => {
    try {
      window.print();
    } catch (err) {
      setError("Browser print dialog could not be opened.");
    }
  };

  const handleDownloadSamplePdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const rep = alexSampleReport;

      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 150);
      doc.text('AURASCAN AI | PRACTICAL PERSONAL STYLE GUIDE (SAMPLE)', 14, 18);

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('Sample Personal Style & Photo Guide', 14, 27);

      doc.setFontSize(8.5);
      doc.setTextColor(167, 139, 250);
      doc.text(`Demonstration Profile: ${rep.customerName}`, 14, 34);

      let y = 44;
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('1. Quick-Start Recommendations', 14, y);
      y += 5;

      doc.setFillColor(18, 18, 22);
      doc.roundedRect(14, y, 182, 34, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(220, 220, 230);
      rep.quickStartChanges.forEach((c, idx) => {
        doc.text(doc.splitTextToSize(`${idx + 1}. ${c.title}: ${c.desc}`, 172), 18, y + 6 + (idx * 8));
      });

      y += 40;
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('2. Three Capsule Outfits from What You Own', 14, y);
      y += 5;

      rep.outfits.forEach((outfit) => {
        doc.setFillColor(18, 18, 22);
        doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(167, 139, 250);
        doc.text(outfit.title, 18, y + 5);
        doc.setTextColor(220, 220, 230);
        doc.text(doc.splitTextToSize(`Pieces: ${outfit.pieces}`, 170), 18, y + 10);
        doc.text(doc.splitTextToSize(`Why it fits: ${outfit.why}`, 170), 18, y + 15);
        y += 26;
      });

      doc.setFontSize(7);
      doc.setTextColor(110, 110, 120);
      doc.text('AuraScan AI Demonstration Document | aurascan-ai-six.vercel.app', 14, 290);

      doc.save('AuraScan-Sample-Style-Guide.pdf');
    } catch (err) {
      setError("Failed to create sample PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const activeReport = scanResult || (isDemoView ? alexSampleReport : null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans selection:bg-violet-500/30">
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={handleReset}
            className="font-bold text-lg tracking-tight flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg p-1"
            tabIndex={0}
            role="button"
            aria-label="AuraScan AI Homepage"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleReset(); }}
          >
            <Sparkles className="text-violet-500" size={22} /> AuraScan AI
          </div>
          
          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-medium text-zinc-400">
            <button 
              onClick={() => openModal('how-it-works')} 
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded p-1"
            >
              How It Works
            </button>
            <button 
              onClick={() => setCurrentRoute('vs-face')} 
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded p-1"
            >
              vs Face Raters
            </button>
            <button 
              onClick={() => setCurrentRoute('vs-color')} 
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded p-1"
            >
              vs Color Palettes
            </button>
            {step === 'results' && !userProfile.isPaid && (
              <button 
                onClick={() => setIsPaywallModalOpen(true)} 
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                Unlock Guide (£7.99)
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-8 w-full flex-1">
        
        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-200 px-5 py-3 rounded-xl flex items-center justify-between gap-3 text-sm" role="alert">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white p-1 rounded" aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Comparison Route 1: vs Face Raters */}
        {currentRoute === 'vs-face' && (
          <SEOComparisonView 
            title="AuraScan AI vs Appearance & Face Raters"
            competitor="Face Rating Sites"
            description="Assigning an arbitrary beauty score provides zero practical help. AuraScan delivers actionable lighting, clothing colour, and outfit guidance to improve how you look in photos."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {/* Comparison Route 2: vs Color Palettes */}
        {currentRoute === 'vs-color' && (
          <SEOComparisonView 
            title="AuraScan AI vs Standalone Colour Analyzers"
            competitor="Generic Swatch Apps"
            description="Knowing a seasonal label is unhelpful if you don't know how to pair pieces together with what you already own or if poor lighting distorts your photos."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {/* Step 1: Upload View (High Above the Fold) */}
        {currentRoute === 'scan' && step === 'upload' && (
          <div className="flex flex-col items-center">
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-center mb-3 leading-tight">
              Personal Style & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                Profile Photo Advice
              </span>
            </h1>

            <p className="text-zinc-300 text-center max-w-xl text-xs sm:text-sm mb-6">
              Upload two photos to receive clear suggestions on colours, clothing layers, and camera angles. Free initial preview; £7.99 for your complete 6-part action guide.
            </p>

            {/* Quick Context Selectors */}
            <div className="w-full max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-5 text-xs">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="pref-priorities" className="text-zinc-400 block mb-1">Your Priority</label>
                  <select 
                    id="pref-priorities"
                    value={userPriorities} 
                    onChange={(e) => setUserPriorities(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs"
                  >
                    <option>Dating profile photos</option>
                    <option>Professional headshots</option>
                    <option>Coordinated casual wardrobe</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pref-style" className="text-zinc-400 block mb-1">Preferred Style</label>
                  <select 
                    id="pref-style"
                    value={userStylePref} 
                    onChange={(e) => setUserStylePref(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs"
                  >
                    <option>Relaxed & minimal patterns</option>
                    <option>Smart casual & layered</option>
                    <option>Sharp & structured</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pref-budget" className="text-zinc-400 block mb-1">Clothing Budget</label>
                  <select 
                    id="pref-budget"
                    value={userBudget} 
                    onChange={(e) => setUserBudget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs"
                  >
                    <option>£0 (Use what I own)</option>
                    <option>Minimal (Under £50)</option>
                    <option>Open to essentials</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Photo Framing Explanation Banner */}
            <div className="w-full max-w-2xl bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3.5 mb-5 flex items-start gap-3 text-xs text-zinc-300">
              <Info size={16} className="text-violet-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200">Why two photos?</strong>
                <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                  The portrait assesses lighting angle and facial color contrast. The standing photo evaluates body silhouette and trouser-to-top proportions. Accepted formats: JPEG/PNG up to 15MB.
                </p>
              </div>
            </div>

            {/* Accessible Upload Controls */}
            <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl mb-5">
              <label 
                htmlFor="face-upload"
                className={`relative h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all focus-within:ring-2 focus-within:ring-violet-500 ${faceImage ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}`}
              >
                {faceImage ? (
                  <img src={faceImage} alt="Portrait preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40 mix-blend-luminosity" />
                ) : (
                  <Camera size={32} className="text-zinc-500 mb-2" />
                )}
                <div className="relative z-10 text-center pointer-events-none px-4">
                  <p className="font-semibold text-xs sm:text-sm">{faceImage ? 'Portrait Attached' : '1. Close-up Portrait'}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Window daylight, eye-level, neutral expression</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300">
                    {faceImage ? 'Replace Photo' : 'Select Photo (JPEG/PNG)'}
                  </span>
                </div>
                <input 
                  id="face-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="image/jpeg, image/png" 
                  aria-label="Upload Close-up Portrait"
                  onChange={(e) => handleImageUpload(e, 'face')} 
                />
              </label>

              <label 
                htmlFor="body-upload"
                className={`relative h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all focus-within:ring-2 focus-within:ring-cyan-500 ${bodyImage ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}`}
              >
                {bodyImage ? (
                  <img src={bodyImage} alt="Full-body preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40 mix-blend-luminosity" />
                ) : (
                  <ImageIcon size={32} className="text-zinc-500 mb-2" />
                )}
                <div className="relative z-10 text-center pointer-events-none px-4">
                  <p className="font-semibold text-xs sm:text-sm">{bodyImage ? 'Standing Photo Attached' : '2. Standing Photo'}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Head to knees, standard standing posture</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300">
                    {bodyImage ? 'Replace Photo' : 'Select Photo (JPEG/PNG)'}
                  </span>
                </div>
                <input 
                  id="body-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="image/jpeg, image/png" 
                  aria-label="Upload Standing Photo"
                  onChange={(e) => handleImageUpload(e, 'body')} 
                />
              </label>
            </div>

            {/* Clear Free Call-to-Action */}
            <button 
              onClick={executeScan}
              disabled={!faceImage || !bodyImage}
              className="px-8 py-3 bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all shadow-md flex items-center gap-2 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              Get My Free Preview <Sparkles size={15} />
            </button>

            <p className="text-[11px] text-zinc-400 text-center mb-8">
              Analysis runs in ephemeral runtime memory. Photos are never stored or used to train models. 18+ only.
            </p>

            {/* Collapsed Sample Showcase */}
            <div className="w-full max-w-3xl mb-12 border border-zinc-800 bg-zinc-950 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
                    Sample Report Preview
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    See What Your Style & Photo Guide Looks Like
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Demonstration Client: Alex · Dating profiles & relaxed casual wardrobe
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSamplePdf}
                    disabled={isGeneratingPdf}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Download size={13} /> Sample PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSampleExpanded(!isSampleExpanded)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {isSampleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isSampleExpanded ? "Hide Sample" : "View Full Sample"}
                  </button>
                </div>
              </div>

              {isSampleExpanded && (
                <div className="mt-6 pt-6 border-t border-zinc-900">
                  <ReportContent report={alexSampleReport} />
                </div>
              )}
            </div>

          </div>
        )}

        {/* Step 2: Processing View */}
        {currentRoute === 'scan' && step === 'loading' && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center" aria-live="polite">
            <div className="relative w-16 h-16 mb-5">
              <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
              <div className="absolute inset-0 border-2 border-violet-500 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={18} className="text-violet-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-base font-semibold mb-1 text-zinc-200">{loadingText || "Processing photos..."}</h2>
            <p className="text-xs text-zinc-500">Evaluating angles, contrast, and wardrobe options</p>
          </div>
        )}

        {/* Step 3: Results View */}
        {currentRoute === 'scan' && step === 'results' && activeReport && (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center">
              <button 
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full"
              >
                <RefreshCcw size={12} /> New Guide
              </button>
              <span className="text-xs text-zinc-500">Ref: {activeReport.scanId}</span>
            </div>

            {/* Free Assessment Summary Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
                Your Starting Direction
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mb-2">
                {activeReport.suggestedDirection}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Identified from your photos and priorities ({userPriorities}).
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                <Check size={13} className="text-emerald-400" /> Start with what you own: test deep colours near your face before buying new clothes.
              </div>
            </div>

            {/* Gated Unlock Prompt */}
            {!userProfile.isPaid ? (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center bg-zinc-950 flex flex-col items-center">
                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center mb-3 border border-zinc-800">
                  <Lock size={18} className="text-violet-400" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">Unlock Your Complete Personal Style & Photo Guide</h3>
                <p className="text-xs text-zinc-400 max-w-md mb-5 leading-relaxed">
                  Access 3 multi-piece outfits, photo diagnostics, starter colour swatches, a 7-step camera checklist, and your 7-day action protocol.
                </p>
                <button 
                  onClick={() => setIsPaywallModalOpen(true)}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xs shadow-md transition-all"
                >
                  Unlock Complete Guide – £7.99 one-time
                </button>
                <p className="text-[10px] text-zinc-500 mt-2.5">14-day refund guarantee if unsatisfied · Instant access</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Report Print / Export Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                      <FileText size={15} className="text-violet-400" /> Complete Style & Photo Guide Active
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Personalised colour palette, outfit formulas, and photo checklist.</p>
                  </div>
                  <button 
                    onClick={handlePrintReport}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Printer size={13} /> Print / Save as PDF
                  </button>
                </div>

                <div id="printable-report" className="space-y-8 bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-900">
                  <ReportContent report={activeReport} />
                </div>
              </div>
            )}

            {/* Save & Social Sharing Suite */}
            <div className="text-center pt-6 border-t border-zinc-900 mt-8">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
                Save & Share
              </span>
              <h3 className="text-base font-bold text-white mb-1">Your Mobile Style Reference</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Save to your camera roll or share your calibrated colour direction with friends.
              </p>

              <div id="share-card" className="max-w-xs mx-auto aspect-[9/16] bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl text-left text-xs mb-4">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-3">
                    <span className="font-bold tracking-wider text-zinc-300">AURASCAN AI</span>
                    <span>STYLE BRIEF</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white mb-1">Key Style Rules</h4>
                  <p className="text-[11px] text-violet-400 font-medium leading-snug">{activeReport.suggestedDirection}</p>
                </div>

                <div className="space-y-2.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-[11px]">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Testable Palette</span>
                    <div className="flex gap-1.5">
                      {activeReport.palette?.slice(0, 5).map((p: any) => (
                        <div key={p.hex} className="w-5 h-5 rounded-full border border-zinc-700 shrink-0" style={{ backgroundColor: p.hex }} title={p.name} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-semibold block mb-0.5">Recommended Setup</span>
                    <p className="text-zinc-300 text-[11px]">Indirect daylight · eye-level camera</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-semibold block mb-0.5">Core Formula</span>
                    <p className="text-zinc-300 text-[11px]">Plain dark top + straight jeans + open layer</p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between items-end text-[10px] text-zinc-500">
                  <span>aurascan-ai-six.vercel.app</span>
                  <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">18+</span>
                </div>
              </div>

              {/* Action Buttons: Download + Native Share */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto mb-3">
                <button 
                  onClick={handleExportCard}
                  className="w-full sm:w-auto flex-1 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={13} /> Save Image (PNG)
                </button>

                <button 
                  onClick={async () => {
                    const shareText = "Just ran my profile photos through AuraScan AI to dial in my lighting and wardrobe colours. Check it out:";
                    const shareUrl = "https://aurascan-ai-six.vercel.app";

                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: "AuraScan AI Style & Photo Guide",
                          text: shareText,
                          url: shareUrl,
                        });
                      } catch (err) {
                        // User cancelled
                      }
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      alert("Website link copied to clipboard!");
                    }
                  }}
                  className="w-full sm:w-auto flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles size={13} /> Share with Friends
                </button>
              </div>

              {/* Quick Platform Social Buttons */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400">
                <span>Quick share:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Got my profile photo lighting and wardrobe palette dialed in with AuraScan AI: https://aurascan-ai-six.vercel.app")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp
                </a>
                <span>·</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Dialed in my profile photo lighting and colour palette with @AuraScanAI. Simple, practical advice from two photos:")}&url=${encodeURIComponent("https://aurascan-ai-six.vercel.app")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors"
                >
                  X (Twitter)
                </a>
                <span>·</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("https://aurascan-ai-six.vercel.app");
                    alert("Website link copied to clipboard!");
                  }}
                  className="hover:text-zinc-200 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-zinc-400">AuraScan AI</span> · Operated by PT Digital Consulting (UK)
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => openModal('privacy')} className="hover:text-zinc-300 transition-colors">Privacy Policy</button>
            <span>·</span>
            <button onClick={() => openModal('terms')} className="hover:text-zinc-300 transition-colors">Terms & Refunds</button>
            <span>·</span>
            <a href="mailto:support@aurascan.ai" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Stripe Payment Modal */}
      {isPaywallModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-zinc-800 p-6 shadow-2xl relative">
            <button 
              onClick={() => !isProcessingPayment && setIsPaywallModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <h3 id="paywall-title" className="text-base font-bold mb-1">Unlock Your Complete Style Guide</h3>
            <p className="text-xs text-zinc-400 mb-4">6-part personalized action guide: 3 outfits, starter palette, repeatable photo setup, and 7-day action protocol.</p>
            <div className="flex justify-between items-center mb-5 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-xs text-zinc-300">One-Time Price</span>
              <span className="text-base font-bold text-white">£7.99</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={isProcessingPayment}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs transition-colors flex justify-center items-center gap-2"
            >
              {isProcessingPayment ? <Activity size={14} className="animate-spin" /> : "Proceed to Secure Stripe Checkout"}
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-3">14-day refund guarantee if unsatisfied</p>
          </div>
        </div>
      )}

      {/* Info Modals with Accessible Focus & Semantic Dialog */}
      {activeModal && (
        <LegalModal 
          title={
            activeModal === 'privacy' ? 'Data Protection & Privacy Policy' :
            activeModal === 'terms' ? 'Terms & Refund Policy' :
            'How AuraScan AI Works'
          }
          onClose={closeModal}
        >
          {activeModal === 'privacy' && (
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p><strong>Data Controller:</strong> PT Digital Consulting, Bristol, UK (<a href="mailto:privacy@aurascan.ai" className="text-violet-400 hover:underline">privacy@aurascan.ai</a>).</p>
              <p><strong>Ephemeral In-Memory Processing:</strong> Uploaded photographs are held in volatile runtime memory (RAM) only for the duration of the analysis. No image files are written to disk, persistent object storage, or user databases.</p>
              <p><strong>No AI Model Training:</strong> Analysis is executed via Google Cloud enterprise endpoints under strict terms confirming customer API inputs are never used to train foundation models.</p>
              <p><strong>Immediate Purge:</strong> Image buffers are garbage-collected immediately upon completion of the response.</p>
            </div>
          )}

          {activeModal === 'terms' && (
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p><strong>Service Scope:</strong> AuraScan provides algorithmic styling, lighting, and wardrobe guidance based on computer vision. It does not provide medical, orthopaedic, or dermatological advice.</p>
              <p><strong>14-Day Refund Guarantee:</strong> If your guide fails to provide practical value, email <a href="mailto:support@aurascan.ai" className="text-violet-400 hover:underline">support@aurascan.ai</a> with your scan reference ID for a prompt, complete refund.</p>
              <p><strong>Age Requirement:</strong> You must be at least 18 years of age to submit photographs.</p>
            </div>
          )}

          {activeModal === 'how-it-works' && (
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p><strong>1. Dual Photo Input:</strong> You select your priority and upload two photos (a portrait and a standing photo) taken in natural daylight.</p>
              <p><strong>2. Visual Diagnostics:</strong> Our vision models evaluate lighting balance, color separation against skin tone, and camera framing angle.</p>
              <p><strong>3. Practical Advice:</strong> You receive an instant free preview followed by the option to unlock all 6 actionable sections, including 3 outfits built around clothes you likely own.</p>
              <p><strong>4. Immediate Purge:</strong> Uploaded images are removed from volatile memory immediately upon completion.</p>
            </div>
          )}
        </LegalModal>
      )}

    </div>
  );
}

// Reusable 6-Part Report Content
function ReportContent({ report }: { report: any }) {
  if (!report) return null;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-zinc-800 pb-3">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">
          Personal Style & Photo Guide
        </span>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Practical Colour, Outfit and Photograph Recommendations
        </h2>
        <div className="grid sm:grid-cols-2 gap-1 text-xs text-zinc-400 mt-2">
          <p><strong className="text-zinc-300">Brief:</strong> {report.priorities}</p>
          <p><strong className="text-zinc-300">Preferences:</strong> {report.preferences}</p>
        </div>
      </div>

      {/* 1. Quick-Start Recommendations */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 border-b border-zinc-800 pb-1">
          1. Quick-Start Recommendations
        </h3>
        <p className="text-xs text-zinc-200">
          <strong>Suggested direction:</strong> {report.suggestedDirection}
        </p>
        <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
          {report.quickStartChanges?.map((change: any, idx: number) => (
            <div key={idx} className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <span className="font-bold text-white block mb-1">{idx + 1}. {change.title}</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">{change.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Photo Observations */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-zinc-800 pb-1">
          2. What Your Photographs Tell Us
        </h3>
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-2.5">Observation</th>
                <th className="p-2.5">Why it matters</th>
                <th className="p-2.5">What to try</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300 text-[11px]">
              {report.photoObservations?.map((obs: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2.5 text-zinc-200">{obs.observation}</td>
                  <td className="p-2.5 text-zinc-400">{obs.why}</td>
                  <td className="p-2.5 text-cyan-300">{obs.tryThis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Starter Colour Palette */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-zinc-800 pb-1">
          3. Starter Colour Palette
        </h3>
        <p className="text-[11px] text-zinc-400">
          A testable starter palette based on your photos. Test these using existing wardrobe pieces before shopping:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {report.palette?.map((p: any) => (
            <div key={p.hex} className="bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-800">
              <div className="w-full h-8 rounded border border-zinc-700 mb-1.5" style={{ backgroundColor: p.hex }} />
              <span className="text-xs font-bold text-white block">{p.name}</span>
              <span className="text-[9px] font-mono text-zinc-400 block">{p.hex}</span>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{p.use}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Three Capsule Outfits */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 border-b border-zinc-800 pb-1">
          4. Three Outfits from What You Own
        </h3>
        <div className="grid md:grid-cols-3 gap-3 text-xs">
          {report.outfits?.map((outfit: any, idx: number) => (
            <div key={idx} className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-xs mb-1.5">{outfit.title}</h4>
                <p className="font-semibold text-violet-300 mb-1.5 leading-relaxed text-[11px]">{outfit.pieces}</p>
                <p className="text-zinc-400 text-[11px] leading-relaxed mb-2"><strong>Why it fits:</strong> {outfit.why}</p>
              </div>
              <div className="border-t border-zinc-800 pt-1.5 text-[10px] text-zinc-400">
                <p><strong>Use what you own:</strong> {outfit.ownAlternative}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Repeatable Photo Setup */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-zinc-800 pb-1">
          5. Profile Photo Checklist
        </h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-300 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
          {report.photoChecklist?.map((step: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2 text-[11px]">
              <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Shopping & Action Plan */}
      <section className="space-y-2 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-zinc-800 pb-1">
          6. Deliberate Shopping Rule & 7-Day Plan
        </h3>
        <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
          <strong>Rule:</strong> Buy nothing until you have assembled and photographed outfits using your existing clothes.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {report.actionPlan?.map((p: any) => (
            <div key={p.day} className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">{p.day}</span>
              <p className="text-zinc-300 text-[10px] leading-snug">{p.task}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Accessible Modal with Focus Containment
function LegalModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 relative max-h-[85vh] overflow-y-auto shadow-2xl focus:outline-none"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>
        <h3 id="modal-title" className="text-sm font-bold text-white mb-3 border-b border-zinc-800 pb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function SEOComparisonView({ title, competitor, description, onBack }: { title: string; competitor: string; description: string; onBack: () => void }) {
  return (
    <div className="py-4 text-left">
      <button 
        onClick={onBack} 
        className="text-xs text-violet-400 hover:underline mb-4 inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded p-1"
      >
        <ArrowLeft size={14} /> Back to Style Guide
      </button>
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">{title}</h2>
      <p className="text-xs text-zinc-400 mb-6 max-w-2xl">{description}</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
            <tr>
              <th className="p-3">Deliverable</th>
              <th className="p-3 text-violet-400 font-bold">AuraScan AI</th>
              <th className="p-3 font-normal">{competitor}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300 text-[11px]">
            <tr>
              <td className="p-3">Actionable Styling (Not Arbitrary 1–10 Numbers)</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">Multi-Piece Outfit Formulas with Wardrobe Alternatives</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">Repeatable Camera & Lighting Setup Checklist</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}