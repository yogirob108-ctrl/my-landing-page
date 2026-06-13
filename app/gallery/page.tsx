import type { Metadata } from 'next';
import Link from 'next/link';
import GalleryClient from './GalleryClient';
import { GALLERY_IMAGES } from './gallery-data';

export const metadata: Metadata = {
  title: 'Photo Gallery | 8 Lakes Tours',
  description: 'A full photo gallery from 8 Lakes Tours: horses, host families, gers, mountain valleys, river crossings, and the Eight Lakes region of Mongolia.',
  alternates: { canonical: 'https://www.8lakestours.com/gallery' },
  robots: { index: true, follow: true },
};

export default function GalleryPage() {
  return (
    <main className="gallery-page">
      <nav className="gallery-nav">
        <Link href="/" className="gallery-logo">8 Lakes Tours</Link>
        <div className="gallery-nav-links">
          <Link href="/">Home</Link>
          <Link href="/#book">Reserve</Link>
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
        </div>
      </nav>

      <header className="gallery-hero">
        <p className="eyebrow">Field Notes · Mongolia</p>
        <h1>Photo Gallery</h1>
        <p>
          A deeper look at the world around the expedition: horses, gers, river crossings,
          host-family country, big weather, and the valleys between Orkhon and Eight Lakes.
        </p>
        <div className="gallery-meta">
          <span>{GALLERY_IMAGES.length} photos</span>
          <span>Tap any image to view full-frame</span>
        </div>
      </header>

      <GalleryClient images={GALLERY_IMAGES} />

      <footer className="gallery-footer">
        <span>© 2026 8 Lakes Tours</span>
        <Link href="/#book">Reserve a spot</Link>
      </footer>

      <style>{`
        .gallery-page { min-height: 100vh; background: #0e0c09; color: #d4cfc4; font-family: var(--font-jost), 'Jost', sans-serif; font-weight: 300; }
        .gallery-nav { position: sticky; top: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 1.2rem; padding: 1.2rem 3rem; background: rgba(14,12,9,0.9); border-bottom: 1px solid rgba(200,169,110,0.15); backdrop-filter: blur(12px); }
        .gallery-logo { color: #f5f0e8; text-decoration: none; text-transform: uppercase; letter-spacing: 0.18em; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: 1.15rem; }
        .gallery-nav-links { display: flex; gap: 1rem; flex-wrap: wrap; }
        .gallery-nav-links a, .gallery-footer a { color: #c8a96e; text-decoration: none; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.68rem; }
        .gallery-hero { max-width: 980px; margin: 0 auto; padding: 6rem 2rem 3rem; text-align: center; }
        .eyebrow { margin-bottom: 1rem; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.3em; font-size: 0.68rem; }
        .gallery-hero h1 { margin: 0; color: #f5f0e8; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: clamp(3.3rem, 9vw, 7rem); line-height: 0.9; font-weight: 300; }
        .gallery-hero p:not(.eyebrow) { max-width: 680px; margin: 1.5rem auto 0; font-size: 1rem; line-height: 1.8; color: rgba(212,207,196,0.82); }
        .gallery-meta { margin-top: 2rem; display: flex; justify-content: center; gap: 0.8rem; flex-wrap: wrap; }
        .gallery-meta span { border: 1px solid rgba(200,169,110,0.25); color: rgba(245,240,232,0.78); padding: 0.55rem 0.8rem; border-radius: 999px; font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; }
        .gallery-controls { position: sticky; top: 65px; z-index: 18; display: flex; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(14,12,9,0.82); backdrop-filter: blur(10px); border-top: 1px solid rgba(200,169,110,0.1); border-bottom: 1px solid rgba(200,169,110,0.1); }
        .filter-button { border: 1px solid rgba(200,169,110,0.28); background: transparent; color: rgba(245,240,232,0.72); padding: 0.65rem 0.9rem; border-radius: 999px; cursor: pointer; font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; }
        .filter-button.active { background: #c8a96e; color: #0e0c09; border-color: #c8a96e; }
        .gallery-grid { padding: 3px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px; background: #0f0f0d; }
        .gallery-card { all: unset; position: relative; display: block; overflow: hidden; background: #17130e; cursor: zoom-in; min-height: 260px; }
        .gallery-card.portrait { grid-row: span 2; }
        .gallery-card img { display: block; width: 100%; height: 100%; min-height: inherit; object-fit: cover; transition: transform 0.5s ease, filter 0.5s ease; }
        .gallery-card:hover img { transform: scale(1.035); filter: brightness(1.08); }
        .gallery-caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 2rem 1rem 0.9rem; background: linear-gradient(180deg, transparent, rgba(14,12,9,0.9)); color: rgba(245,240,232,0.78); font-size: 0.55rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0; transition: opacity 0.3s ease; }
        .gallery-card:hover .gallery-caption { opacity: 1; }
        .gallery-lightbox { position: fixed; inset: 0; z-index: 1000; background: rgba(14,12,9,0.96); display: flex; align-items: center; justify-content: center; padding: 1.5rem; cursor: zoom-out; }
        .lightbox-frame { width: min(96vw, 1800px); height: min(86vh, 1100px); display: flex; align-items: center; justify-content: center; }
        .lightbox-frame img { width: 100%; height: 100%; object-fit: contain; }
        .lightbox-close, .lightbox-nav { position: fixed; z-index: 1001; border: 1px solid rgba(245,240,232,0.35); background: rgba(14,12,9,0.82); color: #f5f0e8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .lightbox-close { top: calc(1rem + env(safe-area-inset-top)); right: calc(1rem + env(safe-area-inset-right)); width: 3rem; height: 3rem; border-radius: 999px; font-size: 1.4rem; }
        .lightbox-nav { top: 50%; transform: translateY(-50%); width: 3rem; height: 3rem; border-radius: 999px; font-size: 1.8rem; }
        .lightbox-prev { left: 1rem; }
        .lightbox-next { right: 1rem; }
        .lightbox-caption { position: fixed; left: 50%; bottom: 1.2rem; transform: translateX(-50%); color: rgba(212,207,196,0.82); font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; text-align: center; max-width: min(88vw, 760px); }
        .gallery-footer { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 2rem 3rem; border-top: 1px solid rgba(200,169,110,0.15); color: rgba(212,207,196,0.5); font-size: 0.75rem; }
        @media (max-width: 1100px) { .gallery-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px) {
          .gallery-nav { padding: 1rem 1.25rem; }
          .gallery-nav-links { gap: 0.75rem; }
          .gallery-nav-links a { font-size: 0.58rem; }
          .gallery-hero { padding: 4.5rem 1.25rem 2rem; }
          .gallery-controls { top: 58px; overflow-x: auto; justify-content: flex-start; }
          .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gallery-card { min-height: 190px; }
          .gallery-card.portrait { min-height: 300px; }
          .gallery-caption { opacity: 1; padding: 1.4rem 0.65rem 0.65rem; font-size: 0.48rem; }
          .lightbox-nav { width: 2.7rem; height: 2.7rem; }
          .lightbox-prev { left: 0.5rem; }
          .lightbox-next { right: 0.5rem; }
          .lightbox-close { width: 3.3rem; height: 3.3rem; }
          .gallery-footer { padding: 1.5rem; }
        }
      `}</style>
    </main>
  );
}
