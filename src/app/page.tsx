'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        router.push('/login');
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 6s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Floating Food Emojis */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '2rem', animation: 'float 3s ease-in-out infinite' }}>🍜</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '1.5rem', animation: 'float 2.5s ease-in-out infinite 0.5s' }}>🍱</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: '1.8rem', animation: 'float 3.5s ease-in-out infinite 1s' }}>🍣</div>
      <div style={{ position: 'absolute', bottom: '30%', right: '10%', fontSize: '2.2rem', animation: 'float 2.8s ease-in-out infinite 1.5s' }}>🍙</div>
      <div style={{ position: 'absolute', top: '50%', left: '5%', fontSize: '1.6rem', animation: 'float 3.2s ease-in-out infinite 2s' }}>🥢</div>
      <div style={{ position: 'absolute', top: '60%', right: '5%', fontSize: '1.9rem', animation: 'float 2.7s ease-in-out infinite 0.8s' }}>🍵</div>

      {/* Main Content */}
      <div 
        style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1)',
          transform: isVisible ? 'scale(1)' : 'scale(1.1)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.5s ease-in-out'
        }}
      >
        {/* Logo */}
        <div 
          style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 15px 35px rgba(255, 107, 107, 0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          <span style={{ fontSize: '3rem' }}>🌸</span>
        </div>

        {/* App Name */}
        <h1 
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          Fuji Sakura
        </h1>

        {/* Subtitle */}
        <p 
          style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '2rem',
            fontWeight: '500'
          }}
        >
          Premium Food Delivery Experience
        </p>

        {/* Loading Animation */}
        <div 
          style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #ffffff',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}