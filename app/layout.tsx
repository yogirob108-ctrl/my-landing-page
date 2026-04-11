import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "8 Lakes Tours | Nomadic Horse Trekking in Mongolia",
  description: "9-day immersive horse trekking expedition through the Naiman Nuur (Eight Lakes) region and Orkhon Valley, Mongolia. Stay with a nomadic host family, ride across the steppe, and experience authentic Mongolian culture. Ethical, community-led travel.",
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
  openGraph: {
    title: "8 Lakes Tours | Nomadic Horse Trekking in Mongolia",
    description: "Ride through the Naiman Nuur region and Orkhon Valley on a 9-day immersive journey hosted by a Mongolian nomadic family. Ethical, authentic, unforgettable.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "8 Lakes Tours | Nomadic Horse Trekking in Mongolia",
    description: "9-day horse trekking expedition through Mongolia's Eight Lakes region. Stay with a nomadic family, ride the steppe, experience real Mongolian life.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "googlef1b9e63f7dfe2c1f",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
