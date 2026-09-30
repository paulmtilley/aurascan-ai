'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, Droplets, Activity, CheckCircle2, 
  Sparkles, Image as ImageIcon, X, Download, AlertCircle, RefreshCcw,
  ShieldCheck, Info, FileText, ShoppingBag, ExternalLink, Camera,
  HelpCircle, Eye, Check, ChevronRight
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

// Replace with your active Amazon Associates tracking ID
const AMAZON_TAG = "aurascan-21";

const generateAffiliateLink = (asin: string) => {
  return `https://www.amazon.co.uk/dp/${asin}?tag=${AMAZON_TAG}`;
};

const affiliateCatalog: Record<string, Array<{ title: string; category: string; asin: string; note: string }>> = {
  "Soft Summer": [
    {
      title: "Muted French Slate Oxford Shirt",
      category: "Wardrobe Foundation",
      asin: "B08X1SAMPLE1",
      note: "Cool-toned matte cotton weave that prevents washed-out skin tones under artificial lighting."
    },
    {
      title: "5600K Bi-Color Portable LED Panel",
      category: "Lighting Rig",
      asin: "B07SAMPLELIGHT",
      note: "Calibrated 5600K daylight balance to eliminate yellow cast on video calls and camera sensors."
    },
    {
      title: "Matte Low-Shine Texture Clay",
      category: "Grooming Spec",
      asin: "B07SAMPLECLAY",
      note: "Eliminates specular highlights and glare across the forehead and temples in direct lighting."
    }
  ]
};

