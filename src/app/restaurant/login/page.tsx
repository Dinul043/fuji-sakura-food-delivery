'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RestaurantLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Clear any stale restaurant tokens when landing on login page
    // This prevents session conflicts when users navigate away without proper logout
    const existingToken = sessionStorage.getItem('restaurantToken');
    if (existingToken) {
      // Try to logout from backend (best effort)
      fetch(`${API_BASE_URL}/api/restaurant/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${existingToken}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {
        // Silently ignore errors - we're cleaning up anyway
      });
      
      // Clear local storage
      sessionStorage.removeItem('restaurantToken');
      sessionStorage.removeItem('restaurantInfo');
      localStorage.removeItem('restaurantName');
      localStorage.removeItem('restaurantEmail');
      localStorage.removeItem('restaurantOwner');
      localStorage.removeItem('isRestaurant');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: {[key: string]: string} = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      
      // Call restaurant login API (we'll create this)
      const response = await fetch(`${API_BASE_URL}/api/restaurant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store restaurant info
        sessionStorage.setItem('restaurantInfo', JSON.stringify(data.restaurant));
        sessionStorage.setItem('restaurantToken', data.access_token);
        localStorage.setItem('restaurantName', data.restaurant.business_name);
        localStorage.setItem('restaurantEmail', data.restaurant.email);
        localStorage.setItem('restaurantOwner', data.restaurant.owner_name);
        localStorage.setItem('isRestaurant', 'true');
        
        // Redirect to restaurant dashboard - don't set loading to false here
        router.push('/restaurant/dashboard');
        return; // Exit early to prevent setIsLoading(false)
      } else {
        const error = await response.json();
        let errorMessage = 'Login failed. Please try again.';
        
        if (response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (response.status === 403) {
          if (error.detail?.includes('pending')) {
            errorMessage = 'Your application is under review. You\'ll be notified once approved.';
          } else if (error.detail?.includes('rejected')) {
            errorMessage = 'Your application was not approved. You can submit a new application.';
          } else {
            errorMessage = 'Account access denied. Please contact support.';
          }
        } else if (error.detail) {
          errorMessage = error.detail;
        }
        
        setErrors(prev => ({ ...prev, password: errorMessage }));
      }
    } catch (error) {
      // Network or connection error - handle silently without console errors
      let errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        }
      }
      
      setErrors({ password: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100%', 
      margin: 0, 
      padding: 0, 
      fontFamily: 'Anuphan, system-ui, sans-serif', 
      overflow: 'hidden' 
    }}>
      {/* Left Column - 60% width - Orange Theme */}
      <div style={{ 
        width: '60%', 
        background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2px, transparent 0)',
          backgroundSize: '50px 50px',
          zIndex: 0
        }}></div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Logo Section */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem auto',
              fontSize: '4rem',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              🏪
            </div>
            
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '800', 
              color: 'white', 
              margin: '0 0 1rem 0',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              letterSpacing: '-0.02em'
            }}>
              Partner Login
            </h1>
            
            <p style={{ 
              fontSize: '1.4rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0,
              fontWeight: '500',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              Access Your Restaurant Dashboard
            </p>
          </div>

          {/* Info Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1.5rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            {[
              { icon: '/icons/dashboard/dashboard.svg', title: 'Dashboard', desc: 'View your analytics' },
              { icon: '/icons/food/food.svg', title: 'Menu', desc: 'Manage your dishes' },
              { icon: '/icons/navigation/orders.svg', title: 'Orders', desc: 'Handle customer orders' },
              { icon: '/icons/navigation/settings.svg', title: 'Settings', desc: 'Update your profile' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '1.5rem',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <Image src={feature.icon} alt={feature.title} width={32} height={32} />
                </div>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.85rem', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - 40% width - Login Form */}
      <div style={{ 
        width: '40%', 
        background: '#FFF7EE',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Subtle Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 87, 34, 0.05) 2px, transparent 0)',
          backgroundSize: '50px 50px',
          zIndex: 0
        }}></div>
        
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Login Form Card */}
          <div style={{ 
            width: '100%', 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            padding: '2.5rem 2rem', 
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 87, 34, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FF5722, #FF7043, #FF8A65)',
            }}></div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #FF5722, #FF7043)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                boxShadow: '0 8px 25px rgba(255, 87, 34, 0.3)'
              }}>
                <span style={{ fontSize: '1.5rem', color: 'white' }}>
                  <Image src="/icons/navigation/restaurant.svg" alt="Restaurant" width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
                </span>
              </div>
              
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: '800', 
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em'
              }}>
                Welcome Back
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                margin: 0,
                fontWeight: '500'
              }}>
                Sign in to your restaurant dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              {/* Email Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.95rem', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Restaurant Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your restaurant email"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#fafafa'
                  }}
                  onFocus={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#FF5722';
                      e.target.style.backgroundColor = '#ffffff';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafafa';
                    }
                  }}
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.95rem', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#fafafa'
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = '#FF5722';
                      e.target.style.backgroundColor = '#ffffff';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafafa';
                    }
                  }}
                />
                {errors.password && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.password}</p>}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isLoading ? 'none' : '0 4px 15px rgba(255, 87, 34, 0.4)',
                  marginBottom: '1.5rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.4)';
                  }
                }}
              >
                {isLoading ? 'Signing In...' : (
                  <>
                    <Image src="/icons/navigation/restaurant.svg" alt="Restaurant" width={20} height={20} style={{ display: 'inline-block', marginRight: '8px', filter: 'brightness(0) invert(1)' }} />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Links */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {/* Forgot password removed for now - will be added later */}
            </div>

            {/* New Partner Link */}
            <div style={{
              background: 'rgba(255, 87, 34, 0.05)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              border: '2px solid rgba(255, 87, 34, 0.1)',
              marginBottom: '2rem'
            }}>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                margin: '0 0 1rem 0',
                fontWeight: '500'
              }}>
                New to Fuji Sakura?
              </p>
              <button
                onClick={() => router.push('/restaurant/apply')}
                style={{
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.75rem 1.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                🚀 Apply for Partnership
              </button>
            </div>

            {/* Back to Portal */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => router.push('/restaurant')}
                style={{
                  background: 'none',
                  border: '2px solid rgba(255, 87, 34, 0.3)',
                  color: '#FF5722',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                ← Back to Restaurant Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}