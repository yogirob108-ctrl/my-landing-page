"use client";

import { track } from '@vercel/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function LandingCta({ href, label, placement }: { href: string; label: string; placement: string }) {
  function recordClick() {
    track('paid_search_cta_click', { placement });
    window.gtag?.('event', 'paid_search_cta_click', {
      event_category: 'booking_funnel',
      placement,
    });
  }

  return <a href={href} onClick={recordClick}>{label}</a>;
}
