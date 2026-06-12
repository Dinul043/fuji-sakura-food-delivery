'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import AuthPopup from '../../components/AuthPopup';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [platformDeliveryFee, setPlatformDeliveryFee] = useState(40.00);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '', 
    city: 'Chennai',
    pincode: ''
  });
  const [deliveryCoords, setDeliveryCoords] = useState<{lat: number; lng: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderInstructions, setOrderInstructions] = useState('');

  useEffect(() => {
    // Fetch platform delivery fee
    fetch(`${API_BASE_URL}/api/geocode/platform-info`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings?.delivery_fee?.value) {
          setPlatformDeliveryFee(parseFloat(data.settings.delivery_fee.value));
        }
      }).catch(() => {});

    // Check if user is guest and show popup
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setShowAuthPopup(true);
      return;
    }

    // Fetch profile from DB and pre-fill address/phone
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('userName') || '';

    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(profile => {
          if (profile) {
            setDeliveryAddress(prev => ({
              ...prev,
              fullName: profile.name || storedName,
              phone: profile.phone ? profile.phone.replace(/\D/g, '').slice(-10) : prev.phone,
              address: profile.address || prev.address,
            }));
          } else {
            setDeliveryAddress(prev => ({ ...prev, fullName: storedName }));
          }
        })
        .catch(() => {
          setDeliveryAddress(prev => ({ ...prev, fullName: storedName }));
        });
    } else {
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
  const deliveryFee = platformDeliveryFee;
  const taxRate = 0.05; // 5% GST estimate — actual calculated per item on backend
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
    
    // Delivery coordinates check — user must use "Use Current Location" or we geocode on submit
    // If no coords, we'll geocode the typed address during order placement
    
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
      // If no delivery coordinates yet (user typed address manually), geocode it
      let finalCoords = deliveryCoords;
      if (!finalCoords) {
        try {
          const geocodeQuery = `${deliveryAddress.address}, ${deliveryAddress.city}, ${deliveryAddress.pincode}`;
          const geoRes = await fetch(`${API_BASE_URL}/api/geocode/search?q=${encodeURIComponent(geocodeQuery)}&limit=1`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.suggestions && geoData.suggestions.length > 0) {
              finalCoords = { lat: geoData.suggestions[0].latitude, lng: geoData.suggestions[0].longitude };
              setDeliveryCoords(finalCoords);
            }
          }
        } catch {
          // Geocoding failed — proceed without coords, backend will handle
        }
      }

      // Sync phone & address back to user profile in DB
      const authToken = localStorage.getItem('token');
      const userName = localStorage.getItem('userName') || deliveryAddress.fullName;
      fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ name: userName, phone: deliveryAddress.phone, address: deliveryAddress.address })
      }).catch(() => {}); // fire-and-forget, don't block order placement
      
      // Get cart item IDs for the order (use cart_id which is the database ID)
      const cartItemIds = checkoutItems
        .map(item => item.cart_id)
        .filter(id => id !== undefined && id !== null);
      
      if (cartItemIds.length === 0) {
        throw new Error('Cart items are not properly loaded. Please refresh the page and try again.');
      }
      
      // Create order via API
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_address: deliveryAddress,
          delivery_latitude: finalCoords?.lat || null,
          delivery_longitude: finalCoords?.lng || null,
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
      
      // Route based on payment method
      if (paymentMethod === 'cod') {
        // COD: Refresh cart and go to success page
        await refreshCart();
        router.push(`/order-success?orderId=${firstOrder.id}`);
      } else {
        // Online: Open Razorpay (cart will be cleared after successful payment)
        await openRazorpay(firstOrder.id, firstOrder.total_amount);
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

  const openRazorpay = async (orderId: number, amount: number) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      
      // Step 1: Create Razorpay order
      const response = await fetch(`${API_BASE_URL}/api/payments/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: orderId })
      });
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : { detail: `Server error ${response.status}` };
        } catch {
          errorData = { detail: `Server error (${response.status}): ${response.statusText}` };
        }
        throw new Error(errorData.detail || `Payment failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Flag to track if payment was successful
      let paymentSuccessful = false;
      
      // Step 2: Open Razorpay popup
      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Fuji Sakura Food Delivery",
        description: `Order #${data.order_number}`,
        order_id: data.razorpay_order_id,
        handler: async function (razorpayResponse: any) {
          // Step 3: Verify payment
          paymentSuccessful = true; // Mark as successful
          await verifyPayment(orderId, razorpayResponse);
        },
        prefill: {
          name: deliveryAddress.fullName,
          contact: deliveryAddress.phone,
          email: localStorage.getItem('userEmail') || 'customer@fujisakura.com'
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [
                  { method: "upi", flows: ["collect"] },
                  { method: "upi", flows: ["qr"] }
                ]
              },
              card: {
                name: "Pay via Card",
                instruments: [{ method: "card" }]
              }
            },
            sequence: ["block.upi", "block.card"],
            preferences: { show_default_blocks: true }
          }
        },
        theme: {
          color: "#ff6b6b"
        },
        modal: {
          ondismiss: async function() {
            // Only handle failure if payment was not successful
            if (!paymentSuccessful) {
              await handlePaymentFailure(orderId, 'Payment cancelled by user');
              setIsLoading(false);
              setErrors({ submit: 'Payment cancelled. Your items are still in the cart.' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setIsLoading(false);
      
    } catch (error) {
      setIsLoading(false);
      setErrors({ submit: 'Failed to open payment gateway. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const verifyPayment = async (orderId: number, razorpayResponse: any) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/payments/razorpay/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature
        })
      });
      
      if (response.ok) {
        // Payment verified successfully
        // Clear cart since payment was successful
        await refreshCart();
        router.push(`/order-success?orderId=${orderId}`);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Payment verification failed' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setErrors({ submit: 'Payment verification failed. Please contact support.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentFailure = async (orderId: number, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_BASE_URL}/api/payments/failure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          failure_reason: reason
        })
      });
    } catch (error) {
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

            {/* Quick location fill button */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={async () => {
                  // Try to use saved location first
                  const savedAddress = localStorage.getItem('userLocationAddress');
                  const savedLat = localStorage.getItem('userLat');
                  const savedLng = localStorage.getItem('userLng');
                  
                  if (savedAddress && savedLat && savedLng) {
                    // Use saved location — reverse geocode for full details
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/geocode/reverse?lat=${savedLat}&lng=${savedLng}`);
                      if (res.ok) {
                        const data = await res.json();
                        setDeliveryAddress(prev => ({
                          ...prev,
                          address: data.full_address || savedAddress,
                          city: data.city || prev.city,
                          pincode: data.postcode || prev.pincode,
                        }));
                        setDeliveryCoords({ lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
                        setErrors(prev => ({ ...prev, address: '' }));
                        return;
                      }
                    } catch { /* fall through to GPS */ }
                  }
                  
                  // No saved location — detect via GPS
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords;
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
                        if (res.ok) {
                          const data = await res.json();
                          setDeliveryAddress(prev => ({
                            ...prev,
                            address: data.full_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                            city: data.city || prev.city,
                            pincode: data.postcode || prev.pincode,
                          }));
                          setDeliveryCoords({ lat: latitude, lng: longitude });
                          setErrors(prev => ({ ...prev, address: '' }));
                          // Also save as delivery location
                          const label = data.area ? `${data.area}, ${data.city}` : data.city;
                          localStorage.setItem('userLat', latitude.toString());
                          localStorage.setItem('userLng', longitude.toString());
                          localStorage.setItem('userLocationAddress', label);
                        }
                      } catch { /* silent */ }
                    },
                    () => { /* GPS denied — do nothing */ },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '2px solid #FF5722',
                  background: 'linear-gradient(135deg, #fff5f2, #ffffff)',
                  color: '#FF5722',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                📍 Use Current Location
              </button>
            </div>

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
                { id: 'cod', icon: '/icons/payment-methods/cards/card-generic.png', name: 'Cash on Delivery', desc: 'Pay when order arrives' },
                { id: 'online', icon: '/icons/payment-methods/cards/card-generic.png', name: 'Pay Online', desc: 'Card, UPI, Wallet via Razorpay' }
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    // Clear payment method error when selected
                    if (errors.paymentMethod) {
                      setErrors(prev => ({ ...prev, paymentMethod: '' }));
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
              }}>GST (5%)</span>
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
              fontSize: '1rem',
              margin: 0,
              fontWeight: '600',
              background: 'rgba(3, 105, 161, 0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              display: 'inline-block'
            }}>
              ⚡ {(() => {
                const savedLat = localStorage.getItem('userLat');
                const savedLng = localStorage.getItem('userLng');
                if (savedLat && savedLng && cart.length > 0) {
                  // Rough estimate: 10 min cooking + distance-based travel
                  // We don't have restaurant coords here, so use a reasonable default
                  // based on the fact that user can only order from nearby restaurants (15km max)
                  return '15-30 minutes';
                }
                return '25-35 minutes';
              })()}
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
