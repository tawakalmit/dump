"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MasonryGrid from "./MasonryGrid";
import {
  getCloudinaryOptimized,
  getCloudinaryVideoThumbnail,
  getCloudinaryVideoSrc,
  getCloudinaryDownloadUrl,
  isVideo,
} from "@/lib/cloudinary-url";

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  media_type?: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [showArrows, setShowArrows] = useState(true);

  // Touch/swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const openLightbox = (index: number) => {
    setSlideDirection(null);
    setSelectedIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
    setSlideDirection(null);
    setIsAnimating(false);
  }, []);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setSlideDirection("right");
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        return prev === 0 ? photos.length - 1 : prev - 1;
      });
      setIsAnimating(false);
    }, 200);
  }, [photos.length, isAnimating]);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setSlideDirection("left");
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        return prev === photos.length - 1 ? 0 : prev + 1;
      });
      setIsAnimating(false);
    }, 200);
  }, [photos.length, isAnimating]);

  // Touch event handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left -> go to next
        goToNext();
      } else {
        // Swiped right -> go to prev
        goToPrev();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [goToNext, goToPrev]);

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

  // Determine animation class for slide effect
  const getSlideClass = () => {
    if (!slideDirection) return "animate-[fadeIn_200ms_ease-out]";
    if (slideDirection === "left") {
      return "animate-[slideInFromRight_250ms_ease-out]";
    }
    return "animate-[slideInFromLeft_250ms_ease-out]";
  };

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
              {isVideo(photo.url, photo.media_type) ? (
                <>
                  <img
                    src={getCloudinaryVideoThumbnail(photo.url, 800)}
                    alt={photo.caption || "Video"}
                    className="w-full h-auto group-hover:brightness-90 transition-all duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 flex items-center justify-center bg-black/50 group-hover:bg-black/60 rounded-full transition-colors">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={getCloudinaryOptimized(photo.url, 800)}
                  alt={photo.caption || "Photo"}
                  className="w-full h-auto group-hover:brightness-90 transition-all duration-300"
                  loading="lazy"
                />
              )}
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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

          {/* Download Button */}
          <a
            href={getCloudinaryDownloadUrl(selectedPhoto.url)}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 z-50 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all duration-200"
            aria-label="Download"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          {/* Toggle Arrows Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowArrows((prev) => !prev);
              }}
              className="absolute top-4 left-4 z-50 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all duration-200"
              aria-label={showArrows ? "Hide navigation arrows" : "Show navigation arrows"}
            >
              {showArrows ? (
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Previous Button */}
          {photos.length > 1 && showArrows && (
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
            key={selectedIndex}
            className={`relative max-w-[90vw] max-h-[90vh] flex flex-col items-center ${getSlideClass()}`}
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(selectedPhoto.url, selectedPhoto.media_type) ? (
              <video
                src={getCloudinaryVideoSrc(selectedPhoto.url)}
                controls
                autoPlay
                playsInline
                className="w-[90vw] max-w-4xl max-h-[85vh] object-contain rounded-lg shadow-2xl bg-black"
              />
            ) : (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Photo preview"}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            )}
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
          {photos.length > 1 && showArrows && (
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

      {/* Keyframe animations for slide transitions */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
