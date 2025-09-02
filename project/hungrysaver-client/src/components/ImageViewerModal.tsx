import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') goPrev();
        if (e.key === 'ArrowRight') goNext();
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [isOpen, initialIndex]);

  if (!isOpen) return null;

  const goPrev = () => {
    if (!images || images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (!images || images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    startXRef.current = e.touches[0].clientX;
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (startXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - startXRef.current;
    const threshold = 50; // swipe threshold in px
    if (deltaX > threshold) {
      goPrev();
    } else if (deltaX < -threshold) {
      goNext();
    }
    startXRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="relative h-full w-full flex items-center justify-center p-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Close Button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation - Left */}
        {images.length > 1 && (
          <button
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 md:left-8 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* Image */}
        <div className="max-w-[95vw] max-h-[85vh] flex items-center justify-center">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="object-contain max-h-[85vh] max-w-[95vw] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.visibility = 'hidden';
            }}
          />
        </div>

        {/* Navigation - Right */}
        {images.length > 1 && (
          <button
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 md:right-8 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-6 flex items-center gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/50'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewerModal;


