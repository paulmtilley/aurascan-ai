import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Check, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AuraScan AI vs Face Rating Apps | Actionable Styling vs Arbitrary Scores',
  description: 'Why arbitrary 1–10 beauty scores fail, and how AuraScan AI provides testable lighting, wardrobe, and camera guidance instead.',
};

export default function VsFaceRatersPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans selection:bg-violet-500/30">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
            <Sparkles className="text-violet-500" size={22} /> AuraScan AI
          </Link>
          <Link
            href="/"
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-full transition-colors"
          >
            Get Free Preview
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 w-full flex-1">
        <Link
          href="/"
          className="text-xs text-violet-400 hover:underline mb-6 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to Style Guide
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
          AuraScan AI vs Appearance & Face Raters
        </h1>

        <p className="text-sm text-zinc-300 leading-relaxed mb-8">
          Assigning an arbitrary beauty score between 1 and 10 provides zero practical utility. AuraScan AI focuses on controllable, testable photographic factors: lighting direction, background separation, and wardrobe color contrast.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-10 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
              <tr>
                <th className="p-3.5">Deliverable</th>
                <th className="p-3.5 text-violet-400 font-bold">AuraScan AI</th>
                <th className="p-3.5 font-normal text-zinc-400">Face Rating Apps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              <tr>
                <td className="p-3.5">Actionable Advice (Not Unexplained Scores)</td>
                <td className="p-3.5 text-emerald-400 font-bold"><Check size={16} /></td>
                <td className="p-3.5 text-zinc-500"><X size={16} /></td>
              </tr>
              <tr>
                <td className="p-3.5">Lighting & Camera Perspective Calibration</td>
                <td className="p-3.5 text-emerald-400 font-bold"><Check size={16} /></td>
                <td className="p-3.5 text-zinc-500"><X size={16} /></td>
              </tr>
              <tr>
                <td className="p-3.5">Wardrobe Formulas from Existing Clothes</td>
                <td className="p-3.5 text-emerald-400 font-bold"><Check size={16} /></td>
                <td className="p-3.5 text-zinc-500"><X size={16} /></td>
              </tr>
              <tr>
                <td className="p-3.5">Starter Colour Palette with Usage Guidance</td>
                <td className="p-3.5 text-emerald-400 font-bold"><Check size={16} /></td>
                <td className="p-3.5 text-zinc-500"><X size={16} /></td>
              </tr>
              <tr>
                <td className="p-3.5">7-Day Testing Protocol Before Buying Clothes</td>
                <td className="p-3.5 text-emerald-400 font-bold"><Check size={16} /></td>
                <td className="p-3.5 text-zinc-500"><X size={16} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Ready to test your lighting and colours?</h2>
          <p className="text-xs text-zinc-400 mb-5 max-w-md mx-auto">
            Upload a portrait and a standing photo to receive an instant free diagnostic and a testable action plan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xs transition-colors shadow-lg shadow-violet-900/30"
          >
            Start Free Diagnostic <Sparkles size={14} />
          </Link>
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-xs text-zinc-500 text-center">
        AuraScan AI · Operated by PT Digital Consulting (UK)
      </footer>
    </div>
  );
}