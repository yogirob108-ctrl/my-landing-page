import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact 8 Lakes Tours for Mongolia horse trekking booking questions, group dates, payment questions, and pre-trip planning.',
  alternates: { canonical: 'https://www.8lakestours.com/contact' },
  robots: { index: true, follow: true },
};

const pageStyle = { background: '#0e0c09', minHeight: '100vh', color: '#d4cfc4', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontWeight: 300 } as const;
const navStyle = { padding: '1.5rem 4rem', borderBottom: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' } as const;
const logoStyle = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: '1.1rem', letterSpacing: '0.15em', color: '#f5f0e8', textTransform: 'uppercase', textDecoration: 'none' } as const;
const linkStyle = { fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none' } as const;
const wrapperStyle = { maxWidth: '760px', margin: '0 auto', padding: '5rem 2rem' } as const;
const eyebrowStyle = { fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '1rem' } as const;
const h1Style = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 300, color: '#f5f0e8', marginBottom: '1rem', lineHeight: 1.1 } as const;
const h2Style = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 400, color: '#f5f0e8', marginBottom: '0.6rem' } as const;
const pStyle = { fontSize: '0.95rem', lineHeight: 1.85, color: '#d4cfc4', opacity: 0.86 } as const;
const footerStyle = { borderTop: '1px solid rgba(200,169,110,0.15)', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' } as const;

export default function Page() {
  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>8 Lakes Tours</Link>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/about" style={linkStyle}>About</Link>
          <Link href="/faq" style={linkStyle}>FAQ</Link>
          <Link href="/contact" style={linkStyle}>Contact</Link>
          <Link href="/" style={linkStyle}>← Back to Site</Link>
        </div>
      </nav>
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
