'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import { API_BASE_URL, getFullImageUrl } from '../../config/constants';
import { useWebSocket } from '@/hooks/useWebSocket';
import Icon from '@/components/Icon';

// Define interfaces for real restaurant data
interface RealRestaurant {
  id: number;
  name: string;
  owner_name: string;
  cuisine: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  restaurant_image: string;
  is_online: boolean;
  menu_items_count: number;
  average_price: number;
  created_at: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  reviews: number;
  image: string;
  tags: string[];
  category: string;
  distance_km?: number | null;
  is_deliverable?: boolean;
}

interface RealCategory {
  id: string;
  name: string;
  emoji: string;
}



export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [restaurants, setRestaurants] = useState<RealRestaurant[]>([]);
  const [categories, setCategories] = useState<RealCategory[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RealRestaurant[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'high' | 'low'>('high');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const router = useRouter();
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const { getTotalItems } = useCart();

  // Banner data
  const banners = [
    {
      id: 1,
      tag: 'LIMITED TIME',
      title: 'Free delivery on your first order',
      subtitle: 'Use code WELCOME at checkout',
      cta: 'Order Now',
      bg: 'linear-gradient(135deg, #18181B 0%, #2d1b4e 100%)',
      accent: '#E85D8E',
      dot: '#a855f7',
    },
    {
      id: 2,
      tag: 'WEEKEND SPECIAL',
      title: '20% off all Japanese cuisine',
      subtitle: 'Valid Saturday & Sunday · Min order ₹299',
      cta: 'Claim Offer',
      bg: 'linear-gradient(135deg, #E85D8E 0%, #c2185b 100%)',
      accent: '#fff',
      dot: 'rgba(255,255,255,0.5)',
    },
    {
      id: 3,
      tag: 'NEW THIS WEEK',
      title: 'Fresh restaurants near you',
      subtitle: 'New menus added · Explore now',
      cta: 'Explore',
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      accent: '#38bdf8',
      dot: '#0ea5e9',
    },
  ];

  // Auto-rotate banners
  useEffect(() => {
    const id = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  // Popular search suggestions
  const popularSuggestions = [
    'Pizza', 'Burger', 'Sushi', 'Ramen', 'Biryani', 'Pasta', 'Tacos', 'Chinese',
    'Thai Food', 'Indian Curry', 'Fried Chicken', 'Seafood', 'Desserts', 'Coffee'
  ];

  // Fetch restaurants from backend with silent error handling
  const fetchRestaurants = async (lat?: number | null, lng?: number | null) => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with optional location params
      let url = `${API_BASE_URL}/api/restaurant/public/restaurants`;
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }

      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000) // 8 second timeout (geocoding may add latency)
      });

      if (!response.ok) {
        throw new Error('Backend not available');
      }

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setFilteredRestaurants(data.restaurants || []);
    } catch (err) {
      // Silent fallback - no console errors, just empty arrays
      setRestaurants([]);
      setFilteredRestaurants([]);
      setError('Oops! There is a network issue. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from backend with silent error handling
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/public/categories`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error('Backend not available');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      // Silent fallback - no console errors, just default categories for UI
      setCategories([
        { id: 'italian', name: 'Italian', emoji: '??' },
        { id: 'japanese', name: 'Japanese', emoji: '??' },
        { id: 'indian', name: 'Indian', emoji: '??' }
      ]);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'Guest';
    setUserName(storedName);

    // Fetch user profile image (NOT address � delivery location is separate)
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(profile => {
          if (profile?.profile_image) setUserProfileImage(profile.profile_image);
        })
        .catch(() => { });
    }

    // Load saved DELIVERY location from localStorage (this is what the header shows)
    const savedLat = localStorage.getItem('userLat');
    const savedLng = localStorage.getItem('userLng');
    const savedLocationAddress = localStorage.getItem('userLocationAddress');

    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      setUserLat(lat);
      setUserLng(lng);
      if (savedLocationAddress) setUserAddress(savedLocationAddress);
      fetchRestaurants(lat, lng);
    } else if (token) {
      // No localStorage location � try loading from DB (user_addresses)
      fetch(`${API_BASE_URL}/api/geocode/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : null)
        .then(addresses => {
          if (addresses && addresses.length > 0) {
            // Use the default or first address
            const defaultAddr = addresses.find((a: any) => a.is_default) || addresses[0];
            const lat = defaultAddr.latitude;
            const lng = defaultAddr.longitude;
            const label = defaultAddr.area ? `${defaultAddr.area}, ${defaultAddr.city}` : defaultAddr.city || defaultAddr.full_address;
            setUserLat(lat);
            setUserLng(lng);
            setUserAddress(label);
            localStorage.setItem('userLat', lat.toString());
            localStorage.setItem('userLng', lng.toString());
            localStorage.setItem('userLocationAddress', label);
            fetchRestaurants(lat, lng);
          } else {
            setShowLocationPrompt(true);
            fetchRestaurants();
          }
        })
        .catch(() => {
          setShowLocationPrompt(true);
          fetchRestaurants();
        });
    } else {
      // No saved delivery location � show prompt and fetch all restaurants
      setShowLocationPrompt(true);
      fetchRestaurants();
    }

    fetchCategories();
  }, []);

  // Detect user location via browser GPS + reverse geocode
  const detectUserLocation = async () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const res = await fetch(`${API_BASE_URL}/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
      let locationLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      let fullAddress = locationLabel;
      let city = '';
      let area = '';
      if (res.ok) {
        const data = await res.json();
        locationLabel = data.area ? `${data.area}, ${data.city}` : data.city || data.full_address;
        fullAddress = data.full_address || locationLabel;
        city = data.city || '';
        area = data.area || '';
      }

      // Save to state and localStorage
      setUserLat(latitude);
      setUserLng(longitude);
      setUserAddress(locationLabel);
      setShowLocationPrompt(false);
      localStorage.setItem('userLat', latitude.toString());
      localStorage.setItem('userLng', longitude.toString());
      localStorage.setItem('userLocationAddress', locationLabel);

      // Save to DB (user_addresses table) � so it persists across devices
      const token = localStorage.getItem('token');
      if (token) {
        // Update user profile address
        fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localStorage.getItem('userName') || 'User',
            address: fullAddress
          })
        }).catch(() => {});

        // Also save to user_addresses for coordinate-based filtering
        fetch(`${API_BASE_URL}/api/geocode/addresses`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: 'Current',
            full_address: fullAddress,
            city: city,
            area: area,
            latitude: latitude,
            longitude: longitude,
            is_default: true
          })
        }).then(res => {
          if (!res.ok) console.log('user_addresses save failed:', res.status);
        }).catch(() => {});
      }

      // Re-fetch restaurants with location
      fetchRestaurants(latitude, longitude);
    } catch {
      // User denied or GPS failed � just dismiss prompt
      setShowLocationPrompt(false);
    } finally {
      setLocationLoading(false);
    }
  };

  // Clear location and show all restaurants
  const clearLocation = () => {
    setUserLat(null);
    setUserLng(null);
    setUserAddress(null);
    setShowLocationPrompt(true);
    localStorage.removeItem('userLat');
    localStorage.removeItem('userLng');
    localStorage.removeItem('userLocationAddress');
    fetchRestaurants();
  };

  // WebSocket for real-time restaurant status updates
  useEffect(() => {
    if (restaurants.length === 0) return;

    const wsConnections: WebSocket[] = [];

    // Create WebSocket connection for each restaurant
    restaurants.forEach((restaurant) => {
      const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws/restaurant/${restaurant.id}`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'restaurant_status_update') {
            // Update restaurant status in state
            setRestaurants(prev => prev.map(r =>
              r.id === data.restaurant_id
                ? { ...r, is_online: data.is_online }
                : r
            ));
            setFilteredRestaurants(prev => prev.map(r =>
              r.id === data.restaurant_id
                ? { ...r, is_online: data.is_online }
                : r
            ));
          }
        } catch (error) {
          // Silent error handling
        }
      };

      wsConnections.push(ws);
    });

    // Cleanup on unmount
    return () => {
      wsConnections.forEach(ws => ws.close());
    };
  }, [restaurants.length]);

  useEffect(() => {
    if (restaurants.length === 0) return;

    let filtered = [...restaurants];

    // Apply both filters independently
    // Filter by search query first
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const searchFiltered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.cuisine.toLowerCase().includes(q) ||
        restaurant.category?.toLowerCase().includes(q) ||
        restaurant.description?.toLowerCase().includes(q) ||
        restaurant.tags?.some(tag => tag.toLowerCase().includes(q))
      );
      // If no exact match, show all restaurants (dish search fallback)
      // The user can then browse and find their dish inside the restaurant menu
      filtered = searchFiltered.length > 0 ? searchFiltered : filtered;
    }

    // Then filter by category (only if no search query)
    if (selectedCategory && !searchQuery.trim()) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.toLowerCase().replace(' ', '_') === selectedCategory ||
        restaurant.category === selectedCategory
      );
    }

    // Sort restaurants
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let result = 0;
        switch (sortBy) {
          case 'rating':
            result = b.rating - a.rating; // High to low by default
            break;
          case 'distance':
            result = (a.distance_km ?? 9999) - (b.distance_km ?? 9999); // Nearest first
            break;
          case 'time':
            result = parseInt(a.delivery_time) - parseInt(b.delivery_time); // Low to high by default (faster first)
            break;
          case 'price':
            result = a.average_price - b.average_price; // Low to high by default (cheaper first)
            break;
          default:
            return 0;
        }
        // Reverse if low to high is selected for rating, or high to low for others
        return sortOrder === 'low' ? -result : result;
      });
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCategory, sortBy, sortOrder, restaurants]);

  const handleLogout = () => {
    // Clear all user session data from localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('userLat');
    localStorage.removeItem('userLng');
    localStorage.removeItem('userLocationAddress');

    // Redirect to login
    router.push('/login');
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);

    // Fast, smooth scroll to restaurants section
    setTimeout(() => {
      if (restaurantsRef.current) {
        const targetElement = restaurantsRef.current;
        const targetPosition = targetElement.offsetTop - 100; // 100px offset from top
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800; // Fast 800ms duration
        let start: number | null = null;

        // Custom easing function for snappy feel
        const easeOutCubic = (t: number): number => {
          return 1 - Math.pow(1 - t, 3);
        };

        const animation = (currentTime: number) => {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const progress = Math.min(timeElapsed / duration, 1);

          const easedProgress = easeOutCubic(progress);
          const currentPosition = startPosition + (distance * easedProgress);

          window.scrollTo(0, currentPosition);

          if (progress < 1) {
            requestAnimationFrame(animation);
          }
        };

        requestAnimationFrame(animation);
      }
    }, 200); // Reduced delay for faster response
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const q = value.toLowerCase();

      // Build suggestions from real restaurant data first
      const dynamicSuggestions: string[] = [];

      restaurants.forEach(r => {
        // Restaurant name
        if (r.name.toLowerCase().includes(q) && !dynamicSuggestions.includes(r.name)) {
          dynamicSuggestions.push(r.name);
        }
        // Cuisine
        if (r.cuisine.toLowerCase().includes(q) && !dynamicSuggestions.includes(r.cuisine)) {
          dynamicSuggestions.push(r.cuisine);
        }
        // Tags (dishes like pizza, biryani etc.)
        r.tags?.forEach(tag => {
          const formatted = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
          if (tag.toLowerCase().includes(q) && !dynamicSuggestions.includes(formatted)) {
            dynamicSuggestions.push(formatted);
          }
        });
      });

      // Fill remaining slots from static popular suggestions
      const staticMatches = popularSuggestions.filter(s =>
        s.toLowerCase().includes(q) &&
        !dynamicSuggestions.some(d => d.toLowerCase() === s.toLowerCase())
      );

      const combined = [...dynamicSuggestions, ...staticMatches].slice(0, 4);
      setSearchSuggestions(combined);
      setShowSuggestions(combined.length > 0);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }

    if (searchTimeout) clearTimeout(searchTimeout);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSuggestions(false);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      // Force scroll after clearing suggestions
      setTimeout(() => {
        scrollToRestaurants();
      }, 100);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Immediately hide suggestions to prevent multiple clicks
    setShowSuggestions(false);

    // Update search query
    setSearchQuery(suggestion);

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Force scroll after state updates with longer delay
    setTimeout(() => {
      scrollToRestaurants();
    }, 150);
  };

  const handleSortClick = (sortType: string) => {
    if (sortType === sortBy) {
      // Toggle between high and low
      setSortOrder(sortOrder === 'high' ? 'low' : 'high');
    } else {
      // New sort type, start with high
      setSortBy(sortType);
      setSortOrder('high');
    }

    // Force scroll after state update
    setTimeout(() => {
      scrollToRestaurants();
    }, 100);
  };

  // Separate scroll function for reusability - SMOOTH ANIMATION VERSION
  const scrollToRestaurants = () => {
    if (restaurantsRef.current) {
      const targetElement = restaurantsRef.current;
      const targetPosition = targetElement.offsetTop - 100;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const duration = 800; // Smooth 800ms duration
      let start: number | null = null;

      // Custom easing function for smooth feel
      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
      };

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);

        const easedProgress = easeOutCubic(progress);
        const currentPosition = startPosition + (distance * easedProgress);

        window.scrollTo(0, currentPosition);

        if (progress < 1) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    }
  };

  const handleCardClick = (restaurantId: number) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  // Function to get category images from public folder (using available auth images as food placeholders)
  const getCategoryImage = (categoryId: string): string => {
    const imageMap: { [key: string]: string } = {
      'italian': '/images/auth/category-italian.png',
      'japanese': '/images/auth/category-japanese.png',
      'indian': '/images/auth/category-indian.png',
      'chinese': '/images/auth/Rectangle 1684 .png',
      'american': '/images/auth/Rectangle 1681 .png',
      'thai': '/images/auth/Rectangle 1682 (1).png',
      'mexican': '/images/auth/Rectangle 1683 .png',
      'pizza': '/images/auth/Rectangle 1684 .png',
      'burgers': '/images/auth/Rectangle 1681 .png',
      'desserts': '/images/auth/Rectangle 1682 (1).png',
      'beverages': '/images/auth/Rectangle 1683 .png',
      'vegetarian': '/images/auth/Rectangle 1684 .png'
    };

    return imageMap[categoryId] || '/images/auth/category-all.png';
  };

  // Simple hover gradient
  const getHoverGradient = () => 'linear-gradient(135deg, #ff6b6b, #ee5a24)';

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', overflowX: 'hidden' }}>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      {/* Backdrop to close dropdowns */}
      {(showProfileDropdown || showMobileMenu) && (
        <div
          onClick={() => { setShowProfileDropdown(false); setShowMobileMenu(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
        />
      )}

      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(24,24,27,0.07)',
        boxShadow: '0 1px 24px rgba(24,24,27,0.06)',
      }}>
        <div className="header-inner" style={{
          maxWidth: 1440, margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>

          {/* ── Logo ── */}
          <a href="/home" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, rgba(232,93,142,0.13), rgba(232,93,142,0.07))',
              border: '1px solid rgba(232,93,142,0.15)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <Image src="/images/logo/Logo.png" alt="Fuji Sakura" width={28} height={28}
                style={{ objectFit: 'contain' }} priority />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#111', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Fuji <span style={{ color: '#E85D8E' }}>Sakura</span>
            </span>
          </a>

          {/* ── Location pill — visible on all screens, compact on mobile ── */}
          <button onClick={detectUserLocation} disabled={locationLoading}
            className="header-location-pill"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 38, padding: '0 14px',
              background: '#F7F7F7', border: '1px solid #EBEBEB',
              borderRadius: 100, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: '#333',
              transition: 'all .18s ease',
              flexShrink: 1, minWidth: 0, maxWidth: 220, overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E85D8E'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(232,93,142,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F7F7'; e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {/* Show address text on tablet+, icon only on small mobile */}
            <span className="header-location-text">
              {locationLoading ? 'Detecting…'
                : userAddress ? userAddress
                : 'Set location'}
            </span>
            {userAddress && !locationLoading && <span style={{ color: '#bbb', fontSize: 10, flexShrink: 0 }} className="header-location-arrow">▼</span>}
          </button>

          {/* ── Spacer ── */}
          <div style={{ flex: 1 }} />

          {/* ── Cart — always visible ── */}
          <button onClick={() => router.push('/cart')} aria-label="Cart"
            style={{
              position: 'relative', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 12,
              cursor: 'pointer', transition: 'all .18s ease', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F7F7F7'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Image src="/icons/navigation/cart.svg" alt="" width={22} height={22} />
            {getTotalItems() > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#E85D8E', color: '#fff',
                fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{getTotalItems() > 9 ? '9+' : getTotalItems()}</span>
            )}
          </button>

          {/* ── Profile avatar + dropdown — desktop ── */}
          <div style={{ position: 'relative', flexShrink: 0 }} className="header-desktop-only">
            <button onClick={() => setShowProfileDropdown(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 40, padding: '0 12px',
                background: showProfileDropdown ? '#F7F7F7' : 'transparent',
                border: '1px solid', borderColor: showProfileDropdown ? '#E85D8E33' : '#EBEBEB',
                borderRadius: 100, cursor: 'pointer', transition: 'all .18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85D8E44'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,93,142,0.08)'; }}
              onMouseLeave={e => { if (!showProfileDropdown) { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.boxShadow = 'none'; } }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: userProfileImage ? 'transparent' : 'linear-gradient(135deg, #E85D8E, #c2185b)',
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 2px rgba(232,93,142,0.2)',
              }}>
                {userProfileImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`${API_BASE_URL}${userProfileImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{userName ? userName[0].toUpperCase() : 'U'}</span>
                }
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#222', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'Profile'}
              </span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showProfileDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 200,
                background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)',
                border: '1px solid #F0F0F0', borderRadius: 18,
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                overflow: 'hidden', animation: 'slideDown 0.18s ease', zIndex: 60,
              }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F5F5F5' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>{userName}</p>
                  <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>Fuji Sakura Member</p>
                </div>
                {[
                  { label: 'My Profile', action: () => { router.push('/profile'); setShowProfileDropdown(false); }, color: '#333' },
                  { label: 'My Orders',  action: () => { router.push('/orders');  setShowProfileDropdown(false); }, color: '#333' },
                  { label: 'Sign Out',   action: () => { handleLogout(); setShowProfileDropdown(false); }, color: '#ef4444' },
                ].map((item, i, arr) => (
                  <button key={item.label} onClick={item.action}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', padding: '12px 16px',
                      background: 'transparent', border: 'none',
                      borderBottom: i < arr.length - 1 ? '1px solid #F7F7F7' : 'none',
                      textAlign: 'left', cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 500, color: item.color, transition: 'background .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = item.color === '#ef4444' ? '#FEF2F2' : '#F9F9F9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── Hamburger — mobile only ── */}
          <button
            onClick={() => setShowMobileMenu(p => !p)}
            aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
            className="header-mobile-only"
            style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid #EBEBEB',
              borderRadius: 12, cursor: 'pointer', flexShrink: 0,
              transition: 'all .15s ease',
            }}
          >
            {showMobileMenu ? (
              /* X icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              /* Hamburger */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>


        {/* Accent gradient line */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E85D8E44 30%, #E85D8E44 70%, transparent)' }} />
      </header>
        {/* ── Mobile menu drawer ── */}
        {/* ── Premium slide-in drawer — right side ── */}
        {showMobileMenu && (
          <>
            {/* Backdrop — fade in, click to close, drag right to dismiss */}
            <div
              className="drawer-backdrop"
              onClick={() => setShowMobileMenu(false)}
              onTouchStart={e => {
                const backdrop = e.currentTarget;
                const startX = e.touches[0].clientX;
                const panel = backdrop.nextElementSibling as HTMLElement | null;

                const onMove = (ev: TouchEvent) => {
                  const dx = ev.touches[0].clientX - startX;
                  if (dx > 0 && panel) {
                    panel.style.transition = 'none';
                    panel.style.transform = `translateX(${dx}px)`;
                    backdrop.style.opacity = `${Math.max(0, 1 - dx / 300)}`;
                  }
                };

                const onEnd = (ev: TouchEvent) => {
                  const dx = ev.changedTouches[0].clientX - startX;
                  backdrop.removeEventListener('touchmove', onMove);
                  backdrop.removeEventListener('touchend', onEnd);
                  if (dx > 100 && panel) {
                    panel.style.transition = 'transform 0.22s cubic-bezier(0.4,0,1,1)';
                    panel.style.transform = 'translateX(100%)';
                    setTimeout(() => setShowMobileMenu(false), 220);
                  } else if (panel) {
                    panel.style.transition = 'transform 0.28s cubic-bezier(0.16,1,0.3,1)';
                    panel.style.transform = 'translateX(0)';
                    backdrop.style.opacity = '1';
                  }
                };

                backdrop.addEventListener('touchmove', onMove, { passive: true });
                backdrop.addEventListener('touchend', onEnd, { passive: true });
              }}
              aria-hidden="true"
            />

            {/* Drawer panel — slides from right, drag right to dismiss */}
            <div
              className="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              onTouchStart={e => {
                const panel = e.currentTarget;
                const startX = e.touches[0].clientX;
                let currentDx = 0;

                const onMove = (ev: TouchEvent) => {
                  const dx = ev.touches[0].clientX - startX;
                  if (dx > 0) {
                    currentDx = dx;
                    panel.style.transition = 'none';
                    panel.style.transform = `translateX(${dx}px)`;
                  }
                };

                const onEnd = () => {
                  panel.removeEventListener('touchmove', onMove);
                  panel.removeEventListener('touchend', onEnd);
                  if (currentDx > 100) {
                    panel.style.transition = 'transform 0.22s cubic-bezier(0.4,0,1,1)';
                    panel.style.transform = 'translateX(100%)';
                    setTimeout(() => setShowMobileMenu(false), 220);
                  } else {
                    panel.style.transition = 'transform 0.28s cubic-bezier(0.16,1,0.3,1)';
                    panel.style.transform = 'translateX(0)';
                  }
                };

                panel.addEventListener('touchmove', onMove, { passive: true });
                panel.addEventListener('touchend', onEnd, { passive: true });
              }}
            >
              {/* Drag pill hint */}
              <div className="drawer-handle" aria-hidden="true" />

              {/* ── User greeting ── */}
              <div className="drawer-user">
                <div className="drawer-avatar">
                  {userProfileImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${API_BASE_URL}${userProfileImage}`} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{userName ? userName[0].toUpperCase() : 'U'}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="drawer-user-name">{userName || 'Guest'}</p>
                </div>
                <button className="drawer-close" onClick={() => setShowMobileMenu(false)} aria-label="Close menu">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="drawer-divider" />

              {/* ── Nav items — only real functionality ── */}
              <button className="drawer-item" onClick={() => { router.push('/profile'); setShowMobileMenu(false); }}>
                <span className="drawer-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className="drawer-item-text">
                  <span className="drawer-item-label">My Profile</span>
                  <span className="drawer-item-sub">View and edit your details</span>
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <button className="drawer-item" onClick={() => { router.push('/orders'); setShowMobileMenu(false); }}>
                <span className="drawer-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </span>
                <span className="drawer-item-text">
                  <span className="drawer-item-label">My Orders</span>
                  <span className="drawer-item-sub">Track and reorder</span>
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <div className="drawer-divider" />

              {/* ── Sign out ── */}
              <button className="drawer-logout" onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>

              {/* ── App version footer ── */}
              <div style={{ marginTop: 'auto', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#CCC', margin: 0 }}>Fuji Sakura v1.0 · Premium Food Delivery</p>
              </div>
            </div>
          </>
        )}

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP + TABLET LAYOUT (hidden on mobile < 768px)
      ═══════════════════════════════════════════════════════════ */}
      <div className="desktop-view">

      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero__inner">
          {/* LEFT */}
          <div className="home-hero__left">
            <span className="home-hero__tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              Premium Food Delivery
            </span>
            <h1 className="home-hero__title">
              Authentic food,{' '}
              <span className="home-hero__title-accent">delivered fast</span>
            </h1>
            <p className="home-hero__subtitle">
              Japanese cuisine, fresh ingredients, and the restaurants you love — at your door in 30 min.
            </p>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div className="home-hero__search" style={{ marginBottom: 0 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Image src="/icons/actions/search.svg" alt="" width={16} height={16}
                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
                  <input
                    id="hero-search-input"
                    type="text"
                    placeholder="Search restaurants or dishes…"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleSearchKeyPress}
                    onFocus={e => {
                      if (searchQuery.trim() && searchSuggestions.length) setShowSuggestions(true);
                      e.target.style.borderColor = '#E85D8E';
                      e.target.style.boxShadow = '0 0 0 4px rgba(232,93,142,0.12)';
                    }}
                    onBlur={e => {
                      setTimeout(() => setShowSuggestions(false), 200);
                      e.target.style.borderColor = '#E0E0E0';
                      e.target.style.boxShadow = 'none';
                    }}
                    style={{
                      width: '100%', height: 50, padding: '0 18px 0 44px',
                      background: '#fff', border: '1.5px solid #E0E0E0',
                      borderRadius: '14px 0 0 14px', fontSize: 14, color: '#222',
                      outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={() => { 
                    setShowSuggestions(false); 
                    if (searchQuery.trim()) {
                      setTimeout(() => scrollToRestaurants(), 100);
                    }
                  }}
                  style={{
                    height: 50, padding: '0 24px', flexShrink: 0,
                    background: '#E85D8E', color: '#fff', border: 'none',
                    borderRadius: '0 14px 14px 0', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#d44d7a')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#E85D8E')}
                >
                  Find Food
                </button>
              </div>

              {/* ── Suggestions dropdown — positioned relative to outer wrapper ── */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 300,
                  background: '#fff',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                  border: '1px solid #F0F0F0',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '8px 16px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#BBB',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #F5F5F5',
                  }}>
                    Suggestions
                  </div>
                  {searchSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={e => { e.preventDefault(); handleSuggestionClick(s); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: i < searchSuggestions.length - 1 ? '1px solid #F8F8F8' : 'none',
                        textAlign: 'left',
                        fontSize: 14,
                        color: '#222',
                        cursor: 'pointer',
                        transition: 'background .1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F8'; e.currentTarget.style.color = '#E85D8E'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#222'; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location detect */}
            <button onClick={detectUserLocation} disabled={locationLoading}
              className="home-hero__location">
              <Image src="/icons/delivery/location.svg" alt="" width={14} height={14} style={{ opacity: 0.6 }} />
              {locationLoading ? 'Detecting location…'
                : userAddress
                  ? <><span>Delivering to</span> <strong>{userAddress}</strong> <span style={{ color: '#E85D8E' }}>· Change</span></>
                  : 'Detect my location'}
            </button>
          </div>

          {/* RIGHT — food image only */}
          <div className="home-hero__right">
            <div className="home-hero__img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/auth/Rectangle 1682 (1).png"
                alt="Delicious food ready for delivery"
                className="home-hero__img"
              />
              {/* Floating — delivery time */}
              <div className="home-hero__float home-hero__float--tl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>30 min delivery</span>
              </div>
              {/* Floating — rating */}
              <div className="home-hero__float home-hero__float--br">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                <span>4.8 rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Full-width bottom strip: stats + feature cards ── */}
        <div className="home-hero__bottom">
          {/* Stats */}
          <div className="home-hero__stats-row">
            {[
              { value: '50+', label: 'Restaurants' },
              { value: '4.8★', label: 'Avg Rating' },
              { value: '30 min', label: 'Avg Delivery' },
            ].map(s => (
              <div key={s.label} className="home-hero__stat">
                <span className="home-hero__stat-value">{s.value}</span>
                <span className="home-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="home-hero__bottom-divider" />

          {/* Feature cards */}
          <div className="home-hero__features-row">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
                title: 'Fast Delivery',
                desc: 'Avg 30 min',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
                title: 'Premium Quality',
                desc: 'Top-rated only',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title: 'Live Tracking',
                desc: 'Real-time updates',
              },
            ].map(f => (
              <div key={f.title} className="home-hero__feature-inline">
                <div className="home-hero__feature-icon-sm">{f.icon}</div>
                <div>
                  <p className="home-hero__feature-title">{f.title}</p>
                  <p className="home-hero__feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ───────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 64px' }}>

        {/* Location banner */}
        {showLocationPrompt && (
          <div className="location-prompt" style={{
            marginTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '14px 20px', background: '#fff',
            border: '1px solid #F0F0F0', borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#222', margin: 0 }}>Set your delivery location</p>
              <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>See restaurants that deliver to you</p>
            </div>
            <button onClick={detectUserLocation} disabled={locationLoading}
              style={{
                height: 38, padding: '0 20px', borderRadius: 100, border: 'none',
                background: '#E85D8E', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: locationLoading ? 'not-allowed' : 'pointer',
                opacity: locationLoading ? 0.65 : 1, whiteSpace: 'nowrap',
              }}>
              {locationLoading ? 'Detecting…' : 'Detect Location'}
            </button>
          </div>
        )}

        {/* ─── CATEGORIES ─────────────────────────────────────── */}
        <div className="category-tabs-wrap">
          <div className="category-tabs-inner scrollbar-hide">
            {/* All */}
            {[{ id: '', name: 'All', emoji: '' }, ...categories].map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 44, padding: '0 16px',
                    background: 'transparent', border: 'none',
                    borderBottom: active ? '2.5px solid #E85D8E' : '2.5px solid transparent',
                    cursor: 'pointer',
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    color: active ? '#E85D8E' : '#666',
                    transition: 'color .15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#E85D8E'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#666'; }}
                >
                  {cat.emoji && <span style={{ fontSize: 15 }}>{cat.emoji}</span>}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── OFFER BANNERS ──────────────────────────────────── */}
        <div className="offer-banner-section">
          {/* Banner track */}
          <div className="offer-banner-track">
            {banners.map((b, i) => (
              <div key={b.id}
                style={{
                  position: 'absolute', inset: 0,
                  background: b.bg,
                  padding: '0 28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: activeBanner === i ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: activeBanner === i ? 'auto' : 'none',
                }}
              >
                {/* Decorative circles */}
                <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: 60, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                {/* Text */}
                <div style={{ zIndex: 1 }}>
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', color: b.accent,
                    background: `${b.accent}22`, borderRadius: 100,
                    padding: '2px 10px', marginBottom: 8,
                  }}>{b.tag}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.2, maxWidth: 340 }}>{b.title}</h3>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{b.subtitle}</p>
                </div>

                {/* CTA */}
                <button style={{
                  flexShrink: 0, height: 40, padding: '0 22px',
                  background: b.accent === '#fff' ? 'rgba(255,255,255,0.2)' : b.accent,
                  border: `1.5px solid ${b.accent === '#fff' ? 'rgba(255,255,255,0.4)' : b.accent}`,
                  borderRadius: 100, color: '#fff', fontSize: 13.5, fontWeight: 700,
                  cursor: 'pointer', zIndex: 1,
                  backdropFilter: 'blur(4px)',
                  transition: 'opacity .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >{b.cta}</button>
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {banners.map((_, i) => (
              <button key={i} onClick={() => setActiveBanner(i)}
                style={{
                  width: activeBanner === i ? 20 : 6,
                  height: 6, borderRadius: 100, border: 'none',
                  background: activeBanner === i ? '#E85D8E' : '#D1D5DB',
                  cursor: 'pointer', transition: 'all .25s ease', padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* ─── SECTION HEADER ─────────────────────────────────── */}
        <div className="section-header">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0, letterSpacing: '-0.3px' }}>
              {searchQuery.trim()
                ? `Results for "${searchQuery}"`
                : selectedCategory
                  ? (categories.find(c => c.id === selectedCategory)?.name ?? 'Restaurants')
                  : 'Popular Near You'}
            </h2>
            {!loading && (
              <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>
                {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSortDropdown(!showSortDropdown)}
              onBlur={() => setTimeout(() => setShowSortDropdown(false), 200)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 36, padding: '0 14px',
                background: sortBy ? '#E85D8E' : '#fff',
                border: `1px solid ${sortBy ? '#E85D8E' : '#EBEBEB'}`,
                borderRadius: 100, cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: sortBy ? '#fff' : '#555',
                transition: 'all .15s',
              }}>
              <Icon name="actions/filter" size={13}
                style={sortBy ? { filter: 'brightness(0) invert(1)' } : { opacity: 0.5 }} />
              Sort
            </button>
            {showSortDropdown && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                width: 210, background: '#fff',
                border: '1px solid #F0F0F0', borderRadius: 14,
                boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
                zIndex: 30, overflow: 'hidden',
                animation: 'slideDown 0.15s ease',
              }}>
                {[
                  { key: '', label: 'Default' },
                  { key: 'rating', label: 'Top Rated' },
                  { key: 'distance', label: 'Nearest First' },
                  { key: 'time', label: 'Fastest Delivery' },
                  { key: 'price', label: 'Price: Low to High' },
                ].map((opt, i, arr) => (
                  <button key={opt.key}
                    onMouseDown={e => { e.preventDefault(); setSortBy(opt.key); setShowSortDropdown(false); }}
                    style={{
                      width: '100%', padding: '11px 16px',
                      background: sortBy === opt.key ? '#FFF5F8' : 'transparent',
                      border: 'none',
                      borderBottom: i < arr.length - 1 ? '1px solid #F7F7F7' : 'none',
                      textAlign: 'left', fontSize: 13.5,
                      color: sortBy === opt.key ? '#E85D8E' : '#333',
                      fontWeight: sortBy === opt.key ? 600 : 400,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (sortBy !== opt.key) e.currentTarget.style.background = '#F9F9F9'; }}
                    onMouseLeave={e => { if (sortBy !== opt.key) e.currentTarget.style.background = 'transparent'; }}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── ERROR ──────────────────────────────────────────── */}
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button onClick={() => { fetchRestaurants(userLat, userLng); fetchCategories(); }}
              style={{ height: 40, padding: '0 24px', borderRadius: 100, border: 'none', background: '#E85D8E', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {/* ─── LOADING SKELETONS ──────────────────────────────── */}
        {loading && !error && (
          <div className="restaurant-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                <div className="skeleton restaurant-card-img" />
                <div className="restaurant-card-info" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 16, borderRadius: 8, width: '70%' }} />
                  <div className="skeleton" style={{ height: 12, borderRadius: 8, width: '45%' }} />
                  <div className="skeleton" style={{ height: 12, borderRadius: 8, width: '90%' }} />
                  <div className="skeleton" style={{ height: 38, borderRadius: 10, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── EMPTY STATE ────────────────────────────────────── */}
        {!loading && !error && filteredRestaurants.length === 0 && restaurants.length > 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>No restaurants found</p>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Try adjusting your search or filters</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
              style={{ height: 40, padding: '0 24px', borderRadius: 100, border: 'none', background: '#E85D8E', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* ─── RESTAURANT GRID ────────────────────────────────── */}
        {!loading && !error && filteredRestaurants.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filteredRestaurants.map(r => (
              <div key={r.id}
                className="restaurant-card"
                onClick={() => { if (!r.is_online || r.is_deliverable === false) return; handleCardClick(r.id); }}
                onMouseEnter={() => r.is_online && setHoveredCard(r.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid #F0F0F0',
                  cursor: r.is_online ? 'pointer' : 'not-allowed',
                  opacity: r.is_online ? 1 : 0.65,
                  transition: 'transform .2s ease, box-shadow .2s ease',
                  transform: hoveredCard === r.id ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: hoveredCard === r.id
                    ? '0 16px 40px rgba(0,0,0,0.11)'
                    : '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                {/* Food photo */}
                <div className="restaurant-card-img" style={{ position: 'relative', background: '#F3F3F3', overflow: 'hidden' }}>
                  {getFullImageUrl(r.restaurant_image).startsWith('http') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getFullImageUrl(r.restaurant_image)} alt={r.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                      {getFullImageUrl(r.restaurant_image)}
                    </div>
                  )}

                  {/* Delivery time — top left */}
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)',
                    borderRadius: 100, padding: '3px 10px',
                    fontSize: 11.5, fontWeight: 600, color: '#222',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
                  }}>
                    {r.delivery_time}
                  </div>

                  {/* Rating — top right */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)',
                    borderRadius: 100, padding: '3px 9px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
                  }}>
                    <Image src="/icons/status/star.svg" alt="" width={11} height={11} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#166534' }}>{r.rating}</span>
                  </div>

                  {/* Offline badge */}
                  {!r.is_online && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        background: '#dc2626', color: '#fff',
                        fontSize: 12, fontWeight: 700,
                        padding: '5px 14px', borderRadius: 100,
                      }}>CLOSED</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="restaurant-card-info" style={{ padding: '14px 16px 16px' }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </h3>
                  <p style={{ fontSize: 12.5, color: '#888', margin: '3px 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.cuisine} Cuisine
                  </p>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#999', marginBottom: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Image src="/icons/delivery/location.svg" alt="" width={12} height={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                      {r.distance_km != null ? `${r.distance_km} km` : 'Nearby'}
                    </span>
                    <span style={{ color: '#E0E0E0' }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Image src="/icons/misc/list.svg" alt="" width={12} height={12} style={{ opacity: 0.5 }} />
                      {r.reviews} reviews
                    </span>
                  </div>

                  {/* Not deliverable */}
                  {r.is_deliverable === false && (
                    <p style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>
                      Not available in your area
                    </p>
                  )}

                  {/* CTA */}
                  <button disabled={!r.is_online}
                    style={{
                      width: '100%', height: 40, borderRadius: 10, border: 'none',
                      background: r.is_online ? '#E85D8E' : '#D1D5DB',
                      color: '#fff', fontSize: 14, fontWeight: 600,
                      cursor: r.is_online ? 'pointer' : 'not-allowed',
                      transition: 'background .15s',
                      letterSpacing: '0.01em',
                    }}
                    onMouseEnter={e => { if (r.is_online) e.currentTarget.style.background = '#d44d7a'; }}
                    onMouseLeave={e => { if (r.is_online) e.currentTarget.style.background = '#E85D8E'; }}
                  >
                    {r.is_online ? 'View Menu' : 'Closed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      </div>{/* end desktop-view */}

      {/* ═══════════════════════════════════════════════════════════
          MOBILE LAYOUT — shown only on < 768px
          Same data, same state, touch-optimised layout
      ═══════════════════════════════════════════════════════════ */}
      <div className="mobile-view">

        {/* ── Search + Location strip ── */}
        <div className="mv-search-strip">
          {/* Location row */}
          <button className="mv-location-btn" onClick={detectUserLocation} disabled={locationLoading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E85D8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="mv-location-text">
              {locationLoading ? 'Detecting…' : userAddress ? `Delivering to: ${userAddress}` : 'Set delivery location'}
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {/* Search input */}
          <div className="mv-search-wrap" style={{ position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mv-search-icon" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              id="hero-search-input"
              type="search"
              placeholder="Search restaurants or dishes…"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              onFocus={() => {
                if (searchQuery.trim() && searchSuggestions.length) setShowSuggestions(true);
              }}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
              className="mv-search-input"
              aria-label="Search restaurants"
            />

            {/* Mobile suggestions dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 300,
                background: '#fff',
                borderRadius: 14,
                boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                border: '1px solid #F0F0F0',
                overflow: 'hidden',
              }}>
                {searchSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={e => { e.preventDefault(); handleSuggestionClick(s); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '13px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: i < searchSuggestions.length - 1 ? '1px solid #F8F8F8' : 'none',
                      textAlign: 'left',
                      fontSize: 14,
                      color: '#222',
                      cursor: 'pointer',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F8'; e.currentTarget.style.color = '#E85D8E'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#222'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Offer Banner ── */}
        <div className="mv-banner">
          {banners.map((b, i) => (
            <div key={b.id} className={`mv-banner-slide ${activeBanner === i ? 'mv-banner-slide--active' : ''}`}
              style={{ background: b.bg }}>
              {/* Decorative circle bg */}
              <div className="mv-banner-circles" aria-hidden="true" />
              {/* Second decorative circle */}
              <div style={{
                position: 'absolute', right: 60, bottom: -30,
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
              }} aria-hidden="true" />

              {/* Left: text content */}
              <div className="mv-banner-content">
                <span className="mv-banner-tag" style={{ color: b.accent, background: `${b.accent}28` }}>
                  {b.tag}
                </span>
                <h3 className="mv-banner-title">{b.title}</h3>
                <p className="mv-banner-sub">{b.subtitle}</p>
              </div>

              {/* Right: CTA */}
              <button className="mv-banner-cta"
                style={{ background: b.accent === '#fff' ? 'rgba(255,255,255,0.18)' : b.accent, borderColor: 'rgba(255,255,255,0.3)' }}>
                {b.cta}
              </button>
            </div>
          ))}
          {/* Dots */}
          <div className="mv-banner-dots" aria-hidden="true">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setActiveBanner(i)}
                className={`mv-banner-dot ${activeBanner === i ? 'mv-banner-dot--active' : ''}`} />
            ))}
          </div>
        </div>

        {/* ── Categories ── */}
        <div className="mv-section-header">
          <span className="mv-section-title">Categories</span>
          <span className="mv-scroll-hint">
            scroll
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div className="mv-categories-wrap">
          <div className="mv-categories scrollbar-hide">
          {[{ id: '', name: 'All', emoji: '' }, ...categories].map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                className={`mv-chip ${active ? 'mv-chip--active' : ''}`}>
                {cat.emoji && <span className="mv-chip-emoji" aria-hidden="true">{cat.emoji}</span>}
                <span>{cat.name}</span>
              </button>
            );
          })}
          </div>
        </div>

        {/* ── Restaurants section ── */}
        <div className="mv-section-header" style={{ marginTop: 12 }}>
          <span className="mv-section-title">
            {searchQuery.trim() ? `Results for "${searchQuery}"` : selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name ?? 'Restaurants') : 'Popular Near You'}
          </span>
          {!loading && (
            <span className="mv-section-count">{filteredRestaurants.length} restaurants</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mv-error">
            <p>{error}</p>
            <button onClick={() => { fetchRestaurants(userLat, userLng); }} className="mv-retry-btn">Retry</button>
          </div>
        )}

        {/* Skeleton */}
        {loading && !error && (
          <div className="mv-restaurant-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mv-card-skeleton">
                <div className="skeleton mv-card-skeleton-img" />
                <div className="mv-card-skeleton-body">
                  <div className="skeleton" style={{ height: 15, borderRadius: 6, width: '65%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '40%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 34, borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredRestaurants.length === 0 && restaurants.length > 0 && (
          <div className="mv-empty">
            <p className="mv-empty-title">No restaurants found</p>
            <p className="mv-empty-sub">Try a different search or category</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); }} className="mv-retry-btn">Clear filters</button>
          </div>
        )}

        {/* Restaurant list */}
        {!loading && !error && filteredRestaurants.length > 0 && (
          <div className="mv-restaurant-list">
            {filteredRestaurants.map(r => (
              <div key={r.id} className={`mv-card ${!r.is_online ? 'mv-card--offline' : ''}`}
                onClick={() => { if (!r.is_online || r.is_deliverable === false) return; handleCardClick(r.id); }}>
                {/* Image */}
                <div className="mv-card-img-wrap">
                  {getFullImageUrl(r.restaurant_image).startsWith('http') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getFullImageUrl(r.restaurant_image)} alt={r.name} className="mv-card-img"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="mv-card-img-fallback">
                      <Image src="/images/auth/Rectangle 1682 (1).png" alt={r.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="mv-card-time-badge">{r.delivery_time}</div>
                  <div className="mv-card-rating-badge">
                    <Image src="/icons/status/star.svg" alt="" width={10} height={10} />
                    <span>{r.rating}</span>
                  </div>
                  {!r.is_online && <div className="mv-card-closed-overlay"><span>CLOSED</span></div>}
                </div>
                {/* Info */}
                <div className="mv-card-body">
                  <div className="mv-card-info">
                    <h3 className="mv-card-name">{r.name}</h3>
                    <p className="mv-card-cuisine">{r.cuisine} Cuisine</p>
                    <div className="mv-card-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Image src="/icons/delivery/location.svg" alt="" width={11} height={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        {r.distance_km != null ? `${r.distance_km} km` : 'Nearby'}
                      </span>
                      <span className="mv-card-meta-dot">·</span>
                      <span>{r.reviews} reviews</span>
                    </div>
                    {r.is_deliverable === false && (
                      <p className="mv-card-not-available">Not available in your area</p>
                    )}
                  </div>
                  <button disabled={!r.is_online} className={`mv-card-cta ${!r.is_online ? 'mv-card-cta--disabled' : ''}`}
                    onClick={e => { e.stopPropagation(); if (r.is_online && r.is_deliverable !== false) handleCardClick(r.id); }}>
                    {r.is_online ? 'Order →' : 'Closed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Bottom Nav REMOVED — this is a website, not native app ── */}

        {/* Spacer */}
        <div style={{ height: 24 }} aria-hidden="true" />

      </div>{/* end mobile-view */}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-footer-inner">

          {/* ── Col 1: Brand ── */}
          <div className="footer-brand">
            <Image src="/images/logo/Logo.png" alt="Fuji Sakura" width={96} height={36}
              style={{ objectFit: 'contain', marginBottom: 14 }} />
            <p className="footer-tagline">
              Premium Japanese food delivery experience — authentic cuisine, delivered fast.
            </p>
            <a href="https://www.fujisakuratech.com" target="_blank" rel="noopener noreferrer"
              className="footer-website">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              fujisakuratech.com
            </a>
          </div>

          {/* ── Col 2: Quick links ── */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/home" className="footer-link">Home</a></li>
              <li><a href="/orders" className="footer-link">My Orders</a></li>
              <li><a href="/cart" className="footer-link">Cart</a></li>
              <li><a href="/profile" className="footer-link">My Profile</a></li>
            </ul>
          </div>

          {/* ── Col 3: Company ── */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li>
                <a href="https://www.fujisakuratech.com" target="_blank" rel="noopener noreferrer"
                  className="footer-link">About Us</a>
              </li>
              <li>
                <a href="https://www.fujisakuratech.com/contact" target="_blank" rel="noopener noreferrer"
                  className="footer-link">Contact Us</a>
              </li>
              <li><a href="/restaurant/login" target="_blank" rel="noopener noreferrer" className="footer-link">Restaurant Partner</a></li>
              <li><a href="/delivery/login" target="_blank" rel="noopener noreferrer" className="footer-link">Delivery Partner</a></li>
            </ul>
          </div>

          {/* ── Col 4: Contact ── */}
          <div className="footer-col">
            <h4 className="footer-col-title">Get in Touch</h4>
            <ul className="footer-links">
              <li>
                <a href="https://www.fujisakuratech.com/contact" target="_blank" rel="noopener noreferrer"
                  className="footer-link footer-link--icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Contact Support
                </a>
              </li>
              <li>
                <a href="https://www.fujisakuratech.com" target="_blank" rel="noopener noreferrer"
                  className="footer-link footer-link--icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Visit Website
                </a>
              </li>
            </ul>

            {/* Powered by badge */}
            <div className="footer-powered">
              <span>Powered by</span>
              <a href="https://www.fujisakuratech.com" target="_blank" rel="noopener noreferrer"
                className="footer-powered-link">Fuji Sakura Tech</a>
            </div>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-mobile-links" style={{ display: 'none' }}>
          {/* shown via CSS on mobile only */}
          <a href="/home" className="footer-mobile-link">Home</a>
          <a href="/orders" className="footer-mobile-link">Orders</a>
          <a href="/cart" className="footer-mobile-link">Cart</a>
          <a href="/profile" className="footer-mobile-link">Profile</a>
          <a href="https://www.fujisakuratech.com/contact" target="_blank" rel="noopener noreferrer" className="footer-mobile-link">Help & Support</a>
          <a href="https://www.fujisakuratech.com/contact" target="_blank" rel="noopener noreferrer" className="footer-mobile-link">Contact</a>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <p className="footer-copy">
              © 2026 Fuji Sakura Tech. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="https://www.fujisakuratech.com" target="_blank" rel="noopener noreferrer"
                className="footer-bottom-link">Privacy Policy</a>
              <span className="footer-bottom-dot" aria-hidden="true">·</span>
              <a href="https://www.fujisakuratech.com" target="_blank" rel="noopener noreferrer"
                className="footer-bottom-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

