'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  ClockIcon as ClockIconSolid,
} from '@heroicons/react/24/solid';
import { useCart } from '@/contexts/CartContext';

const navItems = [
  { href: '/home',    label: 'Home',    Icon: HomeIcon,         IconActive: HomeIconSolid },
  { href: '/cart',    label: 'Cart',    Icon: ShoppingBagIcon,  IconActive: ShoppingBagIconSolid, badge: true },
  { href: '/orders',  label: 'Orders',  Icon: ClockIcon,        IconActive: ClockIconSolid },
  { href: '/profile', label: 'Profile', Icon: UserCircleIcon,   IconActive: UserCircleIconSolid },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-fuji-soft-gray"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, Icon, IconActive, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const ActiveIcon = IconActive;
          const DefaultIcon = Icon;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center justify-center gap-1 py-2 min-h-[44px] min-w-[44px] mx-auto w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura rounded-xl"
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  {isActive
                    ? <ActiveIcon className="w-6 h-6 text-fuji-sakura" aria-hidden="true" />
                    : <DefaultIcon className="w-6 h-6 text-fuji-charcoal/40" aria-hidden="true" />
                  }
                  {badge && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex items-center justify-center w-4 h-4 bg-fuji-sakura text-white text-[9px] font-bold rounded-full leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span
                  className={[
                    'text-[10px] font-semibold font-sans leading-none',
                    isActive ? 'text-fuji-sakura' : 'text-fuji-charcoal/40',
                  ].join(' ')}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
