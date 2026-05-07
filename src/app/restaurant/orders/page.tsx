'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  isVeg: boolean;
}

interface Order {
  id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  delivery_phone: string;
  delivery_address: string;
  total_amount: number;
  payment_method: string;
  items_count: number;
  items: OrderItem[];
  created_at: string;
  status: string;
  special_instructions?: string;
}

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
}

export default function RestaurantOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  // Confirm action modal for status updates
  const [confirmAction, setConfirmAction] = useState<{ orderId: number; status: string; label: string; message: string } | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get restaurant ID from sessionStorage (restaurantInfo set during login)
    const token = sessionStorage.getItem('restaurantToken');
    if (!token) { router.push('/restaurant/login'); return; }

    const info = sessionStorage.getItem('restaurantInfo');
    if (info) {
      try {
        const parsed = JSON.parse(info);
        const id = parsed.id;
        setRestaurantId(id);
        fetchOrders(id);
      } catch {
        router.push('/restaurant/login');
      }
    } else {
      router.push('/restaurant/login');
    }
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string, details?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, details }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchOrders = async (restId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/restaurant/${restId}`);
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our interface
        const transformedOrders = data.map((order: any) => ({
          ...order,
          order_id: order.id,  // Keep both id and order_id
          items_count: order.items?.length || 0,
          created_at: order.created_at
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws/restaurant-dashboard/${restaurantId}`);
      
      ws.onopen = () => {
        setIsConnected(true);
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        ws.addEventListener('close', () => clearInterval(heartbeat));
      };
      
      ws.onmessage = (event) => {
        // Ignore heartbeat pong responses
        if (typeof event.data === 'string' && event.data === 'pong') {
          return;
        }
        
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'new_order') {
            handleNewOrder(message.data);
          }
          // Update order status in real-time when delivery partner accepts/delivers
          // These come as direct messages (not wrapped in event/data)
          if (message.type === 'order_status_update' && message.order) {
            setOrders(prev => prev.map(o => {
              if (o.id === message.order_id || o.order_id === message.order_id) {
                const updatedOrder = message.order;
                return {
                  ...o,
                  status: updatedOrder.status,
                  delivery_partner_name: updatedOrder.delivery_partner_name || (o as any).delivery_partner_name,
                  delivery_partner_phone: updatedOrder.delivery_partner_phone || (o as any).delivery_partner_phone,
                };
              }
              return o;
            }));
          }
        } catch (error) {
          // Silently ignore non-JSON messages (like pong)
          if (event.data !== 'pong') {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      };
      
      ws.onerror = () => setIsConnected(false);
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(() => connectWebSocket(), 3000);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();
    return () => wsRef.current?.close();
  }, [restaurantId]);

  const handleNewOrder = (orderData: any) => {
    const transformedOrder = {
      ...orderData,
      order_id: orderData.id || orderData.order_id,
      items_count: orderData.items?.length || 0,
      created_at: orderData.created_at || orderData.timestamp
    };
    
    // Deduplicate — don't add if order already exists in list
    setOrders(prev => {
      const exists = prev.some(o => o.id === transformedOrder.id || o.order_id === transformedOrder.order_id);
      if (exists) return prev;
      return [transformedOrder, ...prev];
    });
    setLatestOrder(transformedOrder);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 10000);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // Find the order to get the actual database ID
      const order = orders.find(o => o.order_id === orderId);
      const actualId = order?.id || orderId;
      
      console.log(`Updating order ${actualId} (order_id: ${orderId}) to status: ${newStatus}`);
      
      const response = await fetch(`${API_BASE_URL}/api/orders/${actualId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        // Update the order status in the UI
        setOrders(prev => prev.map(order => 
          order.order_id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Show success toast for cancellation with refund
        if (newStatus === 'cancelled') {
          if (data.refund_initiated) {
            showToast(
              'success',
              'Order Cancelled Successfully!',
              'Refund has been initiated and will be processed in 5-7 business days. Customer will receive money back to their original payment method.'
            );
          } else {
            showToast('success', 'Order Cancelled Successfully!');
          }
        }
        
        return true; // Success
      } else {
        console.error('Failed to update status:', data);
        showToast('error', 'Failed to Update Order', data.detail || 'Unknown error occurred');
        return false; // Failure
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      showToast('error', 'Network Error', 'Please check your connection and try again');
      return false; // Failure
    }
  };

  const handleCancelOrder = (orderId: number) => {
    setOrderToCancel(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const token = sessionStorage.getItem('restaurantToken');
      const res = await fetch(`${API_BASE_URL}/api/restaurant/orders/${orderToCancel}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderToCancel, cancel_reason: cancelReason.trim() })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === orderToCancel ? { ...o, status: 'cancelled' } : o
        ));
        setShowCancelModal(false);
        setOrderToCancel(null);
        setCancelReason('');
        const data = await res.json();
        if (data.refund_initiated) {
          showToast('success', 'Order Cancelled', 'Refund has been initiated for the customer.');
        } else {
          showToast('success', 'Order Cancelled', 'Order has been cancelled successfully.');
        }
      } else {
        const d = await res.json();
        showToast('error', 'Failed to Cancel', d.detail || 'Could not cancel order');
      }
    } catch {
      showToast('error', 'Network Error', 'Please check your connection and try again');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: '#3b82f6', bg: '#dbeafe', text: 'Order Confirmed', icon: '✅' };
      case 'preparing':
        return { color: '#f59e0b', bg: '#fef3c7', text: 'Preparing', icon: '🍳' };
      case 'ready':
        return { color: '#f59e0b', bg: '#fef3c7', text: 'Ready for Pickup', icon: '📦' };
      case 'out_for_delivery':
        return { color: '#8b5cf6', bg: '#ede9fe', text: 'Out for Delivery', icon: '🛵' };
      case 'delivered':
        return { color: '#10b981', bg: '#d1fae5', text: 'Delivered', icon: '✓' };
      case 'cancelled':
        return { color: '#ef4444', bg: '#fee2e2', text: 'Cancelled', icon: '✕' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: 'Pending', icon: '⏳' };
    }
  };

  const formatDate = (dateString: string) => {
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

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

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
            Loading orders...
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
      {/* New Order Notification */}
      {showNotification && latestOrder && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '400px',
          border: '2px solid #10b981',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🎉</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#10b981', margin: 0 }}>
                  New Order Received!
                </h3>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#333', margin: '0.5rem 0' }}>
                Order: <span style={{ color: '#ff6b6b' }}>{latestOrder.order_number}</span>
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0' }}>
                Customer: {latestOrder.customer_name}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ff6b6b', marginTop: '0.75rem', marginBottom: 0 }}>
                ₹{latestOrder.total_amount}
              </p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                color: '#999',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1
              }}
            >
              ✕
            </button>
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
          onClick={() => router.push('/restaurant/dashboard')}
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
            transition: 'all 0.2s ease',
            fontSize: '1rem',
            fontWeight: '500'
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
          <span>Back to Dashboard</span>
        </button>
        
        <h1 style={{
          color: 'white',
          fontSize: '1.8rem',
          fontWeight: '600',
          margin: 0,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Orders Management
        </h1>
        
        <div style={{ width: '150px' }}></div> {/* Spacer for centering */}
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
          flexWrap: 'wrap',
          marginTop: '1rem'
        }}>
          {[
            { value: 'all', label: 'All Orders', icon: '📋' },
            { value: 'confirmed', label: 'Confirmed', icon: '✅' },
            { value: 'preparing', label: 'Preparing', icon: '🍳' },
            { value: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
            { value: 'delivered', label: 'Delivered', icon: '✓' }
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
                fontWeight: selectedStatus === filter.value ? '600' : '500',
                fontSize: '0.9rem'
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
              <span>{filter.icon}</span>
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍱</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '1rem', margin: 0 }}>
            {selectedStatus === 'all' ? 'No orders yet' : `No ${selectedStatus} orders`}
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            {selectedStatus === 'all' 
              ? 'New orders will appear here in real-time'
              : `You don't have any ${selectedStatus} orders at the moment.`
            }
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {filteredOrders.map((order, orderIndex) => {
            const statusInfo = getStatusInfo(order.status);
            
            return (
              <div
                key={`order-${order.order_id || orderIndex}`}
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
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>
                    <p style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      margin: '0.25rem 0'
                    }}>
                      Customer: <span style={{ fontWeight: '600', color: '#333' }}>{order.customer_name}</span>
                    </p>
                    <p style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      margin: '0.25rem 0'
                    }}>
                      Phone: {order.delivery_phone}
                    </p>
                    <p style={{
                      color: '#999',
                      fontSize: '0.85rem',
                      margin: '0.5rem 0 0 0'
                    }}>
                      {formatDate(order.created_at)}
                    </p>
                    {order.special_instructions && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.6rem 0.875rem',
                        background: '#fffbeb',
                        borderRadius: '10px',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.4rem'
                      }}>
                        <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>📝</span>
                        <span style={{ fontSize: '0.82rem', color: '#92400e', fontStyle: 'italic', lineHeight: '1.4' }}>
                          {order.special_instructions}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#ff6b6b',
                      marginBottom: '0.5rem'
                    }}>
                      ₹{order.total_amount}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      background: order.payment_method === 'online' 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {order.payment_method === 'online' ? '✓ Paid Online' : '💵 Cash on Delivery'}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🍽️</span>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      Order Items ({order.items_count})
                    </h4>
                  </div>

                  <div style={{ padding: '1rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={`order-${order.order_id}-item-${idx}-${item.name}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '0.25rem'
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: item.isVeg ? '#10b981' : '#ef4444',
                            fontWeight: '500'
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
                            fontSize: '0.9rem',
                            color: '#666',
                            fontWeight: '500'
                          }}>
                            × {item.quantity}
                          </span>
                          <span style={{
                            fontSize: '1rem',
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

                {/* Delivery Address */}
                <div style={{
                  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  border: '1px solid #93c5fd',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                    <h4 style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#1e40af',
                      margin: 0
                    }}>
                      Delivery Address
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#1e3a8a',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {order.delivery_address}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0',
                  flexWrap: 'wrap'
                }}>
                  {order.status === 'confirmed' && (
                    <>
                      <button 
                        onClick={() => setConfirmAction({ orderId: order.order_id, status: 'preparing', label: 'Start Preparing', message: 'Are you sure you want to start preparing this order?' })}
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
                        <span>🍳</span>
                        <span>Start Preparing</span>
                      </button>
                      <button 
                        onClick={() => handleCancelOrder(order.order_id)}
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
                        <span>✕</span>
                        <span>Cancel Order</span>
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <>
                      <button 
                        onClick={() => setConfirmAction({ orderId: order.order_id, status: 'ready', label: 'Ready for Pickup', message: 'Mark this order as ready for pickup?' })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white', border: 'none', borderRadius: '12px',
                          padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '600',
                          cursor: 'pointer', transition: 'all 0.2s ease'
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
                        <span>📦</span>
                        <span>Ready for Pickup</span>
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.order_id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white', border: 'none', borderRadius: '12px',
                          padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '600',
                          cursor: 'pointer', transition: 'all 0.2s ease'
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
                        <span>✕</span>
                        <span>Cancel Order</span>
                      </button>
                    </>
                  )}
                  {order.status === 'ready' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: (order as any).delivery_partner_name ? '#fef9c3' : '#fef3c7',
                      color: (order as any).delivery_partner_name ? '#854d0e' : '#92400e',
                      padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600',
                      border: `2px solid ${(order as any).delivery_partner_name ? '#fde047' : '#f59e0b'}` }}>
                      <span>{(order as any).delivery_partner_name ? '🏍️' : '📦'}</span>
                      <div>
                        <div>{(order as any).delivery_partner_name ? 'Partner On The Way' : 'Waiting for Pickup'}</div>
                        {(order as any).delivery_partner_name && (
                          <div style={{ fontSize: '0.78rem', fontWeight: '500', marginTop: '0.1rem' }}>
                            {(order as any).delivery_partner_name} · {(order as any).delivery_partner_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#ede9fe', color: '#7c3aed', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', border: '2px solid #8b5cf6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🛵</span>
                        <span>Picked up — Out for Delivery</span>
                      </div>
                      {(order as any).delivery_partner_name && (
                        <div style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: '500' }}>
                          Partner: {(order as any).delivery_partner_name} · {(order as any).delivery_partner_phone}
                        </div>
                      )}
                    </div>
                  )}
                  {order.status === 'delivered' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#d1fae5',
                      color: '#10b981',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: '2px solid #10b981'
                    }}>
                      <span>✓</span>
                      <span>Delivered</span>
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#fee2e2',
                      color: '#ef4444',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: '2px solid #ef4444'
                    }}>
                      <span>✕</span>
                      <span>Cancelled</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Action Modal (Start Preparing / Ready for Pickup) */}
      {confirmAction && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '2rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2.5rem',
            maxWidth: '420px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>
              {confirmAction.status === 'preparing' ? '🍳' : '📦'}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', textAlign: 'center', margin: '0 0 0.75rem 0' }}>
              {confirmAction.label}
            </h2>
            <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
              {confirmAction.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '12px',
                  border: '2px solid #e5e7eb', background: 'white', color: '#374151',
                  fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  await updateOrderStatus(action.orderId, action.status);
                }}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none',
                  background: confirmAction.status === 'preparing'
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
                }}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '2rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2.5rem',
            maxWidth: '450px', width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>⚠️</div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', textAlign: 'center', margin: '0 0 0.5rem 0' }}>
              Cancel This Order?
            </h2>
            <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
              If the customer paid online, a refund will be automatically initiated.
            </p>

            {/* Cancel reason */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Reason (optional)
              </label>
              <select
                value={cancelReason.startsWith('Other:') ? 'Other' : cancelReason}
                onChange={(e) => setCancelReason(e.target.value === 'Other' ? 'Other: ' : e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '0.95rem', outline: 'none', background: 'white', color: '#374151', marginBottom: '0.5rem' }}
              >
                <option value="">Select a reason...</option>
                <option value="Item unavailable">Item unavailable</option>
                <option value="Restaurant too busy">Restaurant too busy</option>
                <option value="Closing soon">Closing soon</option>
                <option value="Customer request">Customer request</option>
                <option value="Other">Other (type below)</option>
              </select>
              {cancelReason.startsWith('Other:') && (
                <input
                  type="text"
                  placeholder="Describe the reason..."
                  value={cancelReason.replace('Other: ', '')}
                  onChange={(e) => setCancelReason(`Other: ${e.target.value}`)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => { setShowCancelModal(false); setOrderToCancel(null); setCancelReason(''); }}
                disabled={isCancelling}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '1rem', fontWeight: '600', cursor: isCancelling ? 'not-allowed' : 'pointer', opacity: isCancelling ? 0.5 : 1 }}
              >
                No, Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={isCancelling}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: isCancelling ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: isCancelling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '450px'
      }}>
        {toasts.map((toast) => {
          const colors = {
            success: { bg: '#10b981', icon: '✓' },
            error: { bg: '#ef4444', icon: '✕' },
            info: { bg: '#3b82f6', icon: 'ℹ' }
          };
          const config = colors[toast.type];
          
          return (
            <div
              key={toast.id}
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${config.bg}`,
                animation: 'slideInRight 0.3s ease-out',
                position: 'relative'
              }}
            >
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
              
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', paddingRight: '1.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: config.bg,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {config.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {toast.message}
                  </h4>
                  
                  {toast.details && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {toast.details}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: '#f3f4f6',
                borderRadius: '0 0 14px 14px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: config.bg,
                  animation: 'shrink 5s linear forwards'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
