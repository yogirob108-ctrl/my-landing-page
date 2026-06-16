import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../components/SiteNav';

export const metadata: Metadata = {
  title: 'About 8 Lakes Tours',
  description: 'About 8 Lakes Tours: an Adventure Therapy project and small-group Mongolia horse trekking expedition with nomadic host families in the Orkhon Valley and Eight Lakes region.',
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
        <p style={{...pStyle, fontSize: '1.05rem', marginTop: '1.1rem'}}>It is also one of the first journeys from Adventure Therapy — a wider adventure group built around the idea that wild places, physical challenge, silence, weather, horses, and simple living can do something that comfort cannot.</p>
        {[
          ['What we offer', 'The core trip is a 9-day / 8-night adventure including time in a ger village, four days of guided horseback trekking, meals, accommodation, horses, local guiding, and support from experienced hosts. The route is designed for beginner to intermediate riders with a reasonable level of fitness.'],
          ['Part of Adventure Therapy', 'Adventure Therapy is not clinical therapy and does not claim to treat mental-health conditions. It is our philosophy for building trips: choose real environments over artificial comfort, let nature do some of the work, and use adventure, discomfort, movement, and attention as a way to come back stronger. 8 Lakes Tours is the Mongolia expression of that idea.'],
          ['Who hosts the trip', 'Guests are hosted locally by the Sandagdorj nomadic family and guided through the landscape by experienced Mongolian horsemen, including Suma. Robert Zaher leads the 8 Lakes Tours experience and works directly with the family. Adventure Therapy supports the wider group structure, online booking flow, and future trips. For now, all tour enquiries go through info@8lakestours.com; Rob\'s Instagram is @robzaher108.'],
          ['Why the payment is split', 'Many nomadic families in the area live outside normal online banking systems. The current 2026 trip price is $2,159 per person: $959 is paid online to confirm the booking, and $1,200 is paid directly in cash to the host family in Mongolia. This keeps the local family portion transparent and direct.'],
          ['Where the tour takes place', 'The journey is based in Mongolia, around the Orkhon Valley and the Naiman Nuur / Eight Lakes region. Guests fly into Chinggis Khaan International Airport in Ulaanbaatar before travelling onward to the countryside.'],
          ['What we mean by adventure', 'This is not a spa retreat or a polished tourist circuit. It is horses, gers, weather, long days outside, simple meals, and the kind of quiet you only get when the signal disappears. The point is not to escape life forever; it is to put yourself somewhere real enough that you remember what you are made of.'],
          ['Real adventure, optional challenge', 'Remote travel does not always move like a perfect city itinerary. Weather can shift, horses and roads can change plans, and group dynamics matter when people are moving together in wild country. We respect the environment rather than pretending to control it. At times you may be invited and encouraged to step outside your comfort zone — that is part of the Adventure Therapy ethos — but nothing is forced. You can always say no, rest, take the easier option, or stay closer to nomadic life for the day. The right guest is open-minded, flexible, and willing to meet the trip as it really is.'],
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
