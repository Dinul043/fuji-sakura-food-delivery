'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import AuthPopup from '../../components/AuthPopup';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart, refreshCart } = useCart();
  
  // Get checkout type from URL params
  const checkoutType = searchParams.get('type') || 'all';
  const selectedItemIds = searchParams.get('items')?.split(',') || [];
  const restaurantId = searchParams.get('restaurant');

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentOrderAmount, setCurrentOrderAmount] = useState<number>(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '',
    city: 'Tokyo',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderInstructions, setOrderInstructions] = useState('');
  const [paymentDetailsFilled, setPaymentDetailsFilled] = useState(false);
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // UPI details state
  const [upiId, setUpiId] = useState('');
  
  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPaymentModal]);

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
      const filtered = cart.filter(item => selectedItemIds.includes(`${item.id}-${item.restaurantId}`));
      return filtered;
    } else if (checkoutType === 'restaurant' && restaurantId) {
      const filtered = cart.filter(item => item.restaurantId === parseInt(restaurantId));
      return filtered;
    }
    return cart; // 'all' type
  };

  const checkoutItems = getCheckoutItems();

  // Group items by restaurant
  const groupedItems = checkoutItems.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = {
        restaurant: {
          id: item.restaurantId,
          name: item.restaurantName,
          image: '🏪' // Default restaurant emoji
        },
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
    // Special handling for phone number - only allow digits and max 10
    if (field === 'phone') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits
      if (digitsOnly.length > 10) return; // Don't allow more than 10 digits
      value = digitsOnly;
    }
    
    const updatedAddress = { ...deliveryAddress, [field]: value };
    setDeliveryAddress(updatedAddress);
    
    // Save to localStorage as user types (so it persists when navigating back/forth)
    localStorage.setItem('deliveryAddress', JSON.stringify(updatedAddress));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!deliveryAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!deliveryAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(deliveryAddress.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!deliveryAddress.address.trim()) {
      newErrors.address = 'Complete address is required';
    }
    if (!deliveryAddress.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{5,6}$/.test(deliveryAddress.pincode)) {
      newErrors.pincode = 'Please enter a valid pincode';
    }
    
    // Payment method validation
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    
    try {
      // Save address for future use
      localStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));
      
      // Get cart item IDs for the order (use cart_id which is the database ID)
      const cartItemIds = checkoutItems
        .map(item => item.cart_id)
        .filter(id => id !== undefined && id !== null);
      
      if (cartItemIds.length === 0) {
        throw new Error('Cart items are not properly loaded. Please refresh the page and try again.');
      }
      
      // Create order via API
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          special_instructions: orderInstructions,
          cart_items: cartItemIds
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to place order' }));
        throw new Error(errorData.detail || 'Failed to place order');
      }

      const data = await response.json();
      
      // Get first order from response
      const firstOrder = data.orders[0];
      setCurrentOrderId(firstOrder.id);
      setCurrentOrderAmount(firstOrder.total_amount);
      
      // Refresh cart from database to reflect backend changes (items removed)
      await refreshCart();
      
      // Route based on payment method
      if (paymentMethod === 'cod') {
        // COD: Go directly to success page
        router.push(`/order-success?orderId=${firstOrder.id}`);
      } else {
        // Card/UPI/Wallet: Process payment immediately
        await processPayment(firstOrder.id);
      }
      
    } catch (error) {
      // Handle network errors gracefully
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({ 
        ...errors, 
        submit: errorMessage
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCart = () => {
    router.push('/cart');
  };

  const processPayment = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/payments/success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId
        })
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      // Payment successful, go to success page
      router.push(`/order-success?orderId=${orderId}`);
    } catch (err) {
      setErrors({ 
        ...errors, 
        submit: 'Payment failed. Please try again.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            <Image src="/icons/navigation/cart.svg" alt="Cart" width={64} height={64} />
          </div>
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
          {/* Error Message */}
          {errors.submit && (
            <div style={{
              background: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
            }}>
              <Image src="/icons/status/warning.svg" alt="Warning" width={24} height={24} />
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#dc2626',
                  marginBottom: '0.25rem'
                }}>
                  Order Failed
                </div>
                <div style={{ color: '#991b1b', fontSize: '0.95rem' }}>
                  {errors.submit}
                </div>
              </div>
            </div>
          )}

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
              <Image src="/icons/delivery/location.svg" alt="Location" width={24} height={24} />
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
                    border: `2px solid ${errors.fullName ? '#ef4444' : '#e5e7eb'}`,
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
                    e.target.style.borderColor = errors.fullName ? '#ef4444' : '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = errors.fullName 
                      ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                      : '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.fullName ? '#ef4444' : '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
                {errors.fullName && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {errors.fullName}
                  </p>
                )}
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
                  maxLength={10}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: `2px solid ${errors.phone ? '#ef4444' : '#e5e7eb'}`,
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
                    e.target.style.borderColor = errors.phone ? '#ef4444' : '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = errors.phone 
                      ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                      : '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.phone ? '#ef4444' : '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
                {errors.phone && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {errors.phone}
                  </p>
                )}
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
                  border: `2px solid ${errors.address ? '#ef4444' : '#e5e7eb'}`,
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
                  e.target.style.borderColor = errors.address ? '#ef4444' : '#ff6b6b';
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.boxShadow = errors.address 
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                    : '0 0 0 3px rgba(255, 107, 107, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.address ? '#ef4444' : '#e5e7eb';
                  e.target.style.backgroundColor = '#fafafa';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              />
              {errors.address && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginTop: '0.5rem',
                  margin: '0.5rem 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>⚠️</span>
                  {errors.address}
                </p>
              )}
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
                    border: `2px solid ${errors.pincode ? '#ef4444' : '#e5e7eb'}`,
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
                    e.target.style.borderColor = errors.pincode ? '#ef4444' : '#ff6b6b';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = errors.pincode 
                      ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                      : '0 0 0 3px rgba(255, 107, 107, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.pincode ? '#ef4444' : '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
                {errors.pincode && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {errors.pincode}
                  </p>
                )}
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
              <Image src="/icons/payment/card.svg" alt="Payment" width={24} height={24} />
              Payment Method
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {[
                { id: 'card', icon: '/icons/payment/card.svg', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, Rupay' },
                { id: 'upi', icon: '/icons/payment/phone-pay.svg', name: 'UPI Payment', desc: 'PhonePe, Google Pay, Paytm' },
                { id: 'wallet', icon: '/icons/payment/wallet.svg', name: 'Digital Wallet', desc: 'Paytm, Amazon Pay' },
                { id: 'cod', icon: '/icons/payment/cash.svg', name: 'Cash on Delivery', desc: 'Pay when order arrives' }
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    setPaymentDetailsFilled(false); // Reset when changing payment method
                    // Clear payment method error when selected
                    if (errors.paymentMethod) {
                      setErrors(prev => ({ ...prev, paymentMethod: '' }));
                    }
                    // Show payment modal immediately for non-COD methods
                    if (method.id !== 'cod') {
                      setShowPaymentModal(true);
                    } else {
                      setShowPaymentModal(false);
                      setPaymentDetailsFilled(true); // COD doesn't need details
                    }
                  }}
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
                  <Image 
                    src={method.icon} 
                    alt={method.name} 
                    width={28} 
                    height={28}
                    style={{ 
                      filter: paymentMethod === method.id ? 'none' : 'grayscale(0.3)'
                    }}
                  />
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
                  {/* Show checkmark if payment method selected and details filled */}
                  {paymentMethod === method.id && (method.id === 'cod' || paymentDetailsFilled) && (
                    <div style={{
                      color: '#10b981',
                      fontSize: '1.5rem',
                      fontWeight: '700'
                    }}>
                      ✓
                    </div>
                  )}
                  {paymentMethod === method.id && method.id !== 'cod' && !paymentDetailsFilled && (
                    <div style={{
                      color: '#f59e0b',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      Fill Details
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Error */}
          {errors.paymentMethod && (
            <div style={{
              background: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '1rem',
              color: '#991b1b',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              {errors.paymentMethod}
            </div>
          )}

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
              <Image src="/icons/actions/edit.svg" alt="Instructions" width={24} height={24} />
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
            <Image src="/icons/navigation/cart.svg" alt="Cart" width={24} height={24} />
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
              <Image src="/icons/payment/money.svg" alt="Money" width={20} height={20} style={{ display: 'inline-block', marginRight: '8px' }} />
              Price Breakdown
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
              <Image src="/icons/payment/card.svg" alt="Total" width={20} height={20} style={{ display: 'inline-block' }} />
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

      {/* Payment Modal - Shows when Card/UPI/Wallet selected */}
      {showPaymentModal && !currentOrderId && (
        <PaymentDetailsModal
          amount={total}
          paymentMethod={paymentMethod}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentMethod(''); // Clear selection
            setPaymentDetailsFilled(false); // Clear filled status
          }}
          onSave={() => {
            setShowPaymentModal(false);
            setPaymentDetailsFilled(true); // Mark as filled
          }}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardName={cardName}
          setCardName={setCardName}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          cvv={cvv}
          setCvv={setCvv}
          upiId={upiId}
          setUpiId={setUpiId}
          selectedWallet={selectedWallet}
          setSelectedWallet={setSelectedWallet}
        />
      )}
    </div>
  );
}

// Payment Details Modal Component (shown before order creation)
function PaymentDetailsModal({
  amount,
  paymentMethod,
  onClose,
  onSave,
  cardNumber,
  setCardNumber,
  cardName,
  setCardName,
  expiryDate,
  setExpiryDate,
  cvv,
  setCvv,
  upiId,
  setUpiId,
  selectedWallet,
  setSelectedWallet
}: any) {
  const [error, setError] = useState('');

  // Card formatting functions
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const getCardType = () => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    return 'Card';
  };

  const validateAndSave = () => {
    setError('');
    
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setError('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter cardholder name');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        setError('Please enter expiry date in MM/YY format');
        return;
      }
      if (cvv.length !== 3) {
        setError('Please enter a valid 3-digit CVV');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., yourname@paytm)');
        return;
      }
    }

    // Details are valid, close modal and mark as filled
    onSave();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '2rem',
      overflow: 'hidden' // Prevent background scroll
    }}
    onClick={(e) => {
      // Close modal if clicking on backdrop
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}
    >
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '2.5rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#333',
            margin: 0
          }}>
            {paymentMethod === 'card' && (
              <>
                <Image 
                  src="/icons/payment-methods/card-generic.svg" 
                  alt="Card" 
                  width={24} 
                  height={24}
                  onError={(e) => {
                    // Fallback to emoji if icon not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.textContent = '💳 Enter Card Details';
                  }}
                />
                <span>Enter Card Details</span>
              </>
            )}
            {paymentMethod === 'upi' && (
              <>
                <Image 
                  src="/icons/payment-methods/upi.svg" 
                  alt="UPI" 
                  width={24} 
                  height={24}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.textContent = '📱 Enter UPI Details';
                  }}
                />
                <span>Enter UPI Details</span>
              </>
            )}
            {paymentMethod === 'wallet' && (
              <>
                <Image 
                  src="/icons/payment-methods/wallet.svg" 
                  alt="Wallet" 
                  width={24} 
                  height={24}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.textContent = '👛 Select Wallet';
                  }}
                />
                <span>Select Wallet</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Amount Display */}
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Order Amount
          </div>
          <div style={{ color: 'white', fontSize: '2rem', fontWeight: '700' }}>
            ₹{amount.toFixed(2)}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#991b1b',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Card Payment Form */}
        {paymentMethod === 'card' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {cardNumber && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff6b6b', fontWeight: '600' }}>
                  {getCardType()}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="JOHN DOE"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  textTransform: 'uppercase'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                  CVV
                </label>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="•••"
                  maxLength={3}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          </div>
        )}

        {/* UPI Payment Form */}
        {paymentMethod === 'upi' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                Enter UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>Or scan QR code</div>
              <div style={{
                width: '150px',
                height: '150px',
                background: 'white',
                border: '2px solid #ddd',
                borderRadius: '12px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem'
              }}>
                <Image 
                  src="/icons/payment-methods/qr-code.svg" 
                  alt="QR Code" 
                  width={120} 
                  height={120}
                  onError={(e) => {
                    // Fallback to emoji if icon not found
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.textContent = '📱';
                  }}
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                Scan with any UPI app
              </div>
            </div>
          </div>
        )}

        {/* Wallet Payment Form */}
        {paymentMethod === 'wallet' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
              Select Wallet
            </label>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {[
                { id: 'paytm', name: 'Paytm', iconPath: '/icons/payment-methods/paytm-wallet.svg', fallbackEmoji: '💙', balance: 5000 },
                { id: 'phonepe', name: 'PhonePe', iconPath: '/icons/payment-methods/phonepe-wallet.svg', fallbackEmoji: '💜', balance: 3500 },
                { id: 'amazonpay', name: 'Amazon Pay', iconPath: '/icons/payment-methods/amazonpay.svg', fallbackEmoji: '🧡', balance: 4200 }
              ].map((wallet) => (
                <div
                  key={wallet.id}
                  onClick={() => setSelectedWallet(wallet.id)}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${selectedWallet === wallet.id ? '#ff6b6b' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: selectedWallet === wallet.id ? '#f0f4ff' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '2rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image 
                      src={wallet.iconPath} 
                      alt={wallet.name} 
                      width={48} 
                      height={48}
                      onError={(e) => {
                        // Fallback to emoji if icon not found
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.textContent = wallet.fallbackEmoji;
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#333' }}>{wallet.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Balance: ₹{wallet.balance.toLocaleString()}</div>
                  </div>
                  {selectedWallet === wallet.id && (
                    <div style={{ color: '#ff6b6b', fontSize: '1.25rem' }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              color: '#666',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={validateAndSave}
            style={{
              flex: 2,
              padding: '1rem',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Continue
          </button>
        </div>

        {/* Info Text */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#999'
        }}>
          You can review and place your order after this
        </div>
      </div>
    </div>
  );
}

