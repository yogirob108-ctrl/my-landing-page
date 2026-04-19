import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | 8 Lakes Tours',
  description: 'Privacy Policy for 8 Lakes Tours — how we collect, use, and protect your personal data.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicy() {
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
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 300, color: '#f5f0e8', marginBottom: '0.5rem', lineHeight: 1.1 }}>Privacy Policy</h1>
        <p style={{ fontSize: '0.8rem', color: '#d4cfc4', opacity: 0.5, marginBottom: '3rem' }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Who We Are',
            body: '8 Lakes Tours is operated by Robert Zaher. Our contact email is info@8lakestours.com. We are the data controller for personal data collected through this website.',
          },
          {
            title: '2. What Data We Collect',
            body: 'When you submit the booking form on our website, we collect the following personal data: your first and last name, email address, phone number, nationality, emergency contact details, riding experience level, preferred tour date, dietary restrictions, and any additional notes you provide. We also collect your typed digital signature as confirmation of your agreement to our liability waiver.',
          },
          {
            title: '3. Why We Collect It (Legal Basis)',
            body: 'We collect and process your personal data on the following legal bases under GDPR: (a) Contractual necessity — to process your booking enquiry and communicate with you about your trip; (b) Legitimate interests — to follow up with people who have expressed interest in our tours; (c) Legal obligation — to maintain records of liability waiver agreements for safety and legal compliance purposes.',
          },
          {
            title: '4. How We Use Your Data',
            body: 'We use your personal data solely to: respond to your booking enquiry, confirm and manage your tour reservation, contact you with pre-departure information, and follow up if your enquiry was not completed. We do not use your data for marketing purposes without your explicit consent, and we do not sell or share your data with third parties for commercial purposes.',
          },
          {
            title: '5. Third-Party Services',
            body: 'We use Formspree (formspree.io) to receive and store form submissions. Formspree acts as a data processor on our behalf and stores your form data on secure servers. We use Stripe (stripe.com) to process payments — Stripe handles payment data directly and we never receive or store your card details. Please refer to Formspree\'s and Stripe\'s respective privacy policies for details on how they handle your data.',
          },
          {
            title: '6. Data Retention',
            body: 'We retain your personal data for as long as necessary to fulfil the purposes for which it was collected, and for a minimum of two years after your tour date (or enquiry date if no tour took place) for legal and safety record-keeping purposes. Signed liability waiver records are retained for seven years in line with standard legal practice.',
          },
          {
            title: '7. Your Rights Under GDPR',
            body: 'If you are based in the European Economic Area (EEA) or United Kingdom, you have the following rights: the right to access your personal data, the right to rectification of inaccurate data, the right to erasure ("right to be forgotten"), the right to restrict processing, the right to data portability, and the right to object to processing. To exercise any of these rights, contact us at info@8lakestours.com. We will respond within 30 days.',
          },
          {
            title: '8. Cookies',
            body: 'This website does not use tracking cookies or analytics cookies. We do not use Google Analytics or any third-party tracking scripts. The only scripts loaded are Stripe\'s buy button script (for payment functionality) and Google Fonts (for typography).',
          },
          {
            title: '9. Data Security',
            body: 'We take reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. All data transmission is encrypted via HTTPS.',
          },
          {
            title: '10. Contact & Complaints',
            body: 'For any privacy-related questions or to exercise your rights, contact us at info@8lakestours.com. If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.',
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
