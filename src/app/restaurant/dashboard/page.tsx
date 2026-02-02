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

  useEffect(() => {
    checkAuthAndLoadData();
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
        
        // Update localStorage with fresh data
        localStorage.setItem('restaurantInfo', JSON.stringify(profileData));
      } else {
        // If profile fetch fails, redirect to login
        console.error('Failed to fetch restaurant profile');
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantInfo');
        router.push('/restaurant/login');
        return;
      }
      
      // Load dashboard stats (mock data for now)
      loadDashboardStats();
      
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('restaurantInfo');
      router.push('/restaurant/login');
    } finally {
      setIsLoading(false);
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

  const handleLogout = () => {
    localStorage.removeItem('restaurantToken');
    localStorage.removeItem('restaurantInfo');
    router.push('/restaurant/login');
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    // TODO: API call to update restaurant online status
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}