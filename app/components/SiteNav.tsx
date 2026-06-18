'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SiteNav() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    const updateNav = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      const scrollDelta = currentScrollY - lastScrollY;

      nav.classList.toggle('nav-solid', currentScrollY > 80);

      if (!isMobile || currentScrollY <= 120 || scrollDelta < -4) {
        nav.classList.remove('mobile-nav-hidden');
      } else if (scrollDelta > 4) {
        nav.classList.add('mobile-nav-hidden');
      }

      lastScrollY = Math.max(currentScrollY, 0);
    };

    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
    return () => window.removeEventListener('scroll', updateNav);
  }, []);

  return (
    <nav id="site-nav" className="site-nav">
      <Link href="/" className="site-nav-logo">8 Lakes Tours</Link>
      <div className="site-nav-links">
        <Link href="/gallery">Gallery</Link>
        <Link href="/about">About</Link>
        <Link href="/preparation">Prep</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/#book" className="site-nav-cta">Reserve</Link>
      </div>
      <style jsx>{`
        .site-nav {
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
        .site-nav.nav-solid {
          background: rgba(14,12,9,0.95);
          border-bottom-color: rgba(200,169,110,0.15);
          backdrop-filter: blur(12px);
        }
        .site-nav-logo {
          font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: #f5f0e8;
          text-decoration: none;
          text-transform: uppercase;
        }
        .site-nav-links {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .site-nav-links a {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,240,232,0.78);
          text-decoration: none;
          transition: color 0.3s ease, background 0.3s ease, border-color 0.3s ease;
          white-space: nowrap;
        }
        .site-nav-links a:hover { color: #c8a96e; }
        .site-nav-links .site-nav-cta {
          color: #f5f0e8;
          border: 1px solid rgba(245,240,232,0.4);
          padding: 0.6rem 1.4rem;
        }
        .site-nav-links .site-nav-cta:hover {
          background: #c8a96e;
          border-color: #c8a96e;
          color: #0e0c09;
        }
        @media (max-width: 900px) {
          .site-nav { padding: 1.1rem 1.5rem; }
          .site-nav-links { display: none; }
          .site-nav-logo { font-size: 1.15rem; letter-spacing: 0.18em; }
          .site-nav.mobile-nav-hidden { transform: translateY(-100%); }
        }
      `}</style>
    </nav>
  );
}
