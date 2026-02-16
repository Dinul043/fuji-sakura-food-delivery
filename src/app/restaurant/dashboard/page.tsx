'use client';

import { useState, useEffect } from 'react';
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
}

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  menuItems: number;
  avgRating: number;
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
    avgRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [statusNotification, setStatusNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    checkAuthAndLoadData();
    
    // Set up session validation heartbeat every 30 seconds
    const heartbeatInterval = setInterval(validateSession, 30000);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Handle browser close/navigation away - ask user if they want to logout
  useEffect(() => {
    let isNavigatingAway = false;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show browser's default confirmation dialog
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? You will remain logged in unless you logout properly.';
      isNavigatingAway = true;
      return e.returnValue;
    };

    const handleUnload = async () => {
      // Try to logout when user actually leaves (best effort)
      if (isNavigatingAway) {
        const token = localStorage.getItem('restaurantToken');
        if (token) {
          // Use sendBeacon for reliable logout on page unload
          try {
            const logoutData = JSON.stringify({});
            const blob = new Blob([logoutData], { type: 'application/json' });
            
            // Try sendBeacon first
            if (navigator.sendBeacon) {
              navigator.sendBeacon(`${API_BASE_URL}/api/restaurant/logout`, blob);
            } else {
              // Fallback for browsers that don't support sendBeacon
              fetch(`${API_BASE_URL}/api/restaurant/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: logoutData,
                keepalive: true
              }).catch(() => {
                // Ignore errors during unload
              });
            }
          } catch (error) {
            // Silently ignore errors during unload
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      // When page becomes hidden (user switches tabs, minimizes, etc.)
      if (document.hidden) {
        // Page is now hidden - user might be leaving
      } else {
        // Page is now visible - validate session
        validateSession();
      }
    };

    // Custom navigation handler for internal links
    const handleNavigation = (e: PopStateEvent) => {
      // This handles browser back/forward buttons
      const currentPath = window.location.pathname;
      if (currentPath !== '/restaurant/dashboard') {
        // User is navigating away from dashboard
        setShowExitConfirm(true);
        setPendingNavigation(currentPath);
        // Prevent navigation temporarily
        window.history.pushState(null, '', '/restaurant/dashboard');
      }
    };

    // Override link clicks to show confirmation
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.includes('/restaurant/dashboard')) {
        // User clicked a link that goes away from dashboard
        e.preventDefault();
        setShowExitConfirm(true);
        setPendingNavigation(link.href);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleLinkClick);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if restaurant is logged in
      const token = localStorage.getItem('restaurantToken');
      
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
        setSessionValid(true);
        
        // Set initial online status from profile data
        if (profileData.is_online !== undefined) {
          setIsOnline(profileData.is_online);
        }
        
        // Update localStorage with fresh data
        localStorage.setItem('restaurantInfo', JSON.stringify(profileData));
      } else {
        // If profile fetch fails, redirect to login
        // Silent fallback - no console errors
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantInfo');
        router.push('/restaurant/login');
        return;
      }
      
      // Load dashboard stats (mock data for now)
      loadDashboardStats();
      
    } catch (error) {
      // Silent fallback - no console errors
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('restaurantInfo');
      router.push('/restaurant/login');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSession = async () => {
    try {
      const token = localStorage.getItem('restaurantToken');
      
      if (!token) {
        setSessionValid(false);
        router.push('/restaurant/login');
        return;
      }

      // Call a lightweight endpoint to validate session
      const response = await fetch(`${API_BASE_URL}/api/restaurant/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setSessionValid(false);
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantInfo');
        router.push('/restaurant/login');
      } else {
        setSessionValid(true);
      }
    } catch (error) {
      // Silent fallback - no console errors
      // Don't redirect on network errors, just log
    }
  };

  const loadDashboardStats = () => {
    // Mock data - will be replaced with real API calls
    setStats({
      totalOrders: 247,
      todayOrders: 12,
      totalRevenue: 45680,
      todayRevenue: 1250,
      menuItems: 28,
      avgRating: 4.3
    });
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      const token = localStorage.getItem('restaurantToken');
      
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
      // Always clear local storage and redirect
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('restaurantInfo');
      setShowLogoutConfirm(false);
      router.push('/restaurant/login');
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleExitConfirm = (shouldLogout: boolean) => {
    if (shouldLogout) {
      // Logout and then navigate
      confirmLogout();
    } else {
      // Just navigate without logout
      if (pendingNavigation) {
        window.location.href = pendingNavigation;
      }
    }
    setShowExitConfirm(false);
    setPendingNavigation(null);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    setPendingNavigation(null);
  };

  const toggleOnlineStatus = async () => {
    try {
      const token = localStorage.getItem('restaurantToken');
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
                📈 +15% from yesterday
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
                💰 +8% from yesterday
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
                📊 From 89 reviews
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
              onClick={() => router.push('/restaurant/analytics')}
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#333', fontSize: '1.1rem' }}>
                Analytics
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                View sales and performance
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { time: '2 min ago', action: 'New order received', details: 'Order #1247 - ₹450', icon: '🆕' },
              { time: '15 min ago', action: 'Order completed', details: 'Order #1246 - ₹320', icon: '✅' },
              { time: '1 hour ago', action: 'Menu item updated', details: 'Chicken Biryani price changed', icon: '📝' },
              { time: '2 hours ago', action: 'Customer review', details: '5 stars - "Excellent food!"', icon: '⭐' }
            ].map((activity, index) => (
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
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

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

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
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
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '1.5rem'
            }}>
              ⚠️
            </div>
            
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#333'
            }}>
              You're Leaving the Dashboard
            </h3>
            
            <p style={{
              margin: '0 0 2rem 0',
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              You're about to leave the restaurant dashboard. Would you like to logout to secure your account, or stay logged in?
            </p>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <button
                onClick={() => handleExitConfirm(true)}
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
                🔒 Logout & Leave (Recommended)
              </button>
              
              <button
                onClick={() => handleExitConfirm(false)}
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
                Stay Logged In & Leave
              </button>
              
              <button
                onClick={cancelExit}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#999',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#666';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
              >
                Cancel
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