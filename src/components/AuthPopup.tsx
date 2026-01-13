'use client';

import { useRouter } from 'next/navigation';

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthPopup({ isOpen, onClose, message }: AuthPopupProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/login');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '3rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        animation: 'popupSlideIn 0.3s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: '#666',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.color = '#666';
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '2rem', // Increased spacing after icon
          animation: 'bounce 2s infinite'
        }}>
          🔐
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          color: '#333',
          marginBottom: '1.5rem' // Increased spacing after title
        }}>
          Authentication Required
        </h2>

        {/* Message */}
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2.5rem', // Proper spacing before buttons
          lineHeight: '1.5'
        }}>
          {message || "To proceed with checkout, please sign up for an account or log in to your existing account. This helps us provide better service and track your orders."}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.5rem' // Added spacing before additional info
        }}>
          <button
            onClick={handleSignup}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '140px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a24, #dc2626)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
            }}
          >
            <span>✨</span>
            <span>Sign Up</span>
          </button>

          <button
            onClick={handleLogin}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '140px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#ff6b6b';
              e.currentTarget.style.color = '#ff6b6b';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#333';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            }}
          >
            <span>🔑</span>
            <span>Log In</span>
          </button>
        </div>

        {/* Additional Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: '#1e40af',
            margin: 0,
            lineHeight: '1.4'
          }}>
            💡 <strong>Why create an account?</strong><br />
            Track your orders, save addresses, reorder favorites, and get exclusive offers!
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}