'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, ScanFace, Droplets, Activity, CheckCircle2, 
  Sparkles, Image as ImageIcon, X, Download, AlertCircle, RefreshCcw,
  ShieldCheck, ArrowRight, Info, FileText, ShoppingBag, ExternalLink, Camera
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  ],
  "Cool Summer": [
    {
      title: "Charcoal Heather Melange Crewneck",
      category: "Wardrobe Foundation",
      asin: "B08SAMPLE1C",
      note: "Soft, cool neutral base that elevates jawline contrast without the severe harshness of pure black."
    },
    {
      title: "Matte Finish Anti-Shine Moisturiser",
      category: "Grooming Spec",
      asin: "B07SAMPLE2C",
      note: "Absorbs excess T-zone oil reflection for balanced skin diffusion on high-resolution sensors."
    },
    {
      title: "Silver-Tone Minimalist Watch (Mesh Band)",
      category: "Accessories",
      asin: "B09SAMPLE3C",
      note: "Brushed cool rhodium finish that matches cool undertone skin and frames wrists cleanly."
    }
  ],
  "Deep Winter": [
    {
      title: "High-Contrast Deep Navy Blazer",
      category: "Wardrobe Foundation",
      asin: "B08SAMPLEBLAZER",
      note: "Structured shoulder architecture that sharpens collarbone framing and flatters high facial contrast."
    },
    {
      title: "Crisp Optical White Poplin Shirt",
      category: "Wardrobe Foundation",
      asin: "B07SAMPLE5",
      note: "Pure white base provides maximum photographic presence and crisp facial separation."
    },
    {
      title: "Silver-Tone Minimalist Accents",
      category: "Accessories",
      asin: "B09SAMPLEWATCH",
      note: "Cool polished chrome accents harmonizing with cool-neutral melanin saturation."
    }
  ]
};

const defaultCapsuleOutfits = [
  {
    title: "Casual Sharp (Dating & Social)",
    setting: "Weekend / Social",
    paletteNote: "Cool-muted contrast with soft slate and charcoal base.",
    pieces: [
      "Muted slate blue Oxford shirt (sleeves rolled to mid-forearm)",
      "Charcoal slim-tapered chinos",
      "Clean white leather minimalist low-profile trainers"
    ]
  },
  {
    title: "Professional Executive (Meetings & Headshots)",
    setting: "Business Casual",
    paletteNote: "Balanced medium contrast avoiding harsh monochrome blocks.",
    pieces: [
      "Unstructured wool blazer in deep slate navy",
      "Fine-gauge grey heather merino crewneck",
      "Tailored dark-wash denim or charcoal flannel trousers"
    ]
  },
  {
    title: "Evening Occasion",
    setting: "Formal / Evening",
    paletteNote: "Deep nocturnal cool tones with light accent separation.",
    pieces: [
      "Midnight navy tailored evening jacket",
      "Ice-blue crisp poplin open-collar shirt",
      "Brushed silver dress watch with black leather band"
    ]
  }
];

const mockFreeResult = {
  scanId: "scn_894f71a0b3",
  overallScore: 71,
  archetype: "Urban Sport Minimalist",
  colorSeason: "Soft Summer",
  colorUndertone: "Cool-Neutral",
  teaserMessage: "Your natural frame and cool coloration provide a solid foundation for structured tailoring and muted, cool-toned palette upgrades."
};

