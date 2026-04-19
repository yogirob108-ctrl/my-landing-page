import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | 8 Lakes Tours',
  description: 'Terms and Conditions for booking a tour with 8 Lakes Tours.',
  robots: { index: true, follow: true },
};

export default function TermsAndConditions() {
  return (
    <main style={{ background: '#0e0c09', minHeight: '100vh', color: '#d4cfc4', fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');`}</style>

      <nav style={{ padding: '1.5rem 4rem', borderBottom: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', letterSpacing: '0.15em', color: '#f5f0e8', textTransform: 'uppercase', textDecoration: 'none' }}>
          8 Lakes Tours
        </Link>
        <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none' }}>← Back to Site</Link>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 2rem' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '1rem' }}>Legal</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 300, color: '#f5f0e8', marginBottom: '0.5rem', lineHeight: 1.1 }}>Terms &amp; Conditions</h1>
        <p style={{ fontSize: '0.8rem', color: '#d4cfc4', opacity: 0.5, marginBottom: '3rem' }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Agreement',
            body: 'By submitting a booking enquiry or making a payment through 8 Lakes Tours, you agree to these Terms & Conditions in full. These terms constitute the entire agreement between you and 8 Lakes Tours (operated by Robert Zaher, contact: info@8lakestours.com).',
          },
          {
            title: '2. Booking & Deposit',
            body: 'A non-refundable deposit of $510 USD (approximately 30% of the total tour price) is required to confirm your place. Your spot is not guaranteed until the deposit has been received and confirmed by us. The remaining balance of $1,189 USD is due upon arrival in Mongolia and is paid directly to the host family in cash (USD, Euros, or Mongolian tögrög).',
          },
          {
            title: '3. Tour Price',
            body: 'The current tour price is $1,699 USD per person for the 9-day / 8-night programme. This includes all accommodation, meals, horses and guiding as described on our website. Flights, travel insurance, visas, and personal expenses are not included.',
          },
          {
            title: '4. Cancellation Policy',
            body: 'The $510 deposit is non-refundable under all circumstances. If you cancel more than 60 days before your departure date, no further charges apply. If you cancel within 60 days of departure, the full tour price becomes due. We strongly recommend comprehensive travel insurance that includes trip cancellation coverage.',
          },
          {
            title: '5. Travel Insurance',
            body: 'Comprehensive travel insurance is mandatory for all participants. Your policy must include emergency medical treatment, emergency evacuation and repatriation, and coverage for horseback riding and adventure activities. Proof of insurance may be requested before departure. 8 Lakes Tours reserves the right to deny participation to anyone without adequate coverage.',
          },
          {
            title: '6. Liability Waiver',
            body: 'All participants must sign the 8 Lakes Tours Liability Waiver & Release before departure (or as part of the booking process). By signing, you acknowledge the inherent risks of the activity and release 8 Lakes Tours, its guides, and the host family from liability for injury, illness, or death arising from participation. The waiver is legally binding.',
          },
          {
            title: '7. Health & Fitness',
            body: 'Participation requires a reasonable level of physical fitness. You must disclose any pre-existing medical conditions at the time of booking. 8 Lakes Tours reserves the right to decline or remove any participant who, in the reasonable judgement of the guide, poses a safety risk to themselves or others.',
          },
          {
            title: '8. Itinerary Changes',
            body: 'The itinerary described on our website is indicative. Weather, terrain conditions, and the safety of participants may require changes to the route, schedule, or activities at short notice. These decisions rest with the lead guide and are final. No refund is given for itinerary modifications made for safety reasons.',
          },
          {
            title: '9. Group Size & Availability',
            body: 'Tours are limited to a maximum of 8 participants. 8 Lakes Tours reserves the right to cancel a tour date if minimum participant numbers are not reached, or for reasons beyond our control. In such cases, a full refund of all amounts paid will be issued.',
          },
          {
            title: '10. Force Majeure',
            body: 'We are not liable for cancellations or changes caused by circumstances beyond our reasonable control, including but not limited to natural disasters, government restrictions, war, pandemics, or extreme weather events. In such cases, we will endeavour to offer an alternative date or a credit.',
          },
          {
            title: '11. Governing Law',
            body: 'These Terms & Conditions are governed by the laws of Mongolia for activities conducted on Mongolian territory, and by the laws of the jurisdiction of the operator for pre-departure matters. Any disputes shall be resolved in good faith between the parties.',
          },
          {
            title: '12. Contact',
            body: 'For any questions regarding these terms, contact us at info@8lakestours.com.',
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 400, color: '#f5f0e8', marginBottom: '0.6rem' }}>{title}</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.85, color: '#d4cfc4', opacity: 0.85 }}>{body}</p>
          </section>
        ))}
      </div>

      <footer style={{ borderTop: '1px solid rgba(200,169,110,0.15)', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#d4cfc4', opacity: 0.4 }}>© 2026 8 Lakes Tours · All rights reserved</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8a96e', opacity: 0.7, textDecoration: 'none' }}>Terms & Conditions</Link>
          <Link href="/privacy" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8a96e', opacity: 0.7, textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </footer>
    </main>
  );
}
