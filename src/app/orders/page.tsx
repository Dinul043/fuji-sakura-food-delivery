'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  menu_item_id: number;
}

interface Order {
  id: number;
  order_number: string;
  items: OrderItem[];
  delivery_address: string;
  delivery_phone: string;
  payment_method: string;
  special_instructions: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  estimated_delivery_time: number;
  created_at: string;
  delivered_at?: string;
  restaurant_id: number;
  restaurant_name: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          // User not logged in, redirect to login
          setIsLoading(false);
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/orders/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data || []); // Handle empty array
        } else if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          // Other errors - just set empty orders, no console error
          setOrders([]);
        }
      } catch (error) {
        // Network error or server down - silently handle, show empty state
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  // Filter orders by status
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Get restaurant info for an order
  const getRestaurantInfo = (order: Order) => {
    return {
      id: order.restaurant_id,
      name: order.restaurant_name,
      image: '🏪',
      cuisine: '' // Add cuisine property (empty since not in Order model)
    };
  };

  // Group items by restaurant (for multi-restaurant orders)
  const groupItemsByRestaurant = (order: Order) => {
    return {
      [order.restaurant_id]: {
        restaurant: getRestaurantInfo(order),
        items: order.items
      }
    };
  };

  // Format date - converts UTC to local timezone
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

  // Get status color and emoji
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: '#3b82f6', bg: '#dbeafe', icon: '/icons/actions/check.svg', text: 'Order Confirmed' };
      case 'preparing':
        return { color: '#f59e0b', bg: '#fef3c7', icon: '/icons/food/food.svg', text: 'Preparing' };
      case 'out_for_delivery':
        return { color: '#8b5cf6', bg: '#ede9fe', icon: '/icons/delivery/delivery.svg', text: 'On the Way' };
      case 'delivered':
        return { color: '#10b981', bg: '#d1fae5', icon: '/icons/status/success.svg', text: 'Delivered' };
      case 'cancelled':
        return { color: '#ef4444', bg: '#fee2e2', icon: '/icons/actions/close.svg', text: 'Cancelled' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', icon: '/icons/navigation/orders.svg', text: 'Pending' };
    }
  };

  // Reorder functionality
  const handleReorder = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      
      // Add items back to cart via API
      for (const item of order.items) {
        await fetch(`${API_BASE_URL}/api/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity
          })
        });
      }
      
      // Navigate to cart
      router.push('/cart');
    } catch (error) {
      // Silently handle error - user will see empty cart if it fails
    }
  };

  // Track order (navigate to order detail)
  const handleTrackOrder = (orderId: number) => {
    router.push(`/orders/${orderId}`);
  };

  // Cancel order
  const handleCancelOrder = async (orderId: number) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderToCancel}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Failed to cancel - silently close modal
        setShowCancelModal(false);
        setOrderToCancel(null);
        return;
      }

      // Refresh orders list
      const ordersResponse = await fetch(`${API_BASE_URL}/api/orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (ordersResponse.ok) {
        const data = await ordersResponse.json();
        setOrders(data);
      }

      setShowCancelModal(false);
      setOrderToCancel(null);
    } catch (error) {
      // Silently handle error
      setShowCancelModal(false);
      setOrderToCancel(null);
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if order can be cancelled (within 5 minutes)
  const canCancelOrder = (order: Order) => {
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return false;
    }
    
    const orderTime = new Date(order.created_at).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - orderTime) / 1000 / 60; // in minutes
    
    return timeDiff <= 5;
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
            Loading your orders...
          </h2>
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
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              fontSize: '3rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              ⚠️
            </div>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              textAlign: 'center',
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '1rem'
            }}>
              Cancel Order?
            </h2>
            
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '1rem',
              lineHeight: '1.6',
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '2rem'
            }}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setOrderToCancel(null);
                }}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isCancelling ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isCancelling) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCancelling) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                No, Keep Order
              </button>
              
              <button
                onClick={confirmCancelOrder}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isCancelling ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!isCancelling) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCancelling) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isCancelling ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  'Yes, Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
          onClick={() => router.push('/home')}
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
          My Orders
        </h1>
        
        <div style={{ width: '120px' }}></div> {/* Spacer for centering */}
      </div>

      {/* Status Filter */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#333',
          marginBottom: '1rem',
          margin: 0
        }}>
          Filter by Status
        </h3>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {[
            { value: 'all', label: 'All Orders', icon: '/icons/navigation/orders.svg' },
            { value: 'delivered', label: 'Delivered', icon: '/icons/status/success.svg' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: `2px solid ${selectedStatus === filter.value ? '#ff6b6b' : '#e5e7eb'}`,
                borderRadius: '12px',
                background: selectedStatus === filter.value ? '#fff5f5' : '#ffffff',
                color: selectedStatus === filter.value ? '#ff6b6b' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: selectedStatus === filter.value ? '600' : '500'
              }}
              onMouseEnter={(e) => {
                if (selectedStatus !== filter.value) {
                  e.currentTarget.style.borderColor = '#ff6b6b';
                  e.currentTarget.style.background = '#fef2f2';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStatus !== filter.value) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
            >
              <Image src={filter.icon} alt={filter.label} width={20} height={20} />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            <Image 
              src={selectedStatus === 'all' ? '/icons/navigation/orders.svg' : getStatusInfo(selectedStatus).icon} 
              alt="Status" 
              width={64} 
              height={64} 
            />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '1rem', margin: 0 }}>
            {selectedStatus === 'all' ? 'No orders yet' : `No ${selectedStatus} orders`}
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem', margin: 0 }}>
            {selectedStatus === 'all' 
              ? "You haven't placed any orders yet. Start exploring restaurants!"
              : `You don't have any ${selectedStatus} orders at the moment.`
            }
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
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const restaurantGroups = groupItemsByRestaurant(order);
            
            return (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '2rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: '#333',
                        margin: 0
                      }}>
                        {order.order_number}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        <Image src={statusInfo.icon} alt={statusInfo.text} width={18} height={18} />
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>
                    <p style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>
                      Ordered on {formatDate(order.created_at)}
                    </p>
                    {order.delivered_at && (
                      <p style={{
                        color: '#10b981',
                        fontSize: '0.9rem',
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        Delivered on {formatDate(order.delivered_at)}
                      </p>
                    )}
                  </div>
                  
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: '#ff6b6b',
                      marginBottom: '0.5rem'
                    }}>
                      ₹{order.total_amount.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#666'
                    }}>
                      {order.items.reduce((total, item) => total + item.quantity, 0)} items
                    </div>
                  </div>
                </div>

                {/* Restaurant Groups */}
                {Object.entries(restaurantGroups).map(([restaurantId, group]) => (
                  <div key={restaurantId} style={{
                    marginBottom: '1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    {/* Restaurant Header */}
                    <div style={{
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: 'white',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>{group.restaurant?.image}</span>
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          margin: 0,
                          marginBottom: '0.25rem'
                        }}>
                          {group.restaurant?.name}
                        </h4>
                        <p style={{
                          fontSize: '0.8rem',
                          opacity: 0.9,
                          margin: 0
                        }}>
                          {group.restaurant?.cuisine}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ padding: '1rem' }}>
                      {group.items.map((item, index) => (
                        <div key={`${item.id}-${index}`} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 0',
                          borderBottom: index < group.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#333',
                              marginBottom: '0.25rem'
                            }}>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: item.isVeg ? '#10b981' : '#ef4444'
                            }}>
                              {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <span style={{
                              fontSize: '0.85rem',
                              color: '#666'
                            }}>
                              × {item.quantity}
                            </span>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#ff6b6b'
                            }}>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Order Actions */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  {canCancelOrder(order) && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>❌</span>
                      <span>Cancel Order</span>
                    </button>
                  )}

                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => handleTrackOrder(order.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #1e40af)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>📍</span>
                      <span>Track Order</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleReorder(order)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>🔄</span>
                    <span>Reorder</span>
                  </button>

                  {order.status === 'delivered' && (
                    <button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>⭐</span>
                      <span>Review</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}