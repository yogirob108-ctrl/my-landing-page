import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../components/SiteNav';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact 8 Lakes Tours for Mongolia horse trekking booking questions, group dates, payment questions, and pre-trip planning.',
  alternates: { canonical: 'https://www.8lakestours.com/contact' },
  openGraph: {
    title: 'Contact 8 Lakes Tours',
    description: 'Ask about Mongolia horse trekking dates, private groups, payment, insurance, and trip preparation.',
    url: 'https://www.8lakestours.com/contact',
    images: [{ url: '/images/og-8-lakes-horseback-2026.jpg', width: 1200, height: 630, alt: '8 Lakes Tours Mongolia horseback expedition' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact 8 Lakes Tours',
    description: 'Ask about Mongolia horse trekking dates, private groups, payment, insurance, and trip preparation.',
    images: ['/images/og-8-lakes-horseback-2026.jpg'],
  },
  robots: { index: true, follow: true },
};

const pageStyle = { background: '#0e0c09', minHeight: '100vh', color: '#d4cfc4', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontWeight: 300 } as const;
const linkStyle = { fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none' } as const;
const wrapperStyle = { maxWidth: '760px', margin: '0 auto', padding: '5rem 2rem' } as const;
const eyebrowStyle = { fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '1rem' } as const;
const h1Style = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 300, color: '#f5f0e8', marginBottom: '1rem', lineHeight: 1.1 } as const;
const h2Style = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 400, color: '#f5f0e8', marginBottom: '0.6rem' } as const;
const pStyle = { fontSize: '0.95rem', lineHeight: 1.85, color: '#d4cfc4', opacity: 0.86 } as const;
const footerStyle = { borderTop: '1px solid rgba(200,169,110,0.15)', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' } as const;

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': 'https://www.8lakestours.com/contact#contact-page',
    url: 'https://www.8lakestours.com/contact',
    name: 'Contact 8 Lakes Tours',
    description: 'Contact 8 Lakes Tours for Mongolia horse trekking booking questions, group dates, payment questions, and pre-trip planning.',
    inLanguage: 'en',
    mainEntity: {
      '@type': ['Organization', 'TravelAgency'],
      name: '8 Lakes Tours',
      url: 'https://www.8lakestours.com',
      email: 'info@8lakestours.com',
      sameAs: ['https://www.instagram.com/8lakestours', 'https://www.instagram.com/robzaher108'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'booking enquiries',
        email: 'info@8lakestours.com',
        availableLanguage: ['en'],
      },
    },
  };

  return (
    <main style={pageStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />
      <div style={wrapperStyle}>
        <p style={eyebrowStyle}>Contact</p>
        <h1 style={h1Style}>Contact 8 Lakes Tours</h1>
        <p style={{...pStyle, fontSize: '1.05rem'}}>For booking questions, private group dates, payment questions, insurance requirements, or Mongolia trip planning, contact 8 Lakes Tours directly.</p>
        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={h2Style}>Email</h2>
          <p style={pStyle}><a href="mailto:info@8lakestours.com" style={{ color: '#c8a96e' }}>info@8lakestours.com</a></p>
        </section>
        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={h2Style}>Instagram</h2>
          <p style={pStyle}><a href="https://www.instagram.com/8lakestours" target="_blank" rel="noopener noreferrer" style={{ color: '#c8a96e' }}>@8lakestours</a></p>
          <p style={{...pStyle, marginTop: '0.8rem'}}>Robert Zaher: <a href="https://www.instagram.com/robzaher108?igsh=OHdvdGp0ZW9ieHFv" target="_blank" rel="noopener noreferrer" style={{ color: '#c8a96e' }}>@robzaher108</a></p>
        </section>
        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={h2Style}>Booking enquiries</h2>
          <p style={pStyle}>The fastest way to start is the application form on the homepage. It asks for your preferred date, riding experience, dietary restrictions, emergency contact, and any special notes so the team can assess fit and availability.</p>
          <p style={{...pStyle, marginTop: '1rem'}}><Link href="/#book" style={{ color: '#c8a96e' }}>Go to booking form →</Link></p>
        </section>
      </div>
      <footer style={footerStyle}>
        <span style={{ fontSize: '0.75rem', color: '#d4cfc4', opacity: 0.4 }}>© 2026 8 Lakes Tours · All rights reserved</span>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/terms" style={{...linkStyle, opacity: 0.75}}>Terms</Link>
          <Link href="/privacy" style={{...linkStyle, opacity: 0.75}}>Privacy</Link>
          <Link href="/llms.txt" style={{...linkStyle, opacity: 0.75}}>LLMs.txt</Link>
        </div>
      </footer>
    </main>
  );
}
