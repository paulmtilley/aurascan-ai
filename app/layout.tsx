import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'AI Personal Styling & Profile Photo Advice | AuraScan AI',
  description: 'Upload two photos for actionable colour, outfit and profile-photo lighting advice. Free initial preview; unlock your complete 6-part guide for £7.99.',
  metadataBase: new URL('https://aurascan-ai-six.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AI Personal Styling & Profile Photo Advice | AuraScan AI',
    description: 'Practical colour palettes, outfit formulas from what you own, and repeatable window lighting setups from two photos.',
    url: 'https://aurascan-ai-six.vercel.app',
    siteName: 'AuraScan AI',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Personal Styling & Profile Photo Advice | AuraScan AI',
    description: 'Get personalised colour, outfit and camera setup advice from two photos. Free preview, then £7.99 for your complete action guide.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-violet-500/30">
        {children}
        <Analytics />
      </body>
    </html>
  );
}