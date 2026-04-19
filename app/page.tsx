"use client";
import { useState } from 'react';

const STRIPE_LINK = 'https://buy.stripe.com/cNi3coc6RgPK50saip0gw00';

function WaiverModal({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) {
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const canProceed = signature.trim().length > 1 && agreed;

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',background:'rgba(14,12,9,0.92)'}}>
      <div style={{background:'#1a1510',border:'1px solid rgba(200,169,110,0.3)',borderRadius:'6px',maxWidth:'600px',width:'100%',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'2rem 2rem 0',borderBottom:'1px solid rgba(200,169,110,0.15)'}}>
          <p style={{fontSize:'0.6rem',letterSpacing:'0.3em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Required Before Payment</p>
          <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',color:'var(--cream)',fontWeight:300,marginBottom:'1.2rem'}}>Liability Waiver & Release</h2>
        </div>
        <div style={{overflowY:'auto',padding:'1.5rem 2rem',fontSize:'0.82rem',color:'var(--mist)',lineHeight:1.8,flex:1}}>
          <p style={{marginBottom:'1rem'}}>Please read this waiver carefully before proceeding. By signing below, you acknowledge and agree to the following terms:</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>1. Nature of Activity</p>
          <p style={{marginBottom:'1rem'}}>8 Lakes Tours operates multi-day horseback trekking expeditions in remote wilderness areas of Mongolia. These activities take place in the Orkhon Valley and surrounding steppe, far from medical facilities, emergency services, and modern infrastructure. Participants acknowledge that this is an inherently adventurous and physically demanding experience.</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>2. Horseback Riding Risks</p>
          <p style={{marginBottom:'1rem'}}>Horseback riding carries inherent risks including, but not limited to: falling from or being thrown by a horse, being kicked or bitten, collision with obstacles, and unpredictable animal behaviour. Horses are living animals and may react in unexpected ways regardless of rider experience. Participants ride at their own risk and must follow all instructions from their guide at all times.</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>3. Remote Wilderness Travel</p>
          <p style={{marginBottom:'1rem'}}>Travel takes place in remote, off-grid terrain with no road access, no mobile phone coverage, and no nearby emergency services. In the event of injury or illness, evacuation may take many hours or longer. Participants must be in adequate physical health to undertake the journey and must disclose any pre-existing medical conditions to their guide prior to departure.</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>4. Medical Emergencies</p>
          <p style={{marginBottom:'1rem'}}>8 Lakes Tours and its guides carry basic first aid supplies but are not medical professionals. In the event of a serious medical emergency, all costs associated with evacuation, treatment, and repatriation are the sole responsibility of the participant. 8 Lakes Tours accepts no liability for injury, illness, or death arising from participation in this tour.</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>5. Travel Insurance Requirement</p>
          <p style={{marginBottom:'1rem'}}>Comprehensive travel insurance is <strong style={{color:'var(--cream)'}}>mandatory</strong> for all participants. Your policy must include coverage for: emergency medical treatment, emergency evacuation and repatriation, horseback riding and adventure activities, and trip cancellation or interruption. Proof of insurance may be requested before your departure. 8 Lakes Tours reserves the right to deny participation to anyone without adequate coverage. We recommend <a href="https://www.worldnomads.com" target="_blank" rel="noopener noreferrer" style={{color:'var(--gold)'}}>World Nomads</a> for adventure travel coverage.</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>6. Release of Liability</p>
          <p style={{marginBottom:'1rem'}}>In consideration of being permitted to participate in this tour, I hereby release, waive, discharge, and covenant not to sue 8 Lakes Tours, its guides, the host family, their agents, employees, and representatives from any and all liability, claims, demands, or causes of action arising out of or related to any loss, damage, injury, or death, whether caused by negligence or otherwise, that may be sustained by me while participating in this tour or while on the premises of any location associated with the tour.</p>

          <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.4rem',marginTop:'1.2rem'}}>7. Assumption of Risk</p>
          <p style={{marginBottom:'1rem'}}>I expressly acknowledge and assume all risks associated with this tour, including those resulting from the actions, inactions, or negligence of 8 Lakes Tours or any other party. I confirm that I am physically and mentally capable of participating in this activity, that I have not been advised otherwise by a medical professional, and that I undertake this activity entirely at my own risk.</p>

          <p style={{marginBottom:'0'}}>This waiver is binding upon myself, my heirs, executors, administrators, and assigns. I have read this document in full and understand its contents.</p>
        </div>
        <div style={{padding:'1.5rem 2rem',borderTop:'1px solid rgba(200,169,110,0.15)',display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div>
            <label style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',display:'block',marginBottom:'0.5rem'}}>Type Your Full Name as Signature</label>
            <input
              type="text"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Your full name"
              style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(200,169,110,0.3)',borderRadius:'3px',padding:'0.7rem 1rem',color:'var(--cream)',fontSize:'0.9rem',fontFamily:"'Cormorant Garamond', serif",fontStyle:'italic',outline:'none'}}
            />
          </div>
          <label style={{display:'flex',alignItems:'flex-start',gap:'0.75rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--mist)',lineHeight:1.5}}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{marginTop:'0.2rem',accentColor:'var(--gold)',flexShrink:0}} />
            <span>I have read and understood this Liability Waiver in full, and I voluntarily agree to its terms. I confirm I will obtain adequate travel insurance before departure.</span>
          </label>
          <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
            {!canProceed && (
              <div style={{padding:'0.8rem',background:'rgba(200,169,110,0.1)',border:'1px solid rgba(200,169,110,0.2)',borderRadius:'3px',color:'rgba(212,207,196,0.4)',fontSize:'0.75rem',letterSpacing:'0.15em',textTransform:'uppercase',textAlign:'center'}}>
                Complete Fields Above to Continue
              </div>
            )}
            {canProceed && (
              <a
                href={STRIPE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onAgree}
                style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'0.8rem',background:'#635bff',border:'1px solid #635bff',color:'#fff',fontSize:'0.75rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',borderRadius:'3px',textDecoration:'none'}}
              >
                Pay via Stripe →
              </a>
            )}
            <button
              onClick={onClose}
              style={{padding:'0.8rem',background:'transparent',border:'1px solid rgba(200,169,110,0.3)',color:'var(--mist)',fontSize:'0.75rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',borderRadius:'3px'}}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showWaiver, setShowWaiver] = useState(false);
  const [waiverExpanded, setWaiverExpanded] = useState(false);
  const [signature, setSignature] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const canPay = signature.trim().length > 1;

  const submitToFormspree = async (form: HTMLFormElement) => {
    if (formSubmitted) return;
    setFormSubmitting(true);
    try {
      await fetch('https://formspree.io/f/xnjorabj', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      setFormSubmitted(true);
    } catch {
      // silent — don't block Stripe payment on network error
    } finally {
      setFormSubmitting(false);
    }
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristTrip',
        name: '8 Lakes Tours — Nomadic Horse Trek Mongolia',
        description: '9-day immersive horseback trekking expedition through the Naiman Nuur (Eight Lakes) region and Orkhon Valley, Mongolia, hosted by the Sandagdorj nomadic family.',
        url: 'https://www.8lakestours.com',
        image: 'https://www.8lakestours.com/images/hero.jpg',
        touristType: 'Adventure travellers seeking authentic nomadic experiences',
        itinerary: {
          '@type': 'ItemList',
          numberOfItems: 9,
        },
        offers: {
          '@type': 'Offer',
          price: '1699',
          priceCurrency: 'USD',
          availability: 'https://schema.org/LimitedAvailability',
          validFrom: '2026-01-01',
        },
        provider: {
          '@type': 'Organization',
          name: '8 Lakes Tours',
          url: 'https://www.8lakestours.com',
          email: 'info@8lakestours.com',
          founder: { '@type': 'Person', name: 'Robert Zaher' },
        },
        location: {
          '@type': 'Place',
          name: 'Orkhon Valley & Naiman Nuur, Mongolia',
          geo: { '@type': 'GeoCoordinates', latitude: 46.8, longitude: 102.2 },
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Do I need riding experience?', acceptedAnswer: { '@type': 'Answer', text: 'No experience necessary. Beginners are welcome — our local guides will teach you everything you need to know before the trek begins.' } },
          { '@type': 'Question', name: 'How physically demanding is the trek?', acceptedAnswer: { '@type': 'Answer', text: "Moderate. You'll ride several hours a day across open terrain and camp outdoors. A reasonable level of fitness is recommended but you don't need to be an athlete." } },
          { '@type': 'Question', name: 'What airport do I fly into?', acceptedAnswer: { '@type': 'Answer', text: "Fly into Chinggis Khaan International Airport in Ulaanbaatar (UB). From there you'll take a public bus to Bat-Ulzii — about an 8-hour ride through stunning countryside." } },
          { '@type': 'Question', name: 'Do I need a visa?', acceptedAnswer: { '@type': 'Answer', text: 'US citizens receive a 90-day visa on arrival. All other nationalities should check with their local Mongolian embassy for current requirements.' } },
          { '@type': 'Question', name: 'Is this trip safe?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Basic first aid is available on site and experienced local guides are with you throughout the journey. Ground transportation is on call for emergencies. All participants are required to carry travel insurance with emergency evacuation coverage before departure.' } },
          { '@type': 'Question', name: 'What is your cancellation policy?', acceptedAnswer: { '@type': 'Answer', text: 'The $510 deposit is non-refundable. The remaining balance of $1,189 is paid directly to the host family in cash upon arrival.' } },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        :root {
          --ink: #1a1510;
          --cream: #f5f0e8;
          --gold: #c8a96e;
          --rust: #a85c38;
          --sage: #7a8c6e;
          --mist: #d4cfc4;
          --dark: #0e0c09;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--dark);
          color: var(--cream);
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.5rem 3rem;
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(to bottom, rgba(14,12,9,0.85) 0%, transparent 100%);
          transition: background 0.3s ease;
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem; font-weight: 300; letter-spacing: 0.15em;
          color: var(--cream); text-decoration: none; text-transform: uppercase;
        }
        .nav-cta {
          font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cream); text-decoration: none;
          border: 1px solid rgba(245,240,232,0.4); padding: 0.6rem 1.4rem;
          transition: all 0.3s ease; white-space: nowrap;
        }
        .nav-cta:hover { background: var(--gold); border-color: var(--gold); color: var(--dark); }

        .hero {
          position: relative; height: 100vh; min-height: 700px;
          display: flex; align-items: flex-end; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background-image: url('/images/hero.jpg');
          background-size: cover; background-position: center 30%;
          animation: heroZoom 12s ease-out forwards;
        }
        @keyframes heroZoom {
          from { transform: scale(1.05); }
          to { transform: scale(1.0); }
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(14,12,9,0.92) 0%, rgba(14,12,9,0.3) 50%, rgba(14,12,9,0.1) 100%);
        }
        .hero-content {
          position: relative; z-index: 2;
          padding: 0 6rem 7rem; max-width: 900px;
          animation: heroFade 1.5s ease-out 0.3s both;
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-eyebrow {
          font-size: 0.7rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: #fff; margin-bottom: 1.2rem; font-weight: 400; text-shadow: 0 1px 6px rgba(0,0,0,0.7), 0 2px 16px rgba(0,0,0,0.5);
        }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3.5rem, 7vw, 6.5rem);
          font-weight: 300; line-height: 1.05; color: var(--cream); margin-bottom: 1.5rem;
        }
        .hero-title em { font-style: italic; color: var(--gold); }
        .hero-sub { font-size: 1rem; line-height: 1.7; color: var(--mist); max-width: 520px; margin-bottom: 2.5rem; }
        .hero-sub .mobile-line { display: none; }
        .hero-sub .desktop-line { display: inline; }
        .hero-actions { display: flex; gap: 1rem; align-items: center; }
        .btn-primary {
          display: inline-block; background: var(--gold); color: var(--dark);
          font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 1rem 2.2rem; text-decoration: none; font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-primary:hover { background: var(--rust); color: var(--cream); }
        .btn-ghost {
          display: inline-block; color: var(--cream);
          font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          text-decoration: none; border-bottom: 1px solid rgba(245,240,232,0.3);
          padding-bottom: 2px; transition: border-color 0.3s ease;
        }
        .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

        .stats-bar {
          background: var(--ink);
          border-top: 1px solid rgba(200,169,110,0.2);
          border-bottom: 1px solid rgba(200,169,110,0.2);
          display: grid; grid-template-columns: repeat(4, 1fr); padding: 2rem 6rem;
        }
        .stat { text-align: center; padding: 1rem; border-right: 1px solid rgba(245,240,232,0.08); }
        .stat:last-child { border-right: none; }
        .stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.4rem; font-weight: 300; color: var(--gold);
          display: block; margin-bottom: 0.3rem;
        }
        .stat-label { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--mist); opacity: 0.7; }

        section { padding: 8rem 6rem; }
        .section-eyebrow { font-size: 0.65rem; letter-spacing: 0.35em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; display: block; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 300; line-height: 1.15; color: var(--cream); margin-bottom: 1.5rem; }
        .section-title em { font-style: italic; color: var(--gold); }
        .section-body { font-size: 1rem; line-height: 1.8; color: var(--mist); max-width: 560px; }

        .intro { background: var(--dark); display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center; }
        .intro-img { position: relative; aspect-ratio: 3/4; overflow: hidden; }
        .intro-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
        .intro-img:hover img { transform: scale(1.03); }
        .intro-img-accent { position: absolute; bottom: -1.5rem; right: -1.5rem; width: 55%; aspect-ratio: 1; overflow: hidden; border: 4px solid var(--dark); }
        .intro-img-accent img { width: 100%; height: 100%; object-fit: cover; }

        .photo-strip { padding: 0; display: flex; gap: 0; overflow: hidden; height: 50vh; min-height: 350px; }
        .strip-item { flex: 1; overflow: hidden; position: relative; transition: flex 0.6s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .strip-item:hover { flex: 2.5; }
        .strip-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .strip-item:hover img { transform: scale(1.04); }
        .strip-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(14,12,9,0.85)); padding: 2rem 1.5rem 1rem; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cream); opacity: 0; transition: opacity 0.4s ease; }
        .strip-item:hover .strip-caption { opacity: 1; }

        .partnership { background: var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .partnership-text { padding: 8rem 5rem; }
        .partnership-quote { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-style: italic; font-weight: 300; color: var(--cream); line-height: 1.6; border-left: 2px solid var(--gold); padding-left: 2rem; margin: 2.5rem 0; }
        .partnership-img { overflow: hidden; min-height: 600px; }
        .partnership-img img { width: 100%; height: 100%; object-fit: cover; }

        .itinerary { background: var(--dark); }
        .itinerary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 4rem; }
        .itin-card { background: var(--ink); padding: 2.5rem; position: relative; overflow: hidden; transition: background 0.3s ease; }
        .itin-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease; }
        .itin-card:hover::before { transform: scaleX(1); }
        .itin-card:hover { background: #1e1b15; }
        .itin-days { font-family: 'Cormorant Garamond', serif; font-size: 3rem; font-weight: 300; color: rgba(200,169,110,0.2); position: absolute; top: 1.5rem; right: 1.5rem; line-height: 1; }
        .itin-tag { font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.8rem; display: block; }
        .itin-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: var(--cream); margin-bottom: 1rem; }
        .itin-desc { font-size: 0.875rem; line-height: 1.7; color: var(--mist); opacity: 0.8; }
        .itin-list { list-style: none; margin-top: 1rem; }
        .itin-list li { font-size: 0.8rem; color: var(--mist); padding: 0.3rem 0; padding-left: 1rem; position: relative; opacity: 0.7; }
        .itin-list li::before { content: '—'; position: absolute; left: 0; color: var(--gold); }

        .mosaic { padding: 0; display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 350px 350px 350px; gap: 3px; }
        .mosaic-item { overflow: hidden; position: relative; }
        .mosaic-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .mosaic-item:hover img { transform: scale(1.04); }
        .mosaic-item.tall { grid-row: span 2; }

        .included { background: var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: start; }
        .included-list { list-style: none; }
        .included-list li { padding: 1rem 0; border-bottom: 1px solid rgba(245,240,232,0.07); font-size: 0.9rem; color: var(--mist); display: flex; align-items: center; gap: 1rem; }
        .included-list li .icon { color: var(--gold); font-size: 1rem; flex-shrink: 0; }
        .included-list.not li .icon { color: var(--rust); opacity: 0.7; }

        .booking { background: var(--dark); display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: start; }
        .price-card { background: var(--ink); border: 1px solid rgba(200,169,110,0.25); padding: 3rem; }
        .price-badge { font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase; background: var(--rust); color: var(--cream); display: inline-block; padding: 0.4rem 1rem; margin-bottom: 1.5rem; }
        .price-amount { font-family: 'Cormorant Garamond', serif; font-size: 4rem; font-weight: 300; color: var(--gold); line-height: 1; margin-bottom: 0.4rem; }
        .price-per { font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mist); opacity: 0.6; margin-bottom: 2rem; }
        .price-note { font-size: 0.8rem; color: var(--mist); opacity: 0.7; line-height: 1.6; margin-bottom: 2rem; padding: 1rem; background: rgba(245,240,232,0.04); border-left: 2px solid var(--gold); }
        .booking-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-label { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); }
        .form-input, .form-select, .form-textarea { background: rgba(245,240,232,0.05); border: 1px solid rgba(245,240,232,0.12); color: var(--cream); padding: 0.8rem 1rem; font-family: 'Jost', sans-serif; font-size: 0.875rem; font-weight: 300; width: 100%; transition: border-color 0.3s ease; outline: none; -webkit-appearance: none; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); }
        .form-select option { background: var(--ink); }
        .form-textarea { resize: vertical; min-height: 80px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-check { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.8rem; color: var(--mist); opacity: 0.8; line-height: 1.5; cursor: pointer; }
        .form-check input[type="checkbox"] { appearance: none; width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; border: 1px solid rgba(245,240,232,0.3); background: transparent; cursor: pointer; position: relative; }
        .form-check input[type="checkbox"]:checked { background: var(--gold); border-color: var(--gold); }
        .submit-btn { background: var(--gold); color: var(--dark); border: none; padding: 1.1rem 2rem; font-family: 'Jost', sans-serif; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; cursor: pointer; transition: all 0.3s ease; width: 100%; margin-top: 0.5rem; }
        .submit-btn:hover { background: var(--rust); color: var(--cream); }
        .submit-btn:disabled { background: var(--sage); color: var(--cream); cursor: default; }

        .getting-there-section { background: var(--ink); padding: 8rem 6rem; }
        .getting-there-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; margin-top: 3rem; align-items: start; }
        .divider { display: flex; align-items: center; gap: 1.5rem; padding: 0 6rem; }
        .divider-line { flex: 1; height: 1px; background: rgba(200,169,110,0.15); }
        .divider-ornament { color: var(--gold); font-size: 0.8rem; }

        footer { background: var(--ink); border-top: 1px solid rgba(200,169,110,0.15); padding: 4rem 6rem; display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; letter-spacing: 0.15em; color: var(--cream); text-transform: uppercase; }
        .footer-tagline { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-top: 0.3rem; }
        .footer-note { font-size: 0.75rem; color: var(--mist); opacity: 0.4; }

        .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }

        @media (max-width: 900px) {
          section { padding: 5rem 2rem; }
          nav { padding: 1.2rem 2rem; }
          .hero-content { padding: 0 2rem 5rem; }
          .hero-overlay { background: linear-gradient(to top, rgba(14,12,9,0.97) 0%, rgba(14,12,9,0.6) 45%, rgba(14,12,9,0.25) 100%); }
          .hero-sub .mobile-line { display: inline; }
          .hero-sub .desktop-line { display: none; }
          .stats-bar { grid-template-columns: repeat(2,1fr); padding: 1.5rem 2rem; }
          .intro, .partnership, .booking, .included { grid-template-columns: 1fr; gap: 3rem; }
          .itinerary-grid { grid-template-columns: 1fr; }
          .itin-tag { font-size: 0.75rem; }
          .itin-title { font-size: 2rem; }
          .itin-desc { font-size: 1rem; }
          .itin-list li { font-size: 0.95rem; }
          .photo-strip { height: 40vw; min-height: 200px; }
          .mosaic { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .mosaic-item.tall { grid-row: span 1; }
          footer { flex-direction: column; gap: 1.5rem; text-align: center; padding: 3rem 2rem; }
          .getting-there-section { padding: 4rem 1.5rem; }
          .getting-there-grid { grid-template-columns: 1fr; gap: 3rem; }
          .divider { padding: 0 2rem; }
          .partnership-text { padding: 4rem 2rem; }
          .partnership-img { min-height: unset; }
          .partnership-img img { height: auto; object-fit: contain; }
          .form-grid { grid-template-columns: 1fr; }
          .intro-img-accent { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav id="main-nav">
        <a href="/" className="nav-logo">8 Lakes Tours</a>
        <a href="#book" className="nav-cta">Reserve</a>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">Orkhon Valley & Eight Lakes Region · Mongolia</p>
          <h1 className="hero-title">Ride Into the<br /><em>Endless Steppe</em></h1>
          <p className="hero-sub">
            <span className="mobile-line">9 days in one of the last truly wild places on earth.</span>
            <span className="desktop-line">A 9-day immersive journey into nomadic Mongolian life — riding on horseback through one of the world&apos;s last great wildernesses, hosted by a family whose roots run as deep as the land itself.</span>
          </p>
          <div className="hero-actions">
            <a href="#book" className="btn-primary">Book Your Journey</a>
            <a href="#experience" className="btn-ghost">Explore the Experience</a>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat reveal"><span className="stat-num">9</span><span className="stat-label">Days / 8 Nights</span></div>
        <div className="stat reveal reveal-delay-1"><span className="stat-num">8</span><span className="stat-label">Max Guests</span></div>
        <div className="stat reveal reveal-delay-2"><span className="stat-num">4</span><span className="stat-label">Days on Horseback</span></div>
        <div className="stat reveal reveal-delay-3"><span className="stat-num">$1,699</span><span className="stat-label">Per Person</span></div>
      </div>

      {/* INTRO */}
      <section className="intro" id="experience">
        <div className="intro-img reveal">
          <img src="/images/guide.jpg" alt="Mongolian horseman in traditional dress" loading="lazy" />
          <span style={{position:'absolute', bottom:'1rem', left:'1rem', fontSize:'0.62rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(245,240,232,0.75)', background:'rgba(14,12,9,0.55)', padding:'0.35rem 0.7rem', backdropFilter:'blur(4px)', pointerEvents:'none'}}>Suma — Your Guide</span>
        </div>
        <div className="reveal reveal-delay-1">
          <span className="section-eyebrow">What This Is</span>
          <h2 className="section-title">Mongolia<br /><em>Beyond Tourism</em></h2>
          <p className="section-body">This isn&apos;t a curated tourist experience. You&apos;ll wake up in a ger, ride across open steppe with experienced local horsemen, and camp under skies that have no end. Every meal is shared. Every kilometer is earned.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>8 Lakes Tours is built for people who want to be somewhere real — not just pass through it.</p>
          <div style={{marginTop:'2.5rem', display:'flex', gap:'2rem', flexWrap:'wrap'}}>
            <div><span style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', color:'var(--gold)'}}>Beginner</span><p style={{fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mist)', opacity:0.6, marginTop:'0.2rem'}}>Riders Welcome</p></div>
            <div><span style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', color:'var(--gold)'}}>Small</span><p style={{fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mist)', opacity:0.6, marginTop:'0.2rem'}}>Intimate Group</p></div>
            <div><span style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', color:'var(--gold)'}}>Real</span><p style={{fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mist)', opacity:0.6, marginTop:'0.2rem'}}>Family Partnership</p></div>
          </div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <div className="photo-strip">
        {[
          {src:'/images/riding1.jpg', caption:'The Open Steppe'},
          {src:'/images/water-crossing.jpg', caption:'River Crossings'},
          {src:'/images/landscape1.jpg', caption:'Alpine Lakes Region'},
          {src:'/images/gers.jpg', caption:'Your Home on the Steppe'},
          {src:'/images/sunset.jpg', caption:'Steppe Sunsets'},
        ].map((item) => (
          <div className="strip-item" key={item.src}>
            <img src={item.src} alt={item.caption} loading="lazy" />
            <div className="strip-caption">{item.caption}</div>
          </div>
        ))}
      </div>

      {/* PARTNERSHIP */}
      <section className="partnership" style={{padding:0}}>
        <div className="partnership-text reveal">
          <span className="section-eyebrow">Our Local Partnership</span>
          <h2 className="section-title">The Family<br /><em>Behind It</em></h2>
          <p className="section-body">I met Ganbold while trekking solo through Mongolia. I hadn&apos;t planned to stay — but his family pulled me in with the kind of warmth that&apos;s hard to explain and impossible to forget. We rode together, shared meals, and spent evenings around the fire talking about the land, the horses, and the life they&apos;ve built here across three generations.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>Ganbold&apos;s son Suma grew up in this valley and has been guiding riders through it for years — he knows every trail, every animal, every shift in the weather. When I floated the idea of bringing small groups out here, both of them lit up. This trip exists because they wanted it to.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>You won&apos;t be staying near the family — you&apos;ll be living with them. Same meals, same gers, same daily rhythm. Every booking goes directly to them. That part matters to me.</p>
          <p style={{marginTop:'1.4rem', fontSize:'0.75rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', opacity:0.7}}>— Robert, Founder</p>
        </div>
        <div style={{display:'flex', flexDirection:'column'}}>
          <div className="partnership-img reveal">
            <img src="/images/family.jpg" alt="Group photo with Mongolian host family" loading="lazy" />
          </div>
          <div className="partnership-img reveal">
            <img src="/images/partnership2.jpg" alt="Mongolian host family partnership" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ITINERARY */}
      <section className="itinerary">
        <div className="reveal">
          <span className="section-eyebrow">The Journey</span>
          <h2 className="section-title">Nine Days,<br /><em>One Lifetime</em></h2>
        </div>
        <div className="itinerary-grid">
          <div className="itin-card reveal">
            <span className="itin-days">1–3</span>
            <span className="itin-tag">Days 1 – 3</span>
            <h3 className="itin-title">Nomadic Life Immersion</h3>
            <p className="itin-desc">Travel from the capital into the countryside and be welcomed by your host family. Settle into traditional gers and begin learning daily nomadic life.</p>
            <ul className="itin-list">
              <li>Traditional ger accommodation</li>
              <li>Yak milking & daily routines</li>
              <li>Horse handling & riding practice</li>
              <li>Cultural exchange & shared meals</li>
              <li style={{opacity:1, color:'var(--gold)'}}>Optional: van day trip to nearby historic sites & waterfalls</li>
            </ul>
          </div>
          <div className="itin-card reveal reveal-delay-1">
            <span className="itin-days">4–7</span>
            <span className="itin-tag">Days 4 – 7</span>
            <h3 className="itin-title">Eight Lakes Horse Trek</h3>
            <p className="itin-desc">Four days on horseback through Mongolia&apos;s stunning Eight Lakes region. Remote camping under open skies, guided by experienced local horsemen.</p>
            <ul className="itin-list">
              <li>Daily multi-hour horseback riding</li>
              <li>Wilderness camping</li>
              <li>Alpine lakes & dramatic terrain</li>
              <li>Far from mass tourism</li>
            </ul>
          </div>
          <div className="itin-card reveal reveal-delay-2">
            <span className="itin-days">8–9</span>
            <span className="itin-tag">Days 8 – 9</span>
            <h3 className="itin-title">Village Return & Farewell</h3>
            <p className="itin-desc">Return to the village for rest, shared meals, and reflection. Organized transportation back to Bat-Ulzii included.</p>
            <ul className="itin-list">
              <li>Final meals with host family</li>
              <li>Rest & reflection</li>
              <li>Return transport to Bat-Ulzii</li>
            </ul>
          </div>
        </div>
      </section> 

      {/* MOSAIC */}
      <div className="mosaic">
        <div className="mosaic-item tall"><img src="/images/lake.jpg" alt="Eight Lakes region Mongolia" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/riding2.jpg" alt="Riding through the valley" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/mosaic1.jpg" alt="Traditional Mongolian ger" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/mosaic2.jpg" alt="Sunburst over the steppe" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/mosaic3.jpg" alt="The journey van" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/mosaic4.jpg" alt="Panorama at sunset" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/riding3.jpg" alt="Riding along the river" loading="lazy" /></div>
        <div className="mosaic-item"><img src="/images/mosaic5.jpg" alt="Nomadic herders crossing open steppe" loading="lazy" /></div>
      </div>
      {/* GETTING THERE */}
      <section className="getting-there-section">
        <div className="reveal">
          <span className="section-eyebrow">Getting There</span>
          <h2 className="section-title">Your Journey<br /><em>Starts in UB</em></h2>
        </div>
        <div className="getting-there-grid">
          <div className="reveal">
            <p className="section-body">From Ulaanbaatar, take a public bus to <strong style={{color:'var(--cream)'}}>Bat-Ulzii, Uvurkhangai</strong> — about an 8-hour ride through stunning Mongolian countryside. Use the apps below to find the right route and purchase your ticket.</p>
            <p className="section-body" style={{marginTop:'1.2rem'}}>Once you arrive in Bat-Ulzii, your host family will meet you and bring you to the ger village. Coordinate your arrival time directly via WhatsApp before departure.</p>
            <div style={{marginTop:'2.5rem', padding:'1.5rem', background:'rgba(200,169,110,0.06)', borderLeft:'2px solid var(--gold)'}}>
              <p style={{fontSize:'0.65rem', letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.8rem'}}>Need Help?</p>
              <p style={{fontSize:'0.9rem', color:'var(--mist)', lineHeight:1.7, fontStyle:'italic'}}>WhatsApp contact details for both English-speaking and local Mongolian support will be provided upon confirmed booking.</p>
            </div>
          </div>
          <div className="reveal reveal-delay-1">
            <p style={{fontSize:'0.65rem', letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1.5rem'}}>Recommended Apps</p>
            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div style={{background:'rgba(245,240,232,0.04)', border:'1px solid rgba(245,240,232,0.08)', padding:'1.5rem', display:'flex', gap:'1rem', alignItems:'center'}}>
                <div style={{width:'48px', height:'48px', background:'#f97316', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0}}>🚌</div>
                <div>
                  <p style={{fontSize:'0.9rem', color:'var(--cream)', fontWeight:500, marginBottom:'0.3rem'}}>UB Smart Bus</p>
                  <p style={{fontSize:'0.8rem', color:'var(--mist)', opacity:0.7, lineHeight:1.5}}>Find bus routes and schedules from Ulaanbaatar to the countryside</p>
                </div>
              </div>
              <div style={{background:'rgba(245,240,232,0.04)', border:'1px solid rgba(245,240,232,0.08)', padding:'1.5rem', display:'flex', gap:'1rem', alignItems:'center'}}>
                <div style={{width:'48px', height:'48px', background:'#eab308', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0}}>🚕</div>
                <div>
                  <p style={{fontSize:'0.9rem', color:'var(--cream)', fontWeight:500, marginBottom:'0.3rem'}}>UBCab</p>
                  <p style={{fontSize:'0.8rem', color:'var(--mist)', opacity:0.7, lineHeight:1.5}}>Get around Ulaanbaatar before your departure</p>
                </div>
              </div>
              <div style={{background:'rgba(245,240,232,0.04)', border:'1px solid rgba(245,240,232,0.08)', padding:'1.5rem', display:'flex', gap:'1rem', alignItems:'center'}}>
                <div style={{width:'48px', height:'48px', background:'#6366f1', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0}}>💳</div>
                <div>
                  <p style={{fontSize:'0.9rem', color:'var(--cream)', fontWeight:500, marginBottom:'0.3rem'}}>UBCARD</p>
                  <p style={{fontSize:'0.8rem', color:'var(--mist)', opacity:0.7, lineHeight:1.5}}>Load credit for bus payments in the city</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* INCLUDED */}
      <section className="included">
        <div className="reveal">
          <h2 className="section-title">What&apos;s<br /><em>Included</em></h2>
          <p className="section-body" style={{marginBottom:'2rem'}}>Your $1,699 covers the full experience. No hidden costs.</p>
          <ul className="included-list">
            <li><span className="icon">✦</span> Transportation from Bat-Ulzii to the ger village & return</li>
            <li><span className="icon">✦</span> Host family accommodation (traditional gers)</li>
            <li><span className="icon">✦</span> 3 traditional Mongolian meals per day</li>
            <li><span className="icon">✦</span> Guided 4-day horseback trek</li>
            <li><span className="icon">✦</span> Horses & local expert guides</li>
            <li><span className="icon">✦</span> Cultural immersion activities</li>
          </ul>
        </div>
        <div className="reveal reveal-delay-1">
          <h2 className="section-title" style={{fontSize:'2rem'}}>What to<br /><em>Bring</em></h2>
          <p className="section-body" style={{marginBottom:'2rem'}}>A few essentials to sort before you arrive.</p>
          <ul className="included-list not">
            <li><span className="icon">✦</span> International flights</li>
            <li><span className="icon">✦</span> Travel insurance (required) — <a href="https://www.worldnomads.com" target="_blank" rel="noopener noreferrer" style={{color:'var(--gold)'}}>World Nomads</a></li>
            <li><span className="icon">✦</span> Camping gear & sleeping bag</li>
            <li><span className="icon">✦</span> Personal snacks & trail food</li>
            <li><span className="icon">✦</span> Appropriate clothing for riding</li>
            <li><span className="icon">✦</span> Personal medications</li>
          </ul>
          <div style={{marginTop:'2rem', padding:'1.2rem', background:'rgba(200,169,110,0.06)', borderLeft:'2px solid var(--gold)'}}>
            <p style={{fontSize:'0.8rem', color:'var(--mist)', opacity:0.8, lineHeight:1.6}}>All participants must sign a liability waiver and provide proof of travel insurance before the trip begins.</p>
          </div>
        </div>
      </section>

      <div className="divider"><div className="divider-line"></div><div className="divider-ornament">✦</div><div className="divider-line"></div></div>

      {/* BOOKING */}
      <section className="booking" id="book">
        <div className="reveal">
          <span className="section-eyebrow">Reserve Your Spot</span>
          <h2 className="section-title">Join the<br /><em>First Journey</em></h2>
          <p className="section-body">We&apos;re running our inaugural trip at a special introductory rate of $1,699 per person — limited to 8 participants.</p>
          <div style={{display:'inline-flex', alignItems:'center', gap:'0.6rem', marginTop:'1.2rem', padding:'0.6rem 1.1rem', background:'rgba(185,74,48,0.12)', border:'1px solid rgba(185,74,48,0.35)', borderRadius:'3px'}}>
            <span style={{width:'7px', height:'7px', borderRadius:'50%', background:'var(--rust)', display:'inline-block', flexShrink:0}}></span>
            <span style={{fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--rust)'}}>Only 8 spots available for the 2026 season</span>
          </div>
          <div className="price-card" style={{marginTop:'2.5rem'}}>
            <span className="price-badge">Founding Rate — Limited Availability</span>
            <div className="price-amount">$1,699</div>
            <div className="price-per">Per Person · 9 Days / 8 Nights</div>
            <div className="price-note">A deposit is required to hold your spot. Remaining balance due before departure. Custom group dates available on request.</div>
            <div style={{display:'flex', flexDirection:'column', gap:'0.8rem', marginTop:'1.5rem'}}>
              {[['Duration','9 Days / 8 Nights'],['Group Size','Max 8 Participants'],['Location','Orkhon Valley, Mongolia'],['Riding Level','Beginner – Intermediate']].map(([k,v]) => (
                <div key={k} style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--mist)', padding:'0.6rem 0', borderBottom:'1px solid rgba(245,240,232,0.07)'}}>
                  <span>{k}</span><span style={{color:'var(--cream)'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="reveal reveal-delay-1">
          <span className="section-eyebrow">Application</span>
          <h2 className="section-title" style={{fontSize:'2rem', marginBottom:'2rem'}}>Tell Us<br /><em>About You</em></h2>
          <div style={{marginBottom:'2rem', padding:'1.5rem', background:'rgba(200,169,110,0.08)', border:'1px solid rgba(200,169,110,0.35)', borderRadius:'4px'}}>
            <p style={{fontSize:'0.6rem', letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1rem'}}>Available Tour Dates — 2026</p>
            <div style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.9rem 1rem', background:'rgba(200,169,110,0.07)', border:'1px solid rgba(200,169,110,0.2)', borderRadius:'3px'}}>
                <div>
                  <p style={{fontSize:'1rem', fontFamily:"'Cormorant Garamond', serif", color:'var(--cream)', fontWeight:400, marginBottom:'0.15rem'}}>June 22 – 30, 2026</p>
                  <p style={{fontSize:'0.72rem', color:'var(--mist)', opacity:0.7}}>9 Days · 8 Nights · Orkhon Valley, Mongolia</p>
                </div>
                <span style={{fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', background:'rgba(200,169,110,0.12)', border:'1px solid rgba(200,169,110,0.3)', padding:'0.3rem 0.7rem', borderRadius:'2px', whiteSpace:'nowrap'}}>Spots Available</span>
              </div>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.9rem 1rem', background:'rgba(200,169,110,0.03)', border:'1px solid rgba(200,169,110,0.1)', borderRadius:'3px'}}>
                <div>
                  <p style={{fontSize:'1rem', fontFamily:"'Cormorant Garamond', serif", color:'var(--mist)', fontWeight:400, marginBottom:'0.15rem'}}>Custom Group Date</p>
                  <p style={{fontSize:'0.72rem', color:'var(--mist)', opacity:0.5}}>Private booking · Contact us to arrange</p>
                </div>
                <span style={{fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--mist)', opacity:0.5, whiteSpace:'nowrap'}}>On Request</span>
              </div>
            </div>
          </div>
          <form className="booking-form" onSubmit={async e => { e.preventDefault(); await submitToFormspree(e.currentTarget); }}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">First Name</label><input className="form-input" name="first_name" type="text" placeholder="First name" required /></div>
              <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" name="last_name" type="text" placeholder="Last name" required /></div>
            </div>
            <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" name="email" type="email" placeholder="you@example.com" required /></div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" name="phone" type="tel" placeholder="+1 (555) 000-0000" /></div>
              <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" name="nationality" type="text" placeholder="e.g. American" /></div>
            </div>
            <div className="form-group"><label className="form-label">Emergency Contact (Name & Phone)</label><input className="form-input" name="emergency_contact" type="text" placeholder="Name · Phone number" /></div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Riding Experience</label>
                <select className="form-select" name="riding_experience">
                  <option value="">Select level</option>
                  <option>Beginner — little to none</option>
                  <option>Intermediate — comfortable riding</option>
                  <option>Advanced — experienced rider</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Tour Date</label>
                <select className="form-select" name="tour_date">
                  <option value="">Select date</option>
                  <option>June 22–30</option>
                  <option>Custom Group Date</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Dietary Restrictions</label><input className="form-input" name="dietary_restrictions" type="text" placeholder="None, vegetarian, allergies, etc." /></div>
            <div className="form-group"><label className="form-label">Special Notes or Questions</label><textarea className="form-textarea" name="notes" placeholder="Anything else we should know?"></textarea></div>

            {/* Collapsible Waiver */}
            <div style={{border:'1px solid rgba(200,169,110,0.2)', borderRadius:'3px', overflow:'hidden'}}>
              <button
                type="button"
                onClick={() => setWaiverExpanded(v => !v)}
                style={{width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.9rem 1.1rem', background:'rgba(200,169,110,0.05)', border:'none', cursor:'pointer', textAlign:'left'}}
              >
                <span style={{fontSize:'0.65rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--gold)'}}>Read Liability Waiver</span>
                <span style={{fontSize:'0.75rem', color:'var(--gold)', transition:'transform 0.3s', display:'inline-block', transform: waiverExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
              </button>
              {waiverExpanded && (
                <div style={{padding:'1.2rem 1.4rem', fontSize:'0.8rem', color:'var(--mist)', lineHeight:1.8, borderTop:'1px solid rgba(200,169,110,0.15)', maxHeight:'320px', overflowY:'auto'}}>
                  <p style={{marginBottom:'0.8rem'}}>Please read this waiver carefully. By signing below, you acknowledge and agree to the following terms:</p>
                  {[
                    ['1. Nature of Activity', '8 Lakes Tours operates multi-day horseback trekking expeditions in remote wilderness areas of Mongolia. These activities take place in the Orkhon Valley and surrounding steppe, far from medical facilities, emergency services, and modern infrastructure. Participants acknowledge that this is an inherently adventurous and physically demanding experience.'],
                    ['2. Horseback Riding Risks', 'Horseback riding carries inherent risks including, but not limited to: falling from or being thrown by a horse, being kicked or bitten, collision with obstacles, and unpredictable animal behaviour. Horses are living animals and may react in unexpected ways regardless of rider experience. Participants ride at their own risk and must follow all instructions from their guide at all times.'],
                    ['3. Remote Wilderness Travel', 'Travel takes place in remote, off-grid terrain with no road access, no mobile phone coverage, and no nearby emergency services. In the event of injury or illness, evacuation may take many hours or longer. Participants must be in adequate physical health to undertake the journey and must disclose any pre-existing medical conditions to their guide prior to departure.'],
                    ['4. Medical Emergencies', '8 Lakes Tours and its guides carry basic first aid supplies but are not medical professionals. In the event of a serious medical emergency, all costs associated with evacuation, treatment, and repatriation are the sole responsibility of the participant. 8 Lakes Tours accepts no liability for injury, illness, or death arising from participation in this tour.'],
                    ['5. Travel Insurance Requirement', 'Comprehensive travel insurance is mandatory for all participants. Your policy must include coverage for: emergency medical treatment, emergency evacuation and repatriation, horseback riding and adventure activities, and trip cancellation or interruption. 8 Lakes Tours reserves the right to deny participation to anyone without adequate coverage.'],
                    ['6. Release of Liability', 'In consideration of being permitted to participate in this tour, I hereby release, waive, discharge, and covenant not to sue 8 Lakes Tours, its guides, the host family, their agents, employees, and representatives from any and all liability, claims, demands, or causes of action arising out of or related to any loss, damage, injury, or death, whether caused by negligence or otherwise, that may be sustained by me while participating in this tour.'],
                    ['7. Assumption of Risk', 'I expressly acknowledge and assume all risks associated with this tour, including those resulting from the actions, inactions, or negligence of 8 Lakes Tours or any other party. I confirm that I am physically and mentally capable of participating in this activity, that I have not been advised otherwise by a medical professional, and that I undertake this activity entirely at my own risk.'],
                  ].map(([heading, body]) => (
                    <div key={heading} style={{marginTop:'0.9rem'}}>
                      <p style={{fontSize:'0.6rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.3rem'}}>{heading}</p>
                      <p>{body}</p>
                    </div>
                  ))}
                  <p style={{marginTop:'0.9rem', fontStyle:'italic', opacity:0.7}}>This waiver is binding upon myself, my heirs, executors, administrators, and assigns. I have read this document in full and understand its contents.</p>
                </div>
              )}
            </div>

            <div style={{marginTop:'1rem'}}>
              <label style={{fontSize:'0.65rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', display:'block', marginBottom:'0.5rem'}}>Digital Signature — Type Your Full Name</label>
              <input
                type="text"
                name="signature"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Your full name"
                style={{width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(200,169,110,0.3)', padding:'0.7rem 1rem', color:'var(--cream)', fontSize:'0.95rem', fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', outline:'none', boxSizing:'border-box'}}
              />
              <p style={{fontSize:'0.7rem', color:'var(--mist)', opacity:0.5, marginTop:'0.4rem', lineHeight:1.5}}>By typing your name you confirm you have read and agree to the liability waiver.</p>
            </div>

            {/* Submit application to Formspree */}
            {!formSubmitted ? (
              <button
                type="submit"
                disabled={!canPay || formSubmitting}
                className="submit-btn"
                style={{marginTop:'0.5rem', opacity: canPay ? 1 : 0.4, transition:'opacity 0.3s', cursor: canPay ? 'pointer' : 'not-allowed'}}
              >
                {formSubmitting ? 'Submitting…' : 'Submit Application'}
              </button>
            ) : (
              <div style={{marginTop:'0.5rem', padding:'0.9rem 1rem', background:'rgba(200,169,110,0.08)', border:'1px solid rgba(200,169,110,0.3)', borderRadius:'3px', textAlign:'center'}}>
                <p style={{fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)'}}>✓ Application received — complete your deposit below</p>
              </div>
            )}

            <div style={{marginTop:'1rem', padding:'1.2rem', background:'rgba(200,169,110,0.06)', border:`1px solid ${canPay ? 'rgba(200,169,110,0.2)' : 'rgba(200,169,110,0.1)'}`, borderRadius:'4px', textAlign:'center', transition:'border-color 0.3s'}}>
              <p style={{fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.5rem'}}>Deposit to Reserve Your Spot</p>
              <p style={{fontSize:'0.85rem', color:'var(--mist)', lineHeight:1.6, marginBottom:'1rem'}}>
                A <strong style={{color:'var(--cream)'}}>$510 deposit (30%)</strong> is required to secure your place. The remaining <strong style={{color:'var(--cream)'}}>$1,189</strong> is paid in cash directly to the host family upon arrival.
              </p>
              <div style={{position:'relative'}} onClick={() => { const form = document.querySelector<HTMLFormElement>('.booking-form'); if (form) submitToFormspree(form); }}>
                <stripe-buy-button
                  buy-button-id="buy_btn_1TLn713OYuYvjeqEojr4C6gS"
                  publishable-key="pk_live_51TKXhu3OYuYvjeqE8C4eWygroOMleiInT2mBECzwPdsKBNGY1C5AbaFRN8fmn2I8srp5oKHY6k8hL2toCLAKvgrT000S89GE2w"
                  style={{display:'block', width:'100%', opacity: canPay ? 1 : 0.35, transition:'opacity 0.3s'}}
                />
                {!canPay && (
                  <div
                    style={{position:'absolute', inset:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}
                    onClick={e => { e.stopPropagation(); }}
                  >
                    <p style={{fontSize:'0.7rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', background:'rgba(14,12,9,0.85)', padding:'0.5rem 1rem', pointerEvents:'none'}}>
                      Please type your full name as a signature above
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p style={{fontSize:'0.72rem', color:'var(--mist)', opacity:0.5, textAlign:'center', lineHeight:1.6}}>Submitting this form does not guarantee a spot. We&apos;ll be in touch within 48 hours to confirm.</p>
          </form>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{background:'var(--dark)', padding:'7rem 2rem', textAlign:'center'}}>
        <div style={{maxWidth:'560px', margin:'0 auto'}}>
          <div className="reveal">
            <span className="section-eyebrow">Get In Touch</span>
            <h2 className="section-title">Have a<br /><em>Question?</em></h2>
            <p className="section-body" style={{marginTop:'1rem', marginBottom:'3rem'}}>We're happy to answer anything before you book — whether it's about the route, the horses, visa requirements, or packing. Reach out and we'll get back to you promptly.</p>
          </div>
          <div className="reveal" style={{display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center'}}>
            <a
              href="mailto:info@8lakestours.com"
              style={{display:'flex', alignItems:'center', gap:'1rem', width:'100%', maxWidth:'380px', padding:'1.2rem 1.8rem', background:'rgba(200,169,110,0.06)', border:'1px solid rgba(200,169,110,0.25)', borderRadius:'4px', textDecoration:'none', transition:'border-color 0.3s', color:'inherit'}}
            >
              <span style={{fontSize:'1.2rem'}}>✉</span>
              <div style={{textAlign:'left'}}>
                <p style={{fontSize:'0.6rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.25rem'}}>Email</p>
                <p style={{fontSize:'0.9rem', color:'var(--cream)'}}>info@8lakestours.com</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{background:'var(--ink)', padding:'7rem 2rem'}}>
        <div style={{maxWidth:'760px', margin:'0 auto'}}>
          <div className="reveal" style={{marginBottom:'4rem'}}>
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Common<br /><em>Questions</em></h2>
          </div>
          {[
            {q:'Do I need riding experience?', a:'No experience necessary. Beginners are welcome — our local guides will teach you everything you need to know before the trek begins.'},
            {q:'How physically demanding is the trek?', a:"Moderate. You'll ride several hours a day across open terrain and camp outdoors. A reasonable level of fitness is recommended but you don't need to be an athlete."},
            {q:'What airport do I fly into?', a:"Fly into Chinggis Khaan International Airport in Ulaanbaatar (UB). From there you'll take a public bus to Bat-Ulzii — about an 8-hour ride through stunning countryside."},
            {q:'Do I need a visa?', a:'US citizens receive a 90-day visa on arrival. All other nationalities should check with their local Mongolian embassy for current requirements.'},
            {q:'What is the weather like in the summer?', a:'Expect warm days between 15–24°C (60–75°F) and cold nights that can drop to 0–5°C (32–41°F), especially at higher altitudes. Pack layers — mornings and evenings in the Naiman Nuur region can get very cold.'},
            {q:'What do we eat?', a:'Three traditional Mongolian meals are provided daily. Meals are meat-heavy but vegetarian options can be accommodated — let us know in your booking form.'},
            {q:'Is there WiFi or cell service?', a:'Cell service is limited to none in the remote trek areas. Starlink internet is available while staying at the ger village.'},
            {q:'What happens in a medical emergency?', a:'Basic first aid is available on site. All participants are required to have travel insurance with emergency evacuation coverage before the trip begins.'},
            {q:'Can I bring my children?', a:'This experience is designed for adults only. We do not accept participants under 18.'},
            {q:'Is this trip safe?', a:'Yes. Basic first aid is available on site and experienced local guides — including Suma, who has led numerous tourist groups through this terrain — are with you throughout the journey. Ground transportation is on call for emergencies and can reach the ger village within a few hours. All participants are required to carry travel insurance with emergency evacuation coverage before departure.'},
            {q:'How does the cash payment work?', a:'Your $510 deposit is paid online to secure your spot. The remaining $1,189 balance is paid directly to the host family upon your arrival in Mongolia — either in Mongolian tögrög, USD, or Euros, whichever is more convenient for you. There are no hidden fees or additional charges.'},
            {q:'What is your cancellation policy?', a:'The $510 deposit is non-refundable. The remaining balance of $1,189 is paid directly to the host family in cash upon arrival.'},
          ].map(({q, a}, i) => (
            <div key={i} className="reveal" style={{borderTop:'1px solid rgba(200,169,110,0.15)', padding:'1.8rem 0'}}>
              <p style={{fontFamily:"'Cormorant Garamond', serif", fontSize:'1.15rem', fontWeight:400, color:'var(--cream)', marginBottom:'0.6rem'}}>{q}</p>
              <p style={{fontSize:'0.875rem', color:'var(--mist)', lineHeight:1.75, opacity:0.8}}>{a}</p>
            </div>
          ))}
          <div style={{borderTop:'1px solid rgba(200,169,110,0.15)'}} />
        </div>
      </section>

      <footer>
        <div>
          <div className="footer-logo">8 Lakes Tours</div>
          <div className="footer-tagline">Nomadic Horse Trek · Mongolia</div>
        </div>
        <div className="footer-note">© 2026 8 Lakes Tours · All rights reserved</div>
      </footer>

      {showWaiver && <WaiverModal onClose={() => setShowWaiver(false)} onAgree={() => setShowWaiver(false)} />}

      <script dangerouslySetInnerHTML={{__html: `
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        window.addEventListener('scroll', () => {
          const nav = document.getElementById('main-nav');
          if (nav) nav.style.background = window.scrollY > 100 ? 'rgba(14,12,9,0.95)' : '';
        });
      `}} />
    </>
  );
}
