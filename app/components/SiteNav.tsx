'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SiteNav() {
  useEffect(() => {
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    const updateNav = () => {
      const currentScrollY = window.scrollY;
      nav.classList.toggle('nav-solid', currentScrollY > 80);
    };

    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
    return () => window.removeEventListener('scroll', updateNav);
  }, []);

  return (
    <nav id="site-nav" className="site-nav" aria-label="Site navigation">
      <Link href="/" className="site-nav-logo" aria-label="8 Lakes Tours home">8 Lakes Tours</Link>

      <div className="site-nav-desktop-links" aria-label="Primary navigation">
        <Link href="/gallery">Gallery</Link>
        <Link href="/about">About</Link>
        <Link href="/preparation">Prep</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/#book" className="site-nav-cta">Reserve</Link>
      </div>

      <div className="site-nav-mobile-actions" aria-label="Quick navigation">
        <Link href="/" className="site-nav-home-mobile">Home</Link>
        <Link href="/#book" className="site-nav-cta">Reserve</Link>
      </div>

      <style jsx global>{`
        #site-nav.site-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 1.5rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to bottom, rgba(14,12,9,0.88) 0%, transparent 100%);
          border-bottom: 1px solid transparent;
          transition: background 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
        }
        #site-nav.site-nav.nav-solid {
          background: rgba(14,12,9,0.95);
          border-bottom-color: rgba(200,169,110,0.15);
          backdrop-filter: blur(12px);
        }
        #site-nav .site-nav-logo {
          flex: 0 0 auto;
          font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: #f5f0e8;
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
        }
        #site-nav .site-nav-desktop-links,
        #site-nav .site-nav-mobile-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        #site-nav .site-nav-mobile-actions { display: none; }
        #site-nav .site-nav-desktop-links a,
        #site-nav .site-nav-mobile-actions a {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,240,232,0.78);
          text-decoration: none;
          transition: color 0.3s ease, background 0.3s ease, border-color 0.3s ease;
          white-space: nowrap;
        }
        #site-nav .site-nav-desktop-links a:hover,
        #site-nav .site-nav-mobile-actions a:hover { color: #c8a96e; }
        #site-nav .site-nav-cta {
          color: #0e0c09 !important;
          background: #c8a96e;
          border: 1px solid #c8a96e;
          padding: 0.6rem 1.4rem;
          font-weight: 700;
        }
        #site-nav .site-nav-cta:hover {
          background: #f5f0e8;
          border-color: #f5f0e8;
          color: #0e0c09 !important;
        }
        @media (max-width: 900px) {
          #site-nav.site-nav {
            padding: 0.75rem max(0.85rem, env(safe-area-inset-right)) 0.75rem max(0.95rem, env(safe-area-inset-left));
            gap: 0.65rem;
            background: rgba(14,12,9,0.94);
            border-bottom-color: rgba(200,169,110,0.14);
            backdrop-filter: blur(12px);
          }
          #site-nav .site-nav-desktop-links { display: none !important; }
          #site-nav .site-nav-mobile-actions {
            display: flex !important;
            gap: 0.42rem;
            margin-left: auto;
            flex: 0 0 auto;
          }
          #site-nav .site-nav-logo {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.95rem;
            letter-spacing: 0.12em;
          }
          #site-nav .site-nav-mobile-actions a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2.05rem;
            font-size: 0.58rem;
            letter-spacing: 0.11em;
            line-height: 1;
          }
          #site-nav .site-nav-home-mobile {
            color: rgba(245,240,232,0.9);
            border: 1px solid rgba(245,240,232,0.24);
            padding: 0.55rem 0.66rem;
            background: rgba(245,240,232,0.04);
          }
          #site-nav .site-nav-cta { padding: 0.55rem 0.72rem; }
        }
        @media (max-width: 370px) {
          #site-nav.site-nav { padding-inline: 0.72rem; gap: 0.45rem; }
          #site-nav .site-nav-logo { font-size: 0.82rem; letter-spacing: 0.08em; }
          #site-nav .site-nav-mobile-actions { gap: 0.32rem; }
          #site-nav .site-nav-mobile-actions a { font-size: 0.54rem; letter-spacing: 0.08em; }
          #site-nav .site-nav-home-mobile { padding-inline: 0.52rem; }
          #site-nav .site-nav-cta { padding-inline: 0.6rem; }
        }
      `}</style>
    </nav>
  );
}
