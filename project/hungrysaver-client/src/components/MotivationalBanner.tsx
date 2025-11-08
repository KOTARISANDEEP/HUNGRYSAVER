import { useState, useEffect } from 'react';

// Removed motivational messages; no overlay text is displayed

const MotivationalBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const bannerImages = [
    '/assets/images/download.jpg',
    '/assets/images/nilayam2.png',
    '/assets/images/suraksha1.png',
    '/assets/images/suraksha3.png',
    '/assets/images/vidya2.png'
  ];
  const [imgIdx, setImgIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);

  // Removed motivational text cycling; only slideshow remains

  useEffect(() => {
    const t = setInterval(() => {
      setPrevIdx(imgIdx);
      setImgIdx((p) => (p + 1) % bannerImages.length);
    }, 7000);
    return () => clearInterval(t);
  }, [bannerImages.length, imgIdx]);

  // Only slideshow is displayed; no overlay text

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#EAA640] via-[#F5E3C3] to-[#FAF9F6] rounded-2xl p-8 mb-8 shadow-2xl">
      {/* Background slideshow */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {(bannerImages || []).map((src, i) => (
          <img
            key={i}
            src={src}
            alt="motivation background"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${i === imgIdx ? 'opacity-100 blur-0 scale-100' : i === prevIdx ? 'opacity-0 blur-0 scale-100' : 'opacity-0'}`}
            style={{ zIndex: i === imgIdx ? 1 : 0 }}
          />
        ))}
      </div>

      {/* Decorative overlay shapes removed to keep images clean */}

      {/* Content removed: keep only a minimal close button, no text overlays */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 z-10 text-[#EAA640]/60 hover:text-[#EAA640]/80 transition-colors"
        aria-label="Close banner"
      >
        ✕
      </button>
    </div>
  );
};

export default MotivationalBanner;