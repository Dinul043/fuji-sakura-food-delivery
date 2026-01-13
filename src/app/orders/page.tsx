'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { restaurants } from '../../data/restaurants';

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
  status: 'confirmed' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
  estimatedDelivery: string;
  orderTime: string;
  deliveredTime?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    // Load orders from localStorage
    const loadOrders = () => {
      try {
        const orderHistory = localStorage.getItem('orderHistory');
        if (orderHistory) {
          const parsedOrders = JSON.parse(orderHistory);
          setOrders(parsedOrders.reverse()); // Show newest first
        }
      } catch (error) {
        console.error('Error loading order history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders by status
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Get restaurant info for an order
  const getRestaurantInfo = (restaurantId: number) => {
    return restaurants.find(r => r.id === restaurantId);
  };

  // Group items by restaurant
  const groupItemsByRestaurant = (items: OrderItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = {
          restaurant: getRestaurantInfo(item.restaurantId),
          items: []
        };
      }
      acc[item.restaurantId].items.push(item);
      return acc;
    }, {} as Record<number, { restaurant: any; items: OrderItem[] }>);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color and emoji
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: '#3b82f6', bg: '#dbeafe', emoji: '✅', text: 'Order Confirmed' };
      case 'preparing':
        return { color: '#f59e0b', bg: '#fef3c7', emoji: '👨‍🍳', text: 'Preparing' };
      case 'on-the-way':
        return { color: '#8b5cf6', bg: '#ede9fe', emoji: '🚗', text: 'On the Way' };
      case 'delivered':
        return { color: '#10b981', bg: '#d1fae5', emoji: '🎉', text: 'Delivered' };
      case 'cancelled':
        return { color: '#ef4444', bg: '#fee2e2', emoji: '❌', text: 'Cancelled' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', emoji: '📦', text: 'Unknown' };
    }
  };

  // Reorder functionality
  const handleReorder = (order: Order) => {
    // Add all items from the order back to cart
    const cartItems = order.items.map(item => ({
      ...item,
      id: item.id,
      restaurantId: item.restaurantId
    }));

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Add reordered items to cart
    const updatedCart = [...existingCart, ...cartItems];
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Navigate to cart
    router.push('/cart');
  };

  // Track order (navigate to order detail)
  const handleTrackOrder = (orderId: number) => {
    router.push(`/orders/${orderId}`);
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
            { value: 'all', label: 'All Orders', emoji: '📦' },
            { value: 'confirmed', label: 'Confirmed', emoji: '✅' },
            { value: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
            { value: 'on-the-way', label: 'On the Way', emoji: '🚗' },
            { value: 'delivered', label: 'Delivered', emoji: '🎉' },
            { value: 'cancelled', label: 'Cancelled', emoji: '❌' }
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
              <span>{filter.emoji}</span>
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
            {selectedStatus === 'all' ? '📦' : getStatusInfo(selectedStatus).emoji}
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
            const restaurantGroups = groupItemsByRestaurant(order.items);
            
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
                        Order #{order.id}
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
                        <span>{statusInfo.emoji}</span>
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>
                    <p style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>
                      Ordered on {formatDate(order.orderTime)}
                    </p>
                    {order.deliveredTime && (
                      <p style={{
                        color: '#10b981',
                        fontSize: '0.9rem',
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        Delivered on {formatDate(order.deliveredTime)}
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
                      ${order.total.toFixed(2)}
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
                              ${(item.price * item.quantity).toFixed(2)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}