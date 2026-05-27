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
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const router = useRouter();
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const { getTotalItems } = useCart();

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
        { id: 'italian', name: 'Italian', emoji: '🍝' },
        { id: 'japanese', name: 'Japanese', emoji: '🍣' },
        { id: 'indian', name: 'Indian', emoji: '🍛' }
      ]);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'Guest';
    setUserName(storedName);

    // Fetch user profile image (NOT address — delivery location is separate)
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
      // No localStorage location — try loading from DB (user_addresses)
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
      // No saved delivery location — show prompt and fetch all restaurants
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

      // Save to DB (user_addresses table) — so it persists across devices
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
      // User denied or GPS failed — just dismiss prompt
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
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
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
    localStorage.removeItem('isGuest');
    localStorage.removeItem('rememberMe');

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

    // Show suggestions when typing
    if (value.trim().length > 0) {
      const filtered = popularSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setSearchSuggestions(filtered.slice(0, 6)); // Show max 6 suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }

    // Clear existing timeout - REMOVED AUTO-SCROLL ON TYPING
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // NO AUTO-SCROLL - Only scroll when Enter is pressed or suggestion is clicked
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 20s ease infinite', // Slower animation for better performance
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Food Emojis - Reduced for performance */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '2rem', animation: 'float 8s ease-in-out infinite', opacity: 0.4 }}>🍜</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '1.5rem', animation: 'float 7s ease-in-out infinite 1s', opacity: 0.3 }}>🍱</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: '1.8rem', animation: 'float 9s ease-in-out infinite 2s', opacity: 0.4 }}>🍣</div>

      {/* HEADER - MATCHING SPLASH/LOGIN THEME WITH CARD-LIKE ENDING */}
      <header style={{
        padding: '1rem 2rem 1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(20, 10, 40, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Logo & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🌸 Fuji Sakura
          </h1>

          <div
            onClick={() => {
              if (userAddress && userLat) {
                // Re-detect location (user wants to change)
                detectUserLocation();
              } else {
                detectUserLocation();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: userAddress ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '10px',
              border: userAddress
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : '1px dashed rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = userAddress ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '1px',
              gap: '10px'

            }}>
              <Icon name="delivery/location" size={18} style={{ filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
              {userAddress ? (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: '400' }}>Delivering to</span>
                  <span
                    style={{
                      color: 'white', fontSize: '0.85rem', fontWeight: '700',
                      maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={userAddress}
                  >
                    {userAddress}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: '500' }}>▼</span>
                </>
              ) : (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '400', fontStyle: 'italic' }}>
                    No address added
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white', fontSize: '0.7rem', fontWeight: '700',
                    padding: '0.15rem 0.5rem', borderRadius: '10px',
                    letterSpacing: '0.03em'
                  }}>
                    + Add
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: 1, maxWidth: '400px', margin: '0 2rem', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search restaurants, cuisines, or dishes..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              onFocus={(e) => {
                // Show suggestions if available
                if (searchQuery.trim().length > 0 && searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
                // Style changes
                e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.1)';
              }}
              onBlur={(e) => {
                // Delay hiding to allow clicking suggestions - INCREASED DELAY
                setTimeout(() => setShowSuggestions(false), 300);
                // Style changes
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '25px',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              fontSize: '1rem'
            }}>
              <Image src="/icons/actions/search.svg" alt="Search" width={20} height={20} />
            </span>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              marginTop: '0.5rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'slideDown 0.2s ease-out'
            }}>
              <div style={{
                padding: '0.75rem 1rem 0.5rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Popular Suggestions
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseDown={(e) => {
                    // Prevent blur from happening before click
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#333',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                    e.currentTarget.style.color = '#ff6b6b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#333';
                  }}
                >
                  <Icon name="actions/search" size={14} style={{ opacity: 0.6 }} />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Filter Icon - NEW */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            onBlur={() => setTimeout(() => setShowSortDropdown(false), 200)}
            style={{
              position: 'relative',
              padding: '0.75rem',
              background: sortBy ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!sortBy) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              }
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              if (!sortBy) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Sort restaurants"
          >
            <Icon name="actions/filter" size={20} style={{ filter: 'brightness(0) invert(1)' }} />
            {sortBy && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#10b981',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                <Image src="/icons/actions/check.svg" alt="Selected" width={16} height={16} />
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          {showSortDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 1000,
              overflow: 'hidden',
              minWidth: '220px',
              animation: 'slideDown 0.2s ease-out'
            }}>
              <div style={{
                padding: '0.75rem 1rem 0.5rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Sort By
              </div>

              {[
                { id: 'rating', label: 'Rating', icon: '/icons/status/star.svg', desc: 'High to Low' },
                { id: 'distance', label: 'Distance', icon: '/icons/delivery/location.svg', desc: 'Nearest First' },
                { id: 'time', label: 'Delivery Time', icon: '/icons/time/clock.svg', desc: 'Fastest First' },
                { id: 'price', label: 'Delivery Fee', icon: '/icons/payment/money.svg', desc: 'Low to High' }
              ].map((sort) => (
                <button
                  key={sort.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSortClick(sort.id);
                    setShowSortDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: sortBy === sort.id ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderLeft: sortBy === sort.id ? '3px solid #ff6b6b' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = sortBy === sort.id ? 'rgba(255, 107, 107, 0.1)' : 'transparent';
                  }}
                >
                  <Image src={sort.icon} alt={sort.label} width={20} height={20} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: sortBy === sort.id ? '#ff6b6b' : '#333',
                      marginBottom: '0.1rem'
                    }}>
                      {sort.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#666'
                    }}>
                      {sort.desc}
                    </div>
                  </div>
                  {sortBy === sort.id && (
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#ff6b6b',
                      fontWeight: 'bold'
                    }}>
                      {sortOrder === 'high' ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              ))}

              {/* Clear Sort Option */}
              {sortBy && (
                <>
                  <div style={{
                    height: '1px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    margin: '0.5rem 0'
                  }}></div>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSortBy('');
                      setSortOrder('high');
                      setShowSortDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: '#dc2626',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>✕</span>
                    <span>Clear Sort</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cart & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/cart')}
            style={{
              position: 'relative',
              marginLeft: '5px',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Image src="/icons/navigation/cart.svg" alt="Cart" width={24} height={24} />
            {getTotalItems() > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ff6b6b',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>{getTotalItems()}</span>
            )}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '25px',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ color: 'white', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: '500' }}>Hi, {userName}!</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Welcome back</div>
            </div>

            {/* Orders Button */}
            <button
              onClick={() => router.push('/orders')} style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <Image src="/icons/navigation/orders.svg" alt="Orders" width={20} height={20} />
              <span>Orders</span>
            </button>

            {/* Profile Button */}
            <button
              onClick={() => router.push('/profile')}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6, #5f27cd)';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              {userProfileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE_URL}${userProfileImage}`}
                  alt="Profile"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.6)' }}
                />
              ) : (
                <Image src="/icons/navigation/user.svg" alt="Profile" width={20} height={20} />
              )}
              <span>Profile</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* LOCATION PROMPT BANNER — shown when no location is set */}
      {showLocationPrompt && (
        <div style={{
          background: 'linear-gradient(135deg, #fff5f2, #ffffff)',
          border: '1px solid #ffe0d6',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          margin: '1rem 2rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 2px 12px rgba(255, 87, 34, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📍</span>
            <div>
              <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Set your delivery location</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>See restaurants that deliver to you</div>
            </div>
          </div>
          <button
            onClick={detectUserLocation}
            disabled={locationLoading}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF5722, #FF7043)',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: locationLoading ? 'not-allowed' : 'pointer',
              opacity: locationLoading ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {locationLoading ? '⏳ Detecting...' : '📍 Detect Location'}
          </button>
        </div>
      )}

      {/* SECTION 1: CRAVING TEXT - CENTERED WITH TOP SPACING */}
      <section style={{
        paddingTop: '3rem',
        paddingBottom: '2rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 5
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '1rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '2rem', marginRight: '8px' }}>🍽️</span>
          What are you craving?
        </h2>
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          margin: 0
        }}>
          Choose from popular categories
        </p>
      </section>

      {/* SECTION 2: CATEGORY CAPSULES - MATCHING YOUR IMAGE */}
      <section style={{
        paddingTop: '2rem',
        paddingBottom: '3rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem'
          }}>
            {/* All Category - Selected by default */}
            <button
              onClick={() => handleCategoryClick('')}
              style={{
                background: selectedCategory === ''
                  ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '2rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: selectedCategory === '' ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedCategory === ''
                  ? '0 12px 35px rgba(255, 107, 107, 0.4)'
                  : '0 8px 25px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                // Only apply hover effect if NOT selected
                if (selectedCategory !== '') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.4)';
                  // Change text color to white on hover
                  const textElements = e.currentTarget.querySelectorAll('div');
                  textElements.forEach(el => {
                    (el as HTMLElement).style.color = 'white';
                  });
                }
              }}
              onMouseLeave={(e) => {
                // Only remove hover effect if NOT selected
                if (selectedCategory !== '') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                  // Change text color back to dark
                  const textElements = e.currentTarget.querySelectorAll('div');
                  textElements.forEach(el => {
                    (el as HTMLElement).style.color = '#333';
                  });
                }
              }}
            >
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: selectedCategory === ''
                  ? 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)'
                  : 'radial-gradient(circle at 30% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
              }}></div>

              <div style={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  background: selectedCategory === ''
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Image
                    src="/images/auth/category-all.png"
                    alt="All Categories"
                    width={60}
                    height={60}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '15px',
                      filter: selectedCategory === '' ? 'brightness(1.2) contrast(1.1)' : 'none'
                    }}
                  />
                </div>
                <div style={{
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  color: selectedCategory === '' ? 'white' : '#333',
                  textShadow: selectedCategory === '' ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'
                }}>All</div>
                <div style={{
                  fontSize: '0.8rem',
                  color: selectedCategory === '' ? 'rgba(255, 255, 255, 0.9)' : '#666',
                  marginTop: '0.25rem',
                  fontWeight: '500'
                }}>View All</div>
              </div>
            </button>

            {/* Other Categories — show top 4, rest hidden behind More button */}
            {(showAllCategories ? categories : categories.slice(0, 4)).map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                style={{
                  background: selectedCategory === category.id
                    ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px',
                  padding: '2rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: selectedCategory === category.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedCategory === category.id
                    ? '0 12px 35px rgba(255, 107, 107, 0.4)'
                    : '0 8px 25px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  // Only apply hover effect if NOT selected
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.4)';
                    // Change text color to white on hover
                    const textElements = e.currentTarget.querySelectorAll('div');
                    textElements.forEach(el => {
                      (el as HTMLElement).style.color = 'white';
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  // Only remove hover effect if NOT selected
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                    // Change text color back to dark
                    const textElements = e.currentTarget.querySelectorAll('div');
                    textElements.forEach(el => {
                      (el as HTMLElement).style.color = '#333';
                    });
                  }
                }}
              >
                {/* Background Pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: selectedCategory === category.id
                    ? 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 30% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }}></div>

                <div style={{
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    background: selectedCategory === category.id
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Image
                      src={getCategoryImage(category.id)}
                      alt={category.name}
                      width={60}
                      height={60}
                      style={{
                        objectFit: 'cover',
                        borderRadius: '15px',
                        filter: selectedCategory === category.id ? 'brightness(1.2) contrast(1.1)' : 'none'
                      }}
                    />
                  </div>
                  <div style={{
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    color: selectedCategory === category.id ? 'white' : '#333',
                    textShadow: selectedCategory === category.id ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'
                  }}>{category.name}</div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: selectedCategory === category.id ? 'rgba(255, 255, 255, 0.9)' : '#666',
                    marginTop: '0.25rem',
                    fontWeight: '500'
                  }}>Explore</div>
                </div>
              </button>
            ))}

            {/* More / Less button — only show if more than 4 categories */}
            {categories.length > 4 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px',
                  padding: '2rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {showAllCategories ? '▲' : '⋯'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#333' }}>
                  {showAllCategories ? 'Less' : `+${categories.length - 4} More`}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', fontWeight: '500' }}>
                  {showAllCategories ? 'Show less' : 'View all'}
                </div>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: POPULAR RESTAURANTS TITLE */}
      <section style={{
        paddingTop: '2rem',
        paddingBottom: '1.5rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.25rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            margin: '0 0 0.25rem 0'
          }}>
            Popular Restaurants
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            margin: 0
          }}>
            {filteredRestaurants.length} restaurants found
          </p>
        </div>
      </section>

      {/* SECTION 4: RESTAURANT CARDS GRID */}
      <section
        ref={restaurantsRef}
        style={{
          paddingTop: '2rem',
          paddingBottom: '4rem',
          position: 'relative',
          zIndex: 5
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          {/* Loading State */}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255, 107, 107, 0.3)',
                borderTop: '4px solid #ff6b6b',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{
                color: 'white',
                fontSize: '1.1rem',
                textAlign: 'center'
              }}>
                Loading delicious restaurants...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                maxWidth: '500px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Oops! Something went wrong
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  marginBottom: '1.5rem',
                  margin: '0 0 1.5rem 0'
                }}>
                  {error}
                </p>
                <button
                  onClick={() => {
                    fetchRestaurants(userLat, userLng);
                    fetchCategories();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State - when no restaurants loaded due to network issues */}
          {!loading && !error && filteredRestaurants.length === 0 && restaurants.length === 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                maxWidth: '500px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  No restaurants available
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  marginBottom: '1.5rem',
                  margin: '0 0 1.5rem 0'
                }}>
                  Please check your network connection or try again later
                </p>
                <button
                  onClick={() => {
                    fetchRestaurants(userLat, userLng);
                    fetchCategories();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* No Results State - when no restaurants match filters */}
          {!loading && !error && filteredRestaurants.length === 0 && restaurants.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                maxWidth: '500px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  <Image src="/icons/actions/search.svg" alt="Search" width={48} height={48} />
                </div>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  No restaurants found
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  margin: 0
                }}>
                  Try adjusting your search or category filters
                </p>
              </div>
            </div>
          )}

          {/* Restaurant Cards */}
          {!loading && !error && filteredRestaurants.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1.5rem'
            }}>
              {filteredRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  onClick={() => {
                    if (!restaurant.is_online) return;
                    if (restaurant.is_deliverable === false) {
                      // Show toast or alert that restaurant is not in delivery range
                      return;
                    }
                    handleCardClick(restaurant.id);
                  }}
                  onMouseEnter={() => restaurant.is_online ? setHoveredCard(restaurant.id) : null}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: restaurant.is_online ? 'rgba(255, 255, 255, 0.95)' : 'rgba(200, 200, 200, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: restaurant.is_online ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    transform: (hoveredCard === restaurant.id && restaurant.is_online) ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: (hoveredCard === restaurant.id && restaurant.is_online)
                      ? '0 20px 40px rgba(0, 0, 0, 0.15)'
                      : '0 8px 25px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    opacity: restaurant.is_online ? 1 : 0.7,
                    position: 'relative',
                    width: 'calc(33.333% - 1rem)',
                    minWidth: '280px',
                    maxWidth: '380px',
                  }}
                >
                  {/* Restaurant Image with Overlay Rating */}
                  <div style={{
                    height: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    background: hoveredCard === restaurant.id
                      ? getHoverGradient()
                      : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {getFullImageUrl(restaurant.restaurant_image).startsWith('http') ? (
                      <img
                        src={getFullImageUrl(restaurant.restaurant_image)}
                        alt={restaurant.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div style="
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                height: 100%; 
                                font-size: 4rem;
                              ">
                                <img src="/icons/food/food.svg" alt="Food" width="64" height="64" />
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        fontSize: '4rem'
                      }}>
                        {getFullImageUrl(restaurant.restaurant_image)}
                      </div>
                    )}

                    {/* Rating Overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image src="/icons/status/star.svg" alt="Rating" width={14} height={14} style={{ display: 'inline-block' }} />
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: '#166534'
                      }}>
                        {restaurant.rating}
                      </span>
                    </div>

                    {/* Offline Badge */}
                    {!restaurant.is_online && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(220, 38, 38, 0.95)',
                        backdropFilter: 'blur(10px)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 10
                      }}>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: 'white',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>🔴</span>
                          <span>OFFLINE</span>
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          textAlign: 'center',
                          marginTop: '0.25rem'
                        }}>
                          Not accepting orders
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Restaurant Info */}
                  <div style={{ padding: '1.25rem' }}>
                    {/* Restaurant Name & Cuisine */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#1f2937',
                        marginBottom: '0.25rem',
                        margin: '0 0 0.25rem 0',
                        lineHeight: '1.3'
                      }}>
                        {restaurant.name}
                      </h4>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        {restaurant.cuisine} Cuisine
                      </p>
                    </div>

                    {/* Key Stats Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>🕒</span>
                        <span>{restaurant.delivery_time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>📍</span>
                        <span>{restaurant.distance_km != null ? `${restaurant.distance_km} km` : 'Nearby'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Image src="/icons/misc/list.svg" alt="Reviews" width={16} height={16} />
                        <span>{restaurant.reviews}</span>
                      </div>
                    </div>

                    {/* Not deliverable badge */}
                    {restaurant.is_deliverable === false && (
                      <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.7rem',
                        color: '#dc2626',
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                      }}>
                        ❌ Not available in your area
                      </div>
                    )}

                    {/* Menu & Price Info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Image src="/icons/food/food.svg" alt="Menu" width={16} height={16} />
                        <span>{restaurant.menu_items_count} items</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>💵</span>
                        <span>Avg ${restaurant.average_price}</span>
                      </div>
                    </div>

                    {/* Tags - Compact */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {restaurant.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fef3f2',
                            color: '#dc2626',
                            fontSize: '0.7rem',
                            borderRadius: '8px',
                            fontWeight: '600'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      disabled={!restaurant.is_online}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: restaurant.is_online
                          ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                          : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: restaurant.is_online ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        opacity: restaurant.is_online ? 1 : 0.7
                      }}
                      onMouseEnter={(e) => {
                        if (restaurant.is_online) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (restaurant.is_online) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {restaurant.is_online ? 'View Menu →' : '🔴 Offline - Not Accepting Orders'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SIMPLE FOOTER */}
      <footer style={{
        marginTop: '4rem',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '2rem',
        textAlign: 'center',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <span style={{ fontSize: '2rem' }}>🌸</span>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0
            }}>
              Fuji Sakura
            </h3>
          </div>
          <p style={{
            color: '#d1d5db',
            fontSize: '0.9rem',
            margin: '0 0 1rem 0'
          }}>
            Premium food delivery experience
          </p>
          <div style={{
            color: '#d1d5db',
            fontSize: '0.85rem'
          }}>
            © 2026 Fuji Sakura. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes slideDown {
          0% { 
            opacity: 0;
            transform: translateY(-10px);
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}