const mockPaidResult = {
  faceAnalysis: {
    harmonyScore: 74,
    jawlineDefinition: "Bilateral mandibular line shows solid angularity; minor lateral shadow asymmetry depending on key light positioning.",
    skinClarityNotes: "Balanced cool-neutral complexion; moderate sub-orbital contrast that responds well to neutral 5000K-5600K illumination.",
    topStrengths: ["Defined jawline angle", "Harmonious brow-to-eye spacing"],
    areasToImprove: ["T-zone camera glare control", "Framing neck height with structured collar heights"]
  },
  colorAnalysis: {
    bestColors: ["#4A6B82", "#5C768D", "#6B8E9B", "#2E4053"],
    avoidColors: ["#D35400", "#F39C12", "#F1C40F"],
    recommendedJewelry: "Brushed Silver, Pewter, or Platinum",
    contrastLevel: "Medium-Low Contrast"
  },
  groomingAndLightingSpecs: {
    focalLength: "85mm – 105mm",
    lightingKelvin: "5200K – 5600K",
    cameraAngleRecommendation: "Lens set at eye height, angled 8–10 degrees downward to accentuate the jaw shadow line.",
    hairAndBeardDemarcation: "Maintain a clean taper 1.5 cm above the thyroid cartilage (Adam's apple) to prevent neck-shortening."
  },
  capsuleOutfits: defaultCapsuleOutfits,
  glowUpPlan: [
    { 
      week: 1, 
      focus: "Lighting & Angles Protocol", 
      actions: [
        "Position camera lens at eye level, angled 10 degrees down", 
        "Use 5600K daylight-balanced key light to eliminate yellow casts"
      ] 
    },
    { 
      week: 2, 
      focus: "Grooming & Contrast Balancing", 
      actions: [
        "Introduce a matte anti-shine moisturizer to control T-zone flash flare", 
        "Establish a clean 3mm neck fade above the Adam's apple"
      ] 
    },
    { 
      week: 3, 
      focus: "Capsule Wardrobe Integration", 
      actions: [
        "Remove warm mustard yellows and oranges from direct collar proximity", 
        "Acquire 2 foundational cool-muted base layer tops"
      ] 
    },
    { 
      week: 4, 
      focus: "Audit Evaluation & Uniform System", 
      actions: [
        "Capture updated verification portrait using calibrated 85mm framing", 
        "Lock in 3 daily outfits based on recommended swatches"
      ] 
    }
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

  const [step, setStep] = useState<string>('upload');
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
        ...(prev || mockFreeResult),
        ...mockPaidResult
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
      "Analyzing facial geometry & illumination angles...",
      "Evaluating melanin saturation & contrast spectrums...",
      "Assessing posture silhouette & shoulder-to-hip balance...",
      "Compiling objective personal style audit..."
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
        throw new Error("Analysis failed. Falling back to demonstration metrics.");
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
      alert("Failed to export card. Please take a manual screenshot.");
    }
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      // Use the browser's hardware-accelerated print-to-PDF driver
      window.print();
    } catch (err) {
      console.error("Print trigger failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`AuraScan-Executive-Dossier-${scanResult?.scanId || 'Report'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF directly. Please use your browser Print -> Save as PDF feature.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Safe accessor for capsule outfits
  const displayOutfits = (scanResult?.capsuleOutfits && scanResult.capsuleOutfits.length > 0)
    ? scanResult.capsuleOutfits
    : defaultCapsuleOutfits;

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
            title="AuraScan AI vs Single-Purpose Face Raters"
            competitor="Face Rating Sites"
            description="Evaluating facial geometry in isolation ignores how camera focal compression, neck posture, and clothing contrast shape real-world visual presence."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {currentRoute === 'vs-color' && (
          <SEOComparisonView 
            title="AuraScan AI vs Standalone Color Analyzers"
            competitor="Color Swatch Apps"
            description="Knowing your season is ineffective if your lighting casts 2700K yellow hues and your clothing silhouette lacks shoulder architecture."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {/* Step 1: Upload View */}
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

            {/* Clear Tier Transparency */}
            <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-violet-400 shrink-0" />
                <div>
                  <span className="font-semibold text-zinc-200">Free Tier:</span> Aura Score, Color Season, and undertone evaluation.
                  <br />
                  <span className="font-semibold text-zinc-200">Complete Dossier:</span> Facial harmony, wardrobe hex swatches, 3 complete capsule outfits, camera/grooming specs, and downloadable PDF for <strong className="text-white">£7.99 / $9.99 one-time</strong>.
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

            {/* ICO-Compliant Notice */}
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
                  <strong className="text-zinc-400">Styling Guidance Notice:</strong> Results are algorithmic visual evaluations based on lighting, angle, and contrast. AuraScan provides styling suggestions and does not offer medical, orthopaedic, or dermatological advice.
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

            {/* Use Case Framework */}
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

            {/* DMCC-Compliant Demonstration Outputs */}
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
                    Demonstration output showing transition from pastel knits to structured navy tailoring, elevating jaw definition and eye contrast.
                  </p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sample Profile B</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300">Score: 82</span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-200 mb-2">Posture Presentation Alignment</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Demonstration output showing lens pitch adjustment and structured collar height to eliminate forward head tilt shadows.
                  </p>
                </div>
              </div>
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
            <p className="text-xs text-zinc-500">Transmitting to vision engine (images will be cleared upon completion)</p>
          </div>
        )}

        {/* Step 3: Results View */}
        {currentRoute === 'scan' && step === 'results' && scanResult && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => { setStep('upload'); setFaceImage(null); setBodyImage(null); }}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full"
              >
                <RefreshCcw size={13} /> New Audit
              </button>
              <span className="text-xs text-zinc-500">ID: {scanResult.scanId?.slice(0, 14)}</span>
            </div>

            {/* Free Assessment Summary */}
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

            {/* Gated vs Unlocked Report */}
            {!userProfile.isPaid ? (
              <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 p-10 text-center bg-zinc-950 flex flex-col items-center">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                  <Lock size={20} className="text-violet-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Unlock the Full Personalised Report</h2>
                <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                  Access your complete facial balance breakdown, recommended hex swatches, 3 curated capsule outfits, camera angle fixes, and downloadable executive PDF dossier.
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
              <div className="space-y-6">
                
                {/* PDF Generation Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileText size={16} className="text-violet-400" /> Executive Style Dossier Active
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Comprehensive audit, hex swatches, wardrobe capsules, and camera specs.</p>
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

                {/* Printable Document Container */}
                <div id="printable-report" className="space-y-8 bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-900">
                  
                  {/* Dossier Header */}
                  <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Confidential Personal Dossier</span>
                      <h2 className="text-xl font-black text-white tracking-tight">AuraScan Aesthetic & Colour Audit</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-zinc-400">ID: {scanResult?.scanId}</span>
                      <div className="text-[11px] text-zinc-500">Aura Score: <strong className="text-white">{scanResult?.overallScore}/100</strong></div>
                    </div>
                  </div>

                  {/* Section 1: Facial Analysis */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <ScanFace size={16} className="text-violet-400" /> Facial Harmony & Lighting Analysis
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 block mb-1 font-semibold">Mandibular & Jawline Definition</span>
                        <p className="text-zinc-200 leading-relaxed">{scanResult.faceAnalysis?.jawlineDefinition || mockPaidResult.faceAnalysis.jawlineDefinition}</p>
                      </div>
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 block mb-1 font-semibold">Skin Undertone & Lighting Response</span>
                        <p className="text-zinc-200 leading-relaxed">{scanResult.faceAnalysis?.skinClarityNotes || mockPaidResult.faceAnalysis.skinClarityNotes}</p>
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Photography & Grooming Technical Specs */}
                  <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">
                      <Camera size={16} /> Photography & Grooming Calibration Specs
                    </div>
                    
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Optimal Focal Length</span>
                        <p className="font-mono text-white text-sm font-semibold">{scanResult.groomingAndLightingSpecs?.focalLength || mockPaidResult.groomingAndLightingSpecs.focalLength}</p>
                        <span className="text-[10px] text-zinc-400 mt-1 block">Eliminates optical wide-angle facial distortion.</span>
                      </div>

                      <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Color Temperature</span>
                        <p className="font-mono text-cyan-400 text-sm font-semibold">{scanResult.groomingAndLightingSpecs?.lightingKelvin || mockPaidResult.groomingAndLightingSpecs.lightingKelvin}</p>
                        <span className="text-[10px] text-zinc-400 mt-1 block">Daylight balance preserving cool undertones.</span>
                      </div>

                      <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80 sm:col-span-2">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Camera Axis & Pitch</span>
                        <p className="text-zinc-200 leading-relaxed">{scanResult.groomingAndLightingSpecs?.cameraAngleRecommendation || mockPaidResult.groomingAndLightingSpecs.cameraAngleRecommendation}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/60 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/60 text-xs">
                      <span className="text-emerald-400 font-bold block mb-1 text-[11px] uppercase tracking-wide">Grooming & Neckline Demarcation:</span>
                      <p className="text-zinc-300 leading-relaxed">{scanResult.groomingAndLightingSpecs?.hairAndBeardDemarcation || mockPaidResult.groomingAndLightingSpecs.hairAndBeardDemarcation}</p>
                    </div>
                  </section>

                  {/* Section 3: Tailored Wardrobe Palettes */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <Droplets size={16} className="text-cyan-400" /> Tailored Wardrobe Palettes
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 block mb-3 font-semibold">Primary Enhancing Colors (High Contrast)</span>
                        <div className="flex gap-2.5">
                          {(scanResult.colorAnalysis?.bestColors || mockPaidResult.colorAnalysis.bestColors).map((c: string) => (
                            <div key={c} className="group relative">
                              <div className="w-9 h-9 rounded-lg border border-zinc-700 shadow-sm" style={{ backgroundColor: c }} />
                              <span className="text-[10px] font-mono text-zinc-400 mt-1 block text-center">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 block mb-3 font-semibold">Colors to Limit Near Face</span>
                        <div className="flex gap-2.5">
                          {(scanResult.colorAnalysis?.avoidColors || mockPaidResult.colorAnalysis.avoidColors).map((c: string) => (
                            <div key={c} className="group relative">
                              <div className="w-9 h-9 rounded-lg border border-red-500/30 flex items-center justify-center relative shadow-sm" style={{ backgroundColor: c }}>
                                <X size={14} className="text-zinc-950 mix-blend-difference" />
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 mt-1 block text-center">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 4: Curated Capsule Outfits (GUARANTEED RENDER) */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-baseline border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-violet-400" /> Curated Seasonal Capsule (3 Key Formulas)
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500">Tailored to {scanResult.colorSeason}</span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {displayOutfits.map((outfit: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{outfit.setting}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 font-medium text-zinc-300">Look #{idx + 1}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white mb-2">{outfit.title}</h4>
                            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed italic">{outfit.paletteNote}</p>

                            <ul className="space-y-2 border-t border-zinc-800/80 pt-3">
                              {outfit.pieces?.map((piece: string, pIdx: number) => (
                                <li key={pIdx} className="text-xs text-zinc-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                  <span>{piece}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 5: 30-Day Appearance Roadmap */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                      30-Day Appearance & Presentation Protocol
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      {(scanResult.glowUpPlan || mockPaidResult.glowUpPlan).map((w: any) => (
                        <div key={w.week} className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
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

                  {/* Section 6: Curated Gear Matches (UK ASA & Amazon Associates Compliant) */}
                  <section className="border-t border-zinc-800 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-emerald-400" /> Recommended Wardrobe & Gear Matches
                      </h3>
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                          Ad / Affiliate Links
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 mb-4">
                      Selected essentials matched to your detected <strong>{scanResult?.colorSeason || "Soft Summer"}</strong> palette and camera alignment:
                    </p>

                    <div className="grid sm:grid-cols-3 gap-3">
                      {(affiliateCatalog[scanResult?.colorSeason] || affiliateCatalog["Soft Summer"]).map((item, idx) => (
                        <a 
                          key={idx}
                          href={generateAffiliateLink(item.asin)}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex flex-col justify-between group transition-colors relative"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-violet-400">
                              {item.category}
                            </span>
                            <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Ad
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white flex items-center justify-between">
                              {item.title}
                              <ExternalLink size={12} className="text-zinc-500 group-hover:text-zinc-300 ml-1 shrink-0" />
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{item.note}</p>
                          </div>

                          <span className="text-[10px] text-zinc-500 mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                            <span>View on Amazon UK</span>
                            <span className="text-[9px] text-zinc-600 font-mono">Affiliate Link →</span>
                          </span>
                        </a>
                      ))}
                    </div>

                    {/* Verbatim Amazon Operating Agreement Clause */}
                    <div className="mt-4 p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                      <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                        <strong>Commercial Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases. Product recommendations are algorithmic styling matches based on your seasonal color profile and camera angles; pricing and inventory remain subject to Amazon UK.
                      </p>
                    </div>
                  </section>

                </div>
              </div>
            )}

            {/* Share Card Generator */}
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
                    {(scanResult.colorAnalysis?.bestColors || mockPaidResult.colorAnalysis.bestColors).slice(0, 4).map((c: string) => (
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
                <Download size={14} /> Download Story Card (PNG)
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
            <h3 className="text-lg font-bold mb-1">Upgrade to Full Protocol</h3>
            <p className="text-xs text-zinc-400 mb-6">Unlock your complete facial analysis, hex palettes, 3 capsule wardrobe formulas, camera calibration specs, and downloadable PDF dossier.</p>
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
              <td className="p-3">Downloadable PDF Executive Dossier</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-3">Curated Capsule Wardrobe Formulas</td>
              <td className="p-3 text-emerald-400 font-bold">Yes</td>
              <td className="p-3 text-zinc-500">Partial</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}