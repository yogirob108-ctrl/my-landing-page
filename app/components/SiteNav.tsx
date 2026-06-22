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
    <nav id="site-nav" className="site-nav">
      <Link href="/" className="site-nav-logo">8 Lakes Tours</Link>
      <div className="site-nav-links">
        <Link href="/" className="site-nav-home-mobile">Home</Link>
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
          color: #0e0c09;
          background: #c8a96e;
          border: 1px solid #c8a96e;
          padding: 0.6rem 1.4rem;
          font-weight: 700;
        }
        .site-nav-links .site-nav-cta:hover {
          background: #f5f0e8;
          border-color: #f5f0e8;
          color: #0e0c09;
        }
        .site-nav-home-mobile { display: none; }
        @media (max-width: 900px) {
          .site-nav { padding: 0.85rem 0.85rem 0.85rem 1rem; gap: 0.75rem; }
          .site-nav-links { display: flex; gap: 0.45rem; margin-left: auto; }
          .site-nav-links a { display: none; font-size: 0.58rem; letter-spacing: 0.12em; }
          .site-nav-links .site-nav-home-mobile,
          .site-nav-links .site-nav-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 2.15rem; }
          .site-nav-links .site-nav-home-mobile {
            color: rgba(245,240,232,0.9);
            border: 1px solid rgba(245,240,232,0.24);
            padding: 0.55rem 0.72rem;
            background: rgba(14,12,9,0.42);
          }
          .site-nav-links .site-nav-cta { padding: 0.55rem 0.82rem; }
          .site-nav-logo { font-size: 1rem; letter-spacing: 0.14em; }
        }
        @media (max-width: 390px) {
          .site-nav-logo { font-size: 0.86rem; letter-spacing: 0.1em; }
          .site-nav-links .site-nav-home-mobile { padding-inline: 0.58rem; }
          .site-nav-links .site-nav-cta { padding-inline: 0.68rem; }
        }
      `}</style>
    </nav>
  );
}
