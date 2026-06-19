import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../components/SiteNav';

export const metadata: Metadata = {
  title: 'Trip Preparation',
  description: 'How to prepare for 8 Lakes Tours: packing, insurance, cash for host families, arrival in Mongolia, food expectations, riding fitness, translation, and remote conditions.',
  alternates: { canonical: 'https://www.8lakestours.com/preparation' },
  openGraph: {
    title: 'Prepare for 8 Lakes Tours',
    description: 'Packing, insurance, cash, arrival, food, riding fitness, translation, and remote-condition guidance for the Mongolia horse trek.',
    url: 'https://www.8lakestours.com/preparation',
    images: [{ url: '/images/og-8-lakes-horseback-2026.jpg', width: 1200, height: 630, alt: '8 Lakes Tours Mongolia horseback expedition preparation guide' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prepare for 8 Lakes Tours',
    description: 'Packing, insurance, cash, arrival, food, riding fitness, translation, and remote-condition guidance for the Mongolia horse trek.',
    images: ['/images/og-8-lakes-horseback-2026.jpg'],
  },
  robots: { index: true, follow: true },
};

const pageStyle = { background: '#0e0c09', minHeight: '100vh', color: '#d4cfc4', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontWeight: 300 } as const;
const wrapperStyle = { maxWidth: '860px', margin: '0 auto', padding: '5.5rem 2rem' } as const;
const eyebrowStyle = { fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '1rem' } as const;
const h1Style = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 'clamp(2.8rem, 8vw, 5rem)', fontWeight: 300, color: '#f5f0e8', marginBottom: '1rem', lineHeight: 0.98 } as const;
const h2Style = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: '1.65rem', fontWeight: 400, color: '#f5f0e8', marginBottom: '0.7rem' } as const;
const pStyle = { fontSize: '0.96rem', lineHeight: 1.85, color: '#d4cfc4', opacity: 0.86 } as const;
const linkStyle = { color: '#c8a96e', textUnderlineOffset: '3px' } as const;

const sections = [
  {
    title: 'Documents, insurance, and money',
    items: [
      'Comprehensive travel insurance is mandatory and must cover horseback riding or adventure activities, emergency medical treatment, evacuation, and repatriation.',
      'Bring passport, visa documentation if required for your nationality, insurance details, and emergency-contact information.',
      'Bring $1,200 USD in clean cash notes for the host family. The online $959 booking payment is handled separately through 8 Lakes Tours / Adventure Therapy.',
    ],
  },
  {
    title: 'Packing basics',
    items: [
      'Pack for all seasons, even in summer. The Mongolian steppe can swing from warm sun to cold wind, rain, and freezing-feeling nights quickly.',
      'Bring more warm layers than you think you need: base layers, fleece or down, warm socks, hat, gloves, and a proper waterproof shell.',
      'Comfortable riding trousers, waterproof outer layer, sun protection, and sturdy shoes or boots suitable for camp life.',
      'A personal first-aid kit, blister care, prescriptions, painkillers or anti-inflammatory medication you normally use and can safely take, toiletries, and any personal medical essentials.',
    ],
  },
  {
    title: 'Arrival and travel rhythm',
    items: [
      'Fly into Chinggis Khaan International Airport in Ulaanbaatar, Mongolia.',
      'Expect onward countryside travel toward Bat-Ulzii, the Orkhon Valley, and the Naiman Nuur / Eight Lakes region.',
      'Exact timing, meet-up details, cash instructions, and local contacts are sent to accepted guests before departure.',
    ],
  },
  {
    title: 'Food and dietary fit',
    items: [
      'Traditional remote host-family meals are meat- and dairy-heavy: milk tea, yoghurt, cheese, meat, and animal products are normal.',
      'Vegetarian guests may be possible with advance notice, but strict vegan diets and serious dairy/lactose intolerance may make this the wrong trip.',
      'Contact the team before booking if food is a major health, allergy, or ethical requirement.',
    ],
  },
  {
    title: 'Countryside toilets and simple facilities',
    items: [
      'Once you leave the city, do not expect Western flush toilets. Countryside facilities are usually simple outhouses with squat toilets.',
      'Accommodation can still be warm, welcoming, and comfortable in a rural way, but bathroom facilities are basic and part of the off-grid host-family experience.',
      'Bring toilet paper, wet wipes, hand sanitiser, and a small personal wash kit; pack them where you can reach them easily during travel days.',
    ],
  },
  {
    title: 'Riding, fitness, and mindset',
    items: [
      'Beginners are welcome, but guests should be reasonably fit and comfortable spending several hours outdoors each day.',
      'This is a real remote adventure: weather, horses, roads, and group dynamics can change the plan.',
      'Arrive flexible, patient, and ready for simple conditions, physical discomfort, shared space, and a slower host-family rhythm.',
    ],
  },
  {
    title: 'Communication and translation',
    items: [
      'Guides and organisers handle the main logistics, but the host-family setting is cross-cultural and not every moment happens in perfect English.',
      'A phone with an AI translator such as ChatGPT or another translation app can help if you are stuck for words.',
      'Starlink or local connectivity may be available at some camps, but internet is a bonus — not something to depend on constantly.',
    ],
  },
];

export default function PreparationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': 'https://www.8lakestours.com/preparation#how-to-prepare',
    name: 'How to prepare for 8 Lakes Tours',
    description: 'Preparation guidance for the 8 Lakes Tours Mongolia horse trekking expedition.',
    inLanguage: 'en',
    mainEntityOfPage: 'https://www.8lakestours.com/preparation',
    step: sections.map((section, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: section.title,
      text: section.items.join(' '),
    })),
  };

  return (
    <main style={pageStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />
      <div style={wrapperStyle}>
        <p style={eyebrowStyle}>Preparation</p>
        <h1 style={h1Style}>How to prepare for the steppe.</h1>
        <p style={{ ...pStyle, fontSize: '1.08rem', maxWidth: '700px' }}>
          This page gives practical preparation guidance for accepted guests and serious applicants: what to bring, how to pack for Mongolia&apos;s fast-changing steppe weather, how the cash split works, what food is like, and what mindset fits a remote Mongolian horse trek.
        </p>

        <div style={{ display: 'grid', gap: '1.1rem', marginTop: '3rem' }}>
          {sections.map(section => (
            <section key={section.title} style={{ border: '1px solid rgba(200,169,110,0.18)', background: 'rgba(245,240,232,0.035)', padding: '1.35rem' }}>
              <h2 style={h2Style}>{section.title}</h2>
              <ul style={{ display: 'grid', gap: '0.7rem', margin: 0, paddingLeft: '1.1rem' }}>
                {section.items.map(item => <li key={item} style={pStyle}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>

        <section style={{ marginTop: '2rem', border: '1px solid rgba(200,169,110,0.32)', background: 'rgba(200,169,110,0.065)', padding: '1.35rem' }}>
          <h2 style={h2Style}>Not sure if this fits?</h2>
          <p style={pStyle}>Ask before paying. We would rather check riding level, diet, expectations, dates, and comfort with remote conditions before you commit.</p>
          <p style={{ ...pStyle, marginTop: '0.8rem' }}><a href="mailto:info@8lakestours.com?subject=Preparation%20question%20for%208%20Lakes%20Tours" style={linkStyle}>Email info@8lakestours.com →</a></p>
        </section>

        <p style={{ ...pStyle, marginTop: '2rem' }}>
          Ready to apply? <Link href="/#book" style={linkStyle}>Return to the booking form</Link>.
        </p>
      </div>
    </main>
  );
}
