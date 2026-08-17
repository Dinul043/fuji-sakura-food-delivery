'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  onLocationDetect: () => void;
  locationLabel: string | null;
  locationLoading: boolean;
}

export default function HeroSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLocationDetect,
  locationLabel,
  locationLoading,
}: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Lazy-load video — only play when in viewport
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  // Each element gets its own delay via individual animate props
  const fadeUpBase = { opacity: 0, y: 20 } as const;
  const fadeUpAnim = (delayS: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: delayS, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  });

  return (
    <section
      className="relative overflow-hidden bg-fuji-warm-white"
      aria-label="Hero section"
    >
      {/* ── Soft organic blob — desktop only ── */}
      <div
        className="hidden lg:block absolute right-0 top-0 w-[55%] h-full pointer-events-none"
        aria-hidden="true"
      >
        {/* Blob background shape */}
        <svg
          viewBox="0 0 600 600"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-[-10%] top-[-20%] w-[120%] h-[120%] opacity-[0.06]"
        >
          <path
            d="M460,280Q420,360,340,410Q260,460,180,410Q100,360,80,280Q60,200,130,140Q200,80,290,70Q380,60,440,130Q500,200,460,280Z"
            fill="#E85D8E"
          />
        </svg>
        {/* Dot accent */}
        <div className="absolute top-16 right-24 w-3 h-3 bg-fuji-sakura/30 rounded-full" />
        <div className="absolute top-40 right-48 w-2 h-2 bg-fuji-sakura/20 rounded-full" />
        <div className="absolute bottom-24 right-32 w-4 h-4 bg-fuji-sakura/15 rounded-full" />
      </div>

      {/* ── MOBILE HERO — full-bleed food image + overlay ── */}
      <div className="lg:hidden relative h-72 sm:h-80 overflow-hidden">
        {/* Fallback image — always shown on mobile */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero/hero-food.jpg"
          alt="Delicious food ready for delivery"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-fuji-charcoal/80 via-fuji-charcoal/30 to-transparent" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-7">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="font-heading font-extrabold text-white text-3xl sm:text-4xl leading-tight mb-2"
          >
            Authentic food,{' '}
            <span className="text-fuji-sakura">delivered fast</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.08 }}
            className="text-white/80 text-sm font-sans"
          >
            Japanese cuisine and more — right to your door.
          </motion.p>
        </div>
      </div>

      {/* ── DESKTOP HERO — split 50/50 ── */}
      <div className="hidden lg:grid lg:grid-cols-2 min-h-[520px] xl:min-h-[580px]">

        {/* LEFT — text + search */}
        <div className="flex flex-col justify-center px-8 xl:px-16 py-16 relative z-10">
          <motion.p
            initial={fadeUpBase}
            animate={fadeUpAnim(0)}
            className="text-label font-semibold text-fuji-sakura font-sans uppercase tracking-widest mb-3"
          >
            Premium Food Delivery
          </motion.p>

          <motion.h1
            initial={fadeUpBase}
            animate={fadeUpAnim(0.08)}
            className="font-heading font-extrabold text-fuji-charcoal text-h1 xl:text-display leading-tight mb-4"
          >
            Authentic food,{' '}
            <span className="text-fuji-sakura">delivered</span>{' '}
            fast
          </motion.h1>

          <motion.p
            initial={fadeUpBase}
            animate={fadeUpAnim(0.16)}
            className="text-body text-fuji-charcoal/60 font-sans max-w-sm mb-8 leading-relaxed"
          >
            Japanese cuisine, fresh ingredients, and the restaurants you love — 
            all delivered in 30 minutes or less.
          </motion.p>

          {/* Search + CTA bar */}
          <motion.div
            initial={fadeUpBase}
            animate={fadeUpAnim(0.24)}
            className="flex items-center gap-0 max-w-md"
          >
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fuji-charcoal/35 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search restaurants or dishes…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }}
                className={[
                  'w-full h-12 pl-11 pr-4 font-sans text-body',
                  'bg-white border border-fuji-soft-gray text-fuji-charcoal',
                  'rounded-l-2xl rounded-r-none outline-none',
                  'placeholder:text-fuji-charcoal/35',
                  'focus:border-fuji-sakura/50 focus:ring-2 focus:ring-fuji-sakura/10',
                  'transition-all duration-150',
                ].join(' ')}
                aria-label="Search restaurants or dishes"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={onSearchSubmit}
              className="h-12 rounded-l-none rounded-r-2xl px-5 shrink-0"
              icon={<ArrowRightIcon className="w-4 h-4" aria-hidden="true" />}
              iconPosition="right"
            >
              Find Food
            </Button>
          </motion.div>

          {/* Location detect */}
          <motion.button
            initial={fadeUpBase}
            animate={fadeUpAnim(0.32)}
            onClick={onLocationDetect}
            disabled={locationLoading}
            className="flex items-center gap-2 mt-4 text-label text-fuji-charcoal/50 hover:text-fuji-sakura transition-colors font-sans w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura rounded-lg px-1"
          >
            <MapPinIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {locationLoading
              ? 'Detecting location…'
              : locationLabel
                ? <>Delivering to <strong className="text-fuji-charcoal">{locationLabel}</strong> · Change</>
                : 'Detect my location'
            }
          </motion.button>

          {/* Social proof */}
          <motion.div
            initial={fadeUpBase}
            animate={fadeUpAnim(0.40)}
            className="flex items-center gap-6 mt-10 pt-8 border-t border-fuji-soft-gray"
          >
            {[
              { value: '50+', label: 'Restaurants' },
              { value: '4.8★', label: 'Avg. Rating' },
              { value: '30 min', label: 'Avg. Delivery' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="font-heading font-bold text-h3 text-fuji-charcoal">{value}</span>
                <span className="text-caption text-fuji-charcoal/50 font-sans">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — video / image */}
        <div className="relative flex items-center justify-center overflow-hidden bg-fuji-soft-gray/20">
          {/* Video — desktop only, lazy-loaded */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            poster="/images/hero/hero-food.jpg"
          >
            <source src="/videos/hero-food.webm" type="video/webm" />
            <source src="/videos/hero-food.mp4" type="video/mp4" />
          </video>

          {/* Fallback — shown until video loads */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero/hero-food.jpg"
            alt="Delicious food"
            className="w-full h-full object-cover"
            aria-hidden="true"
          />

          {/* Left-side gradient so text from left panel doesn't clash */}
          <div
            className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-fuji-warm-white to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Mobile search bar (below image) ── */}
      <div className="lg:hidden px-4 py-4">
        <div className="flex items-center gap-0">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fuji-charcoal/35 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search restaurants or dishes…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }}
              className={[
                'w-full h-12 pl-11 pr-4 font-sans text-body',
                'bg-white border border-fuji-soft-gray text-fuji-charcoal',
                'rounded-l-2xl rounded-r-none outline-none',
                'placeholder:text-fuji-charcoal/35',
                'focus:border-fuji-sakura/50 focus:ring-2 focus:ring-fuji-sakura/10',
              ].join(' ')}
              aria-label="Search restaurants or dishes"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onSearchSubmit}
            className="h-12 rounded-l-none rounded-r-2xl px-4 shrink-0"
            icon={<MagnifyingGlassIcon className="w-4 h-4" aria-hidden="true" />}
          />
        </div>

        {/* Location detect — mobile */}
        <button
          onClick={onLocationDetect}
          disabled={locationLoading}
          className="flex items-center gap-2 mt-2.5 text-label text-fuji-charcoal/50 hover:text-fuji-sakura transition-colors font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura rounded-lg px-1"
        >
          <MapPinIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
          {locationLoading
            ? 'Detecting…'
            : locationLabel
              ? <>To <strong className="text-fuji-charcoal">{locationLabel}</strong> · Change</>
              : 'Detect my location'
          }
        </button>
      </div>
    </section>
  );
}
