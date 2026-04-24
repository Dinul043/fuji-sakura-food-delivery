'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RestaurantPayout {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  upi_id: string | null;
  city: string | null;
  total_orders_delivered: number;
  pending_orders: number;
  total_pending_payout: number;
  total_commission_earned: number;
  total_paid_out: number;
}

interface OrderPayout {
  id: number;
  order_id: number;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  payout_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export default function RestaurantPayoutsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantPayout | null>(null);
  const [orderPayouts, setOrderPayouts] = useState<OrderPayout[]>([]);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState<number | null>(null);
  const [confirmPay, setConfirmPay] = useState<RestaurantPayout | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const getToken = () => localStorage.getItem('adminToken');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/admin'); return; }
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/restaurant-payouts`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants || []);
      } else if (res.status === 401) {
        router.push('/admin');
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  const fetchDetail = async (restaurantId: number) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/restaurant-payouts/${restaurantId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrderPayouts(data.payouts || []);
        setOrderSummary(data.summary);
      }
    } catch {}
    finally { setIsLoadingDetail(false); }
  };

  const markPaid = async (restaurantId: number) => {
    setIsMarkingPaid(restaurantId);
    setConfirmPay(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/restaurant-payout/mark-paid/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`✅ ₹${data.amount_paid} paid to ${selectedRestaurant?.business_name || 'restaurant'}`);
        fetchRestaurants();
        if (selectedRestaurant) fetchDetail(selectedRestaurant.id);
      } else {
        const d = await res.json();
        showToast(d.detail || 'Failed to mark as paid', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsMarkingPaid(null); }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722, #FF7043)' }}>
      <div style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '12px', padding: '0.875rem 1.25rem', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <button onClick={() => router.push('/admin/dashboard')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          ← Back
        </button>
        <div>
          <h1 style={{ color: 'white', fontWeight: '700', fontSize: '1.2rem', margin: 0 }}>🏪 Restaurant Payouts</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0 }}>Platform commission 10% · Net payout to restaurants</p>
        </div>
        <button onClick={fetchRestaurants} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: selectedRestaurant ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

        {/* Left — Restaurant List */}
        <div>
          {/* How it works */}
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid #bbf7d0', fontSize: '0.82rem', color: '#374151', lineHeight: '1.8' }}>
            <strong>How restaurant payouts work:</strong><br />
            🟢 <strong>Order Amount</strong> = Food subtotal (no delivery fee, no tax)<br />
            🔴 <strong>Platform Commission</strong> = 10% of order amount (platform keeps this)<br />
            🔵 <strong>Net Payout</strong> = Order Amount − Commission (paid to restaurant)
          </div>

          {restaurants.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
              <p style={{ margin: 0 }}>No approved restaurants yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {restaurants.map(r => (
                <div key={r.id}
                  onClick={() => { setSelectedRestaurant(r); fetchDetail(r.id); }}
                  style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', borderLeft: `4px solid ${r.total_pending_payout > 0 ? '#f59e0b' : '#10b981'}`, border: selectedRestaurant?.id === r.id ? '2px solid #FF5722' : `1px solid #e5e7eb`, borderLeftWidth: '4px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{r.business_name}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.1rem' }}>{r.owner_name} · {r.email}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{r.city || ''} · {r.total_orders_delivered} orders delivered</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Pending</div>
                      <div style={{ fontWeight: '800', color: r.total_pending_payout > 0 ? '#f59e0b' : '#10b981', fontSize: '1.2rem' }}>₹{r.total_pending_payout}</div>
                    </div>
                  </div>

                  {/* 3-column summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>🔵 Net Payout</div>
                      <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.95rem' }}>₹{r.total_pending_payout}</div>
                      <div style={{ fontSize: '0.6rem', color: '#4ade80' }}>To restaurant</div>
                    </div>
                    <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#991b1b', fontWeight: '700', textTransform: 'uppercase' }}>🔴 Commission</div>
                      <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.95rem' }}>₹{r.total_commission_earned}</div>
                      <div style={{ fontSize: '0.6rem', color: '#f87171' }}>Platform keeps</div>
                    </div>
                    <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase' }}>✅ Paid Out</div>
                      <div style={{ fontWeight: '800', color: '#2563eb', fontSize: '0.95rem' }}>₹{r.total_paid_out}</div>
                      <div style={{ fontSize: '0.6rem', color: '#60a5fa' }}>Already paid</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Order Detail */}
        {selectedRestaurant && (
          <div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{selectedRestaurant.business_name}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{selectedRestaurant.pending_orders} pending orders · ₹{selectedRestaurant.total_pending_payout} due</div>
                </div>
                <button onClick={() => { setSelectedRestaurant(null); setOrderPayouts([]); }}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
              </div>

              {selectedRestaurant.total_pending_payout > 0 && (
                <button
                  onClick={() => setConfirmPay(selectedRestaurant)}
                  disabled={isMarkingPaid === selectedRestaurant.id}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: 'none', background: isMarkingPaid === selectedRestaurant.id ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: '700', fontSize: '0.95rem', cursor: isMarkingPaid === selectedRestaurant.id ? 'not-allowed' : 'pointer' }}>
                  {isMarkingPaid === selectedRestaurant.id ? 'Processing...' : `✅ Mark ₹${selectedRestaurant.total_pending_payout} as Paid`}
                </button>
              )}
              {selectedRestaurant.total_pending_payout === 0 && (
                <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '600', padding: '0.5rem' }}>✅ All payouts settled</div>
              )}
            </div>

            {/* Order-wise breakdown */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem', marginBottom: '1rem' }}>Order-wise Breakdown</div>
              {isLoadingDetail ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Loading...</div>
              ) : orderPayouts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No delivered orders yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {orderPayouts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '10px', borderLeft: `3px solid ${p.status === 'paid' ? '#10b981' : '#f59e0b'}` }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem' }}>Order #{p.order_id}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem' }}>
                          {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                          Food: ₹{p.order_amount} · Commission: ₹{p.commission_amount} ({p.commission_rate}%)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: p.status === 'paid' ? '#10b981' : '#f59e0b', fontSize: '1rem' }}>₹{p.payout_amount}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: p.status === 'paid' ? '#10b981' : '#f59e0b', marginTop: '0.1rem' }}>
                          {p.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Pay Modal */}
      {confirmPay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>💸</div>
            <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem', color: '#111827', fontSize: '1.1rem', fontWeight: '700' }}>Confirm Payout</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
              Pay <strong>₹{confirmPay.total_pending_payout}</strong> to <strong>{confirmPay.business_name}</strong>
            </p>
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 1.5rem' }}>
              {confirmPay.pending_orders} orders · Platform earned ₹{confirmPay.total_commission_earned} commission
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmPay(null)}
                style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => markPaid(confirmPay.id)}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                ✅ Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
