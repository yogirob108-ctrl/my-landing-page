import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../components/SiteNav';

export const metadata: Metadata = {
  title: 'About 8 Lakes Tours',
  description: 'About 8 Lakes Tours: a small-group Mongolia horse trekking expedition with nomadic host families in the Orkhon Valley and Eight Lakes region.',
  alternates: { canonical: 'https://www.8lakestours.com/about' },
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
  return (
    <main style={pageStyle}>
      <SiteNav />
      <div style={wrapperStyle}>
        <p style={eyebrowStyle}>About</p>
        <h1 style={h1Style}>About 8 Lakes Tours</h1>
        <p style={{...pStyle, fontSize: '1.05rem'}}>8 Lakes Tours is a small-group Mongolia horse trekking experience built around a direct partnership with nomadic host families in the Orkhon Valley and Naiman Nuur, also known as the Eight Lakes region.</p>
        {[
          ['What we offer', 'The core trip is a 9-day / 8-night adventure including time in a ger village, four days of guided horseback trekking, meals, accommodation, horses, local guiding, and support from experienced hosts. The route is designed for beginner to intermediate riders with a reasonable level of fitness.'],
          ['Who hosts the trip', 'Guests are hosted locally by the Sandagdorj nomadic family and guided through the landscape by experienced Mongolian horsemen, including Suma. Robert Zaher operates the 8 Lakes Tours booking experience and works directly with the family. For now, all tour enquiries go through info@8lakestours.com; Rob\'s Instagram is @robzaher108.'],
          ['Why the payment is split', 'Many nomadic families in the area live outside normal online banking systems. The current 2026 trip price is $2,099 per person: $959 is paid online to confirm the booking, and $1,140 is paid directly in cash to the host family in Mongolia. This keeps the local family portion transparent and direct.'],
          ['Where the tour takes place', 'The journey is based in Mongolia, around the Orkhon Valley and the Naiman Nuur / Eight Lakes region. Guests fly into Chinggis Khaan International Airport in Ulaanbaatar before travelling onward to the countryside.'],
        ].map(([title, body]) => (
          <section key={title} style={{ marginTop: '2.5rem' }}>
            <h2 style={h2Style}>{title}</h2>
            <p style={pStyle}>{body}</p>
          </section>
        ))}
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
