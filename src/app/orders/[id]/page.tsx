'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  restaurantId: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  address: {
    fullName: string;
    phone: string;
    address: string;
    landmark: string;
    city: string;
    pincode: string;
  };
  paymentMethod: string;
  instructions: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  estimatedDelivery: string;
  orderTime: string;
  deliveredTime?: string;
  restaurantName?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Review state
  const [review, setReview] = useState<{ rating: number; comment: string; created_at: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Cancel order state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSecondsLeft, setCancelSecondsLeft] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket(
    `${WS_BASE_URL}/ws/orders/${orderId}`,
    (data) => {
      if (data.type === 'order_status_update' && data.order) {
        // Update order with new data from WebSocket
        const updatedOrder = data.order;
        const transformedOrder: Order = {
          id: updatedOrder.id,
          items: updatedOrder.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isVeg: item.isVeg,
            restaurantId: updatedOrder.restaurant_id
          })),
          address: {
            fullName: updatedOrder.customer_name || '',
            phone: updatedOrder.delivery_phone || '',
            address: updatedOrder.delivery_address || '',
            landmark: '',
            city: '',
            pincode: ''
          },
          paymentMethod: updatedOrder.payment_method || 'cod',
          instructions: updatedOrder.special_instructions || '',
          subtotal: updatedOrder.subtotal,
          deliveryFee: updatedOrder.delivery_fee,
          tax: updatedOrder.tax_amount,
          total: updatedOrder.total_amount,
          status: updatedOrder.status,
          estimatedDelivery: `${updatedOrder.estimated_delivery_time} mins`,
          orderTime: updatedOrder.created_at,
          deliveredTime: updatedOrder.delivered_at,
          restaurantName: updatedOrder.restaurant_name,
          deliveryPartnerName: updatedOrder.delivery_partner_name || null,
          deliveryPartnerPhone: updatedOrder.delivery_partner_phone || null
        };
        
        setOrder(transformedOrder);
        
        // Update step
        const stepMap: Record<string, number> = {
          'confirmed': 0,
          'preparing': 1,
          'ready': 2,
          'out_for_delivery': 3,
          'delivered': 4,
          'cancelled': -1
        };
        setCurrentStep(stepMap[updatedOrder.status] ?? 0);
      }
    }
  );

  useEffect(() => {
    // Fetch order from backend API
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          setOrder(null);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        
        // Transform backend data to match frontend interface
        const transformedOrder: Order = {
          id: data.id,
          items: data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isVeg: item.isVeg,
            restaurantId: data.restaurant_id
          })),
          address: {
            fullName: data.customer_name || '',
            phone: data.delivery_phone || '',
            address: data.delivery_address || '',
            landmark: '',
            city: '',
            pincode: ''
          },
          paymentMethod: data.payment_method || 'cod',
          instructions: data.special_instructions || '',
          subtotal: data.subtotal,
          deliveryFee: data.delivery_fee,
          tax: data.tax_amount,
          total: data.total_amount,
          status: data.status,
          estimatedDelivery: `${data.estimated_delivery_time} mins`,
          orderTime: data.created_at,
          deliveredTime: data.delivered_at,
          restaurantName: data.restaurant_name,
          deliveryPartnerName: data.delivery_partner_name || null,
          deliveryPartnerPhone: data.delivery_partner_phone || null
        };

        setOrder(transformedOrder);
        
        // Set current step based on status
        const stepMap: Record<string, number> = {
          'confirmed': 0,
          'preparing': 1,
          'ready': 2,
          'out_for_delivery': 3,
          'delivered': 4,
          'cancelled': -1
        };
        setCurrentStep(stepMap[data.status] ?? 0);
      } catch (error) {
        console.error('❌ Error loading order:', error);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();

    // Fetch existing review for this order
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/reviews/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.review) setReview(data.review); })
        .catch(() => {});
    }
  }, [orderId]);

  // 1-minute cancellation countdown timer
  useEffect(() => {
    if (!order || order.status !== 'confirmed' || !order.orderTime) return;
    const updateTimer = () => {
      const elapsed = (Date.now() - new Date(order.orderTime).getTime()) / 1000;
      const remaining = Math.max(0, 60 - Math.floor(elapsed));
      setCancelSecondsLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order?.orderTime, order?.status]);

  // Cancel order handler
  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setShowCancelConfirm(false);
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
        setCurrentStep(-1);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to cancel order');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewRating) return;
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, rating: reviewRating, comment: reviewComment.trim() || null })
      });
      if (res.ok) {
        const data = await res.json();
        setReview(data.review);
        setReviewToast('Review submitted! Thank you 🎉');
        setTimeout(() => setReviewToast(null), 4000);
      } else {
        const err = await res.json();
        setReviewToast(err.detail || 'Failed to submit review');
        setTimeout(() => setReviewToast(null), 4000);
      }
    } catch {
      setReviewToast('Network error. Please try again.');
      setTimeout(() => setReviewToast(null), 4000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Get restaurant info for an order
  const getRestaurantInfo = (order: Order) => {
    return {
      id: order.items[0]?.restaurantId || 0,
      name: order.restaurantName || 'Restaurant',
      image: '🏪'
    };
  };

  // Group items by restaurant
  const groupItemsByRestaurant = (items: OrderItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = {
          restaurant: order ? getRestaurantInfo(order) : { id: item.restaurantId, name: 'Restaurant', image: '🏪' },
          items: []
        };
      }
      acc[item.restaurantId].items.push(item);
      return acc;
    }, {} as Record<number, { restaurant: any; items: OrderItem[] }>);
  };

  // Format date - display local time as-is
  const formatDate = (dateString: string) => {
    // Backend sends local time, display it as-is
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Order tracking steps
  const trackingSteps = [
    {
      title: 'Order Confirmed',
      description: 'Your order has been placed successfully',
      emoji: '✅',
      color: '#10b981'
    },
    {
      title: 'Preparing Your Food',
      description: 'The restaurant is preparing your delicious meal',
      emoji: '👨‍🍳',
      color: '#f59e0b'
    },
    {
      title: 'Ready for Pickup',
      description: 'Food is ready — delivery partner is heading to the restaurant',
      emoji: '📦',
      color: '#f59e0b'
    },
    {
      title: 'On the Way',
      description: 'Your order is out for delivery',
      emoji: '🛵',
      color: '#8b5cf6'
    },
    {
      title: 'Delivered',
      description: 'Your order has been delivered successfully',
      emoji: '🎉',
      color: '#10b981'
    }
  ];

  // Get payment method info
  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'card':
        return { icon: '💳', name: 'Credit/Debit Card' };
      case 'upi':
        return { icon: '📱', name: 'UPI Payment' };
      case 'wallet':
        return { icon: '👛', name: 'Digital Wallet' };
      case 'cod':
        return { icon: '💵', name: 'Cash on Delivery' };
      default:
        return { icon: '💳', name: 'Card Payment' };
    }
  };

  if (isLoading) {
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
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #ff6b6b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', margin: 0 }}>
            Loading order details...
          </h2>
        </div>
      </div>
    );
  }

  if (!order) {
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: 0 }}>
            Order not found
          </h2>
          <p style={{ color: '#666', marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: '2rem' }}>
            The order you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/orders')}
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
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const restaurantGroups = groupItemsByRestaurant(order.items);
  const paymentInfo = getPaymentMethodInfo(order.paymentMethod);

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
          onClick={() => router.push('/orders')}
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
          <span>Back to Orders</span>
        </button>
        
        <h1 style={{
          color: 'white',
          fontSize: '1.8rem',
          fontWeight: '600',
          margin: 0,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          Track Order #{order.id}
          {isConnected && (
            <span style={{
              fontSize: '0.75rem',
              background: '#10b981',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                background: 'white',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              Live
            </span>
          )}
        </h1>
        
        <div style={{ width: '120px' }}></div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Panel - Order Tracking */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Order Status */}
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
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              Order Status
            </h2>

            {order.status === 'cancelled' ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#ef4444',
                  marginTop: 0,
                  marginLeft: 0,
                  marginRight: 0,
                  marginBottom: '0.5rem'
                }}>
                  Order Cancelled
                </h3>
                <p style={{ color: '#666', marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: 0 }}>
                  This order has been cancelled
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                {trackingSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        background: isCurrent ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                        border: isCurrent ? '2px solid #ff6b6b' : '2px solid transparent',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: isCompleted ? step.color : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: 'white',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: isCompleted ? `0 4px 12px ${step.color}40` : 'none'
                      }}>
                        {isCompleted ? step.emoji : index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: isCompleted ? step.color : '#9ca3af',
                          marginTop: 0,
                          marginLeft: 0,
                          marginRight: 0,
                          marginBottom: '0.25rem'
                        }}>
                          {step.title}
                        </h4>
                        <p style={{
                          fontSize: '0.9rem',
                          color: isCompleted ? '#374151' : '#9ca3af',
                          marginTop: 0,
                          marginLeft: 0,
                          marginRight: 0,
                          marginBottom: 0
                        }}>
                          {step.description}
                        </p>
                      </div>
                      
                      {isCurrent && (
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#ff6b6b',
                          animation: 'pulse 2s infinite'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Partner Info — show when partner is assigned */}
          {(order.status === 'ready' || order.status === 'out_for_delivery') && order.deliveryPartnerName && (
            <div style={{
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
              borderRadius: '20px', padding: '1.5rem 2rem',
              border: '2px solid #ede9fe', boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🛵</span> Your Delivery Partner
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.05rem' }}>
                    {order.deliveryPartnerName}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                    📞 {order.deliveryPartnerPhone}
                  </div>
                </div>
                <a href={`tel:${order.deliveryPartnerPhone}`}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none' }}>
                  📞 Call
                </a>
              </div>
            </div>
          )}

          {/* Cancel Order — visible only within 1 minute of confirmed order */}
          {order.status === 'confirmed' && cancelSecondsLeft !== null && cancelSecondsLeft > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
              borderRadius: '20px', padding: '1.5rem 2rem',
              border: '2px solid #fee2e2', boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#374151', fontSize: '0.95rem' }}>
                  Cancel window closes in <span style={{ color: '#ef4444', fontWeight: '700' }}>{cancelSecondsLeft}s</span>
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                  Orders can only be cancelled within 1 minute of placement
                </p>
              </div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Cancel Order
              </button>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
            }}>
              <div style={{
                background: 'white', borderRadius: '20px', padding: '2rem',
                maxWidth: '400px', width: '90%', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontSize: '1.2rem', fontWeight: '700' }}>Cancel this order?</h3>
                <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
                  This action cannot be undone. The restaurant will be notified immediately.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    style={{
                      flex: 1, padding: '0.75rem', background: '#f3f4f6', color: '#374151',
                      border: 'none', borderRadius: '10px', fontSize: '0.95rem',
                      fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    style={{
                      flex: 1, padding: '0.75rem',
                      background: isCancelling ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontSize: '0.95rem', fontWeight: '600',
                      cursor: isCancelling ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information */}
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
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🏠</span>
              Delivery Information
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginTop: 0,
                  marginLeft: 0,
                  marginRight: 0,
                  marginBottom: '0.5rem'
                }}>
                  Delivery Address
                </h4>
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  <strong>{order.address.fullName}</strong><br />
                  {order.address.address}<br />
                  {order.address.landmark && `${order.address.landmark}, `}
                  {order.address.city} - {order.address.pincode}<br />
                  📞 {order.address.phone}
                </p>
              </div>

              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginTop: 0,
                  marginLeft: 0,
                  marginRight: 0,
                  marginBottom: '0.5rem'
                }}>
                  Estimated Delivery Time
                </h4>
                <p style={{
                  color: '#10b981',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {order.estimatedDelivery}
                </p>
              </div>

              {order.instructions && (
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginTop: 0,
                    marginLeft: 0,
                    marginRight: 0,
                    marginBottom: '0.5rem'
                  }}>
                    Special Instructions
                  </h4>
                  <p style={{
                    color: '#6b7280',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    "{order.instructions}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Review Section - left panel, after delivery info */}
          {order.status === 'delivered' && (
            <div style={{
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
              borderRadius: '20px', padding: '2.5rem',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              {reviewToast && (
                <div style={{
                  position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999,
                  background: reviewToast.includes('Thank') ? '#10b981' : '#ef4444',
                  color: 'white', borderRadius: '14px', padding: '1rem 1.5rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)', fontWeight: '600', fontSize: '0.95rem'
                }}>
                  {reviewToast}
                </div>
              )}
              <h2 style={{
                fontSize: '1.4rem', fontWeight: '700', color: '#333',
                marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9'
              }}>
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
                Rate Your Experience
              </h2>
              {review ? (
                <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1.5rem', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: '0 0 0.75rem', fontWeight: '700', color: '#166534', fontSize: '1rem' }}>✅ Your Review</p>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '1.5rem', color: s <= review.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                    ))}
                  </div>
                  {review.comment && <p style={{ margin: '0 0 0.5rem', color: '#374151', fontStyle: 'italic' }}>"{review.comment}"</p>}
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
                    Submitted on {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.75rem', fontWeight: '600', color: '#374151' }}>Your Rating</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} onClick={() => setReviewRating(s)}
                          onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)}
                          style={{ fontSize: '2.2rem', cursor: 'pointer', transition: 'transform 0.1s',
                            color: s <= (reviewHover || reviewRating) ? '#f59e0b' : '#d1d5db',
                            transform: s <= (reviewHover || reviewRating) ? 'scale(1.2)' : 'scale(1)' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: '#374151' }}>Comment (optional)</p>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How was your experience? Tell us about the food, delivery..."
                      rows={3} style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px',
                        border: '2px solid #e5e7eb', fontSize: '0.95rem', outline: 'none',
                        resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b6b'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                  </div>
                  <button onClick={handleSubmitReview} disabled={!reviewRating || isSubmittingReview}
                    style={{ padding: '0.875rem', borderRadius: '12px', border: 'none',
                      background: !reviewRating || isSubmittingReview ? '#d1d5db' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: 'white', fontSize: '1rem', fontWeight: '600',
                      cursor: !reviewRating || isSubmittingReview ? 'not-allowed' : 'pointer' }}>
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Order Details */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Order Summary */}
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
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🛒</span>
              Order Summary ({order.items.reduce((total, item) => total + item.quantity, 0)} items)
            </h2>

            {/* Restaurant Groups */}
            {Object.entries(restaurantGroups).map(([restaurantId, group]) => (
              <div key={restaurantId} style={{
                marginBottom: '2rem',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}>
                {/* Restaurant Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  color: 'white',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{ 
                    fontSize: '2rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                  }}>{group.restaurant?.image}</span>
                  <div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      marginTop: 0,
                      marginLeft: 0,
                      marginRight: 0,
                      marginBottom: '0.5rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}>
                      {group.restaurant?.name}
                    </h3>
                    <p style={{
                      fontSize: '0.85rem',
                      opacity: 0.95,
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      {group.restaurant?.cuisine}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div style={{ 
                  padding: '1.5rem',
                  background: '#fafafa'
                }}>
                  {group.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 0',
                      borderBottom: index < group.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: item.isVeg ? '#059669' : '#dc2626',
                          fontWeight: '500',
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
                        gap: '1rem',
                        minWidth: '120px',
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
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: '#ff6b6b',
                          minWidth: '60px',
                          textAlign: 'right'
                        }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Price Breakdown */}
            <div style={{
              borderTop: '2px solid #e2e8f0',
              paddingTop: '1.5rem',
              marginBottom: '2rem',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#374151',
                marginTop: 0,
                marginLeft: 0,
                marginRight: 0,
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #e2e8f0'
              }}>
                💰 Price Breakdown
              </h3>
              
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
                }}>Subtotal</span>
                <span style={{ 
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  color: '#374151'
                }}>${order.subtotal.toFixed(2)}</span>
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
                }}>${order.deliveryFee.toFixed(2)}</span>
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
                }}>${order.tax.toFixed(2)}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.3rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '2rem',
              paddingTop: '1.5rem',
              borderTop: '3px solid #ff6b6b',
              background: 'linear-gradient(135deg, #fff5f5, #fef2f2)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.1)'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>💳</span>
                Total Amount
              </span>
              <span style={{ color: '#ff6b6b' }}>₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Order Info */}
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
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              Order Information
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Order ID</span>
                <span style={{ fontWeight: '700', color: '#ff6b6b' }}>#{order.id}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Order Time</span>
                <span style={{ color: '#6b7280' }}>{formatDate(order.orderTime)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Payment Method</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>{paymentInfo.icon}</span>
                  <span style={{ color: '#6b7280' }}>{paymentInfo.name}</span>
                </div>
              </div>

              {order.deliveredTime && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#f0fdf4',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Delivered Time</span>
                  <span style={{ color: '#166534', fontWeight: '600' }}>{formatDate(order.deliveredTime)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}