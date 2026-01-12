'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import { restaurants } from '../../data/restaurants';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [userName, setUserName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'Guest';
    setUserName(storedName);
    
    // Mock delivery address
    setDeliveryAddress('123 Sakura Street, Tokyo District, City 12345');
  }, []);

  // Group cart items by restaurant
  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = {
        restaurant: restaurants.find(r => r.id === item.restaurantId),
        items: []
      };
    }
    acc[item.restaurantId].items.push(item);
    return acc;
  }, {} as Record<number, { restaurant: any; items: any[] }>);

  const deliveryFee = 2.99;
  const taxRate = 0.08; // 8% tax
  const subtotal = getTotalPrice();
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    setIsLoading(true);
    // Simulate checkout process
    setTimeout(() => {
      alert('Order placed successfully! 🎉');
      clearCart();
      router.push('/home');
      setIsLoading(false);
    }, 2000);
  };

  const handleBackToHome = () => {
    router.push('/home');
  };

  if (cart.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '1rem 2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <button
            onClick={handleBackToHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          
          <h1 style={{
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Your Cart
          </h1>
          
          <div style={{ width: '120px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Empty Cart */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '0.5rem',
            margin: 0
          }}>
            Your cart is empty
          </h2>
          <p style={{
            color: '#666',
            fontSize: '1rem',
            marginBottom: '2rem',
            margin: 0
          }}>
            Add some delicious items from our restaurants!
          </p>
          <button
            onClick={handleBackToHome}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Browse Restaurants
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
      animation: 'gradientShift 15s ease infinite',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '1rem 2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <button
          onClick={handleBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>←</span>
          <span>Back to Home</span>
        </button>
        
        <h1 style={{
          color: 'white',
          fontSize: '1.8rem',
          fontWeight: '600',
          margin: 0,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Your Cart ({getTotalItems()} items)
        </h1>
        
        <button
          onClick={() => clearCart()}
          style={{
            background: 'rgba(255, 107, 107, 0.2)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
          }}
        >
          Clear Cart
        </button>
      </div>

      {/* Main Content - Swiggy Style Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Panel - Cart Items */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          height: 'fit-content'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '1.5rem',
            margin: 0
          }}>
            Order Details
          </h2>

          {/* Delivery Address */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>📍</span>
              <span style={{ fontWeight: '600', color: '#333' }}>Delivery Address</span>
            </div>
            <p style={{
              color: '#666',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {deliveryAddress}
            </p>
          </div>

          {/* Restaurant Groups */}
          {Object.entries(groupedCart).map(([restaurantId, group]) => (
            <div key={restaurantId} style={{
              marginBottom: '2rem',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              {/* Restaurant Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                color: 'white',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '2rem' }}>{group.restaurant?.image}</span>
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {group.restaurant?.name}
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.9,
                    margin: 0
                  }}>
                    {group.restaurant?.cuisine} • {group.restaurant?.deliveryTime}
                  </p>
                </div>
              </div>

              {/* Restaurant Items */}
              <div style={{ padding: '1rem' }}>
                {group.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderBottom: index < group.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#333',
                        margin: 0,
                        marginBottom: '0.25rem'
                      }}>
                        {item.name}
                      </h4>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {item.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#ff6b6b'
                        }}>
                          ${item.price}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: item.isVeg ? '#10b981' : '#ef4444',
                          background: item.isVeg ? '#dcfce7' : '#fee2e2',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}>
                          {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginLeft: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.restaurantId, Math.max(0, item.quantity - 1))}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            color: '#ff6b6b',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          padding: '0.5rem 0.75rem',
                          fontWeight: '600',
                          color: '#333',
                          minWidth: '2rem',
                          textAlign: 'center'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.restaurantId, item.quantity + 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            color: '#ff6b6b',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.restaurantId)}
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          color: '#dc2626',
                          fontSize: '1rem'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel - Order Summary */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          height: 'fit-content',
          position: 'sticky',
          top: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '1.5rem',
            margin: 0
          }}>
            Order Summary
          </h2>

          {/* Price Breakdown */}
          <div style={{
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Subtotal ({getTotalItems()} items)</span>
              <span style={{ fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Delivery Fee</span>
              <span style={{ fontWeight: '600' }}>${deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Tax (8%)</span>
              <span style={{ fontWeight: '600' }}>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '2rem'
          }}>
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Processing...' : `Proceed to Checkout • $${total.toFixed(2)}`}
          </button>

          {/* Estimated Delivery */}
          <div style={{
            background: '#f0f9ff',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
            border: '1px solid #bae6fd'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>🕒</span>
              <span style={{ fontWeight: '600', color: '#0369a1' }}>Estimated Delivery</span>
            </div>
            <p style={{
              color: '#0369a1',
              fontSize: '0.9rem',
              margin: 0
            }}>
              25-35 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}