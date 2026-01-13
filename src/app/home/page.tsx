'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { restaurants, categories, Restaurant } from '../../data/restaurants';
import { useCart } from '../../contexts/CartContext';

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(restaurants);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'high' | 'low'>('high'); // Track sort order
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [clickedCard, setClickedCard] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const router = useRouter();
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const { getTotalItems } = useCart();

  // Popular search suggestions
  const popularSuggestions = [
    'Pizza', 'Burger', 'Sushi', 'Ramen', 'Biryani', 'Pasta', 'Tacos', 'Chinese',
    'Thai Food', 'Indian Curry', 'Fried Chicken', 'Seafood', 'Desserts', 'Coffee'
  ];

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'Guest';
    setUserName(storedName);
  }, []);

  useEffect(() => {
    let filtered = restaurants;

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
      filtered = filtered.filter(restaurant => restaurant.category === selectedCategory);
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
            result = a.deliveryFee - b.deliveryFee; // Low to high by default (closer = cheaper delivery)
            break;
          case 'time':
            result = parseInt(a.deliveryTime) - parseInt(b.deliveryTime); // Low to high by default (faster first)
            break;
          case 'price':
            result = a.deliveryFee - b.deliveryFee; // Low to high by default (cheaper first)
            break;
          default:
            return 0;
        }
        // Reverse if low to high is selected for rating, or high to low for others
        return sortOrder === 'low' ? -result : result;
      });
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCategory, sortBy, sortOrder]);

  const handleLogout = () => {
    localStorage.removeItem('userName');
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
    setClickedCard(restaurantId);
    setTimeout(() => {
      setClickedCard(null);
      router.push(`/restaurant/${restaurantId}`);
    }, 200);
  };

  // Function to get different hover gradients for each card
  const getHoverGradient = (index: number) => {
    const gradients = [
      'linear-gradient(135deg, #ff6b6b, #ee5a24)', // Red-Orange
      'linear-gradient(135deg, #667eea, #764ba2)', // Blue-Purple
      'linear-gradient(135deg, #f093fb, #f5576c)', // Pink-Red
      'linear-gradient(135deg, #4facfe, #00f2fe)', // Blue-Cyan
      'linear-gradient(135deg, #43e97b, #38f9d7)', // Green-Cyan
      'linear-gradient(135deg, #fa709a, #fee140)', // Pink-Yellow
      'linear-gradient(135deg, #a8edea, #fed6e3)', // Cyan-Pink
      'linear-gradient(135deg, #ffecd2, #fcb69f)', // Yellow-Orange
      'linear-gradient(135deg, #ff9a9e, #fecfef)', // Pink-Light Pink
      'linear-gradient(135deg, #a18cd1, #fbc2eb)'  // Purple-Pink
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Food Emojis - Same as splash/login but slower and more subtle */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '2rem', animation: 'float 6s ease-in-out infinite', opacity: 0.6 }}>🍜</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '1.5rem', animation: 'float 5s ease-in-out infinite 1s', opacity: 0.5 }}>🍱</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: '1.8rem', animation: 'float 7s ease-in-out infinite 2s', opacity: 0.6 }}>🍣</div>
      <div style={{ position: 'absolute', bottom: '30%', right: '10%', fontSize: '2.2rem', animation: 'float 5.5s ease-in-out infinite 3s', opacity: 0.5 }}>🍙</div>
      <div style={{ position: 'absolute', top: '50%', left: '5%', fontSize: '1.6rem', animation: 'float 6.5s ease-in-out infinite 4s', opacity: 0.4 }}>🥢</div>
      <div style={{ position: 'absolute', top: '60%', right: '5%', fontSize: '1.9rem', animation: 'float 5.2s ease-in-out infinite 1.5s', opacity: 0.5 }}>🍵</div>

      {/* HEADER - MATCHING SPLASH/LOGIN THEME WITH CARD-LIKE ENDING */}
      <header style={{
        padding: '1rem 2rem 1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0 0 24px 24px',
        margin: '0 1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
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
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ color: 'white', fontSize: '0.9rem' }}>📍</span>
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>Delivering to</span>
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Tokyo, Shibuya</span>
            <span style={{ color: 'white', fontSize: '0.8rem' }}>🔽</span>
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
            }}>🔍</span>
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
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>🔍</span>
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
          onClick={() => router.push('/cart')}
          style={{
            position: 'relative',
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
            <span style={{ fontSize: '1.2rem' }}>🛒</span>
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
              onClick={() => router.push('/orders')}
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
              <span>📦</span>
              <span>Orders</span>
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
          <span style={{ fontSize: '2rem' }}>🍽️</span>
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
            gridTemplateColumns: 'repeat(4, 1fr)',
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
                borderRadius: '16px',
                padding: '1.5rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: selectedCategory === '' ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedCategory === '' 
                  ? '0 8px 25px rgba(255, 107, 107, 0.3)' 
                  : '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                // Only apply hover effect if NOT selected
                if (selectedCategory !== '') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.3)';
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
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                  // Change text color back to dark
                  const textElements = e.currentTarget.querySelectorAll('div');
                  textElements.forEach(el => {
                    (el as HTMLElement).style.color = '#333';
                  });
                }
              }}
            >
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem'
                }}>🍽️</div>
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  color: selectedCategory === '' ? 'white' : '#333'
                }}>All</div>
              </div>
            </button>

            {/* Other Categories */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                style={{
                  background: selectedCategory === category.id 
                    ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '1.5rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: selectedCategory === category.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedCategory === category.id 
                    ? '0 8px 25px rgba(255, 107, 107, 0.3)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  // Only apply hover effect if NOT selected
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.3)';
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
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    // Change text color back to dark
                    const textElements = e.currentTarget.querySelectorAll('div');
                    textElements.forEach(el => {
                      (el as HTMLElement).style.color = '#333';
                    });
                  }
                }}
              >
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '0.5rem'
                  }}>{category.emoji}</div>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: selectedCategory === category.id ? 'white' : '#333'
                  }}>{category.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: POPULAR RESTAURANTS TITLE */}
      <section style={{
        paddingTop: '4rem',
        paddingBottom: '1rem',
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
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            Popular Restaurants
          </h3>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            margin: 0
          }}>
            {filteredRestaurants.length} restaurants found
          </p>
        </div>
      </section>

      {/* SECTION 3.5: SORT BY FUNCTIONALITY */}
      <section style={{
        paddingTop: '2rem',
        paddingBottom: '2rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#333',
              fontWeight: '600',
              fontSize: '1rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🔄</span>
              <span>Sort by:</span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'rating', label: 'Rating', icon: '⭐' },
                { id: 'distance', label: 'Distance', icon: '📍' },
                { id: 'time', label: 'Delivery Time', icon: '⏱️' },
                { id: 'price', label: 'Delivery Fee', icon: '💰' }
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() => handleSortClick(sort.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.75rem 1rem',
                    background: sortBy === sort.id 
                      ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    border: sortBy === sort.id 
                      ? '2px solid rgba(255, 107, 107, 0.5)' 
                      : '2px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: sortBy === sort.id ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: sortBy === sort.id 
                      ? '0 6px 20px rgba(255, 107, 107, 0.3)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    minWidth: '110px'
                  }}
                  onMouseEnter={(e) => {
                    if (sortBy !== sort.id) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.3)';
                      // Change text color to white on hover
                      const textElements = e.currentTarget.querySelectorAll('span, div');
                      textElements.forEach(el => {
                        (el as HTMLElement).style.color = 'white';
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortBy !== sort.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      // Change text color back to dark
                      const textElements = e.currentTarget.querySelectorAll('span, div');
                      textElements.forEach(el => {
                        (el as HTMLElement).style.color = '#333';
                      });
                    }
                  }}
                >
                  <span style={{
                    fontSize: '1.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    {sort.icon}
                  </span>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    color: sortBy === sort.id ? 'white' : '#333',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {sort.label}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: sortBy === sort.id ? 'rgba(255, 255, 255, 0.9)' : '#666',
                    textAlign: 'center',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {sortBy === sort.id && (
                      <span style={{ fontSize: '0.6rem' }}>
                        {sortOrder === 'high' ? '↓' : '↑'}
                      </span>
                    )}
                    <span>
                      {sortBy === sort.id 
                        ? (sortOrder === 'high' ? 'High → Low' : 'Low → High')
                        : 'Click to sort'
                      }
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Clear Sort Button */}
            {sortBy && (
              <button
                onClick={() => {
                  setSortBy('');
                  setSortOrder('high');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <span>✕</span>
                <span>Clear Sort</span>
              </button>
            )}
          </div>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem'
          }}>
            {filteredRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                onClick={() => handleCardClick(restaurant.id)}
                onMouseEnter={() => setHoveredCard(restaurant.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === restaurant.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: hoveredCard === restaurant.id 
                    ? '0 20px 40px rgba(0, 0, 0, 0.15)' 
                    : '0 8px 25px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {/* Restaurant Image with Different Hover Colors */}
                <div style={{
                  height: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  transition: 'all 0.3s ease',
                  background: hoveredCard === restaurant.id 
                    ? getHoverGradient(index)
                    : 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
                }}>
                  {restaurant.image}
                </div>

                {/* Restaurant Info */}
                <div style={{ padding: '1.25rem' }}>
                  {/* Header with Rating */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#1f2937',
                        marginBottom: '0.25rem',
                        margin: 0,
                        lineHeight: '1.3'
                      }}>
                        {restaurant.name}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {restaurant.cuisine}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: '#dcfce7',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      marginLeft: '0.75rem'
                    }}>
                      <span style={{ fontSize: '0.75rem' }}>⭐</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#166534'
                      }}>
                        {restaurant.rating}
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '0.75rem'
                  }}>
                    <span>🕒 {restaurant.deliveryTime}</span>
                    <span>🚚 ${restaurant.deliveryFee}</span>
                    <span>💬 {restaurant.reviews}</span>
                  </div>

                  {/* Tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.375rem',
                    marginBottom: '1rem'
                  }}>
                    {restaurant.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#fef3f2',
                          color: '#dc2626',
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          fontWeight: '500'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
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
                    View Menu →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENTED OUT - WILL BUILD AGAIN STEP BY STEP */}

      {/* FOOTER - BETTER CONTRAST AND VISIBILITY */}
      <footer style={{
        marginTop: '4rem',
        background: 'rgba(0, 0, 0, 0.4)', // Darker background for better contrast
        backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '24px 24px 0 0',
        margin: '4rem 1rem 0 1rem',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '3rem 2rem 2rem'
        }}>
          {/* Footer Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Brand Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '2rem' }}>🌸</span>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#ffffff', // Pure white for better visibility
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  Fuji Sakura
                </h3>
              </div>
              <p style={{
                color: '#e5e5e5', // Lighter gray for better readability
                fontSize: '0.9rem',
                lineHeight: '1.6',
                margin: '0 0 1.5rem 0'
              }}>
                Premium Japanese food delivery experience. Discover authentic flavors from the finest restaurants with fast, reliable delivery.
              </p>
              {/* Social Links */}
              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                {['📱', '📧', '🐦', '📘'].map((icon, index) => (
                  <button
                    key={index}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.8)'; // Pink hover
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{
                color: '#ffffff', // Pure white
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                Quick Links
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {['About Us', 'How It Works', 'Restaurants', 'Become a Partner', 'Careers'].map((link, index) => (
                  <button
                    key={index}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d1d5db', // Light gray for better visibility
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff6b6b'; // Pink hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#d1d5db';
                    }}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 style={{
                color: '#ffffff', // Pure white
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                Support
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {['Help Center', 'Contact Us', 'Track Order', 'Report Issue', 'FAQs'].map((link, index) => (
                  <button
                    key={index}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d1d5db', // Light gray for better visibility
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff6b6b'; // Pink hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#d1d5db';
                    }}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 style={{
                color: '#ffffff', // Pure white
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                Contact
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#d1d5db', // Light gray for better visibility
                  fontSize: '0.9rem'
                }}>
                  <span>📍</span>
                  <span>Tokyo, Shibuya, Japan</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#d1d5db',
                  fontSize: '0.9rem'
                }}>
                  <span>📞</span>
                  <span>+81 3-1234-5678</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#d1d5db',
                  fontSize: '0.9rem'
                }}>
                  <span>📧</span>
                  <span>hello@fujisakura.com</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#d1d5db',
                  fontSize: '0.9rem'
                }}>
                  <span>🕒</span>
                  <span>24/7 Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{
              color: '#d1d5db', // Light gray for better visibility
              fontSize: '0.85rem'
            }}>
              © 2026 Fuji Sakura. All rights reserved.
            </div>
            <div style={{
              display: 'flex',
              gap: '2rem',
              fontSize: '0.85rem'
            }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link, index) => (
                <button
                  key={index}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#d1d5db', // Light gray for better visibility
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff6b6b'; // Pink hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#d1d5db';
                  }}
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {/*
      {/* SECTION 2: CATEGORY GRID - UNIVERSAL CARDS */}
      {/*
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`group theme-card card-hover p-6 transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? 'ring-4 ring-white/50 scale-105' 
                    : ''
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{category.emoji}</div>
                  <div className="font-semibold text-gray-800 text-sm">{category.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: POPULAR RESTAURANTS TITLE */}
      {/*
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">Popular Restaurants</h3>
              <p className="text-white/70">{filteredRestaurants.length} restaurants found</p>
            </div>
          </div>

          {/* SORT CAPSULE - UNIVERSAL THEME */}
          {/*
          <div className="mb-12">
            <div className="inline-flex items-center theme-card px-6 py-3 gap-4">
              <span className="text-gray-700 font-medium">Sort by:</span>
              <div className="flex gap-2">
                {[
                  { id: 'rating', label: 'Rating', icon: '⭐' },
                  { id: 'distance', label: 'Distance', icon: '📍' },
                  { id: 'time', label: 'Time', icon: '⏱️' },
                  { id: 'price', label: 'Price', icon: '💰' }
                ].map((sort) => (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id === sortBy ? '' : sort.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      sortBy === sort.id
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 hover:bg-primary-light hover:text-primary'
                    }`}
                  >
                    <span>{sort.icon}</span>
                    <span>{sort.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: RESTAURANT CARDS GRID */}
      {/*
      <section ref={restaurantsRef} className="py-16">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => handleCardClick(restaurant.id)}
                onMouseEnter={() => setHoveredCard(restaurant.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group theme-card card-hover cursor-pointer transition-all duration-300 ${
                  hoveredCard === restaurant.id || clickedCard === restaurant.id
                    ? 'scale-105'
                    : ''
                }`}
              >
                {/* Restaurant Image */}
                {/*
                <div className={`h-40 flex items-center justify-center text-5xl transition-all duration-300 rounded-t-2xl ${
                  hoveredCard === restaurant.id
                    ? 'theme-bg'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  {restaurant.image}
                </div>

                {/* Restaurant Info */}
                {/*
                <div className="p-5">
                  {/* Header */}
                  {/*
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-1">{restaurant.name}</h4>
                      <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <span className="text-xs">⭐</span>
                      <span className="text-xs font-semibold text-green-700">{restaurant.rating}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  {/*
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>🕒 {restaurant.deliveryTime}</span>
                    <span>🚚 ${restaurant.deliveryFee}</span>
                    <span>💬 {restaurant.reviews} reviews</span>
                  </div>

                  {/* Tags */}
                  {/*
                  <div className="flex flex-wrap gap-1 mb-4">
                    {restaurant.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-light text-primary text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {/*
                  <button className="w-full theme-button text-sm">
                    View Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      {/*
      <footer className="py-16 glass-effect border-t border-white/20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">🌸</span>
            <h3 className="text-2xl font-bold text-white">Fuji Sakura</h3>
          </div>
          <p className="text-white/70 mb-6">Premium food delivery experience</p>
          <div className="flex items-center justify-center gap-8 text-sm text-white/60">
            <span>© 2026 Fuji Sakura</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Contact Us</span>
          </div>
        </div>
      </footer>
      */}

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

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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