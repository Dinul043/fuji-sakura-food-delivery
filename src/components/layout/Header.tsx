'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/contexts/CartContext';
import { API_BASE_URL } from '@/config/constants';

// Converts a backend image path to a full URL safe for next/image
function toFullUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${clean}`;
  }
  return path; // public folder path — already valid for next/image localPatterns
}

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onLocationDetect?: () => void;
  locationLabel?: string | null;
  locationLoading?: boolean;
}

export default function Header({
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onLocationDetect,
  locationLabel,
  locationLoading = false,
}: HeaderProps) {
  const router = useRouter();
  const { getTotalItems } = useCart();
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'Guest');
    setIsGuest(localStorage.getItem('isGuest') === 'true');

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => { if (p?.profile_image) setProfileImage(toFullUrl(p.profile_image)); })
        .catch(() => {});
    }

    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    [
      'userName','userEmail','token','refreshToken',
      'isGuest','rememberMe','userLat','userLng','userLocationAddress',
    ].forEach((k) => localStorage.removeItem(k));
    router.push('/login');
  };

  const cartCount = getTotalItems();

  return (
    <>
      {/* ── DESKTOP & TABLET HEADER ─────────────────────────────── */}
      <header
        className={[
          'sticky top-0 z-50 w-full',
          'bg-fuji-warm-white/95 backdrop-blur-md',
          'transition-shadow duration-200',
          scrolled ? 'shadow-header' : '',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3 lg:gap-6">

            {/* ── Logo ── */}
            <Link
              href="/home"
              className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura rounded-lg"
            >
              <Image
                src="/images/logo/Logo.png"
                alt="Fuji Sakura"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
              <span className="font-heading font-bold text-fuji-charcoal text-lg hidden sm:block leading-none">
                Fuji <span className="text-fuji-sakura">Sakura</span>
              </span>
            </Link>

            {/* ── Location pill ── */}
            <button
              onClick={onLocationDetect}
              disabled={locationLoading}
              className={[
                'hidden md:flex items-center gap-1.5 shrink-0',
                'h-9 px-3 rounded-2xl border transition-colors duration-150',
                'text-label font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura',
                locationLabel
                  ? 'border-fuji-soft-gray bg-white text-fuji-charcoal hover:border-fuji-sakura/40'
                  : 'border-dashed border-fuji-charcoal/25 bg-fuji-soft-gray/50 text-fuji-charcoal/50 hover:border-fuji-sakura/40',
              ].join(' ')}
              aria-label="Detect or change delivery location"
            >
              <MapPinIcon className="w-4 h-4 text-fuji-sakura shrink-0" aria-hidden="true" />
              {locationLoading ? (
                <span className="text-fuji-charcoal/40">Detecting…</span>
              ) : locationLabel ? (
                <>
                  <span className="text-fuji-charcoal/50 text-xs">To</span>
                  <span
                    className="font-semibold max-w-[120px] truncate"
                    title={locationLabel}
                  >
                    {locationLabel}
                  </span>
                  <ChevronDownIcon className="w-3 h-3 text-fuji-charcoal/40 shrink-0" aria-hidden="true" />
                </>
              ) : (
                <span className="text-xs">Add location</span>
              )}
            </button>

            {/* ── Search bar (center, grows) ── */}
            {onSearchChange && (
              <div className="flex-1 max-w-md hidden md:flex relative">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fuji-charcoal/35 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    placeholder="Search restaurants or dishes…"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSearchSubmit?.();
                    }}
                    className={[
                      'w-full h-10 pl-10 pr-4 rounded-2xl font-sans text-label',
                      'bg-fuji-soft-gray/60 border border-transparent text-fuji-charcoal',
                      'placeholder:text-fuji-charcoal/35 outline-none',
                      'transition-all duration-150',
                      'focus:bg-white focus:border-fuji-sakura/40 focus:ring-2 focus:ring-fuji-sakura/10',
                    ].join(' ')}
                    aria-label="Search restaurants or dishes"
                  />
                </div>
              </div>
            )}

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1 ml-auto">

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-fuji-soft-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura"
                aria-label={`Cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
              >
                <ShoppingBagIcon className="w-5 h-5 text-fuji-charcoal" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-fuji-sakura text-white text-[10px] font-bold rounded-full leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowProfileMenu((p) => !p)}
                  className="flex items-center gap-2 h-10 px-2 rounded-2xl hover:bg-fuji-soft-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura"
                  aria-haspopup="true"
                  aria-expanded={showProfileMenu}
                  aria-label="Profile menu"
                >
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileImage}
                      alt={userName}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-6 h-6 text-fuji-charcoal/60" aria-hidden="true" />
                  )}
                  <span className="hidden lg:block text-label font-semibold text-fuji-charcoal max-w-[90px] truncate">
                    {isGuest ? 'Guest' : userName}
                  </span>
                  <ChevronDownIcon className="hidden lg:block w-3 h-3 text-fuji-charcoal/40" aria-hidden="true" />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-card-hover border border-fuji-soft-gray py-1.5 z-50"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b border-fuji-soft-gray">
                        <p className="text-label font-semibold text-fuji-charcoal truncate">{userName}</p>
                        {!isGuest && (
                          <p className="text-caption text-fuji-charcoal/50 truncate">
                            {localStorage.getItem('userEmail') || ''}
                          </p>
                        )}
                      </div>

                      {!isGuest && (
                        <>
                          <Link
                            href="/profile"
                            role="menuitem"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-label text-fuji-charcoal hover:bg-fuji-soft-gray/60 transition-colors"
                          >
                            <UserCircleIcon className="w-4 h-4" aria-hidden="true" />
                            My Profile
                          </Link>
                          <Link
                            href="/orders"
                            role="menuitem"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-label text-fuji-charcoal hover:bg-fuji-soft-gray/60 transition-colors"
                          >
                            <ShoppingBagIcon className="w-4 h-4" aria-hidden="true" />
                            My Orders
                          </Link>
                        </>
                      )}

                      {isGuest ? (
                        <Link
                          href="/login"
                          role="menuitem"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-label text-fuji-sakura font-semibold hover:bg-fuji-sakura/5 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" aria-hidden="true" />
                          Sign In
                        </Link>
                      ) : (
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-label text-fuji-error hover:bg-fuji-error/5 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" aria-hidden="true" />
                          Sign Out
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-fuji-soft-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen
                  ? <XMarkIcon className="w-5 h-5 text-fuji-charcoal" aria-hidden="true" />
                  : <Bars3Icon className="w-5 h-5 text-fuji-charcoal" aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          {/* ── Mobile search bar (below header row) ── */}
          {onSearchChange && (
            <div className="md:hidden pb-3">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fuji-charcoal/35 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Search restaurants or dishes…"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit?.(); }}
                  className={[
                    'w-full h-10 pl-10 pr-4 rounded-2xl font-sans text-label',
                    'bg-fuji-soft-gray/60 border border-transparent text-fuji-charcoal',
                    'placeholder:text-fuji-charcoal/35 outline-none',
                    'focus:bg-white focus:border-fuji-sakura/40 focus:ring-2 focus:ring-fuji-sakura/10',
                  ].join(' ')}
                  aria-label="Search restaurants or dishes"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-fuji-soft-gray/60" />
      </header>

      {/* ── MOBILE SLIDE-DOWN MENU ─────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden fixed top-[calc(4rem+1px)] left-0 right-0 z-40 bg-fuji-warm-white border-b border-fuji-soft-gray shadow-card-hover"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {/* Location */}
              <button
                onClick={() => { onLocationDetect?.(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-fuji-soft-gray/60 text-label text-fuji-charcoal transition-colors"
              >
                <MapPinIcon className="w-5 h-5 text-fuji-sakura" aria-hidden="true" />
                <span>
                  {locationLabel
                    ? <>Delivering to <strong>{locationLabel}</strong></>
                    : 'Add delivery location'
                  }
                </span>
              </button>

              <div className="h-px bg-fuji-soft-gray my-1" />

              {!isGuest ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-fuji-soft-gray/60 text-label text-fuji-charcoal transition-colors">
                    <UserCircleIcon className="w-5 h-5" aria-hidden="true" />
                    My Profile
                  </Link>
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-fuji-soft-gray/60 text-label text-fuji-charcoal transition-colors">
                    <ShoppingBagIcon className="w-5 h-5" aria-hidden="true" />
                    My Orders
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-fuji-error/5 text-label text-fuji-error transition-colors">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" aria-hidden="true" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-fuji-sakura text-white text-label font-semibold justify-center">
                  Sign In / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for profile dropdown */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
