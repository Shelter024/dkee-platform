'use client';

import { useEffect, useState } from 'react';

interface BackgroundMediaProps {
  media?: string | null; // URL or JSON array for slideshow
  type?: string | null; // 'image', 'video', 'slideshow'
  overlay?: string | null; // Hex color
  opacity?: number | null; // 0-1
  effect?: string | null; // 'fade', 'parallax', 'fixed', 'zoom'
  children?: React.ReactNode;
  className?: string;
}

export function BackgroundMedia({
  media,
  type = 'image',
  overlay = '#000000',
  opacity = 0.5,
  effect = 'fade',
  children,
  className = '',
}: BackgroundMediaProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<string[]>([]);

  useEffect(() => {
    if (type === 'slideshow' && media) {
      try {
        const parsedSlides = JSON.parse(media);
        if (Array.isArray(parsedSlides)) {
          setSlides(parsedSlides);
        }
      } catch {
        // If not JSON, treat as single image
        setSlides([media]);
      }
    }
  }, [media, type]);

  useEffect(() => {
    if (type === 'slideshow' && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [type, slides]);

  if (!media) {
    return <div className={className}>{children}</div>;
  }

  const effectClasses = {
    fade: 'transition-opacity duration-1000',
    parallax: 'bg-fixed bg-center',
    fixed: 'bg-fixed',
    zoom: 'animate-zoom-in',
  };

  const getBackgroundStyle = () => {
    if (type === 'video') {
      return {};
    }

    if (type === 'slideshow' && slides.length > 0) {
      return {
        backgroundImage: `url(${slides[currentSlide]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    return {
      backgroundImage: `url(${media})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {type === 'video' ? (
          <>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={media} type="video/mp4" />
            </video>
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: overlay || '#000000',
                opacity: opacity || 0.5,
              }}
            />
          </>
        ) : (
          <>
            {/* Image/Slideshow Background */}
            <div
              className={`absolute inset-0 ${effectClasses[effect as keyof typeof effectClasses] || ''} ${
                type === 'slideshow' ? 'transition-all duration-1000' : ''
              }`}
              style={getBackgroundStyle()}
            />
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: overlay || '#000000',
                opacity: opacity || 0.5,
              }}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Slideshow Indicators */}
      {type === 'slideshow' && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for hero sections
export function BackgroundMediaHero({
  media,
  type,
  overlay,
  opacity,
  effect,
  title,
  subtitle,
  className = '',
}: BackgroundMediaProps & { title?: string; subtitle?: string }) {
  return (
    <BackgroundMedia
      media={media}
      type={type}
      overlay={overlay}
      opacity={opacity}
      effect={effect}
      className={`min-h-[400px] md:min-h-[500px] flex items-center justify-center ${className}`}
    >
      <div className="container mx-auto px-4 text-center text-white">
        {title && (
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{title}</h1>
        )}
        {subtitle && (
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">{subtitle}</p>
        )}
      </div>
    </BackgroundMedia>
  );
}
