'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCart } from '../../../contexts/CartContext';
import AuthPopup from '../../../components/AuthPopup';
import { API_BASE_URL, getFullImageUrl } from '../../../config/constants';
import { useWebSocket } from '@/hooks/useWebSocket';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;       
  is_available: boolean;  // Add availability status
  isVeg?: boolean;
  rating?: number;
}

interface Restaurant {
  id: number;
  name: string;
  owner_name: string;
  cuisine: string;
  description: string;
  address: string;
  phone: string;
  menu_by_category: { [key: string]: MenuItem[] };
  total_menu_items: number;
  average_price: number;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  reviews: number;
  image: string;
  tags: string[];
  hours: string;
  is_open: boolean;
}

export default function RestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = parseInt(params.id as string);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<{ id: number; user_name: string; rating: number; comment: string | null; created_at: string }[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // WebSocket for real-time menu updates
  const { isConnected } = useWebSocket(
    `ws://localhost:8000/ws/restaurant/${restaurantId}`,
    (data) => {
      if (!restaurant) return;

      // Handle menu item availability update
      if (data.type === 'menu_item_availability_update') {
        const updatedMenuByCategory = { ...restaurant.menu_by_category };
        Object.keys(updatedMenuByCategory).forEach(category => {
          updatedMenuByCategory[category] = updatedMenuByCategory[category].map(item =>
            item.id === data.menu_item_id
              ? { ...item, is_available: data.is_available }
              : item
          );
        });
        setRestaurant({ ...restaurant, menu_by_category: updatedMenuByCategory });
      }
      
      // Handle menu item deletion
      if (data.type === 'menu_item_deleted') {
        const updatedMenuByCategory = { ...restaurant.menu_by_category };
        Object.keys(updatedMenuByCategory).forEach(category => {
          updatedMenuByCategory[category] = updatedMenuByCategory[category].filter(
            item => item.id !== data.menu_item_id
          );
        });
        setRestaurant({ ...restaurant, menu_by_category: updatedMenuByCategory });
      }

      // Handle menu item update (edit)
      if (data.type === 'menu_item_updated' && data.menu_item) {
        const updatedItem = data.menu_item;
        const updatedMenuByCategory = { ...restaurant.menu_by_category };
        Object.keys(updatedMenuByCategory).forEach(category => {
          updatedMenuByCategory[category] = updatedMenuByCategory[category].map(item =>
            item.id === updatedItem.id
              ? {
                  id: updatedItem.id,
                  name: updatedItem.item_name,
                  description: updatedItem.description,
                  price: updatedItem.price,
                  image_url: updatedItem.image_url,
                  category: updatedItem.category,
                  is_available: updatedItem.is_available,
                  isVeg: updatedItem.isVeg
                }
              : item
          );
        });
        setRestaurant({ ...restaurant, menu_by_category: updatedMenuByCategory });
      }

      // Handle new menu item added
      if (data.type === 'menu_item_added' && data.menu_item) {
        const newItem = data.menu_item;
        const updatedMenuByCategory = { ...restaurant.menu_by_category };
        const category = newItem.category;
        
        if (!updatedMenuByCategory[category]) {
          updatedMenuByCategory[category] = [];
        }
        
        updatedMenuByCategory[category].push({
          id: newItem.id,
          name: newItem.item_name,
          description: newItem.description,
          price: newItem.price,
          image_url: newItem.image_url,
          category: newItem.category,
          is_available: newItem.is_available,
          isVeg: newItem.isVeg
        });
        
        setRestaurant({ ...restaurant, menu_by_category: updatedMenuByCategory });
      }

      // Handle restaurant profile update
      if (data.type === 'restaurant_profile_updated' && data.restaurant) {
        setRestaurant({
          ...restaurant,
          name: data.restaurant.name,
          cuisine: data.restaurant.cuisine,
          description: data.restaurant.description,
          address: data.restaurant.address,
          phone: data.restaurant.phone
        });
      }

      // Handle restaurant online/offline status
      if (data.type === 'restaurant_status_update') {
        setRestaurant({
          ...restaurant,
          is_open: data.is_online
        });
      }
    }
  );
  const { cart, addToCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, getCartItemsByRestaurant } = useCart();

  // Keep original menu categories structure with "All" as first option
  const menuCategories = [
    { id: 'all', name: 'All Items', icon: '🍽️' },
    { id: 'recommended', name: 'Recommended', icon: '⭐' },
    { id: 'main', name: 'Main Course', icon: '🍽️' },
    { id: 'sides', name: 'Sides', icon: '🥗' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🧁' }
  ];

  // Get menu items from restaurant data
  const menuItems: MenuItem[] = restaurant ? 
    Object.values(restaurant.menu_by_category).flat() : [];

  // Fetch restaurant data from backend with silent error handling
  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/restaurant/public/restaurants/${params.id}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Restaurant not found');
        } else {
          throw new Error('Backend not available');
        }
        return;
      }
      
      const data = await response.json();
      setRestaurant(data);
      
      // Set default category to show all items
      if (data.menu_by_category && Object.keys(data.menu_by_category).length > 0) {
        setSelectedCategory('all');
      }
    } catch (err) {
      // Silent fallback - no console errors
      setError('Unable to load restaurant data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchRestaurant();
      // Fetch reviews (public, no auth needed)
      fetch(`${API_BASE_URL}/api/reviews/restaurant/${params.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setReviews(data.reviews || []);
            setAvgRating(data.average_rating || 0);
            setReviewCount(data.total || 0);
          }
        })
        .catch(() => {});
    }
  }, [params.id]);

  // Function to map backend categories to frontend categories
  const mapBackendCategoryToFrontend = (backendCategory: string): string => {
    const categoryMap: { [key: string]: string } = {
      'biryani': 'main',
      'curry': 'main',
      'curries': 'main',
      'main course': 'main',
      'mains': 'main',
      'appetizers': 'sides',
      'starters': 'sides',
      'sides': 'sides',
      'beverages': 'beverages',
      'drinks': 'beverages',
      'desserts': 'desserts',
      'sweets': 'desserts'
    };
    
    const lowerCategory = backendCategory.toLowerCase();
    return categoryMap[lowerCategory] || 'main';
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    
    // Use centralized helper to get full image URL
    const fullImageUrl = getFullImageUrl(item.image_url);
    
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: fullImageUrl,
      category: item.category,
      isVeg: item.isVeg ?? true,
      rating: item.rating ?? 4.0,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    };
    
    addToCart(cartItem);
    setIsCartOpen(true);
  };

  const currentRestaurantCartItems = restaurant ? getCartItemsByRestaurant(restaurant.id) : [];
  const currentRestaurantTotal = currentRestaurantCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Handle checkout with guest protection
  const handleCheckout = () => {
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setShowAuthPopup(true);
      return;
    }
    router.push(`/checkout?type=restaurant&restaurant=${params.id}`);
  };

  // Get filtered menu items based on selected category
  const filteredMenuItems = (selectedCategory === 'all' || selectedCategory === 'recommended'
    ? menuItems  // Show ALL items for "All" and "Recommended"
    : menuItems.filter(item => {
        // Map backend categories to frontend categories for filtering
        const itemFrontendCategory = mapBackendCategoryToFrontend(item.category);
        return itemFrontendCategory === selectedCategory;
      })
  ).sort((a, b) => {
    // Sort: available items first, unavailable items last
    if (a.is_available === b.is_available) return 0;
    return a.is_available ? -1 : 1;
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div>Loading restaurant...</div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <div>{error || 'Restaurant not found'}</div>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 20s ease infinite',
      position: 'relative'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                {restaurant.name}
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.25rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <span>⭐ {restaurant.rating}</span>
                <span>🕒 {restaurant.delivery_time}</span>
                <span>🚚 ${restaurant.delivery_fee}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              padding: '0.75rem 1.5rem',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🛒 Cart ({getTotalItems()})
            {getTotalItems() > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ff6b6b',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </header>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: isCartOpen ? '1fr 350px' : '1fr',
        gap: '2rem',
        transition: 'all 0.3s ease'
      }}>
        {/* Main Content */}
        <div>
          {/* Menu Categories */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '1rem',
              margin: '0 0 1rem 0'
            }}>
              Menu Categories
            </h2>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {menuCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    background: selectedCategory === category.id 
                      ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    color: selectedCategory === category.id ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.id) {
                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.id) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {menuCategories.find(cat => cat.id === selectedCategory)?.icon}
              {menuCategories.find(cat => cat.id === selectedCategory)?.name}
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {filteredMenuItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: item.is_available ? 'rgba(255, 255, 255, 0.7)' : 'rgba(200, 200, 200, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    opacity: item.is_available ? 1 : 0.7,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (item.is_available) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Unavailable Badge */}
                  {!item.is_available && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                      zIndex: 10
                    }}>
                      🚫 Unavailable Currently
                    </div>
                  )}

                  {/* Item Image */}
                  <div style={{
                    minWidth: '80px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: item.is_available ? 'none' : 'grayscale(100%)'
                  }}>
                    {getFullImageUrl(item.image_url).startsWith('http') ? (
                      <img 
                        src={getFullImageUrl(item.image_url)}
                        alt={item.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div style="font-size: 3rem;">🍽️</div>';
                          }
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '3rem' }}>
                        {getFullImageUrl(item.image_url)}
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: item.is_available ? '#333' : '#666',
                        margin: 0
                      }}>
                        {item.name}
                      </h4>
                      {item.isVeg ? (
                        <span style={{
                          width: '12px',
                          height: '12px',
                          background: '#22c55e',
                          borderRadius: '2px',
                          display: 'inline-block'
                        }}></span>
                      ) : (
                        <span style={{
                          width: '12px',
                          height: '12px',
                          background: '#ef4444',
                          borderRadius: '2px',
                          display: 'inline-block'
                        }}></span>
                      )}
                    </div>
                    <p style={{
                      color: item.is_available ? '#666' : '#999',
                      fontSize: '0.9rem',
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4'
                    }}>
                      {item.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: item.is_available ? '#ff6b6b' : '#999'
                      }}>
                        ₹{item.price}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#666'
                      }}>
                        <span>⭐</span>
                        <span>{item.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => item.is_available && handleAddToCart(item)}
                    disabled={!item.is_available}
                    style={{
                      background: item.is_available 
                        ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                        : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: item.is_available ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      opacity: item.is_available ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (item.is_available) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.is_available) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {item.is_available ? 'Add to Cart' : 'Not Available'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        {isCartOpen && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            height: 'fit-content',
            position: 'sticky',
            top: '100px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#333',
                margin: 0
              }}>
                Your Order
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {currentRestaurantCartItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: '#666'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                <p style={{ margin: 0 }}>Your cart is empty</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Add items to get started</p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  {currentRestaurantCartItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{ 
                        fontSize: '1.5rem',
                        minWidth: '40px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {(() => {
                          // Handle different image formats
                          if (!item.image) {
                            return <div style={{ fontSize: '1.5rem' }}>🍽️</div>;
                          }
                          
                          // If it's a full URL, show image
                          if (item.image.startsWith('http')) {
                            return (
                              <img 
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '6px'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div style="font-size: 1.5rem;">🍽️</div>';
                                  }
                                }}
                              />
                            );
                          }
                          
                          // If it's a relative path, convert to full URL
                          if (item.image.startsWith('/uploads/') || item.image.startsWith('uploads/')) {
                            const fullUrl = `${API_BASE_URL}${item.image.startsWith('/') ? item.image : '/' + item.image}`;
                            return (
                              <img 
                                src={fullUrl}
                                alt={item.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '6px'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div style="font-size: 1.5rem;">🍽️</div>';
                                  }
                                }}
                              />
                            );
                          }
                          
                          // If it's an emoji or other text, show it
                          return <div style={{ fontSize: '1.5rem' }}>{item.image}</div>;
                        })()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#333',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {item.name}
                        </h5>
                        <p style={{
                          fontSize: '0.8rem',
                          color: '#ff6b6b',
                          fontWeight: '600',
                          margin: 0
                        }}>
                          ₹{item.price}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.restaurantId, item.quantity - 1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '1px solid #ddd',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            color: '#666'
                          }}
                        >
                          -
                        </button>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.restaurantId, item.quantity + 1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '1px solid #ddd',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            color: '#666'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                  paddingTop: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      Total: ₹{currentRestaurantTotal}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      {reviewCount > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
            borderRadius: '20px', padding: '2rem',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#1f2937' }}>
                ⭐ Customer Reviews
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </span>
                <div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '1rem', color: s <= Math.round(avgRating) ? '#f59e0b' : '#e5e7eb' }}>★</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Reviews list - one per row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(showAllReviews ? reviews : reviews.slice(0, 6)).map(review => (
                <div key={review.id} style={{
                  background: '#fafafa', borderRadius: '14px', padding: '1.25rem',
                  border: '1px solid #f1f5f9',
                  borderLeft: `4px solid ${review.rating >= 4 ? '#10b981' : review.rating === 3 ? '#f59e0b' : '#ef4444'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${review.rating >= 4 ? '#10b981' : review.rating === 3 ? '#f59e0b' : '#ef4444'}, #6366f1)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '0.9rem'
                    }}>
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {review.user_name}
                      </div>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: '0.8rem', color: s <= review.rating ? '#f59e0b' : '#e5e7eb' }}>★</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {review.comment ? (
                    <p style={{ margin: 0, color: '#374151', fontSize: '0.88rem', lineHeight: '1.5', fontStyle: 'italic' }}>
                      "{review.comment}"
                    </p>
                  ) : (
                    <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.82rem', fontStyle: 'italic' }}>No comment</p>
                  )}
                </div>
              ))}
            </div>

            {/* See all / collapse toggle */}
            {reviews.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setShowAllReviews(prev => !prev)}
                  style={{
                    padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white', fontWeight: '600', fontSize: '0.95rem',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,107,107,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {showAllReviews ? `Show less ↑` : `See all ${reviews.length} reviews ↓`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Popup for Guest Users */}
      <AuthPopup 
        isOpen={showAuthPopup} 
        onClose={() => setShowAuthPopup(false)} 
      />

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}