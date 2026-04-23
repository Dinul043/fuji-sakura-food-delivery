/*
 * Delivery Partner Dashboard
 * ✅ Phase 1: DB tables
 * ✅ Phase 2: Apply form
 * ✅ Phase 3: Admin approval
 * ✅ Phase 4: Login + forgot password
 * ✅ Phase 5: Dashboard — online toggle, available orders, accept, complete (this page)
 * 🔜 Phase 6: Order flow improvements
 * 🔜 Phase 7: Earnings
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  delivery_address: string;
  delivery_phone: string;
  total_amount: number;
  payment_method: string;
  special_instructions?: string;
  restaurant_name: string;
  status: string;
  cod_collected?: boolean;
  items: { name: string; quantity: number; price: number }[];
}

interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  city: string;
  area?: string;
  upi_id?: string;
  is_available: boolean;
}

interface Earnings {
  today_deliveries: number;
  today_earnings: number;
  total_deliveries: number;
  total_earnings: number;
  pending_payout: number;
  cod_to_submit: number;
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [companyUpi, setCompanyUpi] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = () => sessionStorage.getItem('deliveryToken');

  useEffect(() => {
    const token = getToken();
    const stored = sessionStorage.getItem('deliveryPartner');
    if (!token || !stored) { router.push('/delivery/login'); return; }
    const p = JSON.parse(stored);
    setPartner(p);
    setIsOnline(p.is_available);

    // Fetch fresh profile from API to get latest upi_id, area etc.
    fetch(`${API_BASE_URL}/api/delivery/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setPartner(data);
        setIsOnline(data.is_available);
        sessionStorage.setItem('deliveryPartner', JSON.stringify(data));
      }
    }).catch(() => {});
    fetchAvailableOrders();
    fetchEarnings();
    fetchCompanyUpi();

    // Restore active order if partner has one in progress
    fetch(`${API_BASE_URL}/api/delivery/active-order`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.order) setActiveOrder(data.order);
    }).catch(() => {});

    setIsLoading(false);

    // Replace history so browser back button doesn't go to login
    window.history.replaceState(null, '', '/delivery/dashboard');

    // Intercept browser back button — stay on dashboard
    const handlePopState = () => {
      window.history.pushState(null, '', '/delivery/dashboard');
    };
    window.addEventListener('popstate', handlePopState);

    // WebSocket for new order notifications
    const ws = new WebSocket(`ws://localhost:8000/ws/restaurant-dashboard/0`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg === 'pong') return;

        // New order available or order ready for pickup — refresh available orders
        if (msg.type === 'order_ready_for_pickup' || msg.type === 'new_order') {
          const currentPartner = sessionStorage.getItem('deliveryPartner');
          const isCurrentlyOnline = currentPartner ? JSON.parse(currentPartner).is_available : false;
          if (isCurrentlyOnline) {
            showToast(msg.type === 'order_ready_for_pickup' ? '📦 Order ready for pickup!' : '🛵 New order available!', 'success');
            fetchAvailableOrders();
          }
        }

        // Another delivery partner took an order — remove it from our list
        if (msg.type === 'order_taken') {
          setAvailableOrders(prev => prev.filter(o => o.id !== msg.order_id));
        }

        // Order was cancelled by customer — remove from active order and available list
        if (msg.type === 'order_cancelled') {
          setAvailableOrders(prev => prev.filter(o => o.id !== msg.order_id));
          setActiveOrder(prev => {
            if (prev && prev.id === msg.order_id) {
              showToast(`Order #${msg.order_id} was cancelled by the customer`, 'error');
              return null;
            }
            return prev;
          });
        }
      } catch {}
    };
    ws.onclose = () => {};
    return () => {
      ws.close();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/earnings`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setEarnings(await res.json());
    } catch {}
  };

  const fetchCompanyUpi = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/company-upi`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanyUpi(data.company_upi_id);
      }
    } catch {}
  };

  const submitCodIssue = async () => {
    if (!issueText.trim() || !earnings) return;
    setIsSubmittingIssue(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/report-cod-issue`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.max(0, earnings.cod_to_submit - earnings.pending_payout),
          issue_description: issueText.trim()
        })
      });
      if (res.ok) {
        showToast('Issue reported. Admin will contact you shortly.');
        setShowIssueModal(false);
        setIssueText('');
      } else {
        const d = await res.json();
        showToast(d.detail || 'Failed to report issue', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSubmittingIssue(false); }
  };

  const fetchAvailableOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/available-orders`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableOrders(data.orders || []);
      } else if (res.status === 401) {
        router.push('/delivery/login');
      }
    } catch {}
  };

  const toggleOnline = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/toggle-availability`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOnline(data.is_available);
        const updated = { ...partner!, is_available: data.is_available };
        setPartner(updated);
        sessionStorage.setItem('deliveryPartner', JSON.stringify(updated));        showToast(data.is_available ? '🟢 You are now Online' : '🔴 You are now Offline');
        if (data.is_available) fetchAvailableOrders();
        else setAvailableOrders([]);
      }
    } catch { showToast('Network error', 'error'); }
  };

  const acceptOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/accept-order/${orderId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data.order);
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        showToast('✅ Order accepted! Head to the restaurant.');
        fetchEarnings(); // BUG-2 fix: re-check COD limit immediately after accepting
      } else {
        const d = await res.json();
        showToast(d.detail || 'Failed to accept order', 'error');
        fetchAvailableOrders();
      }
    } catch { showToast('Network error', 'error'); }
  };

  const completeOrder = async () => {
    if (!activeOrder) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/complete-order/${activeOrder.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showToast('🎉 Order delivered successfully!');
        setActiveOrder(null);
        fetchAvailableOrders();
        fetchEarnings();
      } else {
        const d = await res.json();
        showToast(d.detail || 'Failed to complete order', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('deliveryToken');
    sessionStorage.removeItem('deliveryPartner');
    router.push('/delivery/login');
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722, #FF7043)' }}>
      <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '12px', padding: '0.875rem 1.25rem', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🛵</span>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>{partner?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>{partner?.vehicle_type} · {partner?.city}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Online toggle */}
          <button onClick={toggleOnline} style={{
            padding: '0.5rem 1.25rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
            fontWeight: '700', fontSize: '0.875rem',
            background: isOnline ? '#10b981' : 'rgba(255,255,255,0.2)',
            color: 'white', transition: 'all 0.2s'
          }}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </button>
          <button onClick={() => router.push('/delivery/profile')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
            👤 Profile
          </button>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>

        {/* UPI Warning */}
        {partner && !partner.upi_id && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.9rem' }}>UPI ID required to take orders</div>
              <div style={{ color: '#b45309', fontSize: '0.8rem' }}>Add your UPI ID in your profile to start accepting deliveries.</div>
            </div>
            <button onClick={() => router.push('/delivery/profile')}
              style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
              Add UPI
            </button>
          </div>
        )}

        {/* Earnings Summary — compact, tap to see full details */}
        {earnings && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Today&apos;s Earnings</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>₹{earnings.today_earnings}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{earnings.today_deliveries} deliveries</div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${Math.max(0, earnings.cod_to_submit - earnings.pending_payout) >= 1500 ? '#ef4444' : earnings.cod_to_submit > 0 ? '#f59e0b' : '#3b82f6'}` }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                {Math.max(0, earnings.cod_to_submit - earnings.pending_payout) >= 1500 ? '🚫 COD Blocked' : earnings.cod_to_submit > 0 ? '⚠️ COD Due' : 'Pending Payout'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: Math.max(0, earnings.cod_to_submit - earnings.pending_payout) >= 1500 ? '#ef4444' : earnings.cod_to_submit > 0 ? '#f59e0b' : '#3b82f6' }}>
                ₹{earnings.cod_to_submit > 0 ? Math.max(0, earnings.cod_to_submit - earnings.pending_payout) : earnings.pending_payout}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{earnings.cod_to_submit > 0 ? 'Net to return to company' : 'Admin will transfer'}</div>
            </div>
          </div>
        )}

        {/* Quick action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={() => router.push('/delivery/earnings')}
            style={{ padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            📊 View Earnings
          </button>
          <button onClick={() => router.push('/delivery/settle')}
            style={{ padding: '0.75rem', borderRadius: '10px', border: `1.5px solid ${earnings && earnings.cod_to_submit > 0 ? '#FF5722' : '#e5e7eb'}`, background: earnings && earnings.cod_to_submit > 0 ? '#FFF5F2' : 'white', color: earnings && earnings.cod_to_submit > 0 ? '#FF5722' : '#374151', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            💸 Settle COD {earnings && earnings.cod_to_submit > 0 ? `(₹${Math.max(0, earnings.cod_to_submit - earnings.pending_payout)})` : ''}
          </button>
        </div>

        {/* Active Delivery Card */}
        {activeOrder && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderLeft: `4px solid ${activeOrder.status === 'ready' ? '#f59e0b' : '#10b981'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                {/* Phase indicator */}
                {activeOrder.status === 'ready' ? (
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🏍️ Head to Restaurant</div>
                ) : (
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🚚 Out for Delivery</div>
                )}
                <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.1rem' }}>{activeOrder.order_number}</div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{activeOrder.restaurant_name}</div>
              </div>
              <div style={{ fontWeight: '800', color: '#FF5722', fontSize: '1.2rem' }}>₹{activeOrder.total_amount}</div>
            </div>

            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1rem' }}>
              {[
                { label: 'Accepted', done: true },
                { label: 'Picked Up', done: activeOrder.status === 'out_for_delivery' },
                { label: 'Delivered', done: false }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.done ? '#10b981' : (i === 1 && activeOrder.status === 'ready' ? '#f59e0b' : '#e5e7eb'),
                      color: 'white', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: step.done ? '#10b981' : '#9ca3af', marginTop: '0.2rem', fontWeight: '600' }}>{step.label}</div>
                  </div>
                  {i < 2 && <div style={{ height: '2px', flex: 1, background: step.done ? '#10b981' : '#e5e7eb', marginBottom: '1rem' }} />}
                </div>
              ))}
            </div>

            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '0.875rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.25rem' }}>📍 Deliver to</div>
              <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{activeOrder.customer_name}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{activeOrder.delivery_address}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>📞 {activeOrder.delivery_phone}</div>
            </div>
            {activeOrder.special_instructions && (
              <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #fde68a', fontSize: '0.85rem', color: '#92400e' }}>
                📝 {activeOrder.special_instructions}
              </div>
            )}

            {/* Phase 1: Heading to restaurant — show "Food Picked Up" button */}
            {activeOrder.status === 'ready' && (
              <button onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/api/delivery/pickup-order/${activeOrder.id}`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setActiveOrder(data.order);
                    showToast('📦 Food picked up! Head to the customer.');
                  } else {
                    const d = await res.json();
                    showToast(d.detail || 'Failed to mark pickup', 'error');
                  }
                } catch { showToast('Network error', 'error'); }
              }}
                style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                📦 Food Picked Up — Start Delivery
              </button>
            )}

            {/* Phase 2: Out for delivery — COD + Mark Delivered */}
            {activeOrder.status === 'out_for_delivery' && (
              <>
                {activeOrder.payment_method?.toLowerCase() === 'cod' && !activeOrder.cod_collected && (
                  <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.875rem' }}>💵 COD Order — ₹{activeOrder.total_amount}</div>
                      <div style={{ color: '#b45309', fontSize: '0.78rem' }}>Collect cash from customer</div>
                    </div>
                    <button onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/delivery/mark-cod-collected/${activeOrder.id}`, {
                          method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}` }
                        });
                        if (res.ok) {
                          setActiveOrder(prev => prev ? { ...prev, cod_collected: true } : null);
                          showToast('💵 Cash collected marked!');
                        }
                      } catch { showToast('Network error', 'error'); }
                    }}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                      Mark Collected
                    </button>
                  </div>
                )}
                {activeOrder.payment_method?.toLowerCase() === 'cod' && activeOrder.cod_collected && (
                  <div style={{ background: '#d1fae5', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.875rem', color: '#065f46', fontWeight: '600', fontSize: '0.875rem' }}>
                    ✅ Cash collected — ₹{activeOrder.total_amount}
                  </div>
                )}
                <button onClick={completeOrder}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                  ✅ Mark as Delivered
                </button>
              </>
            )}
          </div>
        )}

        {/* Available Orders — always show, even when active order exists */}
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
                Available Orders {availableOrders.length > 0 && <span style={{ background: '#FF5722', color: 'white', borderRadius: '20px', padding: '0.1rem 0.6rem', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{availableOrders.length}</span>}
              </h2>
              <button onClick={fetchAvailableOrders} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280' }}>
                🔄 Refresh
              </button>
            </div>

            {!isOnline ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔴</div>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '1rem' }}>You are offline. Go online to see available orders.</p>
                <button onClick={toggleOnline} style={{ marginTop: '1.25rem', padding: '0.75rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  Go Online
                </button>
              </div>
            ) : availableOrders.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p style={{ color: '#9ca3af', margin: 0 }}>No orders available right now. We'll notify you when one comes in.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {availableOrders.map(order => (
                  <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #FF5722' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#111827' }}>{order.order_number}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{order.restaurant_name}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>📍 {order.delivery_address.slice(0, 50)}{order.delivery_address.length > 50 ? '...' : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#FF5722', fontSize: '1.1rem' }}>₹{order.total_amount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{order.items?.length || 0} items</div>
                      </div>
                    </div>
                    <button onClick={() => acceptOrder(order.id)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}>
                      Accept Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
