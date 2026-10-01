import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Personal Styling & Profile Photo Advice | AuraScan AI',
  description: 'Upload two photos for personalised colour, outfit and profile-photo advice. Get a free preview, then unlock your full action guide for £7.99.',
  metadataBase: new URL('https://aurascan-ai-six.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AI Personal Styling & Profile Photo Advice | AuraScan AI',
    description: 'Upload two photos for personalised colour, outfit and profile-photo advice. Get a free preview, then unlock your full action guide for £7.99.',
    url: 'https://aurascan-ai-six.vercel.app',
    siteName: 'AuraScan AI',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Personal Styling & Profile Photo Advice | AuraScan AI',
    description: 'Upload two photos for personalised colour, outfit and profile-photo advice. Get a free preview, then unlock your full action guide for £7.99.',
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