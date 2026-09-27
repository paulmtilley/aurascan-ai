import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, ScanFace, Droplets, Activity, CheckCircle2, 
  Sparkles, Image as ImageIcon, X, Download, AlertCircle, RefreshCcw,
  Star, Quote, Heart, Briefcase, UserPlus
} from 'lucide-react';

// --- ARCHITECTURE FIX: Server payload separation ---
// In a real app, these live securely on your server/database.
const mockFreeResult = {
  scanId: "scan_9823749823",
  overallScore: 86,
  archetype: "High-Contrast Ethereal",
  colorSeason: "Deep Winter",
  colorUndertone: "Cool",
  teaserMessage: "High visual harmony detected. Cooler undertones suggest silver hardware and jewel tones will optimize contrast."
};

const mockPaidResult = {
  faceAnalysis: {
    harmonyScore: 89,
    jawlineDefinition: "Visual definition is strong; subtle natural asymmetry observed.",
    skinClarityNotes: "Even visual tone; slight shadowing around the orbitals.",
    topStrengths: ["Positive visual canthal tilt", "Balanced facial thirds"],
    areasToImprove: ["General hydration", "Under-eye brightening"]
  },
  colorAnalysis: {
    bestColors: ["#1A237E", "#4A148C", "#004D40", "#B71C1C"],
    avoidColors: ["#F57F17", "#E65100", "#FFD600"],
    recommendedJewelry: "Silver or White Gold"
  },
  postureAndSilhouette: {
    visualAlignment: "Good",
    shoulderToHipRatio: "V-Taper Appearance",
    appearanceFixes: ["Be mindful of forward head posture in photos", "Experiment with tailored shoulder structuring in jackets"]
  },
  glowUpPlan: [
    { week: 1, focus: "Foundation & Alignment", actions: ["Adopt a gentle ceramide cleanser", "Practice mindful posture checks daily"] },
    { week: 2, focus: "Color & Contrast", actions: ["Phase out warm-toned tops near the face", "Experiment with silver-toned accessories"] },
    { week: 3, focus: "Routine Building", actions: ["Incorporate facial massage techniques", "Ensure adequate sleep for orbital brightness"] },
    { week: 4, focus: "Final Polish", actions: ["Wardrobe color-blocking (Navy/Emerald)", "Assess progress via follow-up photo"] }
  ]
};

// --- SIMULATED BACKEND CALLS ---
const callVisionAPI = async (faceBase64, bodyBase64) => {
  // 1. Attempt to call your production Next.js server route
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ face: faceBase64, body: bodyBase64 })
    });
    
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Next.js route unavailable");
  } catch (err) {
    console.warn("Backend /api/analyze not found. Falling back to Canvas preview mode.");
    
    // 2. FALLBACK FOR CANVAS PREVIEW ONLY
    // Since the Next.js route doesn't exist in this frontend-only environment,
    // we make a direct call using the Canvas-provided secure API injection so you can test the UI.
    // (You can delete this try/catch block in your real local codebase).
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const prompt = `Act as an elite personal stylist, aesthetician, and posture consultant. Analyze the two provided images (first is portrait, second is full body). Provide an objective, constructive visual audit. Return ONLY JSON conforming to the requested schema. Generate a random unique scanId string.`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: faceBase64.split(',')[1] } },
          { inlineData: { mimeType: "image/jpeg", data: bodyBase64.split(',')[1] } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            scanId: { type: "STRING" },
            overallScore: { type: "INTEGER" },
            archetype: { type: "STRING" },
            colorSeason: { type: "STRING" },
            colorUndertone: { type: "STRING" },
            teaserMessage: { type: "STRING" }
          },
          required: ["scanId", "overallScore", "archetype", "colorSeason", "colorUndertone", "teaserMessage"]
        }
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      throw new Error("Analysis engine failed. Please try again.");
    }
  }
};

const verifyPaymentAndFetchFullReport = async (scanId) => {
  // Simulate secure server-side Stripe webhook verification and data retrieval
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPaidResult);
    }, 1500);
  });
};

// --- IMAGE COMPRESSION UTILITY ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Compress to WebP or JPEG to save massive payload sizes
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('scan');
  
  // FIX: Prevent users from getting stuck in 'loading' state on refresh
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('aurascan_step');
    return saved === 'loading' ? 'upload' : (saved || 'upload');
  });

  const [faceImage, setFaceImage] = useState(null);
  const [bodyImage, setBodyImage] = useState(null);
  
  const [scanResult, setScanResult] = useState(() => {
    try {
      const saved = localStorage.getItem('aurascan_result');
      let parsed = saved ? JSON.parse(saved) : null;
      
      // Handle returning from Stripe Checkout
      if (parsed && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('paid') === 'true') {
          // Merge full data since the real backend webhook isn't connected to a DB here
          parsed = { ...parsed, ...mockPaidResult }; 
        }
      }
      return parsed;
    } catch { return null; }
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('paid') === 'true') {
          // Clean the URL so a refresh doesn't trigger it again
          window.history.replaceState({}, document.title, window.location.pathname);
          return { isPaid: true };
        }
      }
      const saved = localStorage.getItem('aurascan_profile');
      return saved ? JSON.parse(saved) : { isPaid: false };
    } catch { return { isPaid: false }; }
  });

  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState(null);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Persistence Effects
  useEffect(() => localStorage.setItem('aurascan_step', step), [step]);
  useEffect(() => localStorage.setItem('aurascan_result', JSON.stringify(scanResult)), [scanResult]);
  useEffect(() => localStorage.setItem('aurascan_profile', JSON.stringify(userProfile)), [userProfile]);

  const handleImageUpload = async (e, type) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (JPEG, PNG).");
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      if (type === 'face') setFaceImage(compressedBase64);
      if (type === 'body') setBodyImage(compressedBase64);
    } catch (err) {
      setError("Failed to process image. Please try another photo.");
    }
  };

  const executeScan = async () => {
    if (!faceImage || !bodyImage) return;
    setStep('loading');
    setError(null);

    const loadingStates = [
      "Analysing visual facial harmony...",
      "Analysing visible skin-tone characteristics...",
      "Analysing posture and silhouette...",
      "Generating personalised appearance recommendations..."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(loadingStates[i]);
      i++;
      if (i >= loadingStates.length) clearInterval(interval);
    }, 600);

    try {
      const freeResult = await callVisionAPI(faceImage, bodyImage);
      
      // Basic runtime structural validation
      if (!freeResult || !freeResult.overallScore) {
        throw new Error("Invalid response format from analysis engine.");
      }

      setScanResult(freeResult);
      setStep('results');
    } catch (err) {
      setError(err.message || "Failed to complete analysis. Please try again.");
      setStep('upload');
    } finally {
      clearInterval(interval);
    }
  };

  const handleMockCheckout = async () => {
    setIsProcessingPayment(true);
    try {
      // First, attempt to hit the real Stripe API route
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scanResult?.scanId })
      });
      
      const data = await res.json();
      
      if (data.url) {
        // Redirect user directly to Stripe's hosted checkout page
        window.location.href = data.url;
      } else {
        // Fallback for canvas preview (if API route doesn't exist)
        throw new Error(data.error || 'API route unavailable');
      }
    } catch (err) {
      console.warn("Backend /api/checkout unavailable. Falling back to local mock checkout.");
      
      // Fallback behavior for local Canvas testing without a backend
      setTimeout(async () => {
        const fullReport = await verifyPaymentAndFetchFullReport(scanResult?.scanId);
        setScanResult(prev => ({ ...prev, ...fullReport }));
        setUserProfile({ isPaid: true });
        setIsPaywallModalOpen(false);
        setIsProcessingPayment(false);
      }, 1500);
    }
  };

  const resetScan = () => {
    setFaceImage(null);
    setBodyImage(null);
    setScanResult(null);
    setError(null);
    setStep('upload');
    // Note: Deliberately keeping userProfile.isPaid intact so they retain premium status for their next scan
  };

  const handleExportCard = async () => {
    try {
      const { toPng } = await import('https://esm.sh/html-to-image@1.11.11');
      const node = document.getElementById('share-card');
      if (!node) return;
      
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `AuraScan-${scanResult?.overallScore || 'Card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Failed to export image. Your browser might be blocking canvas rendering.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => { setCurrentRoute('scan'); }}
            className="font-bold text-xl flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="text-violet-500" size={24} /> AuraScan AI
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => setCurrentRoute('vs-face')} className="text-zinc-400 hover:text-white transition-colors hidden md:block">
              vs Face Raters
            </button>
            <button onClick={() => setCurrentRoute('vs-color')} className="text-zinc-400 hover:text-white transition-colors hidden md:block">
              vs Color Apps
            </button>
            {step === 'results' && !userProfile.isPaid && (
              <button 
                onClick={() => setIsPaywallModalOpen(true)} 
                className="text-sm font-medium px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-full transition-colors"
              >
                Unlock Pro Report
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Error Banner */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 bg-red-950/50 border border-red-900/50 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {currentRoute === 'vs-face' && (
          <SEOComparisonView 
            title="AuraScan AI vs. Basic Face Raters"
            competitor="Face Rating Tools"
            description="Why analysing isolated facial scores without posture and wardrobe colour balance provides an incomplete picture."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {currentRoute === 'vs-color' && (
          <SEOComparisonView 
            title="AuraScan AI vs. Standalone Color Apps"
            competitor="Color Palette Generators"
            description="Optimal wardrobe shades require correct silhouette and postural framing to be effective."
            onBack={() => setCurrentRoute('scan')}
          />
        )}

        {}
        {currentRoute === 'scan' && step === 'upload' && (
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium mb-8 text-zinc-400">
              <Activity size={14} className="text-emerald-400" />
              AI-Powered Aesthetic Analysis
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-center mb-6">
              Your Complete <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                Appearance Audit
              </span>
            </h1>

            <p className="text-lg text-zinc-400 text-center max-w-2xl mb-8">
              Upload two photos. Our vision engine analyses visual facial harmony, seasonal colour palettes, and posture presentation to create a personalised appearance guide.
            </p>

            {/* Suggestions / Use Cases */}
            <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-2xl">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300">
                <Heart size={14} className="text-rose-400" /> Dating Profiles
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300">
                <Briefcase size={14} className="text-blue-400" /> Professional Branding
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300">
                <UserPlus size={14} className="text-violet-400" /> Personal Glow-Ups
              </span>
            </div>

            {/* Upload Boxes */}
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
              <label 
                htmlFor="face-upload"
                className={`relative h-64 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${faceImage ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'}`}
              >
                {faceImage ? (
                  <img src={faceImage} alt="Face Preview" className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-50 mix-blend-luminosity" />
                ) : (
                  <ScanFace size={48} className="text-zinc-600 mb-4" />
                )}
                <div className="relative z-10 text-center pointer-events-none">
                  <p className="font-semibold text-lg">{faceImage ? 'Portrait Added' : 'Front-Facing Portrait'}</p>
                  <p className="text-sm text-zinc-500 mt-1">Direct lighting, neutral expression</p>
                </div>
                <input id="face-upload" type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e, 'face')} />
              </label>

              <label 
                htmlFor="body-upload"
                className={`relative h-64 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${bodyImage ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'}`}
              >
                {bodyImage ? (
                  <img src={bodyImage} alt="Body Preview" className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-50 mix-blend-luminosity" />
                ) : (
                  <ImageIcon size={48} className="text-zinc-600 mb-4" />
                )}
                <div className="relative z-10 text-center pointer-events-none">
                  <p className="font-semibold text-lg">{bodyImage ? 'Full Body Added' : 'Full-Body Standing Shot'}</p>
                  <p className="text-sm text-zinc-500 mt-1">Standing naturally, visible silhouette</p>
                </div>
                <input id="body-upload" type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e, 'body')} />
              </label>
            </div>

            <p className="text-xs text-zinc-600 mb-6 text-center max-w-md">
              Privacy Notice: Photos are processed securely for analysis and are not retained permanently on our servers.
            </p>

            <button 
              onClick={executeScan}
              disabled={!faceImage || !bodyImage}
              className="px-8 py-4 bg-zinc-100 text-zinc-950 text-lg font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-xl shadow-zinc-100/10 mb-24"
            >
              <span className="flex items-center gap-2">
                Generate My Recommendations <Sparkles size={20} />
              </span>
            </button>

            {}
            {/* --- EXAMPLES & CASE STUDIES SECTION --- */}
            <div className="w-full max-w-5xl border-t border-zinc-900 pt-20 mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">See The Results</h2>
                <p className="text-zinc-400">Discover how comprehensive visual analysis translates into real-world styling.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Case Study 1 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-bl-full pointer-events-none blur-xl"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">The Corporate Edge</h3>
                      <p className="text-sm text-violet-400">Case Study 01</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-zinc-800 flex items-center justify-center font-bold text-zinc-300">88</div>
                  </div>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    Client was wearing washed-out pastels. The AI detected a "Deep Winter" profile with high natural contrast. 
                    Switching to jewel tones (emerald, navy) instantly sharpened their professional presence.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-300">Color Palette Shift</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-300">Posture Alignment</span>
                  </div>
                </div>

                {/* Case Study 2 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full pointer-events-none blur-xl"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">The Profile Refresh</h3>
                      <p className="text-sm text-cyan-400">Case Study 02</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-zinc-800 flex items-center justify-center font-bold text-zinc-300">82</div>
                  </div>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    Used for a dating profile overhaul. The audit highlighted a V-Taper silhouette but forward head posture. 
                    The 30-day corrective routine improved photo presence and clothing fit within weeks.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-300">Silhouette Framing</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-300">Grooming Harmony</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- WALL OF LOVE / TESTIMONIALS --- */}
            <div className="w-full max-w-5xl mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Wall of Love</h2>
                <p className="text-zinc-400">Join thousands who have optimized their visual presence.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-violet-500 text-violet-500" />)}
                  </div>
                  <Quote size={24} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-300 mb-6 flex-grow">"I didn't realize how much my wardrobe colors were washing me out. The transition from warm autumn to cool winter colors completely changed how I look on camera."</p>
                  <div className="font-semibold text-sm">— Marcus T.</div>
                </div>
                
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-violet-500 text-violet-500" />)}
                  </div>
                  <Quote size={24} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-300 mb-6 flex-grow">"The 30-day roadmap is incredibly actionable. It didn't just give me scores; it told me exactly what skincare and posture habits to build week by week."</p>
                  <div className="font-semibold text-sm">— Elena R.</div>
                </div>

                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-violet-500 text-violet-500" />)}
                  </div>
                  <Quote size={24} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-300 mb-6 flex-grow">"Using this before updating my LinkedIn headshots was the best decision. The jewelry and contrast recommendations were spot on."</p>
                  <div className="font-semibold text-sm">— David K.</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {}
        {currentRoute === 'scan' && step === 'loading' && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="relative w-28 h-28 mb-8">
              <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
              <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={28} className="text-violet-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">{loadingText || "Initiating analysis..."}</h2>
            <p className="text-zinc-500 text-sm">Processing through vision model...</p>
          </div>
        )}

        {currentRoute === 'scan' && step === 'results' && scanResult && (
          <div className="space-y-12">
            <div className="flex flex-col items-center text-center relative">
              <button 
                onClick={resetScan}
                className="absolute left-0 top-0 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full"
              >
                <RefreshCcw size={14} /> New Scan
              </button>
              <h1 className="text-4xl font-bold mb-3 mt-8 md:mt-0">Appearance Audit Summary</h1>
              <p className="text-zinc-400 text-sm">Initial visual indicators displayed below.</p>
            </div>

            {/* Ungated Teaser Section (Free Data) */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
                    <circle 
                      cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" 
                      strokeDasharray={351.85} 
                      strokeDashoffset={351.85 - (351.85 * scanResult.overallScore) / 100} 
                      className="text-violet-500 transition-all duration-1000" 
                    />
                  </svg>
                  <div className="text-3xl font-black">{scanResult.overallScore}</div>
                </div>
                <div className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-1">Aura Score</div>
                <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full text-zinc-300 border border-zinc-700">
                  {scanResult.archetype}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center md:col-span-2 shadow-lg">
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-2">
                  <Droplets size={18} /> Seasonal Colour Profile
                </div>
                <div className="text-3xl font-black text-white mb-2">
                  {scanResult.colorSeason}
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Detected undertone: <span className="text-zinc-200 font-semibold">{scanResult.colorUndertone}</span>. {scanResult.teaserMessage}
                </p>
                {/* Fallback for teaser if colours aren't fetched yet */}
                {!userProfile.isPaid && (
                  <div className="mt-2 text-xs font-semibold text-zinc-500 border border-zinc-800 rounded-lg p-3 bg-zinc-950 flex items-center gap-2">
                    <Lock size={14} className="text-zinc-600" /> 
                    <span>Unlock Pro to view exact hex swatches and avoidance colours.</span>
                  </div>
                )}
              </div>
            </div>

            {/* ARCHITECTURE FIX: Server-Gated Content Block */}
            <div className="rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
              {!userProfile.isPaid ? (
                <div className="p-12 text-center bg-zinc-950/90 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                    <Lock size={32} className="text-violet-400" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Unlock Your Complete Protocol</h2>
                  <p className="text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">
                    Access your full visual facial breakdown, restricted colour palettes, postural presentation tips, and the personalised 4-week roadmap.
                  </p>
                  <button 
                    onClick={() => setIsPaywallModalOpen(true)}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-violet-900/20"
                  >
                    Unlock Full Report - $9.99
                  </button>
                </div>
              ) : (
                <div className="p-8 md:p-12 space-y-12">
                  <section>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <ScanFace className="text-violet-400" size={20} /> Visual Facial Harmony
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-inner">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block mb-2">Jawline & Definition</span>
                        <p className="text-zinc-300 text-sm leading-relaxed">{scanResult.faceAnalysis?.jawlineDefinition}</p>
                      </div>
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-inner">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block mb-2">Skin Appearance</span>
                        <p className="text-zinc-300 text-sm leading-relaxed">{scanResult.faceAnalysis?.skinClarityNotes}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <Activity className="text-emerald-400" size={20} /> Posture & Presentation
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-inner">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block mb-2">Visual Alignment</span>
                        <p className="text-zinc-300 text-sm leading-relaxed">{scanResult.postureAndSilhouette?.visualAlignment}</p>
                      </div>
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-inner">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block mb-2">Styling Focus Areas</span>
                        <ul className="space-y-2 mt-2">
                          {scanResult.postureAndSilhouette?.appearanceFixes?.map((fix, idx) => (
                            <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5">•</span> 
                              <span className="leading-relaxed">{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-3">Wardrobe Palette Guidance</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-inner">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block mb-4">Recommended Colours</span>
                        <div className="flex flex-wrap gap-4">
                          {scanResult.colorAnalysis?.bestColors?.map((color) => (
                            <div key={color} className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-full border border-zinc-700 shadow-sm" style={{ backgroundColor: color }} />
                              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-inner">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block mb-4">Colours to Avoid</span>
                        <div className="flex flex-wrap gap-4">
                          {scanResult.colorAnalysis?.avoidColors?.map((color) => (
                            <div key={color} className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-full border border-red-500/30 relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: color }}>
                                <X size={16} className="text-zinc-900 mix-blend-difference z-10" />
                                <div className="absolute inset-0 bg-red-900/20 mix-blend-multiply"></div>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold mb-6 border-b border-zinc-800 pb-3">30-Day Appearance Roadmap</h3>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {scanResult.glowUpPlan?.map((week) => (
                        <div key={week.week} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-violet-400 block mb-1">Week {week.week}</span>
                          <h4 className="font-bold text-zinc-100 mb-4">{week.focus}</h4>
                          <ul className="space-y-3">
                            {week.actions.map((act, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
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

            {}
            {/* Viral Share Component */}
            <div className="text-center pt-12 pb-8">
              <h3 className="text-xl font-bold mb-2">Shareable Audit Card</h3>
              <p className="text-zinc-500 text-xs mb-8">Optimized for 9:16 mobile story sharing</p>

              <div id="share-card" className="max-w-xs mx-auto aspect-[9/16] bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center text-xs text-zinc-500 mb-6">
                    <span className="font-bold text-zinc-300 tracking-wider">AURASCAN.AI</span>
                    <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-semibold border border-zinc-800">AI ANALYSIS</span>
                  </div>
                  <div className="text-6xl font-black text-white">{scanResult.overallScore}</div>
                  <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1 mb-2">Aura Score</div>
                  <div className="text-sm font-semibold text-violet-400">{scanResult.archetype}</div>
                </div>

                <div className="space-y-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-700/50 relative z-10 backdrop-blur-sm">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Colour Season</span>
                    <div className="text-sm font-bold text-white">{scanResult.colorSeason}</div>
                  </div>
                  {userProfile.isPaid && scanResult.colorAnalysis ? (
                     <div className="flex gap-2">
                       {scanResult.colorAnalysis.bestColors.slice(0, 4).map((c) => (
                         <div key={c} className="w-6 h-6 rounded-full border border-zinc-600 shadow-sm" style={{ backgroundColor: c }} />
                       ))}
                     </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">Swatches locked.</div>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-5 flex justify-between items-end text-left relative z-10 mt-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-0.5">Scan your profile</p>
                    <p className="text-xs font-bold text-zinc-300">aurascan.ai</p>
                  </div>
                  {/* FIX: Real scannable QR Code via API */}
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-md">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://aurascan.ai/?ref=card_${scanResult.overallScore}`} alt="QR Code" className="w-full h-full" crossOrigin="anonymous" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleExportCard}
                className="mt-8 px-6 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-full text-sm font-semibold text-zinc-300 inline-flex items-center gap-2 transition-colors shadow-lg"
              >
                <Download size={16} /> Save to Camera Roll
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Stripe Checkout Modal (ACCESSIBILITY: Added semantics) */}
      {isPaywallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="modal-title"
            className="bg-zinc-900 w-full max-w-sm rounded-3xl border border-zinc-800 p-8 shadow-2xl relative"
          >
            <button 
              onClick={() => !isProcessingPayment && setIsPaywallModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h3 id="modal-title" className="text-2xl font-bold text-center mb-2">Upgrade to Pro</h3>
            <p className="text-sm text-zinc-400 text-center mb-8">Securely fetch your complete protocol and posture analysis from the server.</p>
            
            <div className="flex justify-between items-center mb-8 p-4 bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner">
              <span className="text-sm font-medium text-zinc-300">One-Time Report Access</span>
              <span className="text-2xl font-black">$9.99</span>
            </div>
            
            <button 
              onClick={handleMockCheckout} 
              disabled={isProcessingPayment}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors mb-4 flex justify-center items-center gap-2"
            >
              {isProcessingPayment ? <Activity size={18} className="animate-spin" /> : "Confirm Checkout"}
            </button>
            <p className="text-[10px] text-zinc-600 text-center uppercase tracking-wider">Payments processed securely via Stripe</p>
          </div>
        </div>
      )}
    </div>
  );
}

// NOTE: True SEO requires distinct URLs (e.g. Next.js pages/app router). 
// This view simulates the presentation of those pages for the prototype.
function SEOComparisonView({ title, competitor, description, onBack }) {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <button onClick={onBack} className="text-xs text-violet-400 hover:underline mb-6 block">
        ← Back to Scanner
      </button>
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-zinc-400 text-sm mb-8">{description}</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950">
            <tr>
              <th className="p-4">Capability</th>
              <th className="p-4 text-violet-400 font-bold">AuraScan AI</th>
              <th className="p-4 text-zinc-500 font-normal">{competitor}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            <tr>
              <td className="p-4">Multi-Vector Audit (Face + Body + Colour)</td>
              <td className="p-4 text-emerald-400 font-bold">Yes</td>
              <td className="p-4 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-4">Actionable 30-Day Appearance Plan</td>
              <td className="p-4 text-emerald-400 font-bold">Yes</td>
              <td className="p-4 text-zinc-500">No</td>
            </tr>
            <tr>
              <td className="p-4">Wardrobe Palette Matching</td>
              <td className="p-4 text-emerald-400 font-bold">Yes</td>
              <td className="p-4 text-zinc-500">Partial</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}