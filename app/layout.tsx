import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.xarticle.news'),
  title: "Xarticle - Curated Articles from X (Twitter)",
  description: "The smartest way to read long-form content from X. AI-powered summaries of the best articles on tech, business, crypto, and culture. Fast search, zero noise.",
  keywords: [
    'X articles',
    'Twitter long-form',
    'Articles on X',
    'X article summaries',
    'AI article summaries',
    'Twitter content summaries',
    'X insights fast',
    'AI-powered reading',
    'noise-free reading',
    'curated X content',
    'best Twitter threads',
    'X article directory',
    'Twitter article search',
    'how to read X articles efficiently',
    'summarized Twitter content',
    'X creators directory'
  ],
  alternates: {
    canonical: 'https://www.xarticle.news/',
    // x-default indicates this is the default URL for all language versions
    // since we use client-side language switching on the same URL
    languages: {
      'x-default': 'https://www.xarticle.news/',
      'en': 'https://www.xarticle.news/',
    }
  },
  authors: [{ name: 'Xarticle' }],
  creator: 'Xarticle',
  publisher: 'Xarticle',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    apple: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.xarticle.news',
    siteName: 'Xarticle',
    title: 'Xarticle - Curated Articles from X (Twitter)',
    description: 'The smartest way to read long-form content from X. AI-powered summaries of the best articles on tech, business, crypto, and culture. Fast search, zero noise.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xarticle_news',
    creator: '@xarticle_news',
    title: 'Xarticle - Curated Articles from X (Twitter)',
    description: 'The smartest way to read long-form content from X. AI-powered summaries of the best articles on tech, business, crypto, and culture. Fast search, zero noise.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Xarticle",
    "url": "https://www.xarticle.news/"
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pskhqphqikghdyqmgsud.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pbs.twimg.com" />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <ErrorBoundary>
          <ThemeProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
