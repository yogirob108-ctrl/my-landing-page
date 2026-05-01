import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.8lakestours.com"),
  title: "8 Lakes Tours | Nomadic Horse Trekking in Mongolia",
  description: "9-day horse trekking expedition through Mongolia's Eight Lakes region. Ride with a nomadic family, sleep in traditional gers, and experience the real Mongolian steppe.",
  keywords: [
    "Mongolia horse trekking",
    "Naiman Nuur tour",
    "Eight Lakes Mongolia",
    "Orkhon Valley travel",
    "nomadic experience Mongolia",
    "horse riding Mongolia",
    "Mongolia adventure travel",
    "ethical tourism Mongolia",
    "Mongolian nomad homestay",
    "Mongolia cultural tour",
    "horseback riding Mongolia",
    "Mongolia wilderness trek",
    "Uvurkhangai Mongolia tour",
    "Mongolia sustainable travel",
    "authentic Mongolia travel",
    "Mongolia steppe expedition",
    "nomadic horse trek",
    "Mongolia family tour",
  ],
  alternates: {
    canonical: "https://www.8lakestours.com",
  },
  openGraph: {
    title: "8 Lakes Tours | Nomadic Horse Trekking in Mongolia",
    description: "Ride through the Naiman Nuur region and Orkhon Valley on a 9-day immersive journey hosted by a Mongolian nomadic family. Ethical, authentic, unforgettable.",
    type: "website",
    locale: "en_US",
    url: "https://www.8lakestours.com",
    siteName: "8 Lakes Tours",
    images: [
      {
        url: "/images/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Horseback riding through the Mongolian steppe — 8 Lakes Tours",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "8 Lakes Tours | Nomadic Horse Trekking in Mongolia",
    description: "9-day horse trekking expedition through Mongolia's Eight Lakes region. Stay with a nomadic family, ride the steppe, experience real Mongolian life.",
    images: ["/images/hero.jpg"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "k5qDX-okMY6hJL4MNVs5Pv0ZkTIPI-uWg9bl-TigS4o",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-E9PW7T08LZ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-E9PW7T08LZ');
        `}</Script>
        <Script src="https://js.stripe.com/v3/buy-button.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
