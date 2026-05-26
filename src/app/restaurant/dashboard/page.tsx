'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RestaurantData {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  cuisine_type: string;
  description: string;
  status: string;
  upi_id?: string;
  city?: string;
  area?: string;
}

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  menuItems: number;
  avgRating: number;
  reviewCount: number;
  pendingOrders?: number;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    menuItems: 0,
    avgRating: 0,
    reviewCount: 0,
    pendingOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [newOrderNotification, setNewOrderNotification] = useState<{show: boolean; orderNumber: string; amount: number} | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if restaurant is logged in (check both storages for remember me support)
      const token = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken');
      
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      // Fetch real restaurant profile data from backend
      const response = await fetch(`${API_BASE_URL}/api/restaurant/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        setRestaurantData(profileData);

        // Set initial online status from profile data
        if (profileData.is_online !== undefined) {
          setIsOnline(profileData.is_online);
        }
        
        // Update localStorage with fresh data
        sessionStorage.setItem('restaurantInfo', JSON.stringify(profileData));
      } else {
        // If profile fetch fails after interceptor tried refresh, session is truly invalid
        if (response.status === 401) {
          router.push('/restaurant/login');
          return;
        }
      }
      
      // Load dashboard stats (mock data for now)
      loadDashboardStats();
      
    } catch (error) {
      // Network error - don't clear tokens, might just be connectivity issue
      // Silent fallback
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/restaurant/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
        
        // Connect WebSocket after loading stats
        if (restaurantData?.id) {
          connectWebSocket(restaurantData.id);
        }
      } else if (response.status === 401) {
        // FetchInterceptor handles refresh — if still 401, session is truly gone
        router.push('/restaurant/login');
      }
      // On other errors, keep existing stats (don't zero out)
    } catch (error) {
      // Network error - keep existing stats, will retry on next interval
    }
  };

  const connectWebSocket = (restaurantId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/restaurant-dashboard/${restaurantId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected to dashboard');
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);
      ws.addEventListener('close', () => clearInterval(heartbeat));
    };
    
    ws.onmessage = (event) => {
      if (typeof event.data === 'string' && event.data === 'pong') {
        return;
      }
      
      try {
        const message = JSON.parse(event.data);
        
        // Check if it's a platform setting update (not a new order)
        if (message.event === 'new_order' && message.data?.type === 'platform_setting_updated') {
          setStatusNotification({
            show: true,
            message: `⚙️ ${message.data.message}`,
            type: 'success'
          });
          setTimeout(() => setStatusNotification({ show: false, message: '', type: 'success' }), 8000);
          return;
        }
        
        // Actual new order
        if (message.event === 'new_order') {
          handleNewOrder(message.data);
        }
        
        // Direct platform_setting_updated (in case format changes)
        if (message.type === 'platform_setting_updated') {
          setStatusNotification({
            show: true,
            message: `⚙️ ${message.message}`,
            type: 'success'
          });
          setTimeout(() => setStatusNotification({ show: false, message: '', type: 'success' }), 8000);
        }
      } catch (error) {
        if (event.data !== 'pong') {
          // Silent — don't log parse errors
        }
      }
    };
    
    ws.onerror = () => console.log('WebSocket error');
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => connectWebSocket(restaurantId), 3000);
    };
    
    wsRef.current = ws;
  };

  const handleNewOrder = (orderData: any) => {
    // Update stats
    setStats(prev => ({
      ...prev,
      todayOrders: prev.todayOrders + 1,
      todayRevenue: prev.todayRevenue + (orderData.total_amount || 0)
    }));
    
    // Show notification
    setNewOrderNotification({
      show: true,
      orderNumber: orderData.order_number,
      amount: orderData.total_amount
    });
    
    // Add to recent activity
    addRecentActivity({
      time: 'Just now',
      action: 'New order received',
      details: `${orderData.order_number} - ₹${orderData.total_amount}`,
      icon: '🆕',
      timestamp: new Date()
    });
    
    // Hide notification after 10 seconds
    setTimeout(() => {
      setNewOrderNotification(null);
    }, 10000);
  };

  const addRecentActivity = (activity: any) => {
    setRecentActivities(prev => [activity, ...prev].slice(0, 5)); // Keep only last 5
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  // Connect WebSocket when restaurant data is loaded
  useEffect(() => {
    if (restaurantData?.id) {
      connectWebSocket(restaurantData.id);
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [restaurantData?.id]);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      const token = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken');
      
      if (token) {
        // Call backend logout API to clear session
        await fetch(`${API_BASE_URL}/api/restaurant/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      // Silent fallback - no console errors
      // Continue with logout even if API call fails
    } finally {
      // Always clear both storages and redirect
      sessionStorage.removeItem('restaurantToken');
      sessionStorage.removeItem('restaurantInfo');
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('restaurantInfo');
      localStorage.removeItem('restaurantRefreshToken');
      sessionStorage.removeItem('restaurantRefreshToken');
      localStorage.removeItem('restaurantRememberMe');
      setShowLogoutConfirm(false);
      router.push('/restaurant/login');
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleOnlineStatus = async () => {
    try {
      const token = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken');
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/restaurant/toggle-online-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setIsOnline(result.is_online);
        
        // Show success notification
        setStatusNotification({
          show: true,
          message: `Restaurant is now ${result.is_online ? '🟢 ONLINE' : '🔴 OFFLINE'}`,
          type: 'success'
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setStatusNotification(prev => ({ ...prev, show: false }));
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        
        // Show error notification
        setStatusNotification({
          show: true,
          message: `Failed: ${errorData.detail}`,
          type: 'error'
        });
        
        setTimeout(() => {
          setStatusNotification(prev => ({ ...prev, show: false }));
        }, 4000);
      }
    } catch (error) {
      // Show error notification
      setStatusNotification({
        show: true,
        message: 'Network error. Please check your connection.',
        type: 'error'
      });
      
      setTimeout(() => {
        setStatusNotification(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #FF5722', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Status Change Notification */}
      {statusNotification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: statusNotification.type === 'success' 
            ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
            : 'linear-gradient(135deg, #f44336, #e53935)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '1rem',
          fontWeight: '600',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {statusNotification.type === 'success' ? '✅' : '❌'}
          </span>
          <span>{statusNotification.message}</span>
        </div>
      )}

      {/* UPI ID Warning — show if restaurant hasn't set UPI ID */}
      {restaurantData && !restaurantData.upi_id && (
        <div style={{
          background: '#fef3c7',
          borderBottom: '2px solid #f59e0b',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <span style={{ fontWeight: '700', color: '#92400e', fontSize: '0.9rem' }}>UPI ID not set — </span>
              <span style={{ color: '#b45309', fontSize: '0.875rem' }}>Admin cannot pay you until you add your UPI ID in your profile.</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/restaurant/profile')}
            style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Add UPI ID
          </button>
        </div>
      )}

      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/images/logo/Logo.png" alt="Fuji Sakura" width={120} height={36} />
          <div style={{ 
            width: '1px', 
            height: '30px', 
            background: '#e0e0e0' 
          }}></div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            color: '#333',
            fontWeight: '600'
          }}>
            Restaurant Dashboard
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Online Status Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Status:</span>
            <button
              onClick={toggleOnlineStatus}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: isOnline ? '#4CAF50' : '#f44336',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </button>
          </div>
          
          {/* Restaurant Info */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>
              {restaurantData?.business_name}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
              {restaurantData?.owner_name}
            </p>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              color: '#666',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {/* Welcome Section */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            margin: '0 0 0.5rem 0', 
            color: '#333',
            fontSize: '1.8rem',
            fontWeight: '600'
          }}>
            Welcome back, {restaurantData?.owner_name}! 👋
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '1rem'
          }}>
            Here's what's happening with {restaurantData?.business_name} today.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Today's Orders */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Today's Orders
              </p>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '700' }}>
                {stats.todayOrders}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                📈 Orders received today
              </p>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              fontSize: '4rem', 
              opacity: 0.1 
            }}>
              🍽️
            </div>
          </div>

          {/* Today's Revenue */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Today's Revenue
              </p>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '700' }}>
                ₹{stats.todayRevenue.toLocaleString()}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                💰 Revenue earned today
              </p>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              fontSize: '4rem', 
              opacity: 0.1 
            }}>
              💰
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Menu Items
              </p>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '700' }}>
                {stats.menuItems}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                🍜 Active items
              </p>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              fontSize: '4rem', 
              opacity: 0.1 
            }}>
              📋
            </div>
          </div>

          {/* Average Rating */}
          <div style={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Average Rating
              </p>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '700' }}>
                {stats.avgRating} ⭐
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                📊 {stats.reviewCount} review{stats.reviewCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              fontSize: '4rem', 
              opacity: 0.1 
            }}>
              ⭐
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#333',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            Quick Actions
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem'
          }}>
            <button
              onClick={() => router.push('/restaurant/menu')}
              style={{
                padding: '1.5rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#FF5722';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,87,34,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍜</div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#333', fontSize: '1.1rem' }}>
                Manage Menu
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                Add, edit, or remove menu items
              </p>
            </button>

            <button
              onClick={() => router.push('/restaurant/orders')}
              style={{
                padding: '1.5rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#FF5722';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,87,34,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#333', fontSize: '1.1rem' }}>
                View Orders
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                Manage incoming orders
              </p>
            </button>

            <button
              onClick={() => router.push('/restaurant/profile')}
              style={{
                padding: '1.5rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#FF5722';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,87,34,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏪</div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#333', fontSize: '1.1rem' }}>
                Restaurant Profile
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                Update restaurant details
              </p>
            </button>

            <button
              onClick={() => router.push('/restaurant/earnings')}
              style={{
                padding: '1.5rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#FF5722';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,87,34,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#333', fontSize: '1.1rem' }}>
                Earnings
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                View payouts and revenue
              </p>
            </button>

            <button
              onClick={() => router.push('/restaurant/reviews')}
              style={{
                padding: '1.5rem', borderRadius: '10px',
                border: '2px solid #e0e0e0', background: 'white',
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,158,11,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#333', fontSize: '1.1rem' }}>
                Reviews
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                {stats.reviewCount > 0 ? `${stats.reviewCount} customer review${stats.reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
              </p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#333',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            Recent Activity
          </h3>
          
          {recentActivities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#999'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p style={{ margin: 0, fontSize: '1rem' }}>
                No recent activity yet. New orders and updates will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentActivities.map((activity, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{activity.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500', color: '#333' }}>
                      {activity.action}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                      {activity.details}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Order Notification */}
      {newOrderNotification?.show && (
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
                Order: <span style={{ color: '#ff6b6b' }}>{newOrderNotification.orderNumber}</span>
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ff6b6b', marginTop: '0.75rem', marginBottom: 0 }}>
                ₹{newOrderNotification.amount}
              </p>
              <button
                onClick={() => router.push('/restaurant/orders')}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                View Order
              </button>
            </div>
            <button 
              onClick={() => setNewOrderNotification(null)}
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #FF5722, #FF7043)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '1.5rem'
            }}>
              🚪
            </div>
            
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#333'
            }}>
              Confirm Logout
            </h3>
            
            <p style={{
              margin: '0 0 2rem 0',
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to logout? This will end your current session and you'll need to login again.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={cancelLogout}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#ccc';
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmLogout}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF5722, #FF7043)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.3)';
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          0% { 
            transform: translateX(100%);
            opacity: 0;
          }
          100% { 
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}