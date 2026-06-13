'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { GalleryImage } from './gallery-data';

type Filter = 'all' | 'portrait' | 'landscape';

export default function GalleryClient({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const visibleImages = useMemo(() => {
    if (filter === 'all') return images;
    return images.filter(image => image.orientation === filter);
  }, [filter, images]);
  const lightboxImage = lightboxIndex === null ? null : visibleImages[lightboxIndex];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const showPrevious = () => setLightboxIndex(current => current === null ? current : (current + visibleImages.length - 1) % visibleImages.length);
  const showNext = () => setLightboxIndex(current => current === null ? current : (current + 1) % visibleImages.length);

  useEffect(() => {
    if (lightboxIndex === null || typeof window === 'undefined') return;
    document.documentElement.style.overflow = 'hidden';

    const preloadIndexes = [
      lightboxIndex,
      (lightboxIndex + 1) % visibleImages.length,
      (lightboxIndex + visibleImages.length - 1) % visibleImages.length,
      (lightboxIndex + 2) % visibleImages.length,
    ];

    preloadIndexes.forEach(index => {
      const src = visibleImages[index]?.src;
      if (!src) return;
      const image = new window.Image();
      image.decoding = 'async';
      image.src = src;
    });

    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [lightboxIndex, visibleImages]);

  return (
    <>
      <div className="gallery-controls" aria-label="Gallery filters">
        {(['all', 'landscape', 'portrait'] as Filter[]).map(option => (
          <button
            key={option}
            type="button"
            className={`filter-button ${filter === option ? 'active' : ''}`}
            onClick={() => { setFilter(option); setLightboxIndex(null); }}
          >
            {option === 'all' ? `All ${images.length}` : `${option} ${images.filter(image => image.orientation === option).length}`}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {visibleImages.map((image, index) => (
          <button
            type="button"
            className={`gallery-card ${image.orientation}`}
            key={image.src}
            onClick={() => openLightbox(index)}
            aria-label={`Open image: ${image.alt}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              quality={72}
              sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {lightboxImage && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={lightboxImage.alt} onClick={closeLightbox}>
          <button type="button" className="lightbox-close" onClick={event => { event.stopPropagation(); closeLightbox(); }} aria-label="Close image">×</button>
          <button type="button" className="lightbox-nav lightbox-prev" onClick={event => { event.stopPropagation(); showPrevious(); }} aria-label="Previous image">‹</button>
          <div className="lightbox-frame" onClick={event => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Gallery lightbox uses direct local originals with adjacent preloading for instant browsing. */}
            <img src={lightboxImage.src} alt={lightboxImage.alt} decoding="async" />
          </div>
          <button type="button" className="lightbox-nav lightbox-next" onClick={event => { event.stopPropagation(); showNext(); }} aria-label="Next image">›</button>
        </div>
      )}
    </>
  );
}
