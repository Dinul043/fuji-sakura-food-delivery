'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminLoginPage() {
  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleanEmail) && cleanEmail.includes('@') && cleanEmail.split('@').length === 2;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const cleanValue = name === 'email' ? value.trim() : value;
    setFormData(prev => ({ ...prev, [name]: cleanValue }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    const cleanEmail = formData.email.trim();
    
    if (!cleanEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.email && !newErrors.password) {
      try {
        setIsLoading(true);
        
        // Call admin login API (new endpoint) with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail.toLowerCase(),
            password: formData.password
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          // Store admin info (from new admin table)
          localStorage.setItem('adminName', data.admin.name);
          localStorage.setItem('adminEmail', data.admin.email);
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('adminToken', data.access_token);
          localStorage.setItem('userRole', 'admin');
          
          // Redirect to admin dashboard
          router.push('/admin/dashboard');
        } else {
          let errorMessage = 'Login failed. Please check your credentials.';
          
          try {
            const error = await response.json();
            
            if (response.status === 401) {
              errorMessage = 'Invalid email or password. Please try again.';
            } else if (response.status === 403) {
              errorMessage = 'Account access denied. Please contact system administrator.';
            } else if (response.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (error.detail) {
              if (typeof error.detail === 'string') {
                errorMessage = error.detail;
              }
            }
          } catch (parseError) {
            // Silent fallback - no console errors
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
          
          setErrors(prev => ({ ...prev, password: errorMessage }));
        }
      } catch (error) {
        // Silent fallback - no console errors
        
        // Handle different types of network errors
        let errorMessage = 'Network error. Please try again.';
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (error.message === 'Failed to fetch') {
            errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
          } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network connection failed. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          }
        }
        
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      {/* Left Column - 60% width - Same Orange Theme as Customer Login */}
      <div style={{ 
        width: '60%', 
        background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        {/* Main Content */}
        <div style={{ textAlign: 'center', zIndex: 2, color: 'white' }}>
          <div style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #fff, #ffe0d6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            🛡️
          </div>
          
          <h1 style={{ 
            fontFamily: 'Anuphan, system-ui, sans-serif',
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Admin Portal
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            opacity: 0.9, 
            maxWidth: '400px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Secure access to system administration and restaurant management dashboard
          </p>
          
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem 2rem',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <p style={{ 
                fontSize: '1rem', 
                margin: 0, 
                fontWeight: '600',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>
                AUTHORIZED PERSONNEL ONLY
              </p>
              <p style={{ 
                fontSize: '0.85rem', 
                margin: '0.5rem 0 0 0', 
                opacity: 0.9,
                color: 'white',
                fontWeight: '400'
              }}>
                Secure Admin Access Portal
              </p>
            </div>
          </div>
        </div>

        {/* CSS Animation */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>

      {/* Right Column - 40% width - Login Form */}
      <div style={{ 
        width: '40%', 
        backgroundColor: '#FFF7EE', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
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
        
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          
          {/* White Card with Enhanced Design */}
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
            {/* Subtle top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FF5722, #FF7043, #FF8A65)',
            }}></div>

            {/* Logo and Title Section */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{
                width: '90px',
                height: '90px',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 12px 40px rgba(255, 87, 34, 0.4)',
                border: '3px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span style={{ fontSize: '2.2rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>⚡</span>
              </div>
              
              <h2 style={{
                fontFamily: 'Anuphan, system-ui, sans-serif',
                fontSize: '1.6rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 0.5rem 0',
                textAlign: 'center'
              }}>
                System Administration
              </h2>
              <div style={{
                width: '60px',
                height: '3px',
                background: 'linear-gradient(90deg, #FF5722, #FF7043)',
                borderRadius: '2px',
                margin: '0 auto 1rem auto'
              }}></div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#FF5722',
                borderRadius: '50%'
              }}></div>
              <h3 style={{ 
                fontFamily: 'Anuphan, system-ui, sans-serif', 
                fontWeight: 700, 
                fontSize: '1.6rem', 
                margin: 0, 
                color: '#1e293b',
                textAlign: 'center'
              }}>
                Admin Sign In
              </h3>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#FF5722',
                borderRadius: '50%'
              }}></div>
            </div>
            
            <p style={{ 
              fontFamily: 'Anuphan, system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '1rem',
              textAlign: 'center',
              color: '#64748b',
              marginBottom: '2.5rem',
              marginTop: '0.5rem',
              lineHeight: '1.5'
            }}>
              🔐 Enter your credentials to access the admin dashboard
            </p>
            
            <form onSubmit={handleAdminLogin} style={{ marginTop: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#374151', 
                  fontWeight: '500', 
                  fontSize: '0.95rem',
                  fontFamily: 'Anuphan, system-ui, sans-serif'
                }}>
                  Admin Email
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#FF5722',
                    fontSize: '1.1rem'
                  }}>
                    👤
                  </span>
                  <input 
                    type="text" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="admin@fujifood.com" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 0.875rem 0.875rem 3rem', 
                      border: `2px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
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
                </div>
                {errors.email && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.email}</p>}
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#374151', 
                  fontWeight: '500', 
                  fontSize: '0.95rem',
                  fontFamily: 'Anuphan, system-ui, sans-serif'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Enter admin password" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
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
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ 
                      position: 'absolute', 
                      right: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '1.1rem',
                      color: '#FF5722'
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.password}</p>}
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading} 
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: isLoading ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.3s ease',
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)',
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
                {isLoading ? 'Authenticating...' : 'Access Admin Dashboard'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <a 
                  href="/login" 
                  style={{ 
                    color: '#FF5722', 
                    textDecoration: 'none', 
                    fontSize: '0.95rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF5F2';
                    e.currentTarget.style.transform = 'translateX(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span>←</span> Back to Customer Login
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}