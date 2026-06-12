'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface EarningRecord {
  id: number;
  order_id: number;
  amount: number;
  payment_type: string;
  cod_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface EarningsSummary {
  today_deliveries: number;
  today_earnings: number;
  total_deliveries: number;
  total_earnings: number;
  pending_payout: number;
  cod_to_submit: number;
  earnings: EarningRecord[];
}

export default function DeliveryEarningsPage() {
  const router = useRouter();
  const [data, setData] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryFeePerOrder, setDeliveryFeePerOrder] = useState(40);

  const getToken = () => (localStorage.getItem('deliveryToken') || sessionStorage.getItem('deliveryToken'));

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/delivery/login'); return; }
    
    // Fetch platform delivery fee
    fetch(`${API_BASE_URL}/api/geocode/platform-info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.settings?.delivery_fee?.value) setDeliveryFeePerOrder(parseFloat(d.settings.delivery_fee.value)); })
      .catch(() => {});
    
    fetch(`${API_BASE_URL}/api/delivery/earnings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722, #FF7043)' }}>
      <div style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <button onClick={() => router.push('/delivery/dashboard')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          ← Back
        </button>
        <h1 style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>📊 My Earnings</h1>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>
        {data && (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
              {[
                { label: "Today's Earnings", value: `₹${data.today_earnings}`, sub: `${data.today_deliveries} deliveries today`, color: '#10b981' },
                { label: 'Total Earnings', value: `₹${data.total_earnings}`, sub: `${data.total_deliveries} total deliveries`, color: '#3b82f6' },
                { label: 'Pending Payout', value: `₹${data.pending_payout}`, sub: 'Admin will transfer to your UPI', color: '#f59e0b' },
                { label: 'COD Pending', value: `₹${data.cod_to_submit}`, sub: data.cod_to_submit > 0 ? 'Needs to be returned to company' : 'No COD pending', color: data.cod_to_submit > 0 ? '#ef4444' : '#9ca3af' }
              ].map(card => (
                <div key={card.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{card.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* How payout works */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: '700', color: '#166534', fontSize: '0.875rem', marginBottom: '0.5rem' }}>💡 How your payout works</div>
              <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: '1.7' }}>
                • You earn <strong>₹{deliveryFeePerOrder}</strong> for every completed delivery<br />
                • Admin reviews and transfers your pending payout to your UPI ID<br />
                • For COD orders, you collect cash from the customer — return the full amount to company, admin pays ₹{deliveryFeePerOrder} earnings separately
              </div>
            </div>

            {/* Earnings history */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '1rem' }}>Recent Deliveries</div>
              {data.earnings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                  <p style={{ margin: 0 }}>No deliveries yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[...data.earnings].reverse().map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: '#f9fafb', borderRadius: '10px', borderLeft: `3px solid ${e.status === 'paid' ? '#10b981' : '#f59e0b'}` }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>Order #{e.order_id}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>
                          {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {e.payment_type === 'cod' && <span style={{ marginLeft: '0.5rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600' }}>COD</span>}
                        </div>
                        {e.payment_type === 'cod' && e.cod_amount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>COD collected: ₹{e.cod_amount}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#10b981', fontSize: '1rem' }}>+₹{e.amount}</div>
                        <div style={{ fontSize: '0.72rem', color: e.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: '600', marginTop: '0.1rem' }}>
                          {e.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
