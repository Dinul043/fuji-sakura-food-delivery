'use client';

import { useRouter } from 'next/navigation';

export default function RestaurantAnalytics() {
  const router = useRouter();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '3rem', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Analytics & Reports</h2>
        <p style={{ margin: '0 0 2rem 0', color: '#666' }}>
          Coming soon! This page will show sales analytics, performance metrics, and detailed reports.
        </p>
        <button
          onClick={() => router.push('/restaurant/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}