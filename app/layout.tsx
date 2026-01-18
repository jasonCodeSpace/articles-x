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

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.xarticle.news'),
  title: "Xarticle - Curated Articles from X (Twitter)",
  description: "Discover trending discussions, insights, and curated content from top voices on X (Twitter). Read daily summaries of the most engaging articles.",
  keywords: ['articles', 'news', 'twitter', 'x', 'social media', 'content', 'curated', 'trending', 'discussions'],
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
    description: 'Discover trending discussions, insights, and curated content from top voices on X (Twitter). Read daily summaries of the most engaging articles.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xarticle_news',
    creator: '@xarticle_news',
    title: 'Xarticle - Curated Articles from X (Twitter)',
    description: 'Discover trending discussions, insights, and curated content from top voices on X (Twitter). Read daily summaries of the most engaging articles.',
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
        "url": "https://www.xarticle.news/og-image.png",
        "width": 1200,
        "height": 630
      },
      "sameAs": [
        "https://twitter.com/xarticle_news"
      ]
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pbs.twimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />

        {/* DNS prefetch for additional domains */}
        <link rel="dns-prefetch" href="//pbs.twimg.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Google Analytics - delayed for performance */}
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

        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <WebVitals />
        <CookieConsent />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
