import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuraScan AI – AI Appearance, Styling & Colour Analysis',
  description:
    'Upload two photos to receive an instant, objective AI-assisted analysis of your color season, facial harmony, and visual posture presentation.',
  keywords: [
    'color analysis AI',
    'seasonal color palette',
    'face symmetry score',
    'posture presentation analysis',
    'dating profile photo audit'
  ],
  authors: [{ name: 'AuraScan AI' }],
  metadataBase: new URL('https://aurascan-ai-six.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AuraScan AI – Visual Appearance & Seasonal Colour Audit',
    description: 'Instant AI audit of your wardrobe color palette, facial harmony, and posture presentation.',
    url: 'https://aurascan-ai-six.vercel.app',
    siteName: 'AuraScan AI',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuraScan AI – AI Appearance Audit',
    description: 'Upload two photos for an immediate visual appearance and seasonal color audit.',
  },
  robots: {
    index: true,
    follow: true,
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
      </body>
    </html>
  );
}