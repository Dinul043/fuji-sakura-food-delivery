'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  bgClass: string;       // Tailwind bg color class
  textClass: string;     // Tailwind text color class
  accentClass: string;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 1,
    title: 'Free delivery on your first order',
    subtitle: 'Use code WELCOME at checkout',
    cta: 'Order Now',
    bgClass:    'bg-fuji-charcoal',
    textClass:  'text-white',
    accentClass: 'text-fuji-sakura',
  },
  {
    id: 2,
    title: 'Weekend Special — 20% off',
    subtitle: 'Valid Saturday & Sunday on all orders',
    cta: 'Claim Offer',
    bgClass:    'bg-fuji-sakura',
    textClass:  'text-white',
    accentClass: 'text-white/80',
  },
  {
    id: 3,
    title: 'New restaurants near you',
    subtitle: 'Fresh menus added this week',
    cta: 'Explore',
    bgClass:    'bg-[#1e293b]',
    textClass:  'text-white',
    accentClass: 'text-fuji-warning',
  },
];

interface OfferBannerProps {
  banners?: Banner[];
  autoPlayMs?: number;
}

export default function OfferBanner({
  banners = DEFAULT_BANNERS,
  autoPlayMs = 4000,
}: OfferBannerProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const next = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % banners.length);
  }, [banners.length]);

  const prev = () => {
    setDirection(-1);
    setIndex((i) => (i - 1 + banners.length) % banners.length);
  };

  // Auto-play
  useEffect(() => {
    const id = setInterval(next, autoPlayMs);
    return () => clearInterval(id);
  }, [next, autoPlayMs]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const current = banners[index];

  return (
    <div className="relative rounded-3xl overflow-hidden h-28 sm:h-32 select-none" aria-label="Promotional banners">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className={`absolute inset-0 flex items-center px-6 sm:px-8 ${current.bgClass}`}
        >
          {/* Decorative circles */}
          <div className="absolute right-4 top-2 w-24 h-24 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />
          <div className="absolute right-12 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />

          <div className="flex-1 min-w-0 z-10">
            <p className={`font-heading font-bold text-base sm:text-lg leading-snug truncate ${current.textClass}`}>
              {current.title}
            </p>
            <p className={`text-label font-sans mt-0.5 truncate ${current.accentClass}`}>
              {current.subtitle}
            </p>
          </div>

          <button
            className={`shrink-0 ml-4 h-9 px-4 rounded-xl text-label font-semibold font-sans bg-white/15 hover:bg-white/25 transition-colors ${current.textClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            aria-label={current.cta}
          >
            {current.cta}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Previous banner"
      >
        <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Next banner"
      >
        <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5" aria-hidden="true">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            className={[
              'rounded-full transition-all duration-200',
              i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40',
            ].join(' ')}
            aria-label={`Go to banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
