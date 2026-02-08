import { useEffect, useState } from 'react';

export const ParallaxBackground = () => {
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate random stars
    const generatedStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  const parallaxOffset = prefersReducedMotion ? 0 : scrollY * 0.15;
  const lotusPondOffset = prefersReducedMotion ? 0 : scrollY * 0.4;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: '#0B1020' }}>
      {/* Twinkling stars - rendered first so they're visible */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          willChange: prefersReducedMotion ? 'auto' : 'transform',
        }}
      >
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animation: prefersReducedMotion ? 'none' : `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Lotus pond gradient at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60vh]"
        style={{
          transform: `translateY(${lotusPondOffset}px)`,
          willChange: prefersReducedMotion ? 'auto' : 'transform',
          background: 'linear-gradient(to top, hsla(243, 85%, 70%, 0.3) 0%, hsla(243, 85%, 70%, 0.2) 30%, transparent 100%)',
        }}
      />

      {/* Very subtle overlay for text readability - only at bottom, not covering stars */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1020]/20" />
    </div>
  );
};
