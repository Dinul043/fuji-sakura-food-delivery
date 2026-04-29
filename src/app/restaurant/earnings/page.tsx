'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface EarningsSummary {
  today_revenue: number;
  today_orders: number;
  total_revenue: number;
  total_orders: number;
  total_commission_paid: number;
  pending_payout: number;
  pending_orders: number;
  total_received: number;
  commission_rate: number;
  upi_id: string | null;
}

interface PayoutRecord {
  id: number;
  order_id: number;
  order_number: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  payout_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export default function RestaurantEarningsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () => sessionStorage.getItem('restaurantToken');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/restaurant/login'); return; }

    fetch(`${API_BASE_URL}/api/restaurant/earnings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401) { router.push('/restaurant/login'); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (data) {
          setSummary(data.summary);
          setPayouts(data.payouts || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722, #FF7043)' }}>
      <div style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Anuphan, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <button onClick={() => router.push('/restaurant/dashboard')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          ← Back
        </button>
        <div>
          <h1 style={{ color: 'white', fontWeight: '700', fontSize: '1.2rem', margin: 0 }}>💰 My Earnings</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0 }}>
            Commission: {summary?.commission_rate || 10}% · Payout to: {summary?.upi_id || 'UPI not set'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

        {/* How it works */}
        <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #fed7aa', fontSize: '0.82rem', color: '#374151', lineHeight: '1.8' }}>
          <strong>How your earnings work:</strong><br />
          🟢 <strong>Order Amount</strong> = Food subtotal (what customer paid for food)<br />
          🔴 <strong>Platform Commission</strong> = {summary?.commission_rate || 10}% deducted by platform<br />
          🔵 <strong>Your Payout</strong> = Order Amount − Commission (admin pays this to your UPI)
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Today&apos;s Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>₹{summary.today_revenue}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>{summary.today_orders} orders today</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' }}>₹{summary.total_revenue}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>{summary.total_orders} total orders</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${summary.pending_payout > 0 ? '#f59e0b' : '#10b981'}` }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Pending Payout</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: summary.pending_payout > 0 ? '#f59e0b' : '#10b981' }}>₹{summary.pending_payout}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>{summary.pending_orders} orders pending · Admin will transfer</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total Received</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#8b5cf6' }}>₹{summary.total_received}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>Already paid by admin</div>
            </div>
          </div>
        )}

        {/* Commission summary */}
        {summary && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#374151' }}>
              Total platform commission deducted: <strong style={{ color: '#ef4444' }}>₹{summary.total_commission_paid}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>@ {summary.commission_rate}% rate</div>
          </div>
        )}

        {/* Order-wise breakdown */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '1rem' }}>Order-wise Breakdown</div>

          {payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
              <p style={{ margin: 0 }}>No delivered orders yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.7rem', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>
                <span>Order</span>
                <span style={{ textAlign: 'right' }}>Food Amount</span>
                <span style={{ textAlign: 'right' }}>Commission</span>
                <span style={{ textAlign: 'right' }}>Your Payout</span>
                <span style={{ textAlign: 'right' }}>Status</span>
              </div>

              {payouts.map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr', gap: '0.5rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '10px', borderLeft: `3px solid ${p.status === 'paid' ? '#10b981' : '#f59e0b'}`, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{p.order_number}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>₹{p.order_amount}</div>
                  <div style={{ textAlign: 'right', color: '#ef4444', fontSize: '0.875rem' }}>−₹{p.commission_amount}</div>
                  <div style={{ textAlign: 'right', fontWeight: '800', color: '#10b981', fontSize: '0.95rem' }}>₹{p.payout_amount}</div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', background: p.status === 'paid' ? '#d1fae5' : '#fef3c7', color: p.status === 'paid' ? '#065f46' : '#92400e' }}>
                      {p.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
