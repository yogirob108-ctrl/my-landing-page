import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../components/SiteNav';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about 8 Lakes Tours, Mongolia horse trekking, pricing, cash payments to nomadic host families, insurance, and booking.',
  alternates: { canonical: 'https://www.8lakestours.com/faq' },
  openGraph: {
    title: '8 Lakes Tours FAQ',
    description: 'Answers about Mongolia horse trekking dates, payment split, insurance, riding experience, food, safety, and booking.',
    url: 'https://www.8lakestours.com/faq',
    images: [{ url: '/images/og-8-lakes-horseback-2026.jpg', width: 1200, height: 630, alt: '8 Lakes Tours Mongolia horseback expedition' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '8 Lakes Tours FAQ',
    description: 'Answers about Mongolia horse trekking dates, payment split, insurance, riding experience, food, safety, and booking.',
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
    '@type': 'FAQPage',
    '@id': 'https://www.8lakestours.com/faq#faq',
    url: 'https://www.8lakestours.com/faq',
    inLanguage: 'en',
    mainEntity: [
      { '@type': 'Question', name: 'What is 8 Lakes Tours?', acceptedAnswer: { '@type': 'Answer', text: '8 Lakes Tours is a 9-day / 8-night small-group horse trekking expedition in Mongolia, focused on the Orkhon Valley and Naiman Nuur / Eight Lakes region. Guests stay with a nomadic family, ride Mongolian horses, sleep in traditional gers, and experience daily life on the steppe.' } },
      { '@type': 'Question', name: 'What 2026 departure dates are available?', acceptedAnswer: { '@type': 'Answer', text: '8 Lakes Tours currently shows seven fixed 2026 departures from June through September, plus private group dates on request through late September. Each departure is capped at 8 guests and final availability depends on host-family, horse, guide, and group logistics.' } },
      { '@type': 'Question', name: 'How much does the trip cost?', acceptedAnswer: { '@type': 'Answer', text: 'The current 2026 rate is $2,159 USD per person. This is split into a $959 online booking payment and a $1,200 local cash payment made directly to the nomadic host family in Mongolia.' } },
      { '@type': 'Question', name: 'Is the $959 online payment a deposit?', acceptedAnswer: { '@type': 'Answer', text: 'No. It is best understood as the online booking payment that confirms your place and covers the organiser/operator share. The separate $1,200 family portion is paid locally in cash to the host family.' } },
      { '@type': 'Question', name: 'Can you support vegan, lactose-free, or strict dietary requirements?', acceptedAnswer: { '@type': 'Answer', text: 'This trip is not a good fit for strict vegan travellers, and it may be unsuitable for anyone with serious dairy or lactose intolerance. Remote host-family meals are traditionally meat- and dairy-heavy, and fully separate vegan or dairy-free meals cannot be reliably provided.' } },
      { '@type': 'Question', name: 'Is travel insurance required?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Comprehensive travel insurance is mandatory and should include medical treatment, emergency evacuation and repatriation, and horseback riding or adventure activity coverage.' } },
    ],
  };

  return (
    <main style={pageStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />
      <div style={wrapperStyle}>
        <p style={eyebrowStyle}>FAQ</p>
        <h1 style={h1Style}>Common Questions</h1>
        <p style={{...pStyle, fontSize: '1.05rem'}}>Clear answers for travellers comparing Mongolia horse trekking trips, checking payment structure, or asking an AI assistant to explain 8 Lakes Tours.</p>
        {[
          ['What is 8 Lakes Tours?', '8 Lakes Tours is a 9-day / 8-night small-group horse trekking expedition in Mongolia, focused on the Orkhon Valley and Naiman Nuur / Eight Lakes region. Guests stay with a nomadic family, ride Mongolian horses, sleep in traditional gers, and experience daily life on the steppe.'],
          ['Who organises the trip?', "8 Lakes Tours is organised by Robert Zaher after travelling and riding with Ganbold's family in the Orkhon Valley. Bookings are supported by Adventure Therapy, the parent adventure-company behind the online booking and payment flow, while the local family portion goes directly to your hosts in Mongolia."],
          ['Can I speak to someone before booking?', "Yes. Email info@8lakestours.com with any questions before paying. Rob's Instagram is @robzaher108, but tour enquiries currently stay centralised through info@8lakestours.com."],
          ['How much does the trip cost?', 'The current 2026 rate is $2,159 USD per person. This is split into a $959 online booking payment and a $1,200 local cash payment made directly to the nomadic host family in Mongolia.'],
          ['What 2026 departure dates are available?', 'The website currently shows seven fixed 2026 departures from June through September, plus private group dates on request through late September. Each departure is capped at 8 guests and final availability depends on host-family, horse, guide, and group logistics.'],
          ['Why is $1,200 paid in cash locally?', 'Many of the nomadic families we work with cannot reliably receive online payments or bank transfers. Paying the $1,200 family portion directly in cash ensures that money reaches the hosts transparently.'],
          ['Is the $959 online payment a deposit?', 'No. It is best understood as the online booking payment that confirms your place and covers the organiser/operator share. The separate $1,200 family portion is paid locally in cash to the host family.'],
          ['What happens after I pay online?', 'You receive confirmation and practical preparation notes by email, including transport guidance, recommended local apps, packing reminders, insurance requirements, WhatsApp contacts, arrival timing, and instructions for the host-family cash payment. The email provider/settings are still being finalised, but this is the intended confirmation flow.'],
          ['What is the cancellation policy?', 'If your plans change more than 3 weeks / 21 days before departure, the $959 online booking payment is refundable minus unrecoverable Stripe/payment processing fees. Within 3 weeks / 21 days, we will still try to help with a transfer to another date, an approved replacement traveller, or a partial refund where costs have not already been committed. If 8 Lakes Tours cancels your departure, the online amount you paid to us is refunded minus unrecoverable Stripe/payment processing fees. The $1,200 local family payment is paid in cash in Mongolia and is not collected online by 8 Lakes Tours.'],
          ['Do I need riding experience?', 'No. Beginners are welcome, although a reasonable level of fitness is recommended. Local guides teach basic horse handling before the trek.'],
          ['How flexible do I need to be?', 'This is a real remote adventure, not a perfectly controlled resort itinerary. Weather, horse conditions, road access, and group dynamics can affect the plan. We ask guests to arrive with flexibility, patience, and a willingness to adapt. That said, you never have to do every challenge or activity. If something feels like too much, you can say no, rest, or take a quieter day around the host family and ger life.'],
          ['Why is uncertainty part of the trip?', 'The Eight Lakes region sits in real steppe country, where distance, weather, animals, and road conditions can shape the day. A simple Mongolian hospitality story explains the mindset: when travellers lost their way between distant gers, they could stop at another family home for tea, food, shelter, directions, or supplies. The trip asks guests to embrace that same culture of flexibility, hospitality, and variance rather than expecting a perfectly controlled resort itinerary.'],
          ['Are we completely isolated in the wilderness?', 'No. The landscape is wide and remote from city life, but it is not empty or abandoned. Mongolian steppe culture is famously hospitable: neighbouring families visit each other, share food and tea, help with animals and work, and know the land around them. You should expect simple conditions, but not a survival scenario where food, people, or basic support disappear.'],
          ['What if communication or translation gets difficult?', 'The host-family setting is cross-cultural, and not every moment will happen in perfect English. Guides and organisers help with the main logistics, but a phone with an AI translation app such as ChatGPT or another translator can be very useful if you are ever stuck for words. Some family camps may have Starlink or local connectivity, but internet should be treated as a helpful bonus, not something to depend on constantly.'],
          ['Will I be pushed outside my comfort zone?', 'Sometimes, yes — gently and with common sense. Adventure Therapy is built around the idea that wild places, movement, weather, and challenge can be good for people. You may be encouraged to try more than you expected, but participation is never forced. This trip suits people who are open-minded and mentally prepared for simple conditions, physical discomfort, changing plans, and sharing space with a group without needing everything to be polished or predictable.'],
          ['Are there Western toilets or showers in the countryside?', 'No. Once you leave the city, countryside toilet facilities are simple outhouses with squat toilets rather than Western flush toilets, and there are no regular showers. The cabins and ger stays can still be warm, welcoming, and comfortable in a rural way, but bathroom facilities are basic. Bring wet wipes for cleaning hands and body between river washes; washing in the river can be part of the simple, therapeutic steppe rhythm when conditions allow.'],
          ['What medical supplies should I bring?', 'Bring a small personal first-aid kit, blister care, any prescription medication, basic toiletries, and any painkillers or anti-inflammatory medicine you normally use and can safely take. Guides carry basic first aid, but they are not medical professionals and cannot replace your own personal medical supplies.'],
          ['What is included?', 'The trip includes accommodation, meals, horses, local guiding, ger stays, and the hosted horse trekking experience described on the site. Flights, visas, travel insurance, and personal expenses are not included.'],
          ['Can you support vegan, lactose-free, or strict dietary requirements?', 'This trip is not a good fit for strict vegan travellers, and it may be unsuitable for anyone with serious dairy or lactose intolerance. In rural Mongolia, daily host-family food is traditionally meat- and dairy-heavy: milk tea, yoghurt, cheese, meat, and animal products are normal parts of the diet and hospitality. Vegetarian guests may be possible with advance notice, but remote families cannot reliably provide fully separate vegan or dairy-free meals. Please contact us before booking if diet is a major health, allergy, or ethical requirement.'],
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