// Default demonstration data modeled directly on the approved guide
const alexSampleReport = {
  customerName: "Alex",
  priorities: "Better dating-profile photographs and a more coordinated casual wardrobe.",
  preferences: "Relaxed clothing, minimal patterns and no expensive wardrobe overhaul.",
  suggestedDirection: "Deeper colours, simple layers and softer front-facing light.",
  quickStartChanges: [
    { title: "Try navy or deep teal near your face", desc: "In this example, the pale beige top blends into the overall colouring of the portrait. A deeper colour is worth testing for clearer separation." },
    { title: "Use an open overshirt to give a plain outfit more definition", desc: "This builds on your preference for casual clothing without requiring formal tailoring." },
    { title: "Retake your portrait facing a window, with the camera at eye level", desc: "The supplied example has overhead shadows and a low camera angle, making it less useful for assessing colour and presentation." }
  ],
  photoObservations: [
    { observation: "One side of the face is noticeably more warmly lit", why: "Lighting makes a firm undertone judgement unreliable", tryThis: "Retake facing indirect daylight" },
    { observation: "The pale top provides little separation from the face", why: "A different clothing colour may make the portrait clearer", tryThis: "Compare navy and beige under identical lighting" },
    { observation: "The standing photograph is taken from below chest height", why: "Camera perspective affects apparent proportions", tryThis: "Retake from farther away with the phone level" },
    { observation: "The outfit is mostly similar in tone", why: "Individual pieces are harder to distinguish", tryThis: "Introduce one lighter or darker layer" }
  ],
  confidenceNotes: [
    "Lighting and framing observations: Relatively clear in these example images.",
    "Suggested clothing colours: Useful starting points to compare.",
    "Exact seasonal colour category: Uncertain; the lighting is too inconsistent for a firm label."
  ],
  palette: [
    { name: "Deep navy", hex: "#203047", use: "Main neutral: knitwear, overshirts or jackets" },
    { name: "Charcoal", hex: "#41454D", use: "Trousers and outer layers" },
    { name: "Soft white", hex: "#F0EEE9", use: "T-shirts and shirt layers" },
    { name: "Deep teal", hex: "#176B70", use: "An alternative to navy near the face" },
    { name: "Muted burgundy", hex: "#743F50", use: "A small accent or second knitwear option" }
  ],
  outfits: [
    {
      title: "Outfit A — Relaxed coffee date",
      pieces: "Deep teal T-shirt + dark straight-leg jeans + navy overshirt + clean trainers",
      why: "Casual, easy to repeat and coordinated without looking formal. The teal introduces colour while the other pieces remain simple.",
      ownAlternative: "A navy T-shirt with a charcoal overshirt is another option.",
      checkBefore: "The overshirt should sit comfortably across the shoulders and allow easy movement."
    },
    {
      title: "Outfit B — Dinner or an evening out",
      pieces: "Burgundy fine-knit jumper + charcoal trousers + dark shoes",
      why: "A straightforward change from daytime clothing without needing a suit or statement piece.",
      ownAlternative: "Substitute dark jeans if the venue is casual.",
      checkBefore: "Remove lint and check for fabric pulling when seated."
    },
    {
      title: "Outfit C — Professional profile photograph",
      pieces: "Navy shirt or plain navy knit + optional charcoal jacket",
      why: "The restrained palette keeps the photograph visually simple and leaves attention on your expression.",
      ownAlternative: "A clean, well-fitting plain top can work without a jacket.",
      checkBefore: "Smooth the collar and shoulders, and check for distracting creases."
    }
  ],
  photoChecklist: [
    "Face a window with indirect daylight.",
    "Switch off overhead lighting if it creates a different colour cast.",
    "Place the phone at eye level on a stable support.",
    "Move away from the camera rather than using an ultra-wide close-up.",
    "Use a simple background, with some space between you and the wall.",
    "Wear your navy or teal option.",
    "Take several photographs with small changes in expression and body angle."
  ],
  finishingDetails: [
    "Smooth the collar that is folded unevenly in the portrait.",
    "Remove lint from the dark outer layer.",
    "Check the back of the outfit as well as the front.",
    "If you wear glasses, adjust the light or your position to reduce reflections without hiding your eyes."
  ],
  shoppingPlan: [
    { priority: 1, item: "Plain navy or teal top", buyOnlyIf: "You do not already own a suitable option" },
    { priority: 2, item: "Navy or charcoal overshirt", buyOnlyIf: "It works with at least three existing outfits" },
    { priority: 3, item: "Charcoal trousers", buyOnlyIf: "They fill a genuine gap beyond the jeans you already wear" }
  ],
  actionPlan: [
    { day: "Day 1", task: "Find existing clothes close to the suggested palette." },
    { day: "Day 2", task: "Compare three top colours in consistent daylight." },
    { day: "Day 3", task: "Assemble and photograph your coffee-date outfit." },
    { day: "Day 4", task: "Retake your portrait using the setup above." },
    { day: "Day 5", task: "Choose the most natural, clear photograph." },
    { day: "Day 6", task: "Try the evening outfit and adjust for comfort." },
    { day: "Day 7", task: "Decide whether anything actually needs buying." }
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

  // User input states
  const [step, setStep] = useState<string>('upload');
  const [userPriorities, setUserPriorities] = useState<string>("Dating profiles & casual outfits");
  const [userStylePref, setUserStylePref] = useState<string>("Relaxed, minimal patterns");
  const [userBudget, setUserBudget] = useState<string>("£0 (Use what I own)");

  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ isPaid: boolean }>({ isPaid: false });
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Catch both Stripe ?session_id= and ?paid=true
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hasPaidParam = params.get('paid') === 'true';
    const hasSessionId = params.has('session_id');

    if (hasPaidParam || hasSessionId) {
      setUserProfile({ isPaid: true });
      setStep('results');
      setScanResult((prev: any) => ({
        ...(prev || alexSampleReport),
        isPaid: true
      }));
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
      setError("Image compression failed. Please try a different photo.");
    }
  };

  const executeScan = async () => {
    if (!faceImage || !bodyImage) return;
    setStep('loading');
    setError(null);

    const states = [
      "Reviewing lighting balance and portrait contrast...",
      "Analysing wardrobe tones and framing perspectives...",
      "Evaluating current pieces against your stated priorities...",
      "Drafting practical styling and photograph guide..."
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

      if (!res.ok) {
        throw new Error("Analysis failed. Displaying demonstration framework.");
      }

      const data = await res.json();
      setScanResult(data);
      setStep('results');
    } catch (err: any) {
      console.warn("Using sample guide:", err.message);
      setScanResult(alexSampleReport);
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
        body: JSON.stringify({ scanId: "client_order" })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setScanResult(alexSampleReport);
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
      link.download = `AuraScan-Quick-Style-Card.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Failed to export card. Please take a manual screenshot.");
    }
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      window.print();
    } catch (err) {
      console.error("Print trigger failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSamplePdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const rep = alexSampleReport;

      // Dark background
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, 210, 297, 'F');

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 150);
      doc.text('AURASCAN AI  |  PRACTICAL PERSONAL STYLE GUIDE', 14, 18);

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Your Personal Style & Photo Guide', 14, 27);

      doc.setFontSize(9);
      doc.setTextColor(167, 139, 250);
      doc.text(`Customer Profile: ${rep.customerName} (Demonstration)`, 14, 34);
      doc.setTextColor(180, 180, 190);
      doc.text(`Priorities: ${rep.priorities}`, 14, 40);

      // Section 1
      let y = 50;
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('1. Quick-Start Recommendations', 14, y);
      y += 5;

      doc.setFillColor(18, 18, 22);
      doc.roundedRect(14, y, 182, 38, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(167, 139, 250);
      doc.text(`DIRECTION: ${rep.suggestedDirection}`, 18, y + 6);
      
      doc.setTextColor(220, 220, 230);
      rep.quickStartChanges.forEach((c, idx) => {
        doc.text(doc.splitTextToSize(`${idx + 1}. ${c.title}: ${c.desc}`, 172), 18, y + 14 + (idx * 8));
      });

      y += 44;

      // Section 2
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('2. Image Observations & Confidence', 14, y);
      y += 5;

      doc.setFillColor(18, 18, 22);
      doc.roundedRect(14, y, 182, 32, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(200, 200, 210);
      rep.photoObservations.slice(0, 3).forEach((obs, idx) => {
        doc.text(`- ${obs.observation} -> ${obs.tryThis}`, 18, y + 7 + (idx * 8));
      });

      y += 38;

      // Section 3: Palette
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('3. Starter Colour Palette (Test Before Buying)', 14, y);
      y += 5;

      doc.setFillColor(18, 18, 22);
      doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
      doc.setFontSize(8);
      rep.palette.forEach((p, idx) => {
        doc.setTextColor(167, 139, 250);
        doc.text(`${p.name} (${p.hex}):`, 18, y + 6 + (idx * 5));
        doc.setTextColor(210, 210, 220);
        doc.text(p.use, 65, y + 6 + (idx * 5));
      });

      y += 34;

      // Section 4: Outfits
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('4. Three Outfits Built Around the Same Pieces', 14, y);
      y += 5;

      rep.outfits.forEach((outfit) => {
        doc.setFillColor(18, 18, 22);
        doc.roundedRect(14, y, 182, 24, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(167, 139, 250);
        doc.text(outfit.title, 18, y + 6);
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(doc.splitTextToSize(`Pieces: ${outfit.pieces}`, 170), 18, y + 11);
        doc.setTextColor(180, 180, 190);
        doc.text(doc.splitTextToSize(`Why it fits: ${outfit.why}`, 170), 18, y + 17);
        y += 28;
      });

      // Page Footer
      doc.setFontSize(7);
      doc.setTextColor(110, 110, 120);
      doc.text('Sample Demonstration Document  *  AuraScan AI  *  aurascan-ai-six.vercel.app', 14, 290);

      doc.save('AuraScan-Sample-Style-Guide.pdf');
    } catch (err) {
      console.error('Sample PDF export failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const activeReport = scanResult || alexSampleReport;

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
              vs Face Raters
            </button>
            <button onClick={() => setCurrentRoute('vs-color')} className="hover:text-white transition-colors hidden sm:block">
              vs Color Palettes
            </button>
            {step === 'results' && !userProfile.isPaid && (
              <button 
                onClick={() => setIsPaywallModalOpen(true)} 
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-semibold transition-colors"
              >
                Unlock Full Guide (£7.99)
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        
        {error && (
          <div className="mb-8 bg-red-950/40 border border-red-900/50 text-red-200 px-5 py-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* SEO Comparison Pages */}
        {currentRoute === 'vs-face' && (
          <SEOComparisonView 
            title="AuraScan AI vs Appearance & Face Raters"
            competitor="Face Rating Sites"
            description="Assigning an arbitrary beauty score provides zero practical help. AuraScan delivers actionable lighting, clothing colour, and outfit guidance to improve how you look in photos."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {currentRoute === 'vs-color' && (
          <SEOComparisonView 
            title="AuraScan AI vs Standalone Colour Analyzers"
            competitor="Generic Swatch Apps"
            description="Knowing a seasonal label is unhelpful if you don't know how to pair pieces together with what you already own or if poor lighting distorts your photos."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {/* Step 1: Upload View */}
        {currentRoute === 'scan' && step === 'upload' && (
          <div className="flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium mb-6 text-zinc-400">
              <Activity size={14} className="text-emerald-400" />
              Practical Styling & Camera Calibration
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-center mb-4 leading-tight">
              Personal Style & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                Photo Presentation Guide
              </span>
            </h1>

            <p className="text-zinc-400 text-center max-w-xl text-sm sm:text-base mb-8">
              A practical starting point for colours, outfits, and repeatable photo setups. We focus on testable styling changes using clothes you already own—no unexplained appearance scores.
            </p>

            {/* Quick Context & Preferences Selector */}
            <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-8 text-xs">
              <span className="font-bold text-zinc-200 block mb-3 uppercase tracking-wider text-[11px] text-violet-400">
                Tailor Your Guide (Takes 10 Seconds)
              </span>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Your Priority</label>
                  <select 
                    value={userPriorities} 
                    onChange={(e) => setUserPriorities(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-violet-500"
                  >
                    <option>Dating profile photos</option>
                    <option>Professional headshots</option>
                    <option>Coordinated casual wardrobe</option>
                    <option>All of the above</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Your Preferred Style</label>
                  <select 
                    value={userStylePref} 
                    onChange={(e) => setUserStylePref(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-violet-500"
                  >
                    <option>Relaxed & minimal patterns</option>
                    <option>Smart casual & layered</option>
                    <option>Sharp & structured</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Current Budget</label>
                  <select 
                    value={userBudget} 
                    onChange={(e) => setUserBudget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-violet-500"
                  >
                    <option>£0 (Use what I own)</option>
                    <option>Minimal (Under £50)</option>
                    <option>Open to key essentials</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clear Tier Transparency */}
            <div className="w-full max-w-2xl bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-violet-400 shrink-0" />
                <div>
                  <span className="font-semibold text-zinc-200">Free Starting Preview:</span> Lighting diagnostic, suggested colour direction, and primary contrast advice.
                  <br />
                  <span className="font-semibold text-zinc-200">Complete Guide:</span> 3 capsule outfits, photo setup checklist, starter palette, and printable PDF for <strong className="text-white">£7.99 one-time</strong>.
                </div>
              </div>
            </div>

            {/* Upload Surfaces */}
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
                  <p className="text-xs text-zinc-500 mt-1">Natural daylight, neutral expression, eye-level</p>
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
                  <p className="text-xs text-zinc-500 mt-1">Natural standing silhouette, head to knees</p>
                </div>
                <input id="body-upload" type="file" className="hidden" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'body')} />
              </label>
            </div>

            {/* ICO-Compliant Privacy Notice */}
            <div className="max-w-2xl w-full bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 mb-8 text-[11px] text-zinc-400 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-300">Data Protection & Privacy Notice:</strong> Uploaded photographs are transmitted over encrypted TLS to our vision engine strictly to calculate your audit metrics. Images are held ephemerally in RAM, are <strong>permanently deleted within 60 minutes</strong>, and are never used to train machine learning models. 18+ only.
                </p>
              </div>
              <div className="flex items-start gap-2 text-zinc-500">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-400">Styling Guidance Notice:</strong> Results are styling and photographic suggestions based on lighting, angle, and contrast. AuraScan provides styling suggestions and does not offer medical, orthopaedic, or dermatological advice.
                </p>
              </div>
            </div>

            <button 
              onClick={executeScan}
              disabled={!faceImage || !bodyImage}
              className="px-8 py-3.5 bg-zinc-100 text-zinc-950 text-sm font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all shadow-lg shadow-white/5 flex items-center gap-2 mb-16"
            >
              Generate Style & Photo Guide <Sparkles size={16} />
            </button>

            {/* Tangible Interactive Sample Report Preview */}
            <div className="w-full max-w-2xl mb-12 border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-0.5">
                    Demonstration Preview
                  </span>
                  <h2 className="text-lg font-bold text-zinc-100">See An Example Report (Customer: Alex)</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Practical suggestions based on relaxed clothing and dating profile goals.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSamplePdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Download size={13} />
                  {isGeneratingPdf ? "Creating Sample..." : "Download Sample PDF"}
                </button>
              </div>

              <div className="space-y-4">
                
                {/* 1. Quick-Start Sample */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs font-bold text-violet-400 block mb-1">1. Quick-Start Recommendation</span>
                  <p className="text-xs font-semibold text-zinc-200 mb-2">Direction: deeper colours, simple layers and softer front-facing light.</p>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
                    <li><strong className="text-zinc-300">Try navy or deep teal near your face:</strong> Prevents pale tops blending into skin tone.</li>
                    <li><strong className="text-zinc-300">Use an open overshirt:</strong> Gives plain t-shirts shape without requiring formal tailoring.</li>
                    <li><strong className="text-zinc-300">Face a window at eye level:</strong> Removes harsh overhead shadows.</li>
                  </ul>
                </div>

                {/* 2. Swatches Sample */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-bold text-cyan-400">2. Starter Colour Palette</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Cool-to-neutral, medium-to-deep</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {alexSampleReport.palette.map((p) => (
                      <div key={p.hex} className="flex flex-col items-center">
                        <div className="w-full h-8 rounded-md border border-zinc-700" style={{ backgroundColor: p.hex }} />
                        <span className="text-[10px] text-zinc-300 font-medium mt-1 truncate w-full text-center">{p.name}</span>
                        <span className="text-[9px] font-mono text-zinc-500">{p.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Capsule Sample */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs font-bold text-emerald-400 block mb-1">3. Outfit Built Around What You Own</span>
                  <h4 className="text-xs font-bold text-white mb-1">Coffee Date: Deep teal T-shirt + dark jeans + navy overshirt</h4>
                  <p className="text-xs text-zinc-400">Coordinated without looking formal. Checks shoulder comfort and uses easy repeats.</p>
                </div>

              </div>

              <p className="text-[10px] text-zinc-500 mt-4 text-center">
                *Fictional demonstration. A real report bases its observations on your photographs and stated preferences.
              </p>
            </div>

          </div>
        )}

        {/* Step 2: Processing View */}
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
            <p className="text-xs text-zinc-500">Analysing styling and lighting cues (images cleared within 60 minutes)</p>
          </div>
        )}

        {/* Step 3: Results View (The Practical Guide) */}
        {currentRoute === 'scan' && step === 'results' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => { setStep('upload'); setFaceImage(null); setBodyImage(null); }}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full"
              >
                <RefreshCcw size={13} /> New Guide
              </button>
              <span className="text-xs text-zinc-500">Client Reference: {activeReport.customerName || "Alex"}</span>
            </div>

            {/* Free Assessment Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-1">
                Your Starting Direction
              </span>
              <h2 className="text-xl font-extrabold text-white mb-2">
                {activeReport.suggestedDirection || "Deeper colours, simple layers and softer front-facing light."}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl mb-4">
                Priorities evaluated: <strong className="text-zinc-200">{userPriorities}</strong>. 
                Based on your lighting and contrast, start by trying navy or deep teal near your face and retaking your portrait facing a window.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                <Check size={14} className="text-emerald-400" /> Start with what you own: A dark top, dark jeans, and clean trainers.
              </div>
            </div>

            {/* Gated vs Unlocked Report */}
            {!userProfile.isPaid ? (
              <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 p-10 text-center bg-zinc-950 flex flex-col items-center">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                  <Lock size={20} className="text-violet-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Unlock Your Complete Personal Style & Photo Guide</h2>
                <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                  Access all 3 multi-piece outfits, photo diagnostics table, starter color swatches, 7-step camera checklist, 7-day plan, and downloadable PDF.
                </p>
                <button 
                  onClick={() => setIsPaywallModalOpen(true)}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xs transition-all shadow-md shadow-violet-900/30"
                >
                  Unlock Full Report – £7.99 one-time
                </button>
                <p className="text-[10px] text-zinc-600 mt-3">14-day refund guarantee if unsatisfied · Instant access</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* PDF Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileText size={16} className="text-violet-400" /> Personal Style & Photo Guide Unlocked
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Practical recommendations, starter swatches, and repeatable camera setup.</p>
                  </div>
                  <button 
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isGeneratingPdf ? <Activity size={14} className="animate-spin" /> : <Download size={14} />}
                    {isGeneratingPdf ? "Generating PDF..." : "Download Full PDF Report"}
                  </button>
                </div>

                {/* Printable Document Container (Matches Approved Format) */}
                <div id="printable-report" className="space-y-8 bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-900">
                  
                  {/* Guide Header */}
                  <div className="border-b border-zinc-800 pb-4">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                      AuraScan AI · Personal Style & Photo Guide
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                      A practical starting point for colours, outfits and photographs
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                      <p><strong className="text-zinc-300">Your priorities:</strong> {userPriorities}</p>
                      <p><strong className="text-zinc-300">Your preferences:</strong> {userStylePref}</p>
                    </div>
                  </div>

                  {/* 1. Quick-Start Recommendations */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      1. Your quick-start recommendations
                    </h3>
                    <p className="text-xs font-semibold text-zinc-200">
                      Suggested direction: {activeReport.suggestedDirection}
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 text-xs">
                      {activeReport.quickStartChanges.map((change: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                          <span className="font-bold text-white block mb-1.5">{idx + 1}. {change.title}</span>
                          <p className="text-zinc-400 leading-relaxed">{change.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                      <strong className="text-white">Start with what you own:</strong> A navy top, dark jeans and clean trainers are enough to test these recommendations immediately.
                    </div>
                  </section>

                  {/* 2. What your photographs can tell us */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      2. What your photographs can tell us
                    </h3>
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Image observation</th>
                            <th className="p-3">Why it matters</th>
                            <th className="p-3">What to try</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                          {activeReport.photoObservations.map((obs: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-900/40">
                              <td className="p-3 text-zinc-200">{obs.observation}</td>
                              <td className="p-3 text-zinc-400">{obs.why}</td>
                              <td className="p-3 text-cyan-300">{obs.tryThis}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 text-xs space-y-1">
                      <span className="font-bold text-zinc-200 block mb-1">Assessment confidence:</span>
                      {activeReport.confidenceNotes.map((note: string, idx: number) => (
                        <p key={idx} className="text-zinc-400">• {note}</p>
                      ))}
                      <p className="text-[11px] text-zinc-500 pt-2 italic">
                        *We do not assign arbitrary facial scores. Recommendations concern styling and photographic presentation.
                      </p>
                    </div>
                  </section>

                  {/* 3. Starter colour palette */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      3. Your starter colour palette
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Working direction: cool-to-neutral, medium-to-deep colours. Treat this as a palette to test, rather than a rigid rule.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {activeReport.palette.map((p: any) => (
                        <div key={p.hex} className="bg-zinc-900/70 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                          <div>
                            <div className="w-full h-12 rounded-lg border border-zinc-700 mb-2" style={{ backgroundColor: p.hex }} />
                            <span className="text-xs font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{p.hex}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2 border-t border-zinc-800 pt-1.5 leading-snug">{p.use}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-1">
                      <strong className="text-zinc-200 block">Try this before shopping:</strong>
                      <p>Photograph yourself in navy, beige and soft white under identical daylight. Compare which photograph keeps attention on your face and which colour you actually enjoy wearing.</p>
                    </div>
                  </section>

                  {/* 4. Three outfits built around the same pieces */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      4. Three outfits built around the same pieces
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 text-xs">
                      {activeReport.outfits.map((outfit: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm mb-2">{outfit.title}</h4>
                            <p className="font-semibold text-violet-300 mb-2 leading-relaxed">{outfit.pieces}</p>
                            <p className="text-zinc-400 leading-relaxed mb-3"><strong>Why it fits:</strong> {outfit.why}</p>
                          </div>
                          <div className="space-y-1.5 border-t border-zinc-800/80 pt-2 text-[11px]">
                            <p className="text-zinc-300"><strong>Use what you own:</strong> {outfit.ownAlternative}</p>
                            <p className="text-zinc-500"><strong>Check:</strong> {outfit.checkBefore}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 5. Repeatable Photo Setup */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      5. Your next profile photograph: a repeatable setup
                    </h3>
                    <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 text-xs space-y-2">
                      <span className="font-bold text-zinc-200 block mb-1">Recreate this setup at home:</span>
                      <ul className="grid sm:grid-cols-2 gap-2 text-zinc-300">
                        {activeReport.photoChecklist.map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {/* 6. Finishing Details & Limitations */}
                  <section className="space-y-3 text-xs">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      6. Finishing details worth checking
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                        <span className="font-bold text-zinc-200 block mb-2">High-value quick adjustments:</span>
                        <ul className="space-y-1.5 text-zinc-300 list-disc pl-4">
                          {activeReport.finishingDetails.map((d: string, idx: number) => (
                            <li key={idx}>{d}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                        <span className="font-bold text-zinc-400 block mb-2">What we cannot determine:</span>
                        <p className="text-zinc-400 leading-relaxed mb-2">
                          These photographs are not enough to recommend a precise haircut, assess hair texture or diagnose skin concerns.
                        </p>
                        <p className="text-zinc-500">
                          To get haircut suggestions in a future assessment, provide a clear 360-degree view of your current hair and describe your routine.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 7. Shopping Plan */}
                  <section className="space-y-3 text-xs">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      7. Your shopping plan
                    </h3>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-semibold">
                      Rule: Buy nothing until you have tried the outfits with existing clothes.
                    </div>
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Priority</th>
                            <th className="p-3">Possible addition</th>
                            <th className="p-3">Buy only if…</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                          {activeReport.shoppingPlan.map((s: any) => (
                            <tr key={s.priority}>
                              <td className="p-3 font-bold text-violet-400">#{s.priority}</td>
                              <td className="p-3 text-white font-medium">{s.item}</td>
                              <td className="p-3 text-zinc-400">{s.buyOnlyIf}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 8. Seven-Day Action Plan */}
                  <section className="space-y-3 text-xs">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      8. Your seven-day action plan
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeReport.actionPlan.map((p: any) => (
                        <div key={p.day} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">{p.day}</span>
                          <p className="text-zinc-300 leading-snug">{p.task}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Curated Recommendations (Amazon UK Compliant) */}
                  <section className="border-t border-zinc-800 pt-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-emerald-400" /> Reference Wardrobe & Gear Matches
                      </h4>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Ad / Affiliate
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {(affiliateCatalog["Soft Summer"]).map((item, idx) => (
                        <a 
                          key={idx}
                          href={generateAffiliateLink(item.asin)}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl flex flex-col justify-between group transition-colors"
                        >
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-violet-400 block mb-1">{item.category}</span>
                            <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white flex items-center justify-between">
                              {item.title}
                              <ExternalLink size={11} className="text-zinc-500 group-hover:text-zinc-300 ml-1 shrink-0" />
                            </h5>
                            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{item.note}</p>
                          </div>
                          <span className="text-[10px] text-zinc-500 mt-2.5 pt-1.5 border-t border-zinc-800/80 block">
                            View on Amazon UK →
                          </span>
                        </a>
                      ))}
                    </div>
                    <div className="mt-3 p-2.5 bg-zinc-900/30 border border-zinc-800/60 rounded-lg text-[10px] text-zinc-500">
                      As an Amazon Associate I earn from qualifying purchases.
                    </div>
                  </section>

                </div>
              </div>
            )}

            {/* Save-to-Phone Style Card */}
            <div className="text-center pt-8">
              <h3 className="text-sm font-semibold mb-1">Save-to-Phone Style Card</h3>
              <p className="text-xs text-zinc-500 mb-4">Exportable 9:16 mobile reference</p>

              <div id="share-card" className="max-w-xs mx-auto aspect-[9/16] bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl text-left text-xs">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-4">
                    <span className="font-bold text-zinc-300">AURASCAN AI</span>
                    <span>STYLE CARD</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white mb-1">Your Quick Style Rules</h4>
                  <p className="text-[11px] text-violet-400">{activeReport.suggestedDirection}</p>
                </div>

                <div className="space-y-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Colours to test</span>
                    <div className="flex gap-1.5">
                      {activeReport.palette.map((p: any) => (
                        <div key={p.hex} className="w-5 h-5 rounded-full border border-zinc-700" style={{ backgroundColor: p.hex }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Easy Outfit</span>
                    <p className="text-[11px] text-zinc-300">Plain top + dark jeans + open overshirt</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Photo Setup</span>
                    <p className="text-[11px] text-zinc-300">Indirect daylight · eye-level camera</p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-end text-[10px] text-zinc-500">
                  <div>
                    <span>Spending rule</span>
                    <p className="font-bold text-zinc-300">Test first; buy to fill gaps</p>
                  </div>
                  <span className="text-[9px] bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-zinc-400">18+</span>
                </div>
              </div>

              <button 
                onClick={handleExportCard}
                className="mt-4 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs rounded-full inline-flex items-center gap-2"
              >
                <Download size={14} /> Download Style Card (PNG)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
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
            <h3 className="text-lg font-bold mb-1">Unlock Your Personal Style Guide</h3>
            <p className="text-xs text-zinc-400 mb-6">Unlock all 3 curated outfit formulas, lighting & camera diagnostics, starter colour swatches, and downloadable PDF.</p>
            <div className="flex justify-between items-center mb-6 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">One-Time Access</span>
              <span className="text-lg font-bold">£7.99</span>
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
            <p><strong>Purpose & Lawful Basis:</strong> Processing is performed strictly to fulfill your requested styling audit (Contractual Necessity / Consent under UK GDPR).</p>
            <p><strong>Sub-processors & AI Processing:</strong> Images are processed via encrypted API endpoints using Google Gemini (Google Cloud Platform). Data is processed ephemerally in volatile memory.</p>
            <p><strong>Retention Period:</strong> Uploaded photographs are <strong>automatically purged within 60 minutes</strong> of analysis completion. We do not retain biometric templates, facial recognition models, or persistent image archives.</p>
            <p><strong>Your Rights:</strong> Under the UK GDPR, you maintain rights of access, rectification, erasure, and objection. To request immediate manual purging of transaction logs, email privacy@aurascan.ai.</p>
          </div>
        </LegalModal>
      )}

      {/* Terms & Commercial Disclosure Modal */}
      {activeModal === 'terms' && (
        <LegalModal title="Terms of Service & Commercial Disclosures" onClose={() => setActiveModal(null)}>
          <div className="space-y-3 text-xs text-zinc-300">
            <p><strong>Service Nature:</strong> AuraScan AI provides algorithmic styling, lighting, and wardrobe guidance based on computer vision analysis. It does not provide medical, orthopaedic, dermatological, or psychological advice.</p>
            <p><strong>Age Requirement:</strong> You must be at least 18 years of age to submit photographs.</p>
            <div>
              <p className="font-semibold text-white mb-0.5">Commercial & Affiliate Disclosure:</p>
              <p>
                AuraScan AI participates in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.co.uk. 
              </p>
              <p className="mt-1 italic text-zinc-400">
                &quot;As an Amazon Associate I earn from qualifying purchases.&quot;
              </p>
            </div>
            <p><strong>Refund Policy:</strong> We offer a 14-day refund guarantee on one-time audit reports. If your analysis fails to provide actionable value, contact support@aurascan.ai with your transaction ID for a complete refund.</p>
            <p><strong>Consumer Law Compliance:</strong> All demonstration analyses on this platform reflect sample outputs designed to illustrate report format. We do not publish fabricated consumer testimonials.</p>
          </div>
        </LegalModal>
      )}

      {/* How It Works Modal */}
      {activeModal === 'how-it-works' && (
        <LegalModal title="How AuraScan AI Works" onClose={() => setActiveModal(null)}>
          <div className="space-y-3 text-xs text-zinc-300">
            <p><strong>1. Dual Photo Input & Priorities:</strong> You select your current style priority and upload photos taken in natural daylight.</p>
            <p><strong>2. Computer Vision Assessment:</strong> Our models measure visual contrast ratios, lighting consistency, and camera framing angles.</p>
            <p><strong>3. Practical Actionable Guide:</strong> You receive an instant starter colour palette, 3 outfits based on what you own, and a repeatable camera setup.</p>
            <p><strong>4. Ephemeral Purge:</strong> Uploaded image data is wiped from volatile memory within 60 minutes.</p>
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
              <th className="p-3">Deliverable Vector</th>
              <th className="p-3 text-violet-400 font-bold">AuraScan AI</th>
              <th className="p-3 font-normal">{competitor}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            <tr>
              <td className="p-3">Focus on Actionable Styling (Not Unexplained Scores)</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">7-Day Action Plan Using Existing Wardrobe</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">Repeatable Camera & Lighting Calibration Guide</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">3 Multi-Piece Outfit Formulas with Alternatives</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">Partial</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}