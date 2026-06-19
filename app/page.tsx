"use client";
import Image from 'next/image';
import Script from 'next/script';
import { type FormEvent, useEffect, useState } from 'react';

const STRIPE_LINK = 'https://buy.stripe.com/4gM8wI2whczu9gI1LT0gw04';
const STRIPE_BUY_BUTTON_ID = 'buy_btn_1TiGFd3OYuYvjeqEw1PHV27M';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51TKXhu3OYuYvjeqE8C4eWygroOMleiInT2mBECzwPdsKBNGY1C5AbaFRN8fmn2I8srp5oKHY6k8hL2toCLAKvgrT000S89GE2w';

const BASE_PRICE_USD = 2159;
const BASE_ONLINE_PAYMENT_USD = 959;
const BASE_LOCAL_FAMILY_PAYMENT_USD = 1200;

function stripePaymentLink(reference: string, email: string) {
  const params = new URLSearchParams();
  if (reference) params.set('client_reference_id', reference);
  if (email) params.set('prefilled_email', email);

  const query = params.toString();
  return query ? `${STRIPE_LINK}?${query}` : STRIPE_LINK;
}

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'MNT';

type LocalizedPricing = {
  currency: CurrencyCode;
  countryLabel: string;
  tourPrice: string;
  onlinePayment: string;
  localFamilyPayment: string;
};

const CURRENCY_BY_REGION: Record<string, CurrencyCode> = {
  US: 'USD',
  CA: 'USD',
  GB: 'GBP',
  IE: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  HR: 'EUR',
  CY: 'EUR',
  EE: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  GR: 'EUR',
  IT: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  ES: 'EUR',
  RU: 'RUB',
  MN: 'MNT',
};

const COUNTRY_LABEL_BY_CURRENCY: Record<CurrencyCode, string> = {
  USD: 'USD pricing',
  EUR: 'Europe pricing',
  GBP: 'UK pricing',
  RUB: 'Russia pricing',
  MNT: 'Mongolia pricing',
};

const DISPLAY_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  RUB: 90,
  MNT: 3450,
};

const PACKING_LIST = [
  'Warm sleeping bag rated for cold steppe nights',
  'Enough layers to handle all seasons in one trip — pack warmer rather than lighter',
  'Comfortable riding boots or sturdy hiking boots',
  'Light camp shoes or flip-flops',
  'Rain jacket or waterproof shell for sudden weather changes',
  'Warm base layer, fleece/down layer, hat and gloves for cold mornings and evenings',
  'Riding gloves or lightweight outdoor gloves',
  'Sun hat or cap',
  'Sunglasses with secure strap',
  'Swimsuit for lakes, rivers or hot springs',
  'Headlamp or small flashlight',
  'Reusable water bottle',
  'Sunscreen and lip balm with SPF',
  'Mosquito repellent',
  'Personal medication and basic toiletries',
  'Personal first-aid kit, blister care and any painkillers/anti-inflammatory medicine you normally use',
  'Wet wipes for cleaning hands and body when there are no showers',
  'Hand cream or Vaseline for dry weather',
  'Travel pillow if you sleep better with one',
  'Universal adapter plug and power bank',
  'Binoculars or camera if you want them',
];

function detectRegion(): string | undefined {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone?.startsWith('Europe/')) return 'NL';
  if (timezone?.startsWith('America/')) return 'US';
  if (timezone === 'Asia/Ulaanbaatar') return 'MN';

  if (typeof navigator !== 'undefined') {
    const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const locale of locales) {
      try {
        const region = new Intl.Locale(locale).region;
        if (region) return region.toUpperCase();
      } catch {
        // Ignore malformed browser locale strings.
      }
    }
  }

  return undefined;
}

function formatApproxUsd(amountUsd: number, currency: CurrencyCode) {
  const converted = amountUsd * DISPLAY_EXCHANGE_RATES[currency];
  const rounded = currency === 'MNT' ? Math.round(converted / 1000) * 1000 : Math.round(converted);
  const useCompactNotation = rounded >= 100000;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: useCompactNotation ? 'compact' : 'standard',
    maximumFractionDigits: useCompactNotation ? 2 : 0,
  }).format(rounded);
}

function getLocalizedPricing(): LocalizedPricing {
  const region = detectRegion();
  const currency = region ? CURRENCY_BY_REGION[region] ?? 'USD' : 'USD';

  return {
    currency,
    countryLabel: COUNTRY_LABEL_BY_CURRENCY[currency],
    tourPrice: formatApproxUsd(BASE_PRICE_USD, currency),
    onlinePayment: formatApproxUsd(BASE_ONLINE_PAYMENT_USD, currency),
    localFamilyPayment: formatApproxUsd(BASE_LOCAL_FAMILY_PAYMENT_USD, currency),
  };
}

const TOUR_DATES = [
  { date: 'June 22 – 30, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'July 6 – 14, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'July 16 – 24, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'July 28 – August 5, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'August 4 – 12, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'August 24 – September 1, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'September 14 – 22, 2026', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'Private Group Date', detail: 'Custom departure · Available through late September', status: 'On Request', muted: true },
];

const STRIP_IMAGES = [
  { src: '/images/expedition-originals/river-horseman-silhouette-portrait.jpg', alt: 'Horseman silhouetted beside the river' },
  { src: '/images/expedition-originals/horseman-valley-lookout-portrait.jpg', alt: 'Horseman looking across the Orkhon Valley' },
  { src: '/images/expedition-originals/suma-river-crossing-original.jpg', alt: 'Suma riding through a shallow river crossing' },
  { src: '/images/expedition-originals/orkhon-valley-sunset-wide.jpg', alt: 'Sunset over the Orkhon Valley river bends' },
  { src: '/images/expedition-originals/ger-and-van-camp-wide.jpg', alt: 'Traditional ger camp with a van and mountain backdrop' },
  { src: '/images/expedition-originals/yaks-river-backlit-portrait.jpg', alt: 'Yaks grazing beside the river in backlit evening sun' },
];

const MAIN_ALBUM_IMAGES = [
  { src: '/images/guide-horse-portrait.jpg', alt: 'Suma standing with his horse on the open steppe', orientation: 'portrait', collage: 'lead' },
  { src: '/images/expedition-originals/ger-blue-hour-original.jpg', alt: 'Ger at blue hour beneath the mountains', orientation: 'landscape', collage: 'wide' },
  { src: '/images/eagle-portrait-original.jpg', alt: 'Close portrait of a Mongolian eagle', orientation: 'portrait', objectPosition: '75% center', collage: 'tall' },
  { src: '/images/ger-camp-yaks-portrait.jpg', alt: 'Gers and grazing yaks in the valley', orientation: 'portrait', collage: 'square' },
  { src: '/images/expedition-originals/mountain-sunset-river-wide.jpg', alt: 'Mountain sunset above a winding river', orientation: 'landscape', collage: 'panorama' },
  { src: '/images/gallery-extra/rearing-horse-over-valley.jpg', alt: 'Horse rearing above the green valley', orientation: 'landscape', collage: 'extra-wide' },
  { src: '/images/gallery-extra/rider-rearing-horse-wide.jpg', alt: 'Rider on a rearing horse against the sky', orientation: 'landscape', collage: 'extra-wide' },
  { src: '/images/gallery-extra/packed-horses-rain-camp.jpg', alt: 'Packed horses waiting under storm clouds', orientation: 'landscape', collage: 'extra-wide' },
  { src: '/images/expedition-originals/layered-hills-sunset-wide.jpg', alt: 'Layered hills at sunset', orientation: 'landscape', collage: 'wide' },
  { src: '/images/gallery-extra/horses-in-forest-rain.jpg', alt: 'Pack horses resting in the forest rain', orientation: 'landscape', collage: 'extra-wide' },
  { src: '/images/expedition-originals/van-river-sunset-portrait.jpg', alt: 'Van parked below a glowing river sunset', orientation: 'portrait', mobileFullWidth: true, collage: 'feature' },
  { src: '/images/expedition-originals/motorbike-valley-dusk-portrait.jpg', alt: 'Motorbike above the valley at dusk', orientation: 'portrait', collage: 'extra-tall' },
  { src: '/images/expedition-originals/ger-with-sun-original.jpg', alt: 'Ger with low sun over the valley', orientation: 'landscape', collage: 'wide' },
  { src: '/images/expedition-originals/storm-cloud-valley-panorama.jpg', alt: 'Panoramic storm clouds over the valley', orientation: 'landscape', collage: 'extra-wide' },
  { src: '/images/expedition-originals/rider-storm-valley-panorama-portrait.jpg', alt: 'Rider under dramatic storm clouds in the valley', orientation: 'portrait', mobileFullWidth: true, collage: 'finale' },
];

const GALLERY_IMAGES = [
  { src: '/images/guide.jpg', alt: 'Mongolian horseman in traditional dress' },
  { src: '/images/rob-family.jpg', alt: 'Robert with the host family outside a traditional ger in Mongolia' },
  { src: '/images/testimonial-irik-clawson.jpg', alt: 'Irik Clawson riding on horseback at sunset in Mongolia' },
  { src: '/images/testimonial-fin-bennet.jpg', alt: 'Fin Bennet with children beside a traditional ger in Mongolia' },
  { src: '/images/lake.jpg', alt: 'Sunlit river valley in Mongolia' },
  { src: '/images/riding2.jpg', alt: 'Rider crossing shallow water on horseback' },
  { src: '/images/mosaic1.jpg', alt: 'Traditional Mongolian gers with grazing animals' },
  { src: '/images/mosaic2.jpg', alt: 'Ger camp at sunrise in the valley' },
  { src: '/images/mosaic3.jpg', alt: 'Mongolian eagle portrait' },
  { src: '/images/mosaic4.jpg', alt: 'Wide sunset view across the Orkhon Valley' },
  { src: '/images/riding3.jpg', alt: 'Grazing animals beside the river' },
  { src: '/images/mosaic5.jpg', alt: 'Ger silhouette at dusk' },
  ...STRIP_IMAGES.map(({ src, alt }) => ({ src, alt })),
  ...MAIN_ALBUM_IMAGES.map(({ src, alt }) => ({ src, alt })),
];

