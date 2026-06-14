"use client";

import { useState, useEffect, useCallback } from "react";
import MasonryGrid from "./MasonryGrid";

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? photos.length - 1 : prev - 1;
    });
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      return prev === photos.length - 1 ? 0 : prev + 1;
    });
  }, [photos.length]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          goToPrev();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, closeLightbox, goToPrev, goToNext]);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <>
      <MasonryGrid>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
            onClick={() => openLightbox(index)}
          >
            <div className="relative overflow-hidden">
              <img
                src={photo.url}
                alt={photo.caption || "Photo"}
                className="w-full h-auto group-hover:brightness-90 transition-all duration-300"
                loading="lazy"
              />
            </div>
            {photo.caption && (
              <div className="p-3">
                <p className="text-gray-300 text-sm">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </MasonryGrid>

      {/* Lightbox Overlay */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all duration-200"
            aria-label="Close preview"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all duration-200"
              aria-label="Previous photo"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Photo Container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || "Photo preview"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            {selectedPhoto.caption && (
              <p className="mt-4 text-white/90 text-center text-sm sm:text-base max-w-lg">
                {selectedPhoto.caption}
              </p>
            )}
            {/* Photo counter */}
            <p className="mt-2 text-white/50 text-xs">
              {selectedIndex! + 1} / {photos.length}
            </p>
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all duration-200"
              aria-label="Next photo"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
