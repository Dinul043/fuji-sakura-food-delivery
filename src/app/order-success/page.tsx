'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      // Get order details from localStorage
      const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      const order = orderHistory.find((o: any) => o.id.toString() === orderId);
      setOrderDetails(order);
    }
  }, [orderId]);

  const handleBackToHome = () => {
    router.push('/home');
  };

  const handleViewOrders = () => {
    router.push('/orders');
  };

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
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Success Animation */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          animation: 'bounce 2s infinite'
        }}>
          🎉
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '0.5rem',
          margin: 0
        }}>
          Order Placed Successfully!
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2rem',
          margin: 0
        }}>
          Thank you for your order. We're preparing your delicious meal!
        </p>

        {/* Order Details */}
        {orderDetails && (
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#333',
              marginBottom: '1rem',
              margin: 0,
              textAlign: 'center'
            }}>
              Order Details
            </h3>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Order ID:</span>
              <span style={{ fontWeight: '600' }}>#{orderDetails.id}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Items:</span>
              <span style={{ fontWeight: '600' }}>
                {orderDetails.items.reduce((total: number, item: any) => total + item.quantity, 0)} items
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#666' }}>Total Amount:</span>
              <span style={{ fontWeight: '600', color: '#ff6b6b' }}>
                ${orderDetails.total.toFixed(2)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <span style={{ color: '#666' }}>Payment Method:</span>
              <span style={{ fontWeight: '600' }}>
                {orderDetails.paymentMethod === 'card' ? '💳 Card' :
                 orderDetails.paymentMethod === 'upi' ? '📱 UPI' :
                 orderDetails.paymentMethod === 'wallet' ? '👛 Wallet' : '💵 Cash on Delivery'}
              </span>
            </div>

            <div style={{
              background: '#e6fffa',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #81e6d9'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>🕒</span>
                <span style={{ fontWeight: '600', color: '#0d9488' }}>Estimated Delivery</span>
              </div>
              <p style={{
                color: '#0d9488',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: 0,
                textAlign: 'center'
              }}>
                {orderDetails.estimatedDelivery}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <button
            onClick={handleViewOrders}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0369a1, #0284c7)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0369a1, #0284c7)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Track Your Order
          </button>

          <button
            onClick={handleBackToHome}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
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
            Continue Shopping
          </button>
        </div>

        {/* Additional Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fff7ed',
          borderRadius: '12px',
          border: '1px solid #fed7aa'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: '#9a3412',
            margin: 0,
            lineHeight: '1.5'
          }}>
            📱 You'll receive SMS updates about your order status.
            <br />
            💬 Need help? Contact our support team.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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