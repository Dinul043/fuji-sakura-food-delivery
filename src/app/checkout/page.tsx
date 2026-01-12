'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import { restaurants } from '../../data/restaurants';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart, removeFromCart, getTotalItems, getTotalPrice } = useCart();
  
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  
  // Checkout type from URL params
  const checkoutType = searchParams.get('type') || 'all'; // 'all', 'selected', 'restaurant'
  const selectedItemIds = searchParams.get('items')?.split(',') || [];
  const restaurantId = searchParams.get('restaurantId');
  
  // Form data
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: '123 Sakura Street, Tokyo District, City 12345',
    phone: '',
    instructions: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'Guest';
    setUserName(storedName);
    
    // If no items to checkout, redirect to cart
    if (cart.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  // Get items to checkout based on type
  const getCheckoutItems = () => {
    switch (checkoutType) {
      case 'selected':
        return cart.filter(item => selectedItemIds.includes(`${item.id}-${item.restaurantId}`));
      case 'restaurant':
        return cart.filter(item => item.restaurantId === parseInt(restaurantId || '0'));
      default:
        return cart;
    }
  };

  const checkoutItems = getCheckoutItems();
  const subtotal = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = 2.99;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;

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

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('card.')) {
      const cardField = field.split('.')[1];
      setCardDetails(prev => ({ ...prev, [cardField]: value }));
    } else {
      setDeliveryDetails(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      // Remove checked out items from cart
      checkoutItems.forEach(item => {
        removeFromCart(item.id, item.restaurantId);
      });
      
      setCurrentStep(3); // Show confirmation
      setIsLoading(false);
    }, 2000);
  };

  const handleBackToHome = () => {
    router.push('/home');
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
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>No Items to Checkout</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Please add items to your cart first.</p>
          <button
            onClick={handleBackToCart}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Cart
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
        
        <div style={{ width: '120px' }}></div>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        {[1, 2, 3].map((step) => (
          <div key={step} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: step <= currentStep ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600'
            }}>
              {step === 3 && currentStep === 3 ? '✓' : step}
            </div>
            <span style={{
              color: 'white',
              fontWeight: '500',
              marginRight: step < 3 ? '2rem' : '0'
            }}>
              {step === 1 ? 'Details' : step === 2 ? 'Payment' : 'Confirmation'}
            </span>
            {step < 3 && (
              <div style={{
                width: '3rem',
                height: '2px',
                background: step < currentStep ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'rgba(255, 255, 255, 0.3)',
                marginRight: '2rem'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: currentStep === 3 ? '1fr' : '2fr 1fr',
        gap: '2rem'
      }}>
        {/* Left Panel - Step Content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '2rem' }}>
                Delivery Details
              </h2>
              
              {/* Delivery Address */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Delivery Address
                </label>
                <textarea
                  value={deliveryDetails.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '80px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your delivery address"
                />
              </div>

              {/* Phone Number */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={deliveryDetails.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Delivery Instructions */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  value={deliveryDetails.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '80px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              <button
                onClick={handleNextStep}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '2rem' }}>
                Payment Method
              </h2>

              {/* Payment Method Selection */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  {['card', 'cash'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        border: `2px solid ${paymentMethod === method ? '#ff6b6b' : '#e1e5e9'}`,
                        borderRadius: '12px',
                        background: paymentMethod === method ? '#fff5f5' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}
                    >
                      {method === 'card' ? '💳 Credit/Debit Card' : '💵 Cash on Delivery'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div>
                  {/* Card Number */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => handleInputChange('card.number', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e5e9',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Expiry */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => handleInputChange('card.expiry', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                        placeholder="MM/YY"
                      />
                    </div>

                    {/* CVV */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => handleInputChange('card.cvv', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.name}
                      onChange={(e) => handleInputChange('card.name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e5e9',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handlePreviousStep}
                  style={{
                    flex: 1,
                    background: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #e1e5e9',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  style={{
                    flex: 2,
                    background: isLoading ? '#ccc' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Processing...' : `Place Order • $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '2rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Order Placed Successfully!
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
                Thank you for your order, {userName}! Your delicious food is being prepared.
              </p>
              
              <div style={{
                background: '#f0f9ff',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #bae6fd'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#0369a1', marginBottom: '1rem' }}>
                  Order Details
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Order Total:</span>
                  <span style={{ fontWeight: '600' }}>${total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Items:</span>
                  <span>{checkoutItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Payment:</span>
                  <span>{paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Estimated Delivery:</span>
                  <span style={{ fontWeight: '600', color: '#0369a1' }}>25-35 minutes</span>
                </div>
              </div>

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
                  cursor: 'pointer'
                }}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Order Summary (Hidden on confirmation step) */}
        {currentStep !== 3 && (
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
            <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>
              Order Summary
            </h2>

            {/* Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              {Object.entries(groupedItems).map(([restaurantId, group]) => (
                <div key={restaurantId} style={{ marginBottom: '1rem' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{group.restaurant?.image}</span>
                    <span>{group.restaurant?.name}</span>
                  </h3>
                  {group.items.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: index < group.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#ff6b6b' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#666' }}>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#666' }}>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#666' }}>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#333',
              borderTop: '2px solid #e2e8f0',
              paddingTop: '1rem'
            }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}