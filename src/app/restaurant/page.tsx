'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RestaurantPortal() {
  const router = useRouter();

  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Check if already logged in (remember me) — redirect to dashboard
    const existingToken = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken');
    if (existingToken) {
      router.push('/restaurant/dashboard');
    }
  }, []);

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
              Restaurant Portal
            </h1>
            
            <p style={{ 
              fontSize: '1.4rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0,
              fontWeight: '500',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              Join Fuji Sakura's Growing Network
            </p>
          </div>

          {/* Features */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '2rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            {[
              { icon: '📊', title: 'Analytics', desc: 'Track your performance' },
              { icon: '🍽️', title: 'Menu Control', desc: 'Manage your dishes' },
              { icon: '📱', title: 'Order Management', desc: 'Handle orders easily' },
              { icon: '💰', title: 'Revenue Growth', desc: 'Increase your sales' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '1.5rem',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  margin: '0 0 0.5rem 0' 
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.9rem', 
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

      {/* Right Column - 40% width - Portal Options */}
      <div style={{ 
        width: '40%', 
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 1rem 0',
              letterSpacing: '-0.02em'
            }}>
              Welcome
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b', 
              margin: 0,
              fontWeight: '500'
            }}>
              Choose your path to get started
            </p>
          </div>

          {/* New Partner Option */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05), rgba(255, 112, 67, 0.05))',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '2px solid rgba(255, 87, 34, 0.1)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '2.5rem',
                boxShadow: '0 8px 25px rgba(255, 87, 34, 0.3)'
              }}>
                🆕
              </div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#FF5722', 
                margin: '0 0 0.5rem 0' 
              }}>
                New Restaurant Partner?
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                margin: '0 0 1.5rem 0',
                lineHeight: '1.5'
              }}>
                Apply for partnership and create your account in one simple process
              </p>
            </div>
            
            <button
              onClick={() => router.push('/restaurant/apply')}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.4)';
              }}
            >
              <span>🚀</span>
              Apply & Sign Up
            </button>
          </div>

          {/* Existing Partner Option */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '2px solid rgba(255, 87, 34, 0.2)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '2.5rem',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
              }}>
                ✅
              </div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#4CAF50', 
                margin: '0 0 0.5rem 0' 
              }}>
                Verified Partner?
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                margin: '0 0 1.5rem 0',
                lineHeight: '1.5'
              }}>
                Access your restaurant dashboard and manage your business
              </p>
            </div>
            
            <button
              onClick={() => router.push('/restaurant/login')}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
              }}
            >
              <span>🏪</span>
              Partner Login
            </button>
          </div>

          {/* Back to Home */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => router.push('/login')}
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
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 87, 34, 0.1)';
                e.currentTarget.style.borderColor = '#FF5722';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = 'rgba(255, 87, 34, 0.3)';
              }}
            >
              🏠 Back to Customer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}