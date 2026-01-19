import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { WebVitals } from "@/components/web-vitals";
import { CookieConsent } from "@/components/cookie-consent";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-inter",
  preload: true,
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
    "url": "https://www.xarticle.news/",
    "description": "Curated articles from X (Twitter) with AI-powered summaries",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.xarticle.news/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Xarticle",
      "url": "https://www.xarticle.news",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.xarticle.news/og-image.webp",
        "width": 1200,
        "height": 630
      },
      "sameAs": [
        "https://twitter.com/xarticle_news"
      ]
    }
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical external domains for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pbs.twimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pskhqphqikghdyqmgsud.supabase.co" crossOrigin="anonymous" />
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
        {/* Defer non-critical scripts */}
        <WebVitals />
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
        {/* Google Analytics - loaded after page is idle */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2TMVNWYFES"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2TMVNWYFES');
          `}
        </Script>
      </body>
    </html>
  );
}
