'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import AuthPopup from '../../components/AuthPopup';
import { getFullImageUrl, API_BASE_URL } from '../../config/constants';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalItems, getTotalPrice, forceRefreshCart } = useCart();
  const [userName, setUserName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(40); // Will be fetched from platform settings

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'Guest';
    setUserName(storedName);

    // Fetch platform settings (delivery fee)
    fetch(`${API_BASE_URL}/api/geocode/platform-info`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings?.delivery_fee?.value) {
          setDeliveryFee(parseFloat(data.settings.delivery_fee.value));
        }
      }).catch(() => {});
    
    // Load delivery address from detected location or profile
    const savedLocationAddress = localStorage.getItem('userLocationAddress');
    if (savedLocationAddress) {
      setDeliveryAddress(savedLocationAddress);
    } else {
      // Fetch from profile as fallback
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : null)
          .then(profile => {
            if (profile?.address) setDeliveryAddress(profile.address);
            else setDeliveryAddress('Set your delivery location from the home page');
          }).catch(() => {});
      } else {
        setDeliveryAddress('Set your delivery location from the home page');
      }
    }
  }, []);

  // Separate effect for cart-dependent operations
  useEffect(() => {
    // Select all items by default when cart changes
    const allItemIds = cart.map(item => `${item.id}-${item.restaurantId}`);
    setSelectedItems(new Set(allItemIds));
    setSelectAll(cart.length > 0);
  }, [cart]);

  // Calculate totals for selected items only
  const getSelectedItems = () => {
    return cart.filter(item => selectedItems.has(`${item.id}-${item.restaurantId}`));
  };

  const getSelectedTotal = () => {
    return getSelectedItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSelectedCount = () => {
    return getSelectedItems().reduce((total, item) => total + item.quantity, 0);
  };

  const taxRate = 0.05; // 5% GST estimate — actual calculated per item at checkout
  const subtotal = getTotalPrice();
  const selectedSubtotal = getSelectedTotal();
  const selectedTax = selectedSubtotal * taxRate;
  const selectedTotal = selectedSubtotal + deliveryFee + selectedTax;

  // Selection handlers
  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === cart.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allItemIds = cart.map(item => `${item.id}-${item.restaurantId}`);
      setSelectedItems(new Set(allItemIds));
      setSelectAll(true);
    }
  };

  // Check if user is guest
  const checkGuestAndProceed = (proceedFunction: () => void) => {
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setShowAuthPopup(true);
      return;
    }
    proceedFunction();
  };

  // Checkout handlers
  const handleCheckoutAll = () => {
    if (cart.length === 0) return;
    
    checkGuestAndProceed(() => {
      // Navigate to checkout page with all items
      router.push('/checkout?type=all');
    });
  };

  const handleCheckoutSelected = () => {
    const selectedItemsList = getSelectedItems();
    if (selectedItemsList.length === 0) {
      alert('Please select items to checkout');
      return;
    }
    
    checkGuestAndProceed(() => {
      // Create item IDs string for URL
      const itemIds = selectedItemsList.map(item => `${item.id}-${item.restaurantId}`).join(',');
      
      // Navigate to checkout page with selected items
      router.push(`/checkout?type=selected&items=${itemIds}`);
    });
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            <Image src="/icons/navigation/cart.svg" alt="Cart" width={64} height={64} />
          </div>
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
          onClick={() => {
            if (confirm(`Are you sure you want to clear all ${getTotalItems()} items from your cart?`)) {
              clearCart();
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.5rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '600',
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
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
          {/* Header Row: Title on left, Delivery Address on right */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            gap: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              color: '#333',
              margin: 0,
              lineHeight: '1.2'
            }}>
              Order Details
            </h2>
            
            {/* Delivery Address - Compact on right */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              minWidth: '280px',
              maxWidth: '320px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.35rem'
              }}>
                <Image src="/icons/delivery/location.svg" alt="Location" width={14} height={14} style={{ display: 'inline-block' }} />
                <span style={{ fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>Delivery Address</span>
              </div>
              <p style={{
                color: '#666',
                fontSize: '0.8rem',
                margin: 0,
                lineHeight: '1.3'
              }}>
                {deliveryAddress}
              </p>
            </div>
          </div>

          {/* Select All Checkbox - Below title, left-aligned */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <input
              type="checkbox"
              id="selectAll"
              checked={selectAll}
              onChange={handleSelectAll}
              style={{
                width: '1.2rem',
                height: '1.2rem',
                cursor: 'pointer',
                accentColor: '#3b82f6'
              }}
            />
            <label
              htmlFor="selectAll"
              style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333',
                cursor: 'pointer'
              }}
            >
              Select All ({cart.length} items)
            </label>
          </div>

          {/* Cart Items - Flat List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${item.restaurantId}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: selectedItems.has(`${item.id}-${item.restaurantId}`) ? '#f0f9ff' : 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Left Side: Checkbox + Image + Details */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flex: 1
                }}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    id={`item-${item.id}-${item.restaurantId}`}
                    checked={selectedItems.has(`${item.id}-${item.restaurantId}`)}
                    onChange={() => handleItemSelect(`${item.id}-${item.restaurantId}`)}
                    style={{
                      width: '1.2rem',
                      height: '1.2rem',
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  
                  {/* Food Image */}
                  <div style={{
                    minWidth: '80px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #e2e8f0'
                  }}>
                    {getFullImageUrl(item.image).startsWith('http') ? (
                      <img 
                        src={getFullImageUrl(item.image)}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<img src="/icons/food/food.svg" alt="Food" width="40" height="40" />';
                          }
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '2.5rem' }}>
                        {getFullImageUrl(item.image)}
                      </div>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#333',
                        margin: 0
                      }}>
                        {item.name}
                      </h4>
                      <span style={{
                        fontSize: '0.8rem',
                        color: item.isVeg ? '#10b981' : '#ef4444',
                        background: item.isVeg ? '#dcfce7' : '#fee2e2',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    </div>
                    
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4'
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
                        ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Restaurant Name Badge */}
                  <div style={{
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    <Image src="/icons/navigation/restaurant.svg" alt="Restaurant" width={16} height={16} style={{ display: 'inline-block', marginRight: '4px' }} />
                    {item.restaurantName}
                  </div>
                </div>

                {/* Right Side: Quantity Controls + Delete */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginLeft: '1rem'
                }}>
                  {/* Quantity Controls */}
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

                  {/* Delete Button */}
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
                    <Image src="/icons/actions/close.svg" alt="Delete" width={20} height={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              <span style={{ fontWeight: '600' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Delivery Fee</span>
              <span style={{ fontWeight: '600' }}>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>GST (5%)</span>
              <span style={{ fontWeight: '600' }}>₹{(subtotal * taxRate).toFixed(2)}</span>
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
            <span>₹{(subtotal + deliveryFee + (subtotal * taxRate)).toFixed(2)}</span>
          </div>

          {/* Checkout Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Checkout Selected Button */}
            {getSelectedCount() > 0 && getSelectedCount() < getTotalItems() && (
              <button
                onClick={handleCheckoutSelected}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: isLoading ? '#ccc' : 'linear-gradient(135deg, #0369a1, #0284c7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #0369a1, #0284c7)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? 'Processing...' : `Checkout Selected (${getSelectedCount()}) • ₹${selectedTotal.toFixed(2)}`}
              </button>
            )}

            {/* Checkout All Button */}
            <button
              onClick={handleCheckoutAll}
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
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
              {isLoading ? 'Processing...' : `Checkout All (${getTotalItems()}) • ₹${(subtotal + deliveryFee + (subtotal * taxRate)).toFixed(2)}`}
            </button>
          </div>

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
              15-30 minutes
            </p>
          </div>
        </div>
      </div>

      {/* Authentication Popup */}
      <AuthPopup 
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        message="To proceed with checkout and place your order, please create an account or log in. This helps us track your order and provide better service!"
      />
    </div>
  );
}