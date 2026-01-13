'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import { restaurants } from '../../data/restaurants';
import AuthPopup from '../../components/AuthPopup';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCart();
  
  // Get checkout type from URL params
  const checkoutType = searchParams.get('type') || 'all';
  const selectedItemIds = searchParams.get('items')?.split(',') || [];
  const restaurantId = searchParams.get('restaurant');

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '',
    city: 'Tokyo',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderInstructions, setOrderInstructions] = useState('');

  useEffect(() => {
    // Check if user is guest and show popup
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setShowAuthPopup(true);
      return;
    }

    // Pre-fill address if available
    const savedAddress = localStorage.getItem('deliveryAddress');
    if (savedAddress) {
      setDeliveryAddress(JSON.parse(savedAddress));
    } else {
      const storedName = localStorage.getItem('userName') || 'Guest';
      setDeliveryAddress(prev => ({ ...prev, fullName: storedName }));
    }
  }, []);

  // Filter items based on checkout type
  const getCheckoutItems = () => {
    if (checkoutType === 'selected') {
      return cart.filter(item => selectedItemIds.includes(`${item.id}-${item.restaurantId}`));
    } else if (checkoutType === 'restaurant' && restaurantId) {
      return cart.filter(item => item.restaurantId === parseInt(restaurantId));
    }
    return cart; // 'all' type
  };

  const checkoutItems = getCheckoutItems();

  // Group items by restaurant
  const groupedItems = checkoutItems.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = {
        restaurant: restaurants.find(r => r.id === item.restaurantId),
        items: []
      };
    }
    acc[item.restaurantId].items.push(item);
    return acc;
  }, {} as Record<number, { restaurant: any; items: any[] }>);

  // Calculate totals
  const subtotal = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = 2.99;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;

  const handleAddressChange = (field: string, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!deliveryAddress.fullName.trim()) return 'Full name is required';
    if (!deliveryAddress.phone.trim()) return 'Phone number is required';
    if (!deliveryAddress.address.trim()) return 'Address is required';
    if (!deliveryAddress.pincode.trim()) return 'Pincode is required';
    return null;
  };

  const handlePlaceOrder = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsLoading(true);
    
    // Save address for future use
    localStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));
    
    // Create order object
    const order = {
      id: Date.now(),
      items: checkoutItems,
      address: deliveryAddress,
      paymentMethod,
      instructions: orderInstructions,
      subtotal,
      deliveryFee,
      tax,
      total,
      status: 'confirmed',
      estimatedDelivery: '25-35 minutes',
      orderTime: new Date().toISOString()
    };

    // Save order to localStorage (for order history)
    const existingOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    existingOrders.push(order);
    localStorage.setItem('orderHistory', JSON.stringify(existingOrders));

    setTimeout(() => {
      // Remove ordered items from cart based on checkout type
      if (checkoutType === 'all') {
        clearCart();
      }
      // For 'selected' and 'restaurant' types, we would need additional cart methods
      // to remove specific items, but for now we'll just clear all for 'all' type
      
      // Redirect to order success page
      router.push(`/order-success?orderId=${order.id}`);
      setIsLoading(false);
    }, 2000);
  };

  const handleBackToCart = () => {
    router.push('/cart');
  };

  if (checkoutItems.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '1rem', margin: 0 }}>
            No items to checkout
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem', margin: 0 }}>
            Please add items to your cart first.
          </p>
          <button
            onClick={() => router.push('/home')}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '1rem' // Added top spacing
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
          onClick={handleBackToCart}
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
          <span>Back to Cart</span>
        </button>
        
        <h1 style={{
          color: 'white',
          fontSize: '1.8rem',
          fontWeight: '600',
          margin: 0,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Checkout
        </h1>
        
        <div style={{ width: '120px' }}></div> {/* Spacer for centering */}
      </div>

      {/* Main Content - Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Panel - Forms */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem' // Increased gap between sections
        }}>
          {/* Delivery Address Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2.5rem', // Increased padding
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' // Added shadow
          }}>
            <h2 style={{
              fontSize: '1.4rem', // Slightly larger
              fontWeight: '700', // Bolder
              color: '#333',
              marginBottom: '2rem', // Increased spacing after heading
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem', // Added padding bottom
              borderBottom: '2px solid #f1f5f9' // Added separator line
            }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              Delivery Address
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem', // Increased gap
              marginBottom: '1.5rem' // Increased margin
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem', // Increased spacing
                  color: '#374151', // Darker color
                  fontWeight: '600', // Bolder
                  fontSize: '0.95rem' // Slightly larger
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.fullName}
                  onChange={(e) => handleAddressChange('fullName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem', // Increased padding
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px', // More rounded
                    fontSize: '1rem',
                    transition: 'all 0.3s ease', // Smoother transition
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa', // Light background
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' // Subtle shadow
                  }}
                  placeholder="Enter your full name"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  placeholder="Enter your phone number"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                color: '#374151',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                Complete Address *
              </label>
              <textarea
                value={deliveryAddress.address}
                onChange={(e) => handleAddressChange('address', e.target.value)}
                rows={4} // Increased rows
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  backgroundColor: '#fafafa',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  fontFamily: 'inherit' // Inherit font family
                }}
                placeholder="House/Flat no., Building name, Street, Area"
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff6b6b';
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#fafafa';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Landmark
                </label>
                <input
                  type="text"
                  value={deliveryAddress.landmark}
                  onChange={(e) => handleAddressChange('landmark', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  placeholder="Nearby landmark"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  City
                </label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  placeholder="City"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Pincode *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  placeholder="Pincode"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '2rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              Payment Method
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {[
                { id: 'card', icon: '💳', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, Rupay' },
                { id: 'upi', icon: '📱', name: 'UPI Payment', desc: 'PhonePe, Google Pay, Paytm' },
                { id: 'wallet', icon: '👛', name: 'Digital Wallet', desc: 'Paytm, Amazon Pay' },
                { id: 'cod', icon: '💵', name: 'Cash on Delivery', desc: 'Pay when order arrives' }
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem', // Increased padding
                    border: `2px solid ${paymentMethod === method.id ? '#ff6b6b' : '#e5e7eb'}`,
                    borderRadius: '16px', // More rounded
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: paymentMethod === method.id ? '#fff5f5' : '#fafafa',
                    boxShadow: paymentMethod === method.id 
                      ? '0 4px 12px rgba(255, 107, 107, 0.15)' 
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: paymentMethod === method.id ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    if (paymentMethod !== method.id) {
                      e.currentTarget.style.borderColor = '#ff6b6b';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (paymentMethod !== method.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{
                    width: '24px', // Larger radio button
                    height: '24px',
                    borderRadius: '50%',
                    border: `3px solid ${paymentMethod === method.id ? '#ff6b6b' : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: paymentMethod === method.id ? '#ff6b6b' : 'transparent',
                    transition: 'all 0.3s ease'
                  }}>
                    {paymentMethod === method.id && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'white'
                      }} />
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '1.8rem', // Larger icon
                    filter: paymentMethod === method.id ? 'none' : 'grayscale(0.3)'
                  }}>{method.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: paymentMethod === method.id ? '#ff6b6b' : '#374151',
                      fontSize: '1.05rem',
                      marginBottom: '0.25rem'
                    }}>{method.name}</div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>{method.desc}</div>
                  </div>
                  {paymentMethod === method.id && (
                    <div style={{
                      color: '#ff6b6b',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Instructions Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '2rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              Special Instructions
            </h2>

            <textarea
              value={orderInstructions}
              onChange={(e) => setOrderInstructions(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                backgroundColor: '#fafafa',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
              placeholder="Any special instructions for the restaurant or delivery partner... (Optional)"
              onFocus={(e) => {
                e.target.style.borderColor = '#ff6b6b';
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.backgroundColor = '#fafafa';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
            
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #bae6fd'
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#0369a1',
                margin: 0,
                lineHeight: '1.5'
              }}>
                💡 <strong>Tip:</strong> You can mention dietary preferences, spice level, cooking instructions, or delivery preferences here.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Order Summary */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2.5rem', // Increased padding to match left panel
          border: '1px solid rgba(255, 255, 255, 0.3)',
          height: 'fit-content',
          position: 'sticky',
          top: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' // Added shadow to match left panel
        }}>
          <h2 style={{
            fontSize: '1.4rem', // Increased to match left panel
            fontWeight: '700', // Bolder to match left panel
            color: '#333',
            marginBottom: '2rem', // Increased spacing
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1rem', // Added padding bottom
            borderBottom: '2px solid #f1f5f9' // Added separator line
          }}>
            <span style={{ fontSize: '1.5rem' }}>🛒</span>
            Order Summary ({checkoutItems.reduce((total, item) => total + item.quantity, 0)} items)
          </h2>

          {/* Restaurant Groups */}
          {Object.entries(groupedItems).map(([restaurantId, group]) => (
            <div key={restaurantId} style={{
              marginBottom: '2rem', // Increased spacing between restaurant groups
              border: '2px solid #e2e8f0', // Thicker border
              borderRadius: '16px', // More rounded to match left panel
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' // Added subtle shadow
            }}>
              {/* Restaurant Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                color: 'white',
                padding: '1.25rem', // Increased padding
                display: 'flex',
                alignItems: 'center',
                gap: '1rem' // Increased gap
              }}>
                <span style={{ 
                  fontSize: '2rem', // Larger emoji
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' // Added shadow to emoji
                }}>{group.restaurant?.image}</span>
                <div>
                  <h3 style={{
                    fontSize: '1.1rem', // Slightly larger
                    fontWeight: '700', // Bolder
                    margin: 0,
                    marginBottom: '0.5rem', // Increased spacing
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' // Added text shadow
                  }}>
                    {group.restaurant?.name}
                  </h3>
                  <p style={{
                    fontSize: '0.85rem', // Slightly larger
                    opacity: 0.95, // Less transparent
                    margin: 0,
                    fontWeight: '500' // Slightly bolder
                  }}>
                    {group.restaurant?.cuisine}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div style={{ 
                padding: '1.5rem', // Increased padding
                background: '#fafafa' // Light background for better contrast
              }}>
                {group.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 0', // Increased padding
                    borderBottom: index < group.items.length - 1 ? '1px solid #e2e8f0' : 'none', // Slightly darker border
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.95rem', // Slightly larger
                        fontWeight: '600',
                        color: '#1f2937', // Darker color
                        marginBottom: '0.5rem', // Increased spacing
                        lineHeight: '1.4'
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: '0.85rem', // Slightly larger
                        color: item.isVeg ? '#059669' : '#dc2626', // Better colors
                        fontWeight: '500', // Slightly bolder
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {item.isVeg ? '🟢' : '🔴'}
                        <span>{item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem', // Increased gap
                      minWidth: '120px', // Ensure consistent width
                      justifyContent: 'flex-end'
                    }}>
                      <div style={{
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        × {item.quantity}
                      </div>
                      <span style={{
                        fontSize: '1rem', // Larger price
                        fontWeight: '700', // Bolder
                        color: '#ff6b6b',
                        minWidth: '60px', // Ensure consistent width
                        textAlign: 'right'
                      }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Price Breakdown */}
          <div style={{
            borderTop: '2px solid #e2e8f0', // Thicker border to match left panel
            paddingTop: '1.5rem', // Increased padding
            marginBottom: '2rem', // Increased margin
            background: '#f8fafc', // Light background
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '1rem',
              margin: 0,
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              💰 Price Breakdown
            </h3>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem', // Increased spacing
              padding: '0.5rem 0'
            }}>
              <span style={{ 
                color: '#6b7280',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>Subtotal</span>
              <span style={{ 
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#374151'
              }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0.5rem 0'
            }}>
              <span style={{ 
                color: '#6b7280',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>Delivery Fee</span>
              <span style={{ 
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#374151'
              }}>${deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0.5rem 0'
            }}>
              <span style={{ 
                color: '#6b7280',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>Tax (8%)</span>
              <span style={{ 
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#374151'
              }}>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.3rem', // Larger font
            fontWeight: '700',
            color: '#1f2937', // Darker color
            marginBottom: '2rem',
            paddingTop: '1.5rem', // Increased padding
            borderTop: '3px solid #ff6b6b', // Colored border
            background: 'linear-gradient(135deg, #fff5f5, #fef2f2)', // Light gradient background
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.1)' // Subtle colored shadow
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>💳</span>
              Total Amount
            </span>
            <span style={{ color: '#ff6b6b' }}>${total.toFixed(2)}</span>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '16px', // More rounded
              padding: '1.25rem', // Increased padding
              fontSize: '1.15rem', // Slightly larger
              fontWeight: '700', // Bolder
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease', // Smoother transition
              marginBottom: '1.5rem', // Increased margin
              boxShadow: isLoading 
                ? '0 4px 12px rgba(156, 163, 175, 0.3)' 
                : '0 6px 20px rgba(255, 107, 107, 0.4)', // Enhanced shadow
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Processing Order...
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.2rem' }}>🚀</span>
                Place Order • ${total.toFixed(2)}
              </>
            )}
          </button>

          {/* Estimated Delivery */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', // Enhanced gradient
            borderRadius: '16px', // More rounded
            padding: '1.5rem', // Increased padding
            textAlign: 'center',
            border: '2px solid #bae6fd', // Thicker border
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.1)' // Added shadow
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem', // Increased gap
              marginBottom: '0.75rem' // Increased margin
            }}>
              <span style={{ 
                fontSize: '1.5rem', // Larger emoji
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
              }}>🕒</span>
              <span style={{ 
                fontWeight: '700', // Bolder
                color: '#0369a1',
                fontSize: '1.05rem' // Slightly larger
              }}>Estimated Delivery Time</span>
            </div>
            <p style={{
              color: '#0369a1',
              fontSize: '1rem', // Larger
              margin: 0,
              fontWeight: '600', // Bolder
              background: 'rgba(3, 105, 161, 0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              display: 'inline-block'
            }}>
              ⚡ 25-35 minutes
            </p>
            <div style={{
              marginTop: '0.75rem',
              fontSize: '0.85rem',
              color: '#0284c7',
              fontStyle: 'italic'
            }}>
              We'll keep you updated via notifications
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Popup */}
      <AuthPopup 
        isOpen={showAuthPopup}
        onClose={() => {
          setShowAuthPopup(false);
          router.push('/cart'); // Redirect back to cart
        }}
        message="To proceed with checkout and place your order, please create an account or log in. This helps us track your order and provide better service!"
      />
    </div>
  );
}