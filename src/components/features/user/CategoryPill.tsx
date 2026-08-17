'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
}

interface CategoryPillsProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryPills({
  categories,
  selected,
  onSelect,
}: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Category icon map — SVG icon names from your existing icons
  const iconMap: Record<string, string> = {
    japanese:   '🍱',
    indian:     '🍛',
    chinese:    '🥡',
    italian:    '🍝',
    american:   '🍔',
    thai:       '🍜',
    mexican:    '🌮',
    pizza:      '🍕',
    burgers:    '🍔',
    desserts:   '🍰',
    beverages:  '☕',
    vegetarian: '🥗',
    seafood:    '🦞',
    bbq:        '🍖',
  };

  const allCategory = { id: '', name: 'All' };
  const allCategories = [allCategory, ...categories];

  return (
    <div className="relative" aria-label="Filter by category">
      {/* Fade edges to hint scrollability */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-fuji-warm-white to-transparent pointer-events-none z-10" aria-hidden="true" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-fuji-warm-white to-transparent pointer-events-none z-10" aria-hidden="true" />

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
        role="list"
      >
        {allCategories.map((cat) => {
          const isActive = selected === cat.id;
          const icon = cat.id ? iconMap[cat.id] : null;

          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              role="listitem"
              onClick={() => onSelect(cat.id)}
              className={[
                'flex items-center gap-1.5 shrink-0',
                'h-9 px-4 rounded-full',
                'text-label font-semibold font-sans',
                'border transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura',
                isActive
                  ? 'bg-fuji-sakura text-white border-fuji-sakura shadow-sakura'
                  : 'bg-white text-fuji-charcoal border-fuji-soft-gray hover:border-fuji-sakura/40 hover:text-fuji-sakura',
              ].join(' ')}
              aria-pressed={isActive}
              aria-label={`Filter by ${cat.name}`}
            >
              {icon && (
                <span className="text-sm leading-none" aria-hidden="true">{icon}</span>
              )}
              <span>{cat.name}</span>
              {isActive && (
                <motion.span
                  layoutId="active-pill-dot"
                  className="w-1.5 h-1.5 rounded-full bg-white/60"
                  aria-hidden="true"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
