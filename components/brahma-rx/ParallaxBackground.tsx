import { useEffect, useMemo, useRef, useState } from 'react';

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
};

const createStars = (
  count: number,
  minSize: number,
  maxSize: number,
  opacityMin: number,
  opacityMax: number
): Star[] =>
  Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * (maxSize - minSize) + minSize,
    opacity: Math.random() * (opacityMax - opacityMin) + opacityMin,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2.5,
  }));

export const ParallaxBackground = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const farLayerRef = useRef<HTMLDivElement>(null);
  const midLayerRef = useRef<HTMLDivElement>(null);
  const nearLayerRef = useRef<HTMLDivElement>(null);
  const nebulaOneRef = useRef<HTMLDivElement>(null);
  const nebulaTwoRef = useRef<HTMLDivElement>(null);
  const lotusGlowRef = useRef<HTMLDivElement>(null);

  const farStars = useMemo(() => createStars(140, 0.7, 1.6, 0.25, 0.55), []);
  const midStars = useMemo(() => createStars(90, 1.1, 2.3, 0.35, 0.75), []);
  const nearStars = useMemo(() => createStars(55, 1.8, 3.6, 0.45, 0.9), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const layers = [
      farLayerRef.current,
      midLayerRef.current,
      nearLayerRef.current,
      nebulaOneRef.current,
      nebulaTwoRef.current,
      lotusGlowRef.current,
    ];

    if (prefersReducedMotion) {
      layers.forEach((layer) => {
        if (layer) {
          layer.style.transform = 'translate3d(0, 0, 0)';
          layer.style.willChange = 'auto';
        }
      });
      return;
    }

    layers.forEach((layer) => {
      if (layer) {
        layer.style.willChange = 'transform';
      }
    });

    let rafId = 0;
    let ticking = false;
    let targetY = window.scrollY;
    let currentY = window.scrollY;

    const render = () => {
      currentY += (targetY - currentY) * 0.09;

      if (farLayerRef.current) {
        farLayerRef.current.style.transform = `translate3d(0, ${currentY * -0.14}px, 0)`;
      }
      if (midLayerRef.current) {
        midLayerRef.current.style.transform = `translate3d(0, ${currentY * -0.28}px, 0)`;
      }
      if (nearLayerRef.current) {
        nearLayerRef.current.style.transform = `translate3d(0, ${currentY * -0.44}px, 0)`;
      }
      if (nebulaOneRef.current) {
        nebulaOneRef.current.style.transform = `translate3d(0, ${currentY * -0.2}px, 0)`;
      }
      if (nebulaTwoRef.current) {
        nebulaTwoRef.current.style.transform = `translate3d(0, ${currentY * -0.34}px, 0)`;
      }
      if (lotusGlowRef.current) {
        lotusGlowRef.current.style.transform = `translate3d(0, ${currentY * 0.58}px, 0)`;
      }

      if (Math.abs(targetY - currentY) > 0.2) {
        rafId = window.requestAnimationFrame(render);
      } else {
        ticking = false;
      }
    };

    const handleScroll = () => {
      targetY = window.scrollY;
      if (!ticking) {
        ticking = true;
        rafId = window.requestAnimationFrame(render);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  const renderStars = (stars: Star[]) =>
    stars.map((star, index) => (
      <div
        key={index}
        className="absolute rounded-full bg-white"
        style={{
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: `${star.size}px`,
          height: `${star.size}px`,
          opacity: star.opacity,
          animation: prefersReducedMotion
            ? 'none'
            : `brahma-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
        }}
      />
    ));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#060B1A' }}>
      <div
        ref={nebulaOneRef}
        className="absolute -top-[30vh] left-[-20vw] w-[80vw] h-[80vw] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsla(243, 80%, 65%, 0.42) 0%, hsla(205, 85%, 60%, 0.24) 35%, transparent 72%)',
          animation: prefersReducedMotion ? 'none' : 'brahma-nebula-drift 17s ease-in-out infinite alternate',
        }}
      />

      <div
        ref={nebulaTwoRef}
        className="absolute top-[25vh] right-[-18vw] w-[70vw] h-[70vw] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsla(43, 92%, 68%, 0.25) 0%, hsla(243, 90%, 72%, 0.2) 38%, transparent 74%)',
          animation: prefersReducedMotion ? 'none' : 'brahma-nebula-drift-slow 24s ease-in-out infinite alternate',
        }}
      />

      <div ref={farLayerRef} className="absolute inset-0">{renderStars(farStars)}</div>
      <div ref={midLayerRef} className="absolute inset-0">{renderStars(midStars)}</div>
      <div ref={nearLayerRef} className="absolute inset-0">{renderStars(nearStars)}</div>

      <div
        ref={lotusGlowRef}
        className="absolute bottom-[-10vh] left-0 right-0 h-[76vh]"
        style={{
          background:
            'linear-gradient(to top, hsla(243, 85%, 70%, 0.38) 0%, hsla(258, 75%, 66%, 0.2) 28%, hsla(198, 80%, 62%, 0.12) 48%, transparent 100%)',
          filter: 'blur(2px)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(4, 9, 23, 0.2) 0%, rgba(6, 12, 29, 0.28) 40%, rgba(6, 11, 26, 0.5) 100%)',
        }}
      />
    </div>
  );
};
