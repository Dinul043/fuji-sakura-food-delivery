'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { StarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { TruckIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { getFullImageUrl } from '@/config/constants';

interface RestaurantCardProps {
  id: number;
  name: string;
  cuisine: string;
  image: string;
  restaurant_image?: string;
  rating: number;
  reviews?: number;
  delivery_time: string;
  delivery_fee: number;
  distance_km?: number | null;
  is_online: boolean;
  is_deliverable?: boolean;
  average_price?: number;
  tags?: string[];
}

export default function RestaurantCard({
  id,
  name,
  cuisine,
  image,
  restaurant_image,
  rating,
  reviews,
  delivery_time,
  delivery_fee,
  distance_km,
  is_online,
  is_deliverable,
  average_price,
}: RestaurantCardProps) {
  const router = useRouter();

  const imgSrc =
    restaurant_image ? getFullImageUrl(restaurant_image) :
    image            ? getFullImageUrl(image) :
    '/images/auth/Rectangle 1681 .png';

  // If getFullImageUrl returns an emoji (no real image), use placeholder
  const finalImgSrc = imgSrc.startsWith('/') || imgSrc.startsWith('http')
    ? imgSrc
    : '/images/auth/Rectangle 1681 .png';

  const isOpen = is_online;
  const ratingDisplay = typeof rating === 'number' ? rating.toFixed(1) : '—';

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={() => router.push(`/restaurant/${id}`)}
      className={[
        'bg-white rounded-3xl shadow-card overflow-hidden cursor-pointer',
        'focus-within:ring-2 focus-within:ring-fuji-sakura',
        !isOpen ? 'opacity-75' : '',
      ].join(' ')}
      aria-label={`${name} — ${cuisine}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/restaurant/${id}`); }}
      role="button"
    >
      {/* ── Food image ── */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-fuji-soft-gray">
        {/* Use plain img tag — avoids Next.js image optimization private IP issue in dev */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalImgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Delivery time chip — top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1">
          <ClockIcon className="w-3.5 h-3.5 text-fuji-charcoal/60" aria-hidden="true" />
          <span className="text-caption font-semibold text-fuji-charcoal font-sans">{delivery_time}</span>
        </div>

        {/* Open/closed badge — top-right */}
        <div className="absolute top-3 right-3">
          <Badge variant={isOpen ? 'success' : 'neutral'} dot>
            {isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" aria-hidden="true" />
      </div>

      {/* ── Info ── */}
      <div className="px-4 py-3.5">
        {/* Name */}
        <h3 className="font-heading font-semibold text-fuji-charcoal text-body leading-snug truncate mb-0.5">
          {name}
        </h3>

        {/* Cuisine */}
        <p className="text-caption text-fuji-charcoal/50 font-sans mb-2.5 truncate capitalize">
          {cuisine}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-caption font-sans">
          {/* Rating */}
          <span className="flex items-center gap-1">
            <StarIcon className="w-3.5 h-3.5 text-fuji-warning shrink-0" aria-hidden="true" />
            <span className="font-semibold text-fuji-charcoal">{ratingDisplay}</span>
            {reviews != null && (
              <span className="text-fuji-charcoal/40">({reviews})</span>
            )}
          </span>

          <span className="text-fuji-charcoal/20">·</span>

          {/* Distance */}
          {distance_km != null && (
            <>
              <span className="flex items-center gap-1 text-fuji-charcoal/50">
                <MapPinIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {distance_km < 1
                  ? `${(distance_km * 1000).toFixed(0)}m`
                  : `${distance_km.toFixed(1)}km`
                }
              </span>
              <span className="text-fuji-charcoal/20">·</span>
            </>
          )}

          {/* Delivery fee */}
          <span className="flex items-center gap-1 text-fuji-charcoal/50">
            <TruckIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {delivery_fee === 0 ? (
              <span className="text-fuji-success font-semibold">Free</span>
            ) : (
              `₹${delivery_fee}`
            )}
          </span>
        </div>

        {/* Avg price */}
        {average_price != null && average_price > 0 && (
          <p className="text-caption text-fuji-charcoal/40 font-sans mt-1.5">
            Avg. ₹{average_price} per person
          </p>
        )}
      </div>
    </motion.article>
  );
}