function WaiverModal({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) {
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const canProceed = signature.trim().length > 1 && agreed;

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',background:'rgba(14,12,9,0.92)'}}>
      <div style={{background:'#1a1510',border:'1px solid rgba(200,169,110,0.3)',borderRadius:'6px',maxWidth:'600px',width:'100%',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'2rem 2rem 0',borderBottom:'1px solid rgba(200,169,110,0.15)'}}>
          <p style={{fontSize:'0.6rem',letterSpacing:'0.3em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.6rem'}}>Required Before Payment</p>
          <h2 style={{fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",fontSize:'1.6rem',color:'var(--cream)',fontWeight:300,marginBottom:'1.2rem'}}>Liability Waiver & Release</h2>
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
              style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(200,169,110,0.3)',borderRadius:'3px',padding:'0.7rem 1rem',color:'var(--cream)',fontSize:'0.9rem',fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",fontStyle:'italic',outline:'none'}}
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [waiverExpanded, setWaiverExpanded] = useState(false);
  const [signature, setSignature] = useState('');
  const [email, setEmail] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [leadError, setLeadError] = useState('');
  const [pricing, setPricing] = useState<LocalizedPricing>({
    currency: 'EUR',
    countryLabel: COUNTRY_LABEL_BY_CURRENCY.EUR,
    tourPrice: formatApproxUsd(BASE_PRICE_USD, 'EUR'),
    onlinePayment: formatApproxUsd(BASE_ONLINE_PAYMENT_USD, 'EUR'),
    localFamilyPayment: formatApproxUsd(BASE_LOCAL_FAMILY_PAYMENT_USD, 'EUR'),
  });
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const signatureIsValid = signature.trim().length > 1;
  const hasRequiredContact = signatureIsValid && emailIsValid;
  const canPay = formSubmitted && hasRequiredContact;
  const checkoutFallbackHref = canPay ? stripePaymentLink(bookingReference, email.trim()) : '#book';
  const lightboxImage = lightboxIndex === null ? null : GALLERY_IMAGES[lightboxIndex];
  const isLightboxOpen = lightboxIndex !== null;
  const openLightbox = (src: string, alt: string) => {
    const imageIndex = GALLERY_IMAGES.findIndex(image => image.src === src && image.alt === alt);
    setLightboxIndex(imageIndex >= 0 ? imageIndex : 0);
  };
  const showPreviousImage = () => setLightboxIndex(current => current === null ? current : (current + GALLERY_IMAGES.length - 1) % GALLERY_IMAGES.length);
  const showNextImage = () => setLightboxIndex(current => current === null ? current : (current + 1) % GALLERY_IMAGES.length);

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadError('');
    setLeadStatus('saving');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadName, email: leadEmail, source: 'homepage_newsletter_cta', interest: 'Mongolia field notes, trip dates, preparation emails, and Adventure Therapy updates' }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Could not save your email. Please try again.');
      setLeadStatus('saved');
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Could not save your email. Please try again.');
      setLeadStatus('error');
    }
  };

  useEffect(() => {
    if (lightboxIndex === null || typeof window === 'undefined') return;

    const preloadIndexes = [
      lightboxIndex,
      (lightboxIndex + 1) % GALLERY_IMAGES.length,
      (lightboxIndex + GALLERY_IMAGES.length - 1) % GALLERY_IMAGES.length,
      (lightboxIndex + 2) % GALLERY_IMAGES.length,
    ];

    preloadIndexes.forEach(index => {
      const src = GALLERY_IMAGES[index]?.src;
      if (!src) return;
      const image = new window.Image();
      image.decoding = 'async';
      image.src = src;
    });
  }, [lightboxIndex]);

  useEffect(() => {
    setPricing(getLocalizedPricing());
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowLeft') {
        setLightboxIndex(current => current === null ? current : (current + GALLERY_IMAGES.length - 1) % GALLERY_IMAGES.length);
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex(current => current === null ? current : (current + 1) % GALLERY_IMAGES.length);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      window.scrollTo(0, scrollY);
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
      });
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    root.classList.add('js-reveal');

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('visible'));
      return () => root.classList.remove('js-reveal');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => observer.observe(el));

    let lastScrollY = window.scrollY;

    const updateNavBackground = () => {
      const nav = document.getElementById('main-nav');
      if (!nav) return;

      const currentScrollY = window.scrollY;
      const isMobile = window.matchMedia('(max-width: 900px)').matches;

      nav.style.background = currentScrollY > 100 ? 'rgba(14,12,9,0.95)' : '';

      const scrollDelta = currentScrollY - lastScrollY;

      if (!isMobile || currentScrollY <= 120 || scrollDelta < -4) {
        nav.classList.remove('mobile-nav-hidden');
      } else if (scrollDelta > 4) {
        nav.classList.add('mobile-nav-hidden');
      }

      lastScrollY = Math.max(currentScrollY, 0);
    };

    updateNavBackground();
    window.addEventListener('scroll', updateNavBackground, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateNavBackground);
      root.classList.remove('js-reveal');
    };
  }, []);

  const submitBooking = async (form: HTMLFormElement) => {
    if (formSubmitted) return;
    setFormError('');
    setFormSubmitting(true);
    try {
      const formData = new FormData(form);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; reference?: string; error?: string } | null;

      if (!response.ok || !payload?.ok || !payload.reference) {
        throw new Error(payload?.error || 'The booking could not be saved. Please try again or email info@8lakestours.com.');
      }

      setBookingReference(payload.reference);
      setFormSubmitted(true);

    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The booking could not be saved. Please try again or email info@8lakestours.com.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: '8 Lakes Tours',
        url: 'https://www.8lakestours.com',
        inLanguage: 'en',
        publisher: { '@type': 'Organization', name: '8 Lakes Tours' },
      },
      {
        '@type': 'TouristTrip',
        '@id': 'https://www.8lakestours.com/#trip',
        name: '8 Lakes Tours — Nomadic Horse Trek Mongolia',
        description: '9-day immersive horseback trekking expedition through the Naiman Nuur (Eight Lakes) region and Orkhon Valley, Mongolia, hosted by the Sandagdorj nomadic family.',
        url: 'https://www.8lakestours.com',
        mainEntityOfPage: 'https://www.8lakestours.com',
        inLanguage: 'en',
        image: ['https://www.8lakestours.com/images/hero-sunset-valley.jpg', 'https://www.8lakestours.com/images/hero-horseback.jpg', 'https://www.8lakestours.com/images/rob-family.jpg'],
        touristType: 'Adventure travellers seeking authentic nomadic experiences',
        itinerary: {
          '@type': 'ItemList',
          numberOfItems: 9,
        },
        offers: {
          '@type': 'Offer',
          price: '2159',
          priceCurrency: 'USD',
          availability: 'https://schema.org/LimitedAvailability',
          validFrom: '2026-01-01',
          validThrough: '2026-09-22',
        },
        provider: {
          '@type': 'Organization',
          name: '8 Lakes Tours',
          url: 'https://www.8lakestours.com',
          email: 'info@8lakestours.com',
          sameAs: ['https://www.instagram.com/8lakestours', 'https://www.instagram.com/robzaher108'],
          founder: { '@type': 'Person', name: 'Robert Zaher', sameAs: 'https://www.instagram.com/robzaher108' },
        },
        location: {
          '@type': 'Place',
          name: 'Orkhon Valley & Naiman Nuur, Mongolia',
          geo: { '@type': 'GeoCoordinates', latitude: 46.8, longitude: 102.2 },
        },
        areaServed: {
          '@type': 'Country',
          name: 'Mongolia',
        },
        review: [
          {
            '@type': 'Review',
            author: { '@type': 'Person', name: 'Irik Clawson' },
            reviewBody: 'Endless riding from one plain to the next, across the Steppe, by the lakes…. Magical. What more is there in life?',
          },
          {
            '@type': 'Review',
            author: { '@type': 'Person', name: 'Fin Bennet' },
            reviewBody: 'It couldn’t be further from back home and that makes me so excited.',
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.8lakestours.com/#2026-departures',
        name: '8 Lakes Tours 2026 fixed departure dates',
        itemListElement: TOUR_DATES.map((tourDate, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tourDate.date,
          description: `${tourDate.detail} · ${tourDate.status}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Who organises the trip?', acceptedAnswer: { '@type': 'Answer', text: '8 Lakes Tours is organised by Robert Zaher after travelling and riding with Ganbold’s family in the Orkhon Valley. Bookings are supported by Adventure Therapy, the parent adventure-company behind the online booking and payment flow, while the local family portion goes directly to your hosts in Mongolia.' } },
          { '@type': 'Question', name: 'What happens after I pay online?', acceptedAnswer: { '@type': 'Answer', text: 'You will receive confirmation and preparation notes by email, including transport guidance, recommended local apps, packing reminders, insurance requirements, WhatsApp contacts, arrival timing, and host-family cash payment instructions.' } },
          { '@type': 'Question', name: 'Do I need riding experience?', acceptedAnswer: { '@type': 'Answer', text: 'No experience necessary. Beginners are welcome — our local guides will teach you everything you need to know before the trek begins.' } },
          { '@type': 'Question', name: 'How flexible do I need to be?', acceptedAnswer: { '@type': 'Answer', text: 'This is a real remote adventure, not a perfectly controlled resort itinerary. Weather, horse conditions, road access, and group dynamics can affect the plan. Guests should arrive flexible and open-minded. On the steppe, uncertainty has long been part of life: travellers could lose their way between gers, so hospitality, tea, food, shelter, directions, and mutual help became part of the culture. You may be encouraged to step outside your comfort zone, but nothing is forced: you can say no, rest, or take a quieter day around the host family and ger life.' } },
          { '@type': 'Question', name: 'What if communication or translation gets difficult?', acceptedAnswer: { '@type': 'Answer', text: 'The host-family setting is cross-cultural, and not every moment will happen in perfect English. Guides and organisers help with the main logistics, but a phone with an AI translation app such as ChatGPT or another translator can be useful if you are stuck for words. Some camps may have Starlink or local connectivity, but internet should be treated as a helpful bonus, not something to depend on constantly.' } },
          { '@type': 'Question', name: 'How physically demanding is the trek?', acceptedAnswer: { '@type': 'Answer', text: "Moderate. You'll ride several hours a day across open terrain and camp outdoors. A reasonable level of fitness is recommended but you don't need to be an athlete. Guests should also be mentally prepared for simple conditions, physical discomfort, changing plans, and group life in the wild." } },
          { '@type': 'Question', name: 'Are there Western toilets or showers in the countryside?', acceptedAnswer: { '@type': 'Answer', text: 'No. Once guests leave the city, countryside toilet facilities are simple outhouses with squat toilets rather than Western flush toilets, and there are no regular showers. Cabins and ger stays can be warm and welcoming, but bathroom facilities are basic. Guests should bring wet wipes for cleaning hands and body between river washes; washing in the river can be part of the simple, therapeutic steppe rhythm when conditions allow.' } },
          { '@type': 'Question', name: 'What medical supplies should I bring?', acceptedAnswer: { '@type': 'Answer', text: 'Bring your own personal first-aid kit, blister care, any prescription medication, basic toiletries, and any painkillers or anti-inflammatory medicine you normally use and can safely take. Guides carry basic first aid, but they are not a replacement for your personal medical needs.' } },
          { '@type': 'Question', name: 'Can you support vegan, lactose-free, or strict dietary requirements?', acceptedAnswer: { '@type': 'Answer', text: 'This trip is not a good fit for strict vegan travellers and may be unsuitable for anyone with serious dairy or lactose intolerance. Rural Mongolian host-family meals are traditionally meat- and dairy-heavy, including milk tea, yoghurt, cheese, meat, and other animal products. The dairy is also part of the quality of the host-family experience: families often produce their own milk from yaks or cows and serve it fresh in traditional foods. Vegetarian guests may be possible with advance notice, but fully separate vegan or dairy-free meals cannot be reliably provided in this remote setting.' } },
          { '@type': 'Question', name: 'What 2026 departure dates are available?', acceptedAnswer: { '@type': 'Answer', text: '8 Lakes Tours currently shows seven fixed 2026 departures from June through September, plus private group dates on request through late September. Each departure is capped at 8 guests and final availability depends on host-family, horse, guide, and group logistics.' } },
          { '@type': 'Question', name: 'What airport do I fly into?', acceptedAnswer: { '@type': 'Answer', text: "Fly into Chinggis Khaan International Airport in Ulaanbaatar (UB). From there you'll take a public bus to Bat-Ulzii — about an 8-hour ride through stunning countryside." } },
          { '@type': 'Question', name: 'Do I need a visa?', acceptedAnswer: { '@type': 'Answer', text: 'US citizens receive a 90-day visa on arrival. All other nationalities should check with their local Mongolian embassy for current requirements.' } },
          { '@type': 'Question', name: 'Is this trip safe?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Basic first aid is available on site and experienced local guides are with you throughout the journey. Ground transportation is on call for emergencies. All participants are required to carry travel insurance with emergency evacuation coverage before departure.' } },
          { '@type': 'Question', name: 'How does payment work?', acceptedAnswer: { '@type': 'Answer', text: 'The current 2026 rate is $2,159 USD per person. A $959 online booking payment confirms your place with 8 Lakes Tours through Adventure Therapy. The remaining $1,200 is paid directly in cash to the nomadic host families in Mongolia so the local portion reaches them directly.' } },
          { '@type': 'Question', name: 'What is the cancellation policy?', acceptedAnswer: { '@type': 'Answer', text: 'If your plans change more than 3 weeks / 21 days before departure, the $959 online booking payment is refundable minus unrecoverable Stripe/payment processing fees. Within 3 weeks / 21 days, 8 Lakes Tours will still try to help with a transfer to another date, an approved replacement traveller, or a partial refund where costs have not already been committed. If 8 Lakes Tours cancels your departure, the online amount paid to us is refunded minus unrecoverable Stripe/payment processing fees. The $1,200 host-family cash payment is not collected online.' } },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
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
        html { scroll-behavior: smooth; overflow-x: clip; max-width: 100%; overscroll-behavior-x: none; }
        body {
          background: var(--dark);
          color: var(--cream);
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 300;
          overflow-x: clip;
          max-width: 100%;
          overscroll-behavior-x: none;
        }

        @supports not (overflow: clip) {
          html, body { overflow-x: hidden; }
        }

        #main-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.5rem 3rem;
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(to bottom, rgba(14,12,9,0.85) 0%, transparent 100%);
          transition: background 0.3s ease, transform 0.3s ease;
        }
        .nav-logo {
          font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
          font-size: 1.3rem; font-weight: 300; letter-spacing: 0.15em;
          color: var(--cream); text-decoration: none; text-transform: uppercase;
        }
        .nav-links { display: flex; align-items: center; gap: 0.9rem; }
        .nav-social {
          font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(245,240,232,0.78); text-decoration: none; transition: color 0.3s ease;
        }
        .nav-social:hover { color: var(--gold); }
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

          animation: heroZoom 12s ease-out forwards;
        }
        .hero-bg img { object-fit: cover; object-position: center 30%; }
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
          padding: 0 6rem 6.5rem; max-width: 980px;
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
          font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
          font-size: clamp(3.5rem, 7vw, 6.5rem);
          font-weight: 300; line-height: 1.05; color: var(--cream); margin-bottom: 1.5rem;
        }
        .hero-title em { font-style: italic; color: var(--gold); }
        .hero-sub { font-size: 1.05rem; line-height: 1.7; color: var(--mist); max-width: 680px; margin-bottom: 1.5rem; }
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
          font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
          font-size: 2.4rem; font-weight: 300; color: var(--gold);
          display: block; margin-bottom: 0.3rem;
        }
        .stat-label { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--mist); opacity: 0.7; }

        section { padding: 8rem 6rem; }
        .section-eyebrow { font-size: 0.65rem; letter-spacing: 0.35em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; display: block; }
        .section-title { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 300; line-height: 1.15; color: var(--cream); margin-bottom: 1.5rem; }
        .section-title em { font-style: italic; color: var(--gold); }
        .section-body { font-size: 1rem; line-height: 1.8; color: var(--mist); max-width: 560px; }

        .offer-strip { background: var(--ink); border-top: 1px solid rgba(200,169,110,0.22); border-bottom: 1px solid rgba(200,169,110,0.22); padding: 1.3rem 6rem; display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,1.5fr) auto; gap: 1.5rem; align-items: center; }
        .offer-strip-kicker { font-size: 0.6rem; letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.35rem; }
        .offer-strip-title { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.65rem; font-weight: 300; color: var(--cream); line-height: 1.12; }
        .offer-strip-facts { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 0.6rem; }
        .offer-fact { border-left: 1px solid rgba(200,169,110,0.28); padding-left: 0.85rem; min-width: 0; }
        .offer-fact strong { display: block; color: var(--cream); font-size: 0.92rem; line-height: 1.25; overflow-wrap: anywhere; }
        .offer-fact span { display: block; margin-top: 0.2rem; color: rgba(212,207,196,0.68); font-size: 0.58rem; line-height: 1.45; letter-spacing: 0.16em; text-transform: uppercase; }
        .offer-strip-cta { display: inline-flex; justify-content: center; align-items: center; white-space: nowrap; background: var(--gold); border: 1px solid var(--gold); color: var(--dark); text-decoration: none; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; padding: 0.9rem 1.2rem; transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease; }
        .offer-strip-cta:hover { background: var(--cream); border-color: var(--cream); transform: translateY(-1px); }

        .intro { background: var(--dark); display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center; }
        .intro-img { position: relative; aspect-ratio: 3/4; overflow: hidden; }
        .intro-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
        .intro-img.portrait-full { background: #0f0f0d; border: 1px solid rgba(200,169,110,0.14); }
        .intro-img.portrait-full img { object-fit: contain; }
        .intro-img:hover img { transform: scale(1.03); }
        .intro-img.portrait-full:hover img { transform: none; }
        .intro-img-accent { position: absolute; bottom: -1.5rem; right: -1.5rem; width: 55%; aspect-ratio: 1; overflow: hidden; border: 4px solid var(--dark); }
        .intro-img-accent img { width: 100%; height: 100%; object-fit: cover; }
        .intro-points { margin-top: 2.5rem; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem; }
        .intro-point-value { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.8rem; color: var(--gold); line-height: 1; }
        .intro-point-label { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--mist); opacity: 0.6; margin-top: 0.4rem; line-height: 1.4; }

        .photo-strip { padding: 0; display: flex; gap: 0; overflow: hidden; height: 50vh; min-height: 350px; }
        .strip-item { flex: 1; overflow: hidden; position: relative; transition: flex 0.6s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .strip-item:hover { flex: 2.5; }
        .strip-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .strip-item:hover img { transform: scale(1.04); }
        .partnership { background: var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .partnership-text { padding: 6rem; display: flex; flex-direction: column; justify-content: center; }
        .partnership-inline-photo { display: none !important; position: relative; width: 100%; height: auto; aspect-ratio: 1.46; margin: 2rem 0; overflow: hidden; border: 1px solid rgba(200,169,110,0.22); }
        .partnership-inline-photo img { object-fit: cover; }
        .partnership-quote { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.6rem; font-style: italic; font-weight: 300; color: var(--cream); line-height: 1.6; border-left: 2px solid var(--gold); padding-left: 2rem; margin: 2.5rem 0; }
        .partnership-img { overflow: hidden; min-height: 600px; }
        .partnership-img img { width: 100%; height: 100%; object-fit: cover; }

        .trust { background: var(--dark); padding: 7rem 5rem; }
        .trust-header { max-width: 760px; margin: 0 auto 3rem; text-align: center; }
        .trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 1120px; margin: 0 auto; }
        .trust-card { border: 1px solid rgba(200,169,110,0.2); background: rgba(200,169,110,0.045); padding: 1.6rem; min-height: 210px; display: flex; flex-direction: column; justify-content: space-between; }
        .trust-quote { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--cream); line-height: 1.55; font-style: italic; }
        .trust-source { font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-top: 1.4rem; }
        .testimonial-grid { max-width: 1000px; margin: 0 auto 3rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.4rem; }
        .testimonial-card { background: rgba(245,240,232,0.04); border: 1px solid rgba(200,169,110,0.18); overflow: hidden; }
        .testimonial-photo { position: relative; height: 360px; overflow: hidden; display: block; width: 100%; }
        .testimonial-photo img { object-fit: cover; }
        .testimonial-body { padding: 1.6rem; }
        .testimonial-quote { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.45rem; line-height: 1.45; color: var(--cream); font-style: italic; }
        .testimonial-name { margin-top: 1.2rem; font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); }
        .proof-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; max-width: 1120px; margin: 2rem auto 0; background: rgba(200,169,110,0.18); border: 1px solid rgba(200,169,110,0.18); }
        .proof-item { background: var(--ink); padding: 1.2rem; text-align: center; }
        .proof-value { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.6rem; color: var(--gold); display: block; }
        .proof-label { font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mist); opacity: 0.7; margin-top: 0.35rem; display: block; }
        .instagram-link { color: var(--gold); text-decoration: none; border-bottom: 1px solid rgba(200,169,110,0.45); }
        .instagram-link:hover { color: var(--cream); border-color: var(--cream); }

        .itinerary { background: var(--dark); }
        .itinerary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 4rem; }
        .itin-card { background: var(--ink); padding: 3rem; position: relative; overflow: hidden; transition: background 0.3s ease; }
        .itin-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease; }
        .itin-card:hover::before { transform: scaleX(1); }
        .itin-card:hover { background: #1e1b15; }
        .itin-days { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 3.4rem; font-weight: 300; color: rgba(200,169,110,0.24); position: absolute; top: 1.5rem; right: 1.5rem; line-height: 1; }
        .itin-tag { font-size: 0.72rem; letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; display: block; }
        .itin-title { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.85rem; font-weight: 300; color: var(--cream); margin-bottom: 1.1rem; line-height: 1.15; }
        .itin-desc { font-size: 1rem; line-height: 1.8; color: rgba(245,240,232,0.78); opacity: 1; }
        .itin-list { list-style: none; margin-top: 1.2rem; }
        .itin-list li { font-size: 0.95rem; line-height: 1.65; color: rgba(245,240,232,0.72); padding: 0.45rem 0; padding-left: 1.15rem; position: relative; opacity: 1; }
        .itin-list li::before { content: '—'; position: absolute; left: 0; color: var(--gold); }

        .mosaic { padding: 0; display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 350px 350px 350px; gap: 3px; }
        .mosaic-item { overflow: hidden; position: relative; }
        .mosaic-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .mosaic-item.portrait-full { background: #0f0f0d; }
        .mosaic-item.portrait-full img { object-fit: contain; }
        .mosaic-item:hover img { transform: scale(1.04); }
        .mosaic-item.portrait-full:hover img { transform: none; }
        .mosaic-item.tall { grid-row: span 2; }
        .main-album { padding: 3px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-rows: clamp(78px, 7vw, 118px); gap: 3px; background: #0f0f0d; }
        .main-album-item { position: relative; overflow: hidden; background: var(--ink); min-height: 0; }
        .main-album-item.collage-lead { grid-column: 1 / 5; grid-row: 1 / 7; }
        .main-album-item.collage-wide:nth-of-type(2) { grid-column: 5 / 9; grid-row: 1 / 4; }
        .main-album-item.collage-tall { grid-column: 9 / 11; grid-row: 1 / 5; }
        .main-album-item.collage-square { grid-column: 11 / 13; grid-row: 1 / 3; }
        .main-album-item.collage-panorama { grid-column: 5 / 9; grid-row: 4 / 7; }
        .main-album-item.collage-wide:nth-of-type(6) { grid-column: 11 / 13; grid-row: 3 / 5; }
        .main-album-item.collage-feature { grid-column: 9 / 13; grid-row: 5 / 10; }
        .main-album-item.collage-wide:nth-of-type(13) { grid-column: 1 / 7; grid-row: 7 / 10; }
        .main-album-item.collage-finale { grid-column: 7 / 9; grid-row: 7 / 10; }
        .main-album-item.collage-extra-wide { grid-column: span 4; grid-row: span 3; }
        .main-album-item.collage-extra-tall { grid-column: span 3; grid-row: span 5; }
        .main-album-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .main-album-item:hover img { transform: scale(1.04); }
        .image-button { all: unset; display: block; width: 100%; height: 100%; position: relative; cursor: zoom-in; }
        .image-button.testimonial-photo { height: 360px; }
        .image-button.partnership-inline-photo { height: auto; aspect-ratio: 1.46; }
        .image-button:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }
        .lightbox { position: fixed; inset: 0; z-index: 1000; background: rgba(14,12,9,0.96); display: flex; align-items: center; justify-content: center; padding: 1.5rem; cursor: zoom-out; overscroll-behavior: contain; touch-action: none; }
        .lightbox-frame { position: relative; width: min(96vw, 1800px); height: min(86vh, 1100px); display: flex; align-items: center; justify-content: center; }
        .lightbox-frame img { width: 100%; height: 100%; object-fit: contain; }
        .lightbox-close { position: fixed; top: calc(1rem + env(safe-area-inset-top)); right: calc(1rem + env(safe-area-inset-right)); z-index: 1001; width: 3rem; height: 3rem; border-radius: 999px; border: 1px solid rgba(245,240,232,0.35); background: rgba(14,12,9,0.82); color: var(--cream); cursor: pointer; font-size: 1.35rem; line-height: 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 28px rgba(0,0,0,0.32); }
        .lightbox-nav { position: fixed; top: 50%; transform: translateY(-50%); z-index: 1001; width: 3rem; height: 3rem; border-radius: 999px; border: 1px solid rgba(245,240,232,0.35); background: rgba(14,12,9,0.68); color: var(--cream); cursor: pointer; font-size: 1.8rem; line-height: 1; display: flex; align-items: center; justify-content: center; }
        .lightbox-nav:hover { background: var(--gold); color: var(--dark); border-color: var(--gold); }
        .lightbox-prev { left: 1rem; }
        .lightbox-next { right: 1rem; }
        .trust-conversion { background: var(--ink); display: grid; grid-template-columns: minmax(260px, 0.8fr) 1.2fr; gap: 4rem; align-items: center; }
        .rob-photo { position: relative; aspect-ratio: 1; border: 1px solid rgba(200,169,110,0.24); background: rgba(200,169,110,0.06); overflow: hidden; }
        .rob-photo img { object-fit: cover; object-position: 50% 32%; }
        .trust-card-founder h3 { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 300; color: var(--cream); margin-bottom: 0.8rem; }
        .trust-card-founder p { font-size: 0.9rem; line-height: 1.75; color: rgba(212,207,196,0.82); }
        .trust-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 1.6rem; }
        .trust-link { display: inline-flex; padding: 0.8rem 1rem; border: 1px solid rgba(200,169,110,0.35); color: var(--gold); text-decoration: none; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; }
        .trust-link:hover { background: var(--gold); color: var(--dark); }

        .included { background: var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: start; }
        .included-list { list-style: none; }
        .included-list li { padding: 1rem 0; border-bottom: 1px solid rgba(245,240,232,0.07); font-size: 0.9rem; color: var(--mist); display: flex; align-items: center; gap: 1rem; }
        .included-list li .icon { color: var(--gold); font-size: 1rem; flex-shrink: 0; }
        .included-list.not li .icon { color: var(--rust); opacity: 0.7; }
        .packing-details { margin-top: 1.5rem; border: 1px solid rgba(200,169,110,0.22); background: rgba(200,169,110,0.045); }
        .packing-summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.2rem; color: var(--gold); font-size: 0.65rem; letter-spacing: 0.22em; text-transform: uppercase; }
        .packing-summary::-webkit-details-marker { display: none; }
        .packing-summary::after { content: '▼'; font-size: 0.7rem; transition: transform 0.25s ease; }
        .packing-details[open] .packing-summary::after { transform: rotate(180deg); }
        .packing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem 1.2rem; padding: 0 1.2rem 1.2rem; border-top: 1px solid rgba(200,169,110,0.15); }
        .packing-grid li { list-style: none; position: relative; padding-left: 1rem; font-size: 0.82rem; line-height: 1.55; color: rgba(212,207,196,0.82); }
        .packing-grid li::before { content: '•'; position: absolute; left: 0; color: var(--gold); }

        .booking { background: var(--dark); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6rem; align-items: start; overflow-x: clip; }
        .scarcity-pill { display:inline-flex; max-width:100%; box-sizing:border-box; align-items:center; gap:0.6rem; margin-top:1.2rem; padding:0.6rem 1.1rem; background:rgba(185,74,48,0.12); border:1px solid rgba(185,74,48,0.35); border-radius:3px; overflow:hidden; }
        .scarcity-pill span:last-child { min-width:0; font-size:0.72rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--rust); line-height:1.45; overflow-wrap:anywhere; }
        .price-card { max-width:100%; box-sizing:border-box; overflow:hidden; background: var(--ink); border: 1px solid rgba(200,169,110,0.25); padding: 3rem; }
        .price-badge { max-width:100%; box-sizing:border-box; font-size: 0.6rem; letter-spacing: 0.3em; line-height:1.55; text-transform: uppercase; background: var(--rust); color: var(--cream); display: inline-block; padding: 0.4rem 1rem; margin-bottom: 1.5rem; overflow-wrap:anywhere; }
        .price-amount { max-width:100%; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: clamp(2.45rem, 8vw, 4rem); font-weight: 300; color: var(--gold); line-height: 0.98; margin-bottom: 0.4rem; overflow-wrap:anywhere; word-break: normal; }
        .price-per { max-width:100%; font-size: 0.75rem; letter-spacing: 0.15em; line-height:1.5; text-transform: uppercase; color: var(--mist); opacity: 0.6; margin-bottom: 2rem; overflow-wrap:anywhere; }
        .price-note { max-width:100%; box-sizing:border-box; font-size: 0.8rem; color: var(--mist); opacity: 0.7; line-height: 1.6; margin-bottom: 1rem; padding: 1rem; background: rgba(245,240,232,0.04); border-left: 2px solid var(--gold); overflow-wrap:anywhere; }
        .payment-split { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 0.65rem; align-items: stretch; margin: 1.1rem 0; }
        .payment-split-card { border: 1px solid rgba(200,169,110,0.24); background: rgba(245,240,232,0.035); padding: 1rem; min-width: 0; }
        .payment-split-label { display: block; color: rgba(212,207,196,0.62); font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.35rem; }
        .payment-split-amount { display: block; color: var(--cream); font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.45rem; line-height: 1; margin-bottom: 0.35rem; overflow-wrap: anywhere; }
        .payment-split-copy { color: rgba(212,207,196,0.76); font-size: 0.72rem; line-height: 1.5; }
        .payment-split-arrow { display: flex; align-items: center; justify-content: center; color: var(--gold); font-size: 1.1rem; opacity: 0.76; }
        .payment-details { margin-top: 1rem; border: 1px solid rgba(200,169,110,0.22); background: rgba(200,169,110,0.045); }
        .payment-summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.85rem 1rem; color: var(--gold); font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; }
        .payment-summary::-webkit-details-marker { display: none; }
        .payment-summary::after { content: '▼'; font-size: 0.65rem; transition: transform 0.25s ease; }
        .payment-details[open] .payment-summary::after { transform: rotate(180deg); }
        .payment-detail-body { padding: 0 1rem 1rem; border-top: 1px solid rgba(200,169,110,0.14); font-size: 0.8rem; line-height: 1.65; color: rgba(212,207,196,0.82); overflow-wrap:anywhere; }
        .payment-detail-body p { margin-top: 0.8rem; }
        .ask-card { margin-top: 1.1rem; border: 1px solid rgba(200,169,110,0.24); background: rgba(200,169,110,0.055); padding: 1rem; }
        .ask-card h3 { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; color: var(--cream); font-size: 1.25rem; font-weight: 300; margin-bottom: 0.4rem; }
        .ask-card p { color: rgba(212,207,196,0.78); font-size: 0.82rem; line-height: 1.6; margin-bottom: 0.75rem; }
        .ask-card a { display: inline-flex; color: var(--gold); border-bottom: 1px solid rgba(200,169,110,0.45); text-decoration: none; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; }
        .ask-card a:hover { color: var(--cream); border-color: var(--cream); }
        .price-spec-list { display:flex; flex-direction:column; gap:0.8rem; margin-top:1.5rem; }
        .price-spec-row { display:flex; justify-content:space-between; gap:1rem; min-width:0; font-size:0.8rem; color:var(--mist); padding:0.6rem 0; border-bottom:1px solid rgba(245,240,232,0.07); }
        .price-spec-row span { min-width:0; overflow-wrap:anywhere; }
        .price-spec-row span:last-child { color:var(--cream); text-align:right; }
        .tour-dates-card { margin-top: 1.5rem; padding: 1.25rem; background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.35); border-radius: 4px; }
        .tour-date-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; }
        .tour-date-row { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.72rem 0.78rem; background: rgba(200,169,110,0.07); border: 1px solid rgba(200,169,110,0.2); border-radius: 3px; }
        .tour-date-row.muted { background: rgba(200,169,110,0.03); border-color: rgba(200,169,110,0.1); }
        .tour-date-title { font-size: 0.94rem; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; color: var(--cream); font-weight: 400; margin-bottom: 0.1rem; }
        .tour-date-row.muted .tour-date-title { color: var(--mist); }
        .tour-date-detail { font-size: 0.66rem; color: var(--mist); opacity: 0.7; }
        .tour-date-row.muted .tour-date-detail { opacity: 0.5; }
        .tour-date-status { font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); background: rgba(200,169,110,0.12); border: 1px solid rgba(200,169,110,0.3); padding: 0.3rem 0.7rem; border-radius: 2px; white-space: nowrap; }
        .tour-date-row.muted .tour-date-status { color: var(--mist); background: transparent; border-color: transparent; opacity: 0.5; }
        .booking-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-section { border: 1px solid rgba(200,169,110,0.16); background: rgba(245,240,232,0.025); padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem; }
        .form-section-title { font-size: 0.62rem; letter-spacing: 0.24em; text-transform: uppercase; color: rgba(200,169,110,0.9); margin-bottom: 0.1rem; }
        .form-fields { border: 0; padding: 0; margin: 0; display: contents; }
        .form-fields:disabled { opacity: 0.58; }
        .form-fields:disabled input, .form-fields:disabled select, .form-fields:disabled textarea, .form-fields:disabled button { cursor: not-allowed; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-label { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); }
        .form-input, .form-select, .form-textarea { background: rgba(245,240,232,0.05); border: 1px solid rgba(245,240,232,0.12); color: var(--cream); padding: 0.8rem 1rem; font-family: var(--font-jost), 'Jost', sans-serif; font-size: 0.875rem; line-height: 1.3; font-weight: 300; width: 100%; min-height: 48px; box-sizing: border-box; transition: border-color 0.3s ease; outline: none; -webkit-appearance: none; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); }
        .form-input:-webkit-autofill, .form-input:-webkit-autofill:hover, .form-input:-webkit-autofill:focus, input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, textarea:-webkit-autofill, textarea:-webkit-autofill:hover, textarea:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 1000px #15120e inset !important; box-shadow: 0 0 0 1000px #15120e inset !important; -webkit-text-fill-color: var(--cream) !important; caret-color: var(--cream); border-color: rgba(200,169,110,0.35) !important; transition: background-color 9999s ease-in-out 0s; }
        .form-select option { background: var(--ink); }
        .form-textarea { resize: vertical; min-height: 80px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-check { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.8rem; color: var(--mist); opacity: 0.8; line-height: 1.5; cursor: pointer; }
        .form-check input[type="checkbox"] { appearance: none; width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; border: 1px solid rgba(245,240,232,0.3); background: transparent; cursor: pointer; position: relative; }
        .form-check input[type="checkbox"]:checked { background: var(--gold); border-color: var(--gold); }
        .submit-btn { background: var(--gold); color: var(--dark); border: none; padding: 1.1rem 2rem; font-family: var(--font-jost), 'Jost', sans-serif; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; cursor: pointer; transition: all 0.3s ease; width: 100%; margin-top: 0.5rem; }
        .submit-btn:hover { background: var(--rust); color: var(--cream); }
        .submit-btn:disabled { background: var(--sage); color: var(--cream); cursor: default; }
        .payment-checkout-card { max-width:100%; box-sizing:border-box; overflow:hidden; margin-top: 1rem; padding: 1.2rem; background: linear-gradient(145deg, rgba(245,240,232,0.075), rgba(99,91,255,0.08)); border: 1px solid rgba(200,169,110,0.24); border-radius: 6px; text-align: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
        .checkout-eyebrow { font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.55rem; }
        .checkout-copy { font-size: 0.85rem; color: var(--mist); line-height: 1.6; margin-bottom: 1rem; }
        .checkout-copy strong { color: var(--cream); }
        .stripe-trust-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; margin: 0 0 0.85rem; }
        .stripe-trust-row span { border: 1px solid rgba(245,240,232,0.14); background: rgba(14,12,9,0.44); color: rgba(245,240,232,0.72); border-radius: 999px; padding: 0.32rem 0.55rem; font-size: 0.62rem; letter-spacing: 0.08em; }
        .stripe-trust-row .stripe-wordmark { background: #635bff; border-color: #635bff; color: #fff; font-weight: 700; letter-spacing: -0.02em; text-transform: lowercase; }
        .checkout-note { font-size: 0.72rem; color: rgba(212,207,196,0.62); line-height: 1.6; margin-bottom: 1rem; }
        .form-error { margin-top: 0.75rem; color: #ffb4a6; font-size: 0.72rem; line-height: 1.5; text-align: center; }
        .checkout-button-wrap { position: relative; }
        .stripe-embed-wrap { width:100%; max-width:min(430px, 100%); margin: 0 auto; overflow:hidden; }
        .stripe-checkout-preview { width: 100%; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,244,249,0.96)); color: #0a2540; padding: 0; overflow: hidden; box-shadow: 0 18px 38px rgba(0,0,0,0.24); transition: opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease; }
        .stripe-checkout-preview:not(:disabled) { cursor: pointer; }
        .stripe-checkout-preview:not(:disabled):hover { transform: translateY(-1px); }
        .stripe-checkout-preview:disabled { opacity: 0.48; filter: grayscale(0.16); cursor: not-allowed; }
        .stripe-preview-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1rem 0.55rem; border-bottom: 1px solid rgba(10,37,64,0.08); }
        .stripe-preview-wordmark { background: #635bff; color: #fff; border-radius: 5px; padding: 0.28rem 0.5rem; font-size: 0.76rem; font-weight: 700; letter-spacing: -0.02em; text-transform: lowercase; }
        .stripe-preview-secure { color: rgba(10,37,64,0.62); font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; }
        .stripe-preview-body { display: block; padding: 0.85rem 1rem 1rem; text-align: left; }
        .stripe-preview-label { display: block; color: rgba(10,37,64,0.58); font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.32rem; }
        .stripe-preview-amount { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; color: #0a2540; font-size: 1.34rem; font-weight: 700; letter-spacing: -0.03em; }
        .stripe-preview-amount span { color: rgba(10,37,64,0.56); font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; white-space: nowrap; }
        .stripe-card-row { display: flex; gap: 0.35rem; margin-top: 0.85rem; }
        .stripe-card-row span { border: 1px solid rgba(10,37,64,0.14); border-radius: 4px; background: #fff; color: rgba(10,37,64,0.7); padding: 0.25rem 0.38rem; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.04em; }
        .stripe-pay-button { display: flex; width: 100%; box-sizing: border-box; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.15rem; background: linear-gradient(135deg, #635bff, #7b72ff); border: 1px solid rgba(255,255,255,0.16); border-radius: 5px; color: #fff; font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 500; text-decoration: none; box-shadow: 0 14px 34px rgba(99,91,255,0.24); transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .stripe-pay-button:hover { transform: translateY(-1px); box-shadow: 0 18px 42px rgba(99,91,255,0.34); }
        .stripe-pay-button strong { font-size: 0.78rem; color: #fff; white-space: nowrap; }
        .stripe-pay-button.disabled { opacity: 0.38; cursor: not-allowed; box-shadow: none; }
        .stripe-pay-button.disabled:hover { transform: none; box-shadow: none; }
        .stripe-buy-button-frame { width:100%; max-width:100%; overflow:hidden; min-height: 230px; transition: opacity 0.25s ease, filter 0.25s ease; }
        .stripe-buy-button-frame stripe-buy-button { display:block; max-width:100%; overflow:hidden; }
        .stripe-buy-button-frame.locked { opacity: 0.42; filter: grayscale(0.2); pointer-events: none; }
        .stripe-link-fallback { display: inline-flex; justify-content: center; margin-top: 0.75rem; color: rgba(245,240,232,0.58); font-size: 0.68rem; text-decoration: underline; text-underline-offset: 3px; }
        .checkout-lock-overlay { position: absolute; inset: 0; z-index: 2; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .checkout-lock-overlay p { max-width:calc(100% - 1rem); box-sizing:border-box; font-size: 0.7rem; letter-spacing: 0.12em; line-height:1.45; text-transform: uppercase; color: var(--gold); background: rgba(14,12,9,0.88); border: 1px solid rgba(200,169,110,0.24); padding: 0.5rem 0.75rem; pointer-events: none; white-space:normal; overflow-wrap:anywhere; }
        .checkout-error { margin-top: 0.75rem; color: #ffb4a6; font-size: 0.72rem; line-height: 1.5; text-align: center; }
        .lead-card-public { margin: 2.2rem auto 0; max-width: 460px; padding: 1.2rem; border: 1px solid rgba(200,169,110,0.22); border-radius: 8px; background: rgba(245,240,232,0.045); }
        .lead-card-public h3 { color: var(--cream); font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.65rem; font-weight: 300; margin: 0 0 0.4rem; }
        .lead-card-public p { color: rgba(212,207,196,0.72); font-size: 0.82rem; line-height: 1.6; margin: 0 0 1rem; }
        .lead-form { display: grid; gap: 0.6rem; }
        .lead-form input { width: 100%; box-sizing: border-box; border: 1px solid rgba(245,240,232,0.14); background: rgba(14,12,9,0.54); color: var(--cream); border-radius: 4px; padding: 0.86rem 1rem; font: inherit; outline: none; }
        .lead-form input:focus { border-color: var(--gold); }
        .lead-form button { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--gold); background: var(--gold); color: var(--dark); border-radius: 0; padding: 1rem 1.25rem; font-family: var(--font-jost), 'Jost', sans-serif; font-size: 0.72rem; letter-spacing: 0.18em; line-height: 1; text-transform: uppercase; font-weight: 700; cursor: pointer; transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s ease; }
        .lead-form button:hover:not(:disabled) { background: var(--cream); border-color: var(--cream); color: var(--dark); transform: translateY(-1px); }
        .lead-form button:disabled { opacity: 0.86; cursor: default; color: rgba(14,12,9,0.88); }
        .lead-message { margin-top: 0.75rem; font-size: 0.74rem; line-height: 1.5; color: var(--gold); }
        .lead-message.error { color: #ffb4a6; }
        .lead-privacy { margin-top: 0.75rem !important; margin-bottom: 0 !important; font-size: 0.68rem !important; line-height: 1.5 !important; color: rgba(212,207,196,0.56) !important; }
        .lightbox-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center; padding: 2rem; cursor: zoom-out; }
        .getting-there-section { background: var(--ink); padding: 8rem 6rem; }
        .getting-there-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; margin-top: 3rem; align-items: start; }
        .divider { display: flex; align-items: center; gap: 1.5rem; padding: 0 6rem; }
        .divider-line { flex: 1; height: 1px; background: rgba(200,169,110,0.15); }
        .divider-ornament { color: var(--gold); font-size: 0.8rem; }

        .faq-section { background: var(--ink); padding: 7rem 2rem; }
        footer { background: #120f0b; border-top: 1px solid rgba(200,169,110,0.18); padding: 4.5rem 2rem 3rem; text-align: center; }
        .footer-inner { max-width: 860px; margin: 0 auto; display: block; }
        .footer-kicker { font-size: 0.62rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
        .footer-logo { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5vw, 4rem); line-height: 0.95; letter-spacing: 0.16em; color: var(--cream); text-transform: uppercase; }
        .footer-tagline { font-size: 0.72rem; line-height: 1.8; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(200,169,110,0.88); margin: 1rem auto 0; max-width: 520px; }
        .footer-cta { display: inline-flex; margin-top: 2rem; padding: 1rem 1.8rem; background: var(--gold); border: 1px solid var(--gold); color: var(--dark); text-decoration: none; font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease; }
        .footer-cta:hover { background: var(--cream); border-color: var(--cream); color: var(--dark); transform: translateY(-2px); }
        .footer-links { margin: 3rem auto 0; display: flex; flex-wrap: wrap; gap: 0.9rem 1.5rem; justify-content: center; }
        .footer-link { color: rgba(200,169,110,0.86); text-decoration: none; font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase; transition: color 0.3s ease; }
        .footer-link:hover { color: var(--cream); }
        .footer-note { border-top: 1px solid rgba(200,169,110,0.14); max-width: 1120px; margin: 3.5rem auto 0; padding-top: 1.4rem; display: flex; justify-content: space-between; gap: 1rem; font-size: 0.75rem; color: rgba(212,207,196,0.68); }

        .reveal { opacity: 1; transform: translateY(0); transition: opacity 0.8s ease, transform 0.8s ease; }
        .js-reveal .reveal { opacity: 1; transform: translateY(0); }
        .js-reveal .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .js-reveal .reveal, .js-reveal .reveal.visible { opacity: 1 !important; transform: none !important; }
          .hero-bg { animation: none !important; }
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
        }

        @media (max-width: 900px) {
          section { padding: 5rem 2rem; }
          #main-nav { padding: 1.1rem 1.5rem; }
          .nav-links { display: none; }
          .nav-logo { font-size: 1.15rem; letter-spacing: 0.18em; }
          #main-nav.mobile-nav-hidden { transform: translateY(-100%); }
          .hero {
            height: auto;
            min-height: 100svh;
            min-height: 100dvh;
            padding-top: calc(5.25rem + env(safe-area-inset-top));
          }
          .hero-content {
            padding: 0 1.55rem calc(5.25rem + env(safe-area-inset-bottom));
            width: 100%;
          }
          .hero-overlay { background: linear-gradient(to top, rgba(14,12,9,0.97) 0%, rgba(14,12,9,0.6) 45%, rgba(14,12,9,0.25) 100%); }
          .hero-sub { margin-bottom: 1.2rem; }
          .hero-sub .mobile-line { display: inline; }
          .hero-sub .desktop-line { display: none; }
          .hero-actions { flex-direction: column; align-items: stretch; gap: 0.8rem; }
          .hero-actions .btn-primary, .hero-actions .btn-ghost { text-align: center; }
          .intro-points { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin-top: 2.2rem; align-items: start; }
          .offer-strip { padding: 1.25rem 1.2rem; grid-template-columns: 1fr; gap: 1rem; }
          .offer-strip-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .offer-fact { padding-left: 0.65rem; }
          .offer-fact strong { font-size: 0.82rem; }
          .offer-strip-cta { width: 100%; }
          .intro-point-value { font-size: clamp(1.25rem, 7vw, 1.55rem); }
          .intro-point-label { font-size: 0.48rem; letter-spacing: 0.12em; line-height: 1.55; overflow-wrap: normal; }
          .trust-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
          .trust-link { justify-content: center; align-items: center; text-align: center; padding: 0.85rem 0.6rem; font-size: 0.58rem; letter-spacing: 0.12em; line-height: 1.35; }
          .stats-bar { grid-template-columns: repeat(2,1fr); padding: 1.5rem 2rem; }
          .intro, .partnership, .booking, .included, .trust-conversion { grid-template-columns: 1fr; gap: 3rem; }
          .booking { padding: 4rem 1.2rem; }
          .scarcity-pill { display:flex; width:100%; padding:0.55rem 0.7rem; }
          .scarcity-pill span:last-child { font-size:0.6rem; letter-spacing:0.12em; }
          .price-card { padding: 1.25rem 0.9rem; margin-top:1.5rem !important; }
          .price-badge { display:block; width:100%; padding:0.45rem 0.55rem; text-align:center; font-size:0.52rem; letter-spacing:0.18em; }
          .price-amount { font-size: clamp(2.15rem, 15vw, 3.05rem); line-height:0.95; }
          .price-per { font-size:0.62rem; letter-spacing:0.1em; margin-bottom:1.15rem; }
          .price-note { padding:0.8rem; font-size:0.76rem; }
          .payment-split { grid-template-columns: 1fr; gap: 0.45rem; }
          .payment-split-card { padding: 0.85rem; }
          .payment-split-amount { font-size: 1.3rem; }
          .payment-split-arrow { transform: rotate(90deg); height: 1.1rem; }
          .payment-summary { padding:0.75rem 0.8rem; font-size:0.56rem; letter-spacing:0.12em; line-height:1.45; }
          .payment-detail-body { padding:0 0.8rem 0.85rem; }
          .price-spec-list { gap:0.45rem; margin-top:1rem; }
          .price-spec-row { display:grid; grid-template-columns:0.8fr 1.2fr; gap:0.8rem; font-size:0.76rem; line-height:1.45; }
          .tour-dates-card { padding: 1rem 0.8rem; }
          .tour-date-list { grid-template-columns: 1fr; gap: 0.35rem; }
          .tour-date-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.45rem; padding: 0.62rem 0.7rem; align-items: center; }
          .tour-date-title { font-size: 0.93rem; margin: 0; }
          .tour-date-detail { display: none; }
          .tour-date-status { font-size: 0.48rem; letter-spacing: 0.08em; padding: 0.24rem 0.42rem; }
          .booking-form { gap: 0.85rem; }
          .form-section { padding: 0.85rem; gap: 0.75rem; }
          .form-section-title { font-size: 0.56rem; letter-spacing: 0.16em; }
          .form-group { gap: 0.28rem; }
          .form-label { font-size: 0.54rem; letter-spacing: 0.11em; line-height: 1.35; }
          .form-input, .form-select, .form-textarea { min-height: 46px; padding: 0.62rem 0.72rem; font-size: 0.94rem; }
          .form-textarea { min-height: 88px; }
          .form-grid { grid-template-columns: 1fr; gap: 0.75rem; }
          .form-grid.compact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .trust { padding: 4rem 1.5rem; }
          .trust-grid { grid-template-columns: 1fr; }
          .testimonial-grid { grid-template-columns: 1fr; }
          .testimonial-photo { height: 280px; }
          .image-button.testimonial-photo { height: 280px; }
          .proof-strip { grid-template-columns: 1fr 1fr; }
          .itinerary-grid { grid-template-columns: 1fr; }
          .itin-tag { font-size: 0.75rem; }
          .itin-title { font-size: 2rem; }
          .itin-desc { font-size: 1rem; }
          .itin-list li { font-size: 0.95rem; }
          .photo-strip { height: 40vw; min-height: 200px; }
          .mosaic { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .mosaic-item.tall { grid-row: span 1; }
          .faq-section { padding: 4rem 1.5rem 3.5rem; }
          footer { padding: 3.25rem 1.5rem calc(3rem + env(safe-area-inset-bottom)); }
          .footer-inner { display: block; text-align: center; }
          .footer-kicker { margin-bottom: 0.8rem; }
          .footer-logo { font-size: clamp(2.15rem, 10vw, 3rem); letter-spacing: 0.12em; }
          .footer-tagline { font-size: 0.68rem; letter-spacing: 0.16em; max-width: 320px; }
          .footer-cta { width: 100%; justify-content: center; margin-top: 1.5rem; }
          .footer-links { margin-top: 2.5rem; gap: 1rem 1.2rem; }
          .main-album { display: block; column-count: 2; column-gap: 3px; }
          .main-album-item { display: block; width: 100%; margin: 0 0 3px; break-inside: avoid; page-break-inside: avoid; transform: translateZ(0); }
          .main-album-item.collage-lead { aspect-ratio: 3 / 4.25; }
          .main-album-item.collage-wide { aspect-ratio: 1 / 1; }
          .main-album-item.collage-tall { aspect-ratio: 3 / 4.6; }
          .main-album-item.collage-square { aspect-ratio: 1 / 1; }
          .main-album-item.collage-panorama { aspect-ratio: 4 / 3; }
          .main-album-item.collage-feature { aspect-ratio: 3 / 4.1; }
          .main-album-item.collage-finale { aspect-ratio: 4 / 5; }
          .main-album-item.collage-extra-wide { aspect-ratio: 4 / 3; }
          .main-album-item.collage-extra-tall { aspect-ratio: 3 / 4.6; }
          .lightbox-nav { width: 2.7rem; height: 2.7rem; font-size: 1.6rem; }
          .lightbox-close { top: calc(0.8rem + env(safe-area-inset-top)); right: calc(0.8rem + env(safe-area-inset-right)); width: 3.4rem; height: 3.4rem; font-size: 1.5rem; background: rgba(14,12,9,0.9); border-color: rgba(245,240,232,0.5); }
          .lightbox-prev { left: 0.5rem; }
          .lightbox-next { right: 0.5rem; }
          .footer-link { font-size: 0.66rem; letter-spacing: 0.14em; }
          .footer-note { margin-top: 2.5rem; padding-top: 1.2rem; flex-direction: column; font-size: 0.72rem; line-height: 1.6; }
          .getting-there-section { padding: 4rem 1.5rem; }
          .getting-there-grid { grid-template-columns: 1fr; gap: 3rem; }
          .divider { padding: 0 2rem; }
          .partnership-text { padding: 4rem 2rem; }
          .partnership-inline-photo { display: block !important; }
          .partnership-img { display: none; }
          .form-grid { grid-template-columns: 1fr; }
          .packing-grid { grid-template-columns: 1fr; }
          .payment-checkout-card { padding:0.8rem 0.55rem; }
          .checkout-eyebrow { font-size:0.58rem; letter-spacing:0.13em; }
          .checkout-copy { font-size:0.78rem; }
          .checkout-note { font-size:0.68rem; }
          .stripe-embed-wrap { max-width:100%; }
          .stripe-buy-button-frame { min-height:220px; }
          .checkout-lock-overlay p { font-size:0.58rem; letter-spacing:0.09em; padding:0.45rem 0.5rem; }
          .intro-img-accent { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav id="main-nav">
        <a href="#top" className="nav-logo">8 Lakes Tours</a>
        <div className="nav-links">
          <a href="/gallery" className="nav-social">Gallery</a>
          <a href="/about" className="nav-social">About</a>
          <a href="/preparation" className="nav-social">Prep</a>
          <a href="/faq" className="nav-social">FAQ</a>
          <a href="/contact" className="nav-social">Contact</a>
          <a href="#book" className="nav-cta">Reserve</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero" id="top">
        <div className="hero-bg">
          <Image
            src="/images/hero-sunset-valley.jpg"
            alt="Dramatic sunset over the Orkhon Valley and winding river in Mongolia"
            fill
            preload
            quality={82}
            sizes="100vw"
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">9 Days · Orkhon Valley & Eight Lakes · Mongolia</p>
          <h1 className="hero-title">Ride Into the<br /><em>Endless Steppe</em></h1>
          <p className="hero-sub">
            <span className="mobile-line">A 9-day small-group horseback expedition in Mongolia — hosted with nomadic families and open to beginner/intermediate riders.</span>
            <span className="desktop-line">A 9-day small-group horseback expedition through Mongolia&apos;s Orkhon Valley and Eight Lakes region — hosted with nomadic families, guided by local horsemen, and open to beginner/intermediate riders who want the real thing.</span>
          </p>
          <div className="hero-actions">
            <a href="#book" className="btn-primary">Reserve Online</a>
            <a href="#experience" className="btn-ghost">Explore the Journey</a>
          </div>
        </div>
      </div>

      <section className="offer-strip" aria-label="2026 expedition price and booking summary">
        <div>
          <p className="offer-strip-kicker">2026 expeditions open</p>
          <h2 className="offer-strip-title">Small-group Mongolia horse trek</h2>
        </div>
        <div className="offer-strip-facts">
          <div className="offer-fact"><strong>{pricing.tourPrice}</strong><span>Total per person</span></div>
          <div className="offer-fact"><strong>{pricing.onlinePayment}</strong><span>Pay online to reserve</span></div>
          <div className="offer-fact"><strong>{pricing.localFamilyPayment}</strong><span>Cash direct to hosts</span></div>
          <div className="offer-fact"><strong>Max 8</strong><span>Guests per departure</span></div>
        </div>
        <a className="offer-strip-cta" href="#book">See dates</a>
      </section>


      {/* INTRO */}
      <section className="intro" id="experience">
        <div className="intro-img reveal">
          <button
            type="button"
            className="image-button"
            aria-label="View larger image: Mongolian horseman in traditional dress"
            onClick={() => openLightbox('/images/guide.jpg', 'Mongolian horseman in traditional dress')}
          >
            <Image src="/images/guide.jpg" alt="Mongolian horseman in traditional dress" fill quality={72} sizes="(max-width: 900px) 100vw, 50vw" />
          </button>
          <span style={{position:'absolute', bottom:'1rem', left:'1rem', fontSize:'0.62rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(245,240,232,0.75)', background:'rgba(14,12,9,0.55)', padding:'0.35rem 0.7rem', backdropFilter:'blur(4px)', pointerEvents:'none'}}>Suma — Your Guide</span>
        </div>
        <div className="reveal reveal-delay-1">
          <span className="section-eyebrow">What This Is</span>
          <h2 className="section-title">Mongolia<br /><em>Beyond Tourism</em></h2>
          <p className="section-body">This isn&apos;t a curated tourist experience. You&apos;ll wake up in a ger, ride across open steppe with experienced local horsemen, and camp under skies that have no end. Every meal is shared. Every kilometer is earned.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>8 Lakes Tours is an Adventure Therapy journey built for people who want to be somewhere real, not just pass through it.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>That means some flexibility is part of the experience. Weather, horses, roads, group rhythm, and traditional host-family food can shape the day. You may be invited to step outside your comfort zone, but you are never forced to do every challenge — saying no, resting, or taking a quieter day around nomadic life is always allowed.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>Remote does not mean abandoned. On the steppe, uncertainty has always been part of life: travellers could lose their way between gers, so stopping at another family&apos;s home for tea, food, shelter, or directions became part of the culture. The same spirit runs through this trip — adapt to the land, accept hospitality, and let the day unfold without needing everything to go exactly to plan.</p>
          <div className="intro-points">
            <div><span className="intro-point-value">Beginner</span><p className="intro-point-label">Riders Welcome</p></div>
            <div><span className="intro-point-value">Small</span><p className="intro-point-label">Intimate Group</p></div>
            <div><span className="intro-point-value">Real</span><p className="intro-point-label">Family Partnership</p></div>
          </div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <div className="photo-strip">
        {STRIP_IMAGES.map((item) => (
          <div className="strip-item" key={item.src}>
            <button
              type="button"
              className="image-button"
              aria-label={`View larger image: ${item.alt}`}
              onClick={() => openLightbox(item.src, item.alt)}
            >
              <Image src={item.src} alt={item.alt} fill quality={70} sizes="(max-width: 900px) 20vw, 20vw" />
            </button>
          </div>
        ))}
      </div>

      {/* PARTNERSHIP */}
      <section className="partnership" style={{padding:0}}>
        <div className="partnership-text reveal">
          <span className="section-eyebrow">Our Local Partnership</span>
          <h2 className="section-title">The Family<br /><em>Behind It</em></h2>
          <button
            type="button"
            className="image-button partnership-inline-photo"
            aria-label="View larger image: Robert with the host family outside a traditional ger in Mongolia"
            onClick={() => openLightbox('/images/rob-family.jpg', 'Robert with the host family outside a traditional ger in Mongolia')}
          >
            <Image src="/images/rob-family.jpg" alt="Robert with the host family outside a traditional ger in Mongolia" fill quality={72} sizes="100vw" />
          </button>
          <p className="section-body">I met Ganbold while trekking solo through Mongolia. I hadn&apos;t planned to stay — but his family pulled me in with the kind of warmth that&apos;s hard to explain and impossible to forget. We rode together, shared meals, and spent evenings around the fire talking about the land, the horses, and the life they&apos;ve built here across three generations.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>Ganbold&apos;s son Suma grew up in this valley and has been guiding riders through it for years — he knows every trail, every animal, every shift in the weather. When I floated the idea of bringing small groups out here, both of them lit up. This trip exists because they wanted it to.</p>
          <p className="section-body" style={{marginTop:'1.2rem'}}>You won&apos;t be staying near the family — you&apos;ll be living with them. Same meals, same gers, same daily rhythm. Every booking supports the local hosts directly. That part matters to me.</p>
          <p style={{marginTop:'1.4rem', fontSize:'0.75rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', opacity:0.7}}>— Robert, Founder</p>
        </div>
        <div className="partnership-img reveal">
          <button
            type="button"
            className="image-button"
            aria-label="View larger image: Robert with the host family outside a traditional ger in Mongolia"
            onClick={() => openLightbox('/images/rob-family.jpg', 'Robert with the host family outside a traditional ger in Mongolia')}
          >
            <Image src="/images/rob-family.jpg" alt="Robert with the host family outside a traditional ger in Mongolia" fill quality={72} sizes="(max-width: 900px) 100vw, 50vw" />
          </button>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust" id="trust">
        <div className="trust-header reveal">
          <span className="section-eyebrow">Proof Before Promises</span>
          <h2 className="section-title">Built on<br /><em>Real Relationships</em></h2>
          <p className="section-body" style={{margin:'0 auto'}}>Real people have already made the journey into this valley. These are early guest impressions from the same world you&apos;ll be stepping into: horses, host families, big weather, and a place that feels very far from ordinary life.</p>
        </div>
        <div className="testimonial-grid">
          {[
            {
              name: 'Irik',
              src: '/images/testimonial-irik-clawson.jpg',
              alt: 'Irik Clawson riding on horseback at sunset in Mongolia',
              quote: 'Endless riding from one plain to the next, across the Steppe, by the lakes…. Magical. What more is there in life?',
            },
            {
              name: 'Fin',
              src: '/images/testimonial-fin-bennet.jpg',
              alt: 'Fin Bennet with children beside a traditional ger in Mongolia',
              quote: 'It couldn’t be further from back home and that makes me so excited.',
            },
          ].map(testimonial => (
            <article className="testimonial-card reveal" key={testimonial.name}>
              <button
                type="button"
                className="image-button testimonial-photo"
                aria-label={`View larger image: ${testimonial.alt}`}
                onClick={() => openLightbox(testimonial.src, testimonial.alt)}
              >
                <Image src={testimonial.src} alt={testimonial.alt} fill quality={76} sizes="(max-width: 900px) 100vw, 50vw" />
              </button>
              <div className="testimonial-body">
                <p className="testimonial-quote">“{testimonial.quote}”</p>
                <p className="testimonial-name">{testimonial.name}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="proof-strip reveal">
          <div className="proof-item"><span className="proof-value">8</span><span className="proof-label">Max guests</span></div>
          <div className="proof-item"><span className="proof-value">18+</span><span className="proof-label">Adults only</span></div>
          <div className="proof-item"><span className="proof-value">Insurance</span><span className="proof-label">Required</span></div>
          <div className="proof-item"><span className="proof-value">Direct</span><span className="proof-label">Family partnership</span></div>
        </div>
        <p className="section-body reveal" style={{textAlign:'center', margin:'2rem auto 0', maxWidth:'720px'}}>Follow the route, camp life and behind-the-scenes buildout on <a className="instagram-link" href="https://www.instagram.com/8lakestours" target="_blank" rel="noopener noreferrer">Instagram @8lakestours</a>.</p>
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

      {/* HOMEPAGE PHOTO COLLAGE */}
      <div className="main-album" id="homepage-photos" aria-label="8 Lakes Tours homepage photo collage">
        {MAIN_ALBUM_IMAGES.map((item) => (
          <div
            className={`main-album-item collage-${item.collage}${item.mobileFullWidth ? ' mobile-full-width' : ''}`}
            key={item.src}
          >
            <button
              type="button"
              className="image-button"
              aria-label={`View larger image: ${item.alt}`}
              onClick={() => openLightbox(item.src, item.alt)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                quality={70}
                sizes="(max-width: 900px) 50vw, 33vw"
                style={item.objectPosition ? { objectPosition: item.objectPosition } : undefined}
              />
            </button>
          </div>
        ))}
      </div>

      <section style={{background:'#0f0f0d', padding:'3rem 2rem', textAlign:'center', borderTop:'1px solid rgba(200,169,110,0.14)', borderBottom:'1px solid rgba(200,169,110,0.14)'}}>
        <p style={{fontSize:'0.65rem', letterSpacing:'0.26em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.75rem'}}>Want more photos?</p>
        <p style={{fontSize:'0.95rem', color:'rgba(212,207,196,0.78)', lineHeight:1.7, maxWidth:'620px', margin:'0 auto 1.3rem'}}>We keep the homepage focused on the trip decision. The fuller Mongolia photo archive lives in the gallery.</p>
        <a href="/gallery" className="btn-ghost">View Full Gallery</a>
      </section>
      {/* GETTING THERE */}
      <section className="getting-there-section">
        <div className="reveal">
          <span className="section-eyebrow">Getting There</span>
          <h2 className="section-title">Your Journey<br /><em>Starts in UB</em></h2>
        </div>
        <div className="getting-there-grid" style={{gridTemplateColumns:'minmax(0, 760px)', maxWidth:'900px'}}>
          <div className="reveal">
            <p className="section-body">From Ulaanbaatar, take a public bus to <strong style={{color:'var(--cream)'}}>Bat-Ulzii, Uvurkhangai</strong> — about an 8-hour ride through stunning Mongolian countryside.</p>
            <p className="section-body" style={{marginTop:'1.2rem'}}>Once you arrive in Bat-Ulzii, your host family will meet you and bring you to the ger village. Transport details, recommended local apps, and exact coordination notes will be included in your confirmation email after booking.</p>
            <div style={{marginTop:'2.5rem', padding:'1.5rem', background:'rgba(200,169,110,0.06)', borderLeft:'2px solid var(--gold)'}}>
              <p style={{fontSize:'0.65rem', letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.8rem'}}>Need Help?</p>
              <p style={{fontSize:'0.9rem', color:'var(--mist)', lineHeight:1.7, fontStyle:'italic'}}>WhatsApp contact details for both English-speaking and local Mongolian support will be provided upon confirmed booking.</p>
            </div>
          </div>
        </div>
      </section>
      {/* INCLUDED */}
      <section className="included">
        <div className="reveal">
          <h2 className="section-title">What&apos;s<br /><em>Included</em></h2>
          <p className="section-body" style={{marginBottom:'2rem'}}>Your {pricing.tourPrice} covers the full experience. No hidden costs.</p>
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
            <li><span className="icon">✦</span> Warm sleeping bag & personal camping comfort items</li>
            <li><span className="icon">✦</span> Riding layers, waterproof shell & sturdy boots</li>
            <li><span className="icon">✦</span> Personal snacks, medication, first-aid kit, painkillers & toiletries</li>
            <li><span className="icon">✦</span> Cash for the local family payment and personal extras</li>
          </ul>
          <details className="packing-details">
            <summary className="packing-summary">Suggested Packing List</summary>
            <ul className="packing-grid">
              {PACKING_LIST.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
          <div style={{marginTop:'2rem', padding:'1.2rem', background:'rgba(200,169,110,0.06)', borderLeft:'2px solid var(--gold)'}}>
            <p style={{fontSize:'0.8rem', color:'var(--mist)', opacity:0.8, lineHeight:1.6}}>All participants must sign a liability waiver, provide proof of travel insurance, bring their own personal medical basics, and arrive mentally prepared for simple conditions, changing plans, physical discomfort, and group life in the wild.</p>
          </div>
        </div>
      </section>

      <section className="trust-conversion">
        <div className="rob-photo reveal">
          <Image src="/images/rob-zaher.jpg" alt="Robert Zaher outdoors in warm evening light" fill quality={72} sizes="(max-width: 900px) 100vw, 35vw" />
        </div>
        <div className="trust-card-founder reveal reveal-delay-1">
          <span className="section-eyebrow">Who You&apos;re Booking With</span>
          <h2 className="section-title">Robert, the Family<br /><em>&amp; 8 Lakes Tours</em></h2>
          <p>8 Lakes Tours is organised by Robert Zaher after travelling and riding with Ganbold&apos;s family in the Orkhon Valley. Adventure Therapy supports the online booking flow and wider company structure, while the local family payment goes directly to your hosts in Mongolia.</p>
          <p style={{marginTop:'1rem'}}>All tour enquiries go through <strong style={{color:'var(--cream)'}}>info@8lakestours.com</strong>.</p>
          <div className="trust-actions">
            <a className="trust-link" href="mailto:info@8lakestours.com">Email the tour team</a>
            <a className="trust-link" href="https://www.instagram.com/robzaher108?igsh=OHdvdGp0ZW9ieHFv" target="_blank" rel="noopener noreferrer">Rob&apos;s Instagram</a>
          </div>
        </div>
      </section>

      <div className="divider"><div className="divider-line"></div><div className="divider-ornament">✦</div><div className="divider-line"></div></div>

      {/* BOOKING */}
      <section className="booking" id="book">
        <div className="reveal">
          <span className="section-eyebrow">Reserve Your Spot</span>
          <h2 className="section-title">Choose Your<br /><em>2026 Expedition</em></h2>
          <p className="section-body">Real guests have already made the journey. The 2026 8 Lakes Tours season is now open at {pricing.tourPrice} per person, with each departure capped at 8 participants.</p>
          <div className="scarcity-pill">
            <span style={{width:'7px', height:'7px', borderRadius:'50%', background:'var(--rust)', display:'inline-block', flexShrink:0}}></span>
            <span>Small groups only — each departure capped at 8 guests</span>
          </div>
          <div className="price-card" style={{marginTop:'2.5rem'}}>
            <span className="price-badge">2026 Season Rate — Limited Availability</span>
            <div className="price-amount">{pricing.tourPrice}</div>
            <div className="price-per">Per Person · 9 Days / 8 Nights · {pricing.countryLabel}</div>
            <div className="price-note">Pay {pricing.onlinePayment} online now to confirm your place. Bring {pricing.localFamilyPayment} in cash for the host family.</div>
            <div className="payment-split" aria-label="How the 8 Lakes Tours payment is split">
              <div className="payment-split-card">
                <span className="payment-split-label">Pay online</span>
                <span className="payment-split-amount">{pricing.onlinePayment}</span>
                <p className="payment-split-copy">Reserves your place with 8 Lakes Tours / Adventure Therapy.</p>
              </div>
              <div className="payment-split-arrow" aria-hidden="true">+</div>
              <div className="payment-split-card">
                <span className="payment-split-label">Pay locally</span>
                <span className="payment-split-amount">{pricing.localFamilyPayment}</span>
                <p className="payment-split-copy">Clean USD cash paid directly to the nomadic host family in Mongolia.</p>
              </div>
            </div>
            <details className="payment-details">
              <summary className="payment-summary">How payment works</summary>
              <div className="payment-detail-body">
                <p>Total trip price: {pricing.tourPrice} per person.</p>
                <p>The online payment goes through Adventure Therapy / 8 Lakes Tours to reserve your place. The {pricing.localFamilyPayment} local portion is paid directly in cash to the nomadic host families because they cannot reliably receive online transfers.</p>
                <p>If your plans change more than 3 weeks / 21 days before departure, the online amount is refundable minus unrecoverable Stripe/payment processing fees. Within 3 weeks / 21 days, we&apos;ll still try to help with a date transfer, replacement traveller, or partial refund where costs have not already been committed.</p>
                <p>We&apos;ll include exact cash instructions and timing in your confirmation notes.</p>
              </div>
            </details>
            <div className="price-spec-list">
              {[['Duration','9 Days / 8 Nights'],['Group Size','Max 8 Participants'],['Location','Orkhon Valley, Mongolia'],['Riding Level','Beginner – Intermediate']].map(([k,v]) => (
                <div key={k} className="price-spec-row">
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div className="ask-card">
              <h3>Not sure if this fits?</h3>
              <p>Ask before paying. We&apos;re happy to check riding level, food restrictions, route expectations, dates, or whether this is the right kind of adventure for you.</p>
              <a href="mailto:info@8lakestours.com?subject=Question%20before%20booking%208%20Lakes%20Tours">Ask a question first</a>
            </div>
          </div>
          <div className="tour-dates-card">
            <p style={{fontSize:'0.6rem', letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1rem'}}>Available Tour Dates — 2026</p>
            <div className="tour-date-list">
              {TOUR_DATES.map(dateOption => (
                <div className={`tour-date-row${dateOption.muted ? ' muted' : ''}`} key={dateOption.date}>
                  <div>
                    <p className="tour-date-title">{dateOption.date}</p>
                    <p className="tour-date-detail">{dateOption.detail}</p>
                  </div>
                  <span className="tour-date-status">{dateOption.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="reveal reveal-delay-1" id="application">
          <span className="section-eyebrow">Booking</span>
          <h2 className="section-title" style={{fontSize:'2rem', marginBottom:'1rem'}}>Reserve<br /><em>Your Place</em></h2>
          <p className="section-body" style={{fontSize:'0.9rem', marginBottom:'2rem'}}>We ask for a few details so we can match riders safely, prepare the host family, and send the right confirmation notes.</p>
          <form className="booking-form" onSubmit={async e => { e.preventDefault(); await submitBooking(e.currentTarget); }}>
            <input type="hidden" name="display_currency" value={pricing.currency} />
            <input type="hidden" name="display_tour_price" value={pricing.tourPrice} />
            <input type="hidden" name="display_online_payment" value={pricing.onlinePayment} />
            <input type="hidden" name="display_local_family_payment" value={pricing.localFamilyPayment} />
            <fieldset className="form-fields" disabled={formSubmitted || formSubmitting}>
            <div className="form-section">
              <p className="form-section-title">Contact details</p>
              <div className="form-grid compact-grid">
                <div className="form-group"><label className="form-label" htmlFor="first_name">First Name</label><input id="first_name" className="form-input" name="first_name" type="text" placeholder="First name" required /></div>
                <div className="form-group"><label className="form-label" htmlFor="last_name">Last Name</label><input id="last_name" className="form-input" name="last_name" type="text" placeholder="Last name" required /></div>
              </div>
              <div className="form-group"><label className="form-label" htmlFor="email">Email Address — Required for Confirmation</label><input id="email" className="form-input" name="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="form-grid compact-grid">
                <div className="form-group"><label className="form-label" htmlFor="phone">Phone Number</label><input id="phone" className="form-input" name="phone" type="tel" placeholder="+1 (555) 000-0000" /></div>
                <div className="form-group"><label className="form-label" htmlFor="nationality">Nationality</label><input id="nationality" className="form-input" name="nationality" type="text" placeholder="e.g. American" /></div>
              </div>
              <div className="form-group"><label className="form-label" htmlFor="emergency_contact">Emergency Contact (Name & Phone)</label><input id="emergency_contact" className="form-input" name="emergency_contact" type="text" placeholder="Name · Phone number" /></div>
            </div>

            <div className="form-section">
              <p className="form-section-title">Trip details</p>
              <div className="form-grid compact-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="riding_experience">Riding Experience</label>
                  <select id="riding_experience" className="form-select" name="riding_experience">
                    <option value="">Select level</option>
                    <option>Beginner — little to none</option>
                    <option>Intermediate — comfortable riding</option>
                    <option>Advanced — experienced rider</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="tour_date">Preferred Tour Date</label>
                  <select id="tour_date" className="form-select" name="tour_date">
                    <option value="">Select date</option>
                    {TOUR_DATES.map(dateOption => (
                      <option key={dateOption.date}>{dateOption.date}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label" htmlFor="dietary_restrictions">Dietary Restrictions</label><input id="dietary_restrictions" className="form-input" name="dietary_restrictions" type="text" placeholder="None, vegetarian, allergies, serious dairy/lactose issues, etc." /></div>
              <div className="form-group"><label className="form-label" htmlFor="how_heard">How did you hear about us?</label><input id="how_heard" className="form-input" name="how_heard" type="text" placeholder="Instagram, Rob, friend, Google, retreat group, etc." /></div>
              <div className="form-group"><label className="form-label" htmlFor="notes">Special Notes or Questions</label><textarea id="notes" className="form-textarea" name="notes" placeholder="Anything else we should know?"></textarea></div>
            </div>

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
              <label htmlFor="signature" style={{fontSize:'0.65rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', display:'block', marginBottom:'0.5rem'}}>Digital Signature — Type Your Full Name</label>
              <input
                id="signature"
                className="form-input signature-input"
                type="text"
                name="signature"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Your full name"
                style={{width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(200,169,110,0.3)', padding:'0.7rem 1rem', color:'var(--cream)', fontSize:'0.95rem', fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle:'italic', outline:'none', boxSizing:'border-box'}}
              />
              <p style={{fontSize:'0.7rem', color:'var(--mist)', opacity:0.5, marginTop:'0.4rem', lineHeight:1.5}}>By typing your name you confirm you have read and agree to the liability waiver.</p>
            </div>
            </fieldset>

            {/* Submit booking to ops */}
            {!formSubmitted ? (
              <button
                type="submit"
                disabled={!hasRequiredContact || formSubmitting}
                className="submit-btn"
                style={{marginTop:'0.5rem', opacity: hasRequiredContact ? 1 : 0.4, transition:'opacity 0.3s', cursor: hasRequiredContact ? 'pointer' : 'not-allowed'}}
              >
                {formSubmitting ? 'Submitting…' : 'Submit Booking'}
              </button>
            ) : (
              <div style={{marginTop:'0.5rem', padding:'0.9rem 1rem', background:'rgba(200,169,110,0.08)', border:'1px solid rgba(200,169,110,0.3)', borderRadius:'3px', textAlign:'center'}}>
                <p style={{fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)'}}>✓ Booking saved — complete your online booking payment below</p>
                {bookingReference && <p style={{fontSize:'0.68rem', color:'rgba(245,240,232,0.62)', marginTop:'0.4rem'}}>Reference: {bookingReference}</p>}
              </div>
            )}
            {formError && <p className="form-error">{formError}</p>}

            <div className="payment-checkout-card">
              <p className="checkout-eyebrow">Online Reservation Payment</p>
              <p className="checkout-copy">
                Submit the booking form with a valid email first, then pay <strong>{pricing.onlinePayment} online</strong> to reserve your place. The host-family cash portion is handled in Mongolia.
              </p>
              <p className="checkout-note">
                Localized prices are estimates for browsing. Stripe checkout confirms the final charge before payment.
              </p>
              <div className="checkout-button-wrap stripe-embed-wrap" aria-disabled={!canPay}>
                <Script async src="https://js.stripe.com/v3/buy-button.js" strategy="afterInteractive" />
                <div
                  className={`stripe-buy-button-frame${canPay ? '' : ' locked'}`}
                  dangerouslySetInnerHTML={{
                    __html: `<stripe-buy-button buy-button-id="${STRIPE_BUY_BUTTON_ID}" publishable-key="${STRIPE_PUBLISHABLE_KEY}" client-reference-id="${bookingReference || 'pending-booking'}"></stripe-buy-button>`,
                  }}
                />
                <a
                  className="stripe-link-fallback"
                  href={checkoutFallbackHref}
                  aria-disabled={!canPay}
                  tabIndex={canPay ? 0 : -1}
                  onClick={event => {
                    if (!canPay) event.preventDefault();
                  }}
                >
                  Open Stripe checkout
                </a>
                {!canPay && (
                  <div
                    className="checkout-lock-overlay"
                    onClick={e => { e.stopPropagation(); }}
                  >
                    <p>
                      {!emailIsValid ? 'Please enter a valid email address above' : !signatureIsValid ? 'Please type your full name as a signature above' : 'Submit your booking before payment'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p style={{fontSize:'0.72rem', color:'var(--mist)', opacity:0.5, textAlign:'center', lineHeight:1.6}}>Submitting this form does not guarantee a spot. We&apos;ll be in touch within 48 hours to confirm.</p>
            <p style={{fontSize:'0.7rem', color:'var(--mist)', opacity:0.4, textAlign:'center', lineHeight:1.6, marginTop:'0.5rem'}}>
              By submitting this form you agree to our{' '}
              <a href="/terms" style={{color:'var(--gold)', opacity:0.7, textDecoration:'underline', textUnderlineOffset:'3px'}}>Terms &amp; Conditions</a>
              {' '}and{' '}
              <a href="/privacy" style={{color:'var(--gold)', opacity:0.7, textDecoration:'underline', textUnderlineOffset:'3px'}}>Privacy Policy</a>.
              Your data will be used to process your booking enquiry and send relevant trip/prep updates. Reply to any email to opt out of marketing updates.
            </p>
          </form>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{background:'var(--dark)', padding:'7rem 2rem', textAlign:'center'}}>
        <div style={{maxWidth:'560px', margin:'0 auto'}}>
          <div className="reveal">
            <span className="section-eyebrow">Get In Touch</span>
            <h2 className="section-title">Have a<br /><em>Question?</em></h2>
            <p className="section-body" style={{marginTop:'1rem', marginBottom:'3rem'}}>We&apos;re happy to answer anything before you book — whether it&apos;s about the route, the horses, visa requirements, or packing. Reach out and we&apos;ll get back to you promptly.</p>
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
          <div className="lead-card-public reveal">
            <h3>Join the field notes</h3>
            <p>Not ready to reserve yet? Join the 8 Lakes update list for Mongolia field notes, new dates, practical prep emails, and future Adventure Therapy trips.</p>
            <form className="lead-form" onSubmit={submitLead}>
              <input
                type="text"
                name="name"
                placeholder="Name — optional"
                value={leadName}
                onChange={event => setLeadName(event.target.value)}
                autoComplete="name"
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={leadEmail}
                onChange={event => setLeadEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <button type="submit" disabled={leadStatus === 'saving' || leadStatus === 'saved'}>
                {leadStatus === 'saving' ? 'Saving…' : leadStatus === 'saved' ? 'Saved' : 'Join the list'}
              </button>
            </form>
            {leadStatus === 'saved' && <p className="lead-message">✓ You&apos;re on the list. We&apos;ll send only relevant trip notes and updates.</p>}
            {leadStatus === 'error' && <p className="lead-message error">{leadError}</p>}
            <p className="lead-privacy">Applicants are added automatically too, so nobody falls through the cracks. No spam — opt out by replying to any email.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div style={{maxWidth:'760px', margin:'0 auto'}}>
          <div className="reveal" style={{marginBottom:'4rem'}}>
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Common<br /><em>Questions</em></h2>
          </div>
          {[
            {q:'Is this trip legit?', a:"Yes. 8 Lakes Tours is organised by Robert Zaher after travelling and riding with Ganbold's family in the Orkhon Valley. Adventure Therapy supports the online booking/payment system, while the local family portion is paid directly to your hosts in Mongolia."},
            {q:'Can I speak to someone before booking?', a:"Yes. Email info@8lakestours.com with any questions before paying. You can also check Rob's Instagram at @robzaher108 while we keep tour email communication centralised through the info@ address."},
            {q:'What happens after I pay online?', a:'You will receive confirmation and practical preparation notes by email, including transport guidance, recommended local apps, packing reminders, insurance requirements, WhatsApp contacts, arrival timing, and exact cash-payment instructions for the host family.'},
            {q:'Do I need riding experience?', a:'No experience necessary. Beginners are welcome — our local guides will teach you everything you need to know before the trek begins.'},
            {q:'How flexible do I need to be?', a:'This is a real remote adventure, not a perfectly controlled resort itinerary. Weather, horse conditions, road access, and group dynamics can affect the plan. On the steppe, uncertainty has long been part of life: travellers could lose their way between gers, so hospitality, tea, food, shelter, directions, and mutual help became part of the culture. You may be encouraged to step outside your comfort zone, but nothing is forced — you can say no, rest, or take a quieter day around the host family and ger life.'},
            {q:'How physically demanding is the trek?', a:"Moderate. You'll ride several hours a day across open terrain and camp outdoors. A reasonable level of fitness is recommended but you don't need to be an athlete. You should also be mentally prepared for simple conditions, physical discomfort, changing plans, and sharing space with a group in the wild."},
            {q:'Are there Western toilets or showers in the countryside?', a:'No — once you leave the city, countryside toilet facilities are simple outhouses with squat toilets rather than Western flush toilets, and there are no regular showers. The cabins and ger stays can be warm and welcoming, but bathroom facilities are basic. Bring wet wipes for cleaning hands and body between river washes; washing in the river can be part of the simple, therapeutic steppe rhythm when conditions allow.'},
            {q:'What 2026 departure dates are available?', a:'We currently show seven fixed 2026 departures from June through September, plus private group dates on request through late September. Each departure is capped at 8 guests and final availability depends on host-family, horse, guide, and group logistics.'},
            {q:'What medical supplies should I bring?', a:'Bring a small personal first-aid kit, blister care, any prescription medication, basic toiletries, and any painkillers or anti-inflammatory medicine you normally use and can safely take. Guides carry basic first aid, but they are not medical professionals and cannot replace your own personal medical supplies.'},
            {q:'What airport do I fly into?', a:"Fly into Chinggis Khaan International Airport in Ulaanbaatar (UB). From there you'll take a public bus to Bat-Ulzii — about an 8-hour ride through stunning countryside."},
            {q:'Do I need a visa?', a:'US citizens receive a 90-day visa on arrival. All other nationalities should check with their local Mongolian embassy for current requirements.'},
            {q:'What is the weather like in the summer?', a:'Expect warm days between 15–24°C (60–75°F) and cold nights that can drop to 0–5°C (32–41°F), especially at higher altitudes. Pack layers — mornings and evenings in the Naiman Nuur region can get very cold.'},
            {q:'What do we eat?', a:'Three traditional Mongolian meals are provided daily. Meals are part of the host-family experience and are usually meat- and dairy-heavy: milk tea, yoghurt, cheese, meat, and animal products are normal. The dairy is one of the highest-quality parts of the experience — families often produce their own milk from yaks or cows and serve it fresh as milk tea, yoghurt, cheese, and other traditional foods. Vegetarian guests may be possible with advance notice, but strict vegan diets or serious dairy/lactose intolerance are difficult to support in this remote setting — contact us before booking if this is important.'},
            {q:'Can you support vegan, lactose-free, or strict dietary requirements?', a:'Honestly, this may not be the right tour for strict vegan travellers or anyone with serious dairy or lactose intolerance. Rural Mongolian families cannot reliably provide separate vegan or fully dairy-free meals, and we do not want to sell the trip to someone whose core food needs cannot be met safely or respectfully. For guests who can enjoy it, the host-family dairy is a special part of the trip: often made from the family’s own yak or cow milk and served fresh in traditional foods.'},
            {q:'Is there WiFi or cell service?', a:'Cell service is limited to none in the remote trek areas. Starlink or local connectivity may be available at some family camps or ger village stays, but treat internet as a helpful bonus rather than something to depend on constantly. If communication gets tricky, a phone with an AI translation app such as ChatGPT or another translator can be a great way to find words and connect across languages when a connection is available.'},
            {q:'What happens in a medical emergency?', a:'Basic first aid is available on site. All participants are required to have travel insurance with emergency evacuation coverage before the trip begins.'},
            {q:'Can I bring my children?', a:'This experience is designed for adults only. We do not accept participants under 18.'},
            {q:'Is this trip safe?', a:'Yes. Basic first aid is available on site and experienced local guides — including Suma, who has led numerous tourist groups through this terrain — are with you throughout the journey. Ground transportation is on call for emergencies and can reach the ger village within a few hours. All participants are required to carry travel insurance with emergency evacuation coverage before departure.'},
            {q:'How does payment work?', a:'The current 2026 rate is $2,159 per person. You pay $959 online through Adventure Therapy / 8 Lakes Tours to confirm your place. The remaining $1,200 is paid directly in cash to the nomadic host families in Mongolia, which keeps the local family portion transparent and direct.'},
            {q:'Why is part of the trip paid in cash locally?', a:'Many of the nomadic families we work with live outside traditional banking systems. Paying the $1,200 local family portion in cash ensures that money reaches the families directly. We will guide accepted guests through exactly when and how to bring the cash payment before departure.'},
            {q:'What is your cancellation policy?', a:'If your plans change more than 3 weeks / 21 days before departure, the $959 online booking payment is refundable minus unrecoverable Stripe/payment processing fees. Within 3 weeks / 21 days, we will still try to help with a transfer to another date, an approved replacement traveller, or a partial refund where costs have not already been committed. If 8 Lakes Tours cancels your departure, the online amount you paid to us is refunded minus unrecoverable Stripe/payment processing fees. The $1,200 local family payment is paid in cash in Mongolia and is not collected online by Adventure Therapy or 8 Lakes Tours.'},
          ].map(({q, a}, i) => (
            <div key={i} className="reveal" style={{borderTop:'1px solid rgba(200,169,110,0.15)', padding:'1.8rem 0'}}>
              <p style={{fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif", fontSize:'1.15rem', fontWeight:400, color:'var(--cream)', marginBottom:'0.6rem'}}>{q}</p>
              <p style={{fontSize:'0.875rem', color:'var(--mist)', lineHeight:1.75, opacity:0.8}}>{a}</p>
            </div>
          ))}
          <div style={{borderTop:'1px solid rgba(200,169,110,0.15)'}} />
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-kicker">Mongolia · Small-group horseback expeditions</div>
            <div className="footer-logo">8 Lakes<br />Tours</div>
            <div className="footer-tagline">An Adventure Therapy journey through the Orkhon Valley and Eight Lakes region.</div>
            <a className="footer-cta" href="#application">Reserve a Spot</a>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <a className="footer-link" href="https://www.instagram.com/8lakestours" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a className="footer-link" href="/gallery">Gallery</a>
            <a className="footer-link" href="/about">About</a>
            <a className="footer-link" href="/preparation">Preparation</a>
            <a className="footer-link" href="/faq">FAQ</a>
            <a className="footer-link" href="/contact">Contact</a>
            <a className="footer-link" href="/terms">Terms</a>
            <a className="footer-link" href="/privacy">Privacy</a>
          </nav>
        </div>
        <div className="footer-note">
          <span>© 2026 8 Lakes Tours. All rights reserved.</span>
          <span>Built for direct local family partnership in Mongolia.</span>
        </div>
      </footer>

      {lightboxImage && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={lightboxImage.alt} onClick={() => setLightboxIndex(null)}>
          <button type="button" className="lightbox-close" onClick={event => { event.stopPropagation(); setLightboxIndex(null); }} aria-label="Close expanded image">×</button>
          <button type="button" className="lightbox-nav lightbox-prev" onClick={event => { event.stopPropagation(); showPreviousImage(); }} aria-label="Previous image">‹</button>
          <div className="lightbox-frame" onClick={event => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Lightbox uses direct local originals so adjacent-photo preloading makes next/prev feel instant. */}
            <img className="lightbox-image" src={lightboxImage.src} alt={lightboxImage.alt} decoding="async" />
          </div>
          <button type="button" className="lightbox-nav lightbox-next" onClick={event => { event.stopPropagation(); showNextImage(); }} aria-label="Next image">›</button>
        </div>
      )}

      {showWaiver && <WaiverModal onClose={() => setShowWaiver(false)} onAgree={() => setShowWaiver(false)} />}

    </>
  );
}
