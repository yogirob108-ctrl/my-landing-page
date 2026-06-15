import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../components/SiteNav';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about 8 Lakes Tours, Mongolia horse trekking, pricing, cash payments to nomadic host families, insurance, and booking.',
  alternates: { canonical: 'https://www.8lakestours.com/faq' },
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
        <p style={eyebrowStyle}>FAQ</p>
        <h1 style={h1Style}>Common Questions</h1>
        <p style={{...pStyle, fontSize: '1.05rem'}}>Clear answers for travellers comparing Mongolia horse trekking trips, checking payment structure, or asking an AI assistant to explain 8 Lakes Tours.</p>
        {[
          ['What is 8 Lakes Tours?', '8 Lakes Tours is a 9-day / 8-night small-group horse trekking expedition in Mongolia, focused on the Orkhon Valley and Naiman Nuur / Eight Lakes region. Guests stay with a nomadic family, ride Mongolian horses, sleep in traditional gers, and experience daily life on the steppe.'],
          ['Who organises the trip?', "8 Lakes Tours is organised by Robert Zaher after travelling and riding with Ganbold's family in the Orkhon Valley. Bookings are handled online through Horse Adventures, while the local family portion goes directly to your hosts in Mongolia."],
          ['Can I speak to someone before booking?', "Yes. Email info@8lakestours.com with any questions before paying. Rob's Instagram is @robzaher108, but tour enquiries currently stay centralised through info@8lakestours.com."],
          ['How much does the trip cost?', 'The current 2026 rate is $2,159 USD per person. This is split into a $959 online booking payment and a $1,200 local cash payment made directly to the nomadic host family in Mongolia.'],
          ['Why is $1,200 paid in cash locally?', 'Many of the nomadic families we work with cannot reliably receive online payments or bank transfers. Paying the $1,200 family portion directly in cash ensures that money reaches the hosts transparently.'],
          ['Is the $959 online payment a deposit?', 'No. It is best understood as the online booking payment that confirms your place and covers the organiser/operator share. The separate $1,200 family portion is paid locally in cash to the host family.'],
          ['What happens after I pay online?', 'You receive confirmation and practical preparation notes by email, including transport guidance, recommended local apps, packing reminders, insurance requirements, WhatsApp contacts, arrival timing, and instructions for the host-family cash payment. The email provider/settings are still being finalised, but this is the intended confirmation flow.'],
          ['Do I need riding experience?', 'No. Beginners are welcome, although a reasonable level of fitness is recommended. Local guides teach basic horse handling before the trek.'],
          ['What is included?', 'The trip includes accommodation, meals, horses, local guiding, ger stays, and the hosted horse trekking experience described on the site. Flights, visas, travel insurance, and personal expenses are not included.'],
          ['What airport should I use?', 'Fly into Chinggis Khaan International Airport in Ulaanbaatar, Mongolia. Guests then travel onward into the countryside before the host-family stay and trek begin.'],
          ['Is travel insurance required?', 'Yes. Comprehensive travel insurance is mandatory and should include medical treatment, emergency evacuation and repatriation, and horseback riding or adventure activity coverage.'],
          ['Can children join?', 'No. The current experience is adults-only and participants must be 18 or older.'],
          ['How do I contact 8 Lakes Tours?', "Use the booking form on the website or email info@8lakestours.com. Instagram is available at @8lakestours, and Rob's personal Instagram is @robzaher108."],
        ].map(([q, a]) => (
          <section key={q} style={{ borderTop: '1px solid rgba(200,169,110,0.15)', padding: '1.8rem 0' }}>
            <h2 style={h2Style}>{q}</h2>
            <p style={pStyle}>{a}</p>
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
