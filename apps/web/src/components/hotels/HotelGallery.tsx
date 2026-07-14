"use client";

import { useState } from "react";
import Image from "next/image";

interface HotelGalleryProps {
  images: string[];
  name: string;
}

export function HotelGallery({ images, name }: HotelGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const shown = images.slice(0, 5);
  const remaining = images.length - 5;

  if (images.length === 0) return null;

  return (
    <>
      {/* Grid layout */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden">
        {/* Main large image */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden"
          onClick={() => setLightbox(0)}
        >
          <Image
            src={shown[0]}
            alt={`${name} — photo 1`}
            fill
            priority
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 40vw"
          />
        </div>

        {/* Thumbnails */}
        {shown.slice(1, 5).map((src, idx) => (
          <div
            key={idx}
            className="relative cursor-pointer overflow-hidden"
            onClick={() => setLightbox(idx + 1)}
          >
            <Image
              src={src}
              alt={`${name} — photo ${idx + 2}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="25vw"
            />
            {/* "Show all" overlay on last visible */}
            {idx === 3 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">+{remaining} more</span>
              </div>
            )}
          </div>
        ))}

        {/* Fill remaining slots with placeholder if fewer than 5 images */}
        {shown.length < 5 &&
          Array.from({ length: 5 - shown.length - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-100" />
          ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightbox]}
              alt={`${name} — photo ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          {lightbox < images.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
