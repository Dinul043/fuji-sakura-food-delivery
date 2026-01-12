'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { restaurants, Restaurant } from '../../../data/restaurants';
import { useCart } from '../../../contexts/CartContext';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
}

export default function RestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, addToCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, getCartItemsByRestaurant } = useCart();

  // Sample menu data - in real app this would come from API
  const menuItems: MenuItem[] = [
    {
      id: 1,
      name: "Chef's Special Biryani",
      description: "Aromatic basmati rice with tender chicken and exotic spices",
      price: 299,
      image: "🍛",
      category: "recommended",
      isVeg: false,
      rating: 4.8
    },
    {
      id: 2,
      name: "Mutton Dum Biryani",
      description: "Slow-cooked mutton with fragrant basmati rice",
      price: 349,
      image: "🍛",
      category: "recommended",
      isVeg: false,
      rating: 4.9
    },
    {
      id: 3,
      name: "Hyderabadi Haleem",
      description: "Traditional slow-cooked lentil and meat stew",
      price: 199,
      image: "🍲",
      category: "recommended",
      isVeg: false,
      rating: 4.7
    },
    {
      id: 4,
      name: "Chicken Biryani",
      description: "Classic chicken biryani with aromatic spices",
      price: 249,
      image: "🍛",
      category: "main",
      isVeg: false,
      rating: 4.6
    },
    {
      id: 5,
      name: "Veg Biryani",
      description: "Mixed vegetable biryani with basmati rice",
      price: 199,
      image: "🍛",
      category: "main",
      isVeg: true,
      rating: 4.4
    },
    {
      id: 6,
      name: "Butter Chicken",
      description: "Creamy tomato-based chicken curry",
      price: 229,
      image: "🍗",
      category: "main",
      isVeg: false,
      rating: 4.5
    },
    {
      id: 7,
      name: "Raita",
      description: "Cool yogurt with cucumber and spices",
      price: 49,
      image: "🥛",
      category: "sides",
      isVeg: true,
      rating: 4.2
    },
    {
      id: 8,
      name: "Papad",
      description: "Crispy lentil wafers",
      price: 29,
      image: "🫓",
      category: "sides",
      isVeg: true,
      rating: 4.0
    }
  ];

  const menuCategories = [
    { id: 'recommended', name: 'Recommended', icon: '⭐' },
    { id: 'main', name: 'Main Course', icon: '🍽️' },
    { id: 'sides', name: 'Sides', icon: '🥗' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🧁' }
  ];

  useEffect(() => {
    const restaurantId = parseInt(params.id as string);
    const foundRestaurant = restaurants.find(r => r.id === restaurantId);
    setRestaurant(foundRestaurant || null);
  }, [params.id]);

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    
    addToCart({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      isVeg: item.isVeg,
      rating: item.rating,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    });
    setIsCartOpen(true);
  };

  const currentRestaurantCartItems = restaurant ? getCartItemsByRestaurant(restaurant.id) : [];
  const currentRestaurantTotal = currentRestaurantCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const filteredMenuItems = menuItems.filter(item => item.category === selectedCategory);

  if (!restaurant) {
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
        Restaurant not found
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 6s ease infinite',
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
                <span>🕒 {restaurant.deliveryTime}</span>
                <span>🚚 ${restaurant.deliveryFee}</span>
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
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Item Image */}
                  <div style={{
                    fontSize: '3rem',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {item.image}
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
                        color: '#333',
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
                      color: '#666',
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
                        color: '#ff6b6b'
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
                    onClick={() => handleAddToCart(item)}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '120px'
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
                    Add to Cart
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
                      <div style={{ fontSize: '1.5rem' }}>{item.image}</div>
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

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}