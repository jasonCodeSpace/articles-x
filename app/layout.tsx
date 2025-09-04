import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { WebVitals } from "@/components/web-vitals";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.xarticle.news'),
  title: "Articles X",
  description: "A modern article platform for discovering and reading curated content from X (Twitter)",
  keywords: ['articles', 'news', 'twitter', 'x', 'social media', 'content'],
  authors: [{ name: 'Articles X' }],
  creator: 'Articles X',
  publisher: 'Articles X',
  icons: {
    icon: [
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/logo.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.xarticle.news',
    siteName: 'Articles X',
    title: 'Articles X - Modern Article Platform',
    description: 'A modern article platform for discovering and reading curated content from X (Twitter)',
    images: [
       {
         url: '/og-image.svg',
         width: 1200,
         height: 630,
         alt: 'Articles X - Modern Article Platform',
       },
     ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xarticle_news',
    creator: '@xarticle_news',
    title: 'Articles X - Modern Article Platform',
    description: 'A modern article platform for discovering and reading curated content from X (Twitter)',
    images: ['/og-image.svg'],
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Xarticle",
    "url": "https://www.xarticle.news/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.xarticle.news/search?q={query}",
      "query-input": "required name=query"
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
