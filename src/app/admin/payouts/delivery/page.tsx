'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DeliveryPartnerPayout {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  city: string | null;
  upi_id: string | null;
  pending_payout: number;
  cod_collected_by_partner: number;
  total_settled_by_partner: number;
  net_cod_to_return: number;
}

interface CodSettlement {
  id: number;
  order_id?: number;
  amount: number;
  status: string;
  refund_status: string;
  refund_id?: string;
  failure_reason?: string;
  paid_at: string | null;
  created_at: string;
}

export default function DeliveryPayoutsPage() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [partners, setPartners] = useState<DeliveryPartnerPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingPaid, setIsMarkingPaid] = useState<number | null>(null);
  const [confirmPay, setConfirmPay] = useState<DeliveryPartnerPayout | null>(null);
  const [viewSettlements, setViewSettlements] = useState<DeliveryPartnerPayout | null>(null);
  const [settlements, setSettlements] = useState<CodSettlement[]>([]);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false);
  const [isRefunding, setIsRefunding] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const getToken = () => localStorage.getItem('adminToken');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/admin'); return; }
    fetchPartners();
    connectWebSocket();
    return () => { wsRef.current?.close(); };
  }, []);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/admin');
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'cod_settlement_paid') fetchPartners();
        } catch {}
      };
      ws.onclose = () => {
        setTimeout(connectWebSocket, 5000);
      };
    } catch {}
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-payouts`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || data || []);
      } else if (res.status === 401) {
        router.push('/admin');
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  const markPaid = async (partnerId: number) => {
    setIsMarkingPaid(partnerId);
    setConfirmPay(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-payout/mark-paid/${partnerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`✅ ₹${data.amount_paid ?? ''} paid via UPI`);
        fetchPartners();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(typeof d.detail === 'string' ? d.detail : Array.isArray(d.detail) ? d.detail[0]?.msg : 'Failed to mark as paid', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsMarkingPaid(null); }
  };

  const fetchSettlements = async (partnerId: number) => {
    setIsLoadingSettlements(true);
    setSettlements([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-partner/${partnerId}/cod-settlements`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettlements(data.settlements || data || []);
      }
    } catch {}
    finally { setIsLoadingSettlements(false); }
  };

  const initiateRefund = async (settlementId: number) => {
    setIsRefunding(settlementId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cod-settlement/${settlementId}/refund`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual refund by admin' })
      });
      if (res.ok) {
        showToast('✅ Refund initiated');
        if (viewSettlements) fetchSettlements(viewSettlements.id);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(typeof d.detail === 'string' ? d.detail : Array.isArray(d.detail) ? d.detail[0]?.msg : 'Refund failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsRefunding(null); }
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
          <h1 style={{ color: 'white', fontWeight: '700', fontSize: '1.2rem', margin: 0 }}>💸 Delivery Partner Payouts</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0 }}>Earnings · COD settlements · UPI payouts</p>
        </div>
        <button onClick={fetchPartners}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

        {/* Legend */}
        <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid #fed7aa', fontSize: '0.82rem', color: '#374151', lineHeight: '1.9' }}>
          <strong>How COD settlement works:</strong><br />
          🟢 <strong>Delivery Earnings</strong> = Fixed fee per delivery (owed to partner)<br />
          🔴 <strong>COD Collected</strong> = Cash collected from customers on delivery<br />
          💳 <strong>Platform Received</strong> = Amount partner has already returned to platform<br />
          🔵 <strong>Still Pending</strong> = COD cash partner still needs to return (COD Collected − Platform Received)
        </div>

        {/* Partner List */}
        {partners.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛵</div>
            <p style={{ margin: 0 }}>No delivery partners yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {partners.map(p => (
              <div key={p.id} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', borderLeft: `4px solid ${p.net_cod_to_return > 0 ? '#ef4444' : p.pending_payout > 0 ? '#f59e0b' : '#10b981'}` }}>

                {/* Partner header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{p.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.1rem' }}>{p.email} · {p.phone}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{p.vehicle_type}{p.city ? ` · ${p.city}` : ''}{p.upi_id ? ` · UPI: ${p.upi_id}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Earnings Due</div>
                    <div style={{ fontWeight: '800', color: p.pending_payout > 0 ? '#f59e0b' : '#10b981', fontSize: '1.2rem' }}>₹{p.pending_payout}</div>
                  </div>
                </div>

                {/* 4-column breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>🟢 Delivery Earnings</div>
                    <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.95rem' }}>₹{p.pending_payout}</div>
                    <div style={{ fontSize: '0.58rem', color: '#4ade80' }}>pending_payout</div>
                  </div>
                  <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#991b1b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>🔴 COD Collected</div>
                    <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.95rem' }}>₹{p.cod_collected_by_partner}</div>
                    <div style={{ fontSize: '0.58rem', color: '#f87171' }}>from customers</div>
                  </div>
                  <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#075985', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>💳 Platform Received</div>
                    <div style={{ fontWeight: '800', color: '#0284c7', fontSize: '0.95rem' }}>₹{p.total_settled_by_partner}</div>
                    <div style={{ fontSize: '0.58rem', color: '#38bdf8' }}>returned so far</div>
                  </div>
                  <div style={{ background: p.net_cod_to_return > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: p.net_cod_to_return > 0 ? '#991b1b' : '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>🔵 Still Pending</div>
                    <div style={{ fontWeight: '800', color: p.net_cod_to_return > 0 ? '#dc2626' : '#16a34a', fontSize: '0.95rem' }}>₹{p.net_cod_to_return}</div>
                    <div style={{ fontSize: '0.58rem', color: p.net_cod_to_return > 0 ? '#f87171' : '#4ade80' }}>to return</div>
                  </div>
                </div>

                {/* COD warning banner */}
                {p.net_cod_to_return > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 0.875rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#dc2626', fontWeight: '600' }}>
                    🔒 Partner must return ₹{p.net_cod_to_return} COD cash before earnings can be paid
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {p.pending_payout > 0 && (
                    <button
                      onClick={() => p.net_cod_to_return > 0 ? showToast(`Cannot pay — partner still has ₹${p.net_cod_to_return} COD to return first`, 'error') : setConfirmPay(p)}
                      disabled={isMarkingPaid === p.id}
                      style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: isMarkingPaid === p.id ? '#9ca3af' : p.net_cod_to_return > 0 ? '#9ca3af' : 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: isMarkingPaid === p.id || p.net_cod_to_return > 0 ? 'not-allowed' : 'pointer' }}>
                      {isMarkingPaid === p.id ? 'Processing...' : p.net_cod_to_return > 0 ? `🔒 Blocked — COD Pending` : `💸 Mark ₹${p.pending_payout} as Paid via UPI`}
                    </button>
                  )}
                  <button
                    onClick={() => { setViewSettlements(p); fetchSettlements(p.id); }}
                    style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    📋 View COD Settlement History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Pay Modal */}
      {confirmPay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>💸</div>
            <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem', color: '#111827', fontSize: '1.1rem', fontWeight: '700' }}>Confirm UPI Payout</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.4rem' }}>
              Pay <strong>₹{confirmPay.pending_payout}</strong> to <strong>{confirmPay.name}</strong>
            </p>
            {confirmPay.upi_id && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 1.5rem' }}>
                UPI: {confirmPay.upi_id}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmPay(null)}
                style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => markPaid(confirmPay.id)}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                ✅ Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COD Settlement History Modal */}
      {viewSettlements && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.75rem', maxWidth: '560px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#111827', fontSize: '1rem', fontWeight: '700' }}>📋 COD Settlement History</h3>
                <p style={{ margin: '0.2rem 0 0', color: '#6b7280', fontSize: '0.8rem' }}>{viewSettlements.name}</p>
              </div>
              <button onClick={() => { setViewSettlements(null); setSettlements([]); }}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {isLoadingSettlements ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Loading...</div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  No settlement records found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {settlements.map(s => (
                    <div key={s.id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '0.875rem', borderLeft: `3px solid ${s.status === 'paid' ? '#10b981' : s.status === 'failed' ? '#ef4444' : '#f59e0b'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem' }}>Settlement #{s.id}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.15rem' }}>
                            Amount: ₹{s.amount}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                            {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {s.paid_at && ` · Paid ${new Date(s.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                          </div>
                          {s.failure_reason && <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.1rem' }}>{s.failure_reason}</div>}
                          {s.refund_id && <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '0.1rem' }}>Refund ID: {s.refund_id}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', background: s.status === 'paid' ? '#d1fae5' : s.status === 'failed' ? '#fee2e2' : '#fef3c7', color: s.status === 'paid' ? '#065f46' : s.status === 'failed' ? '#991b1b' : '#92400e' }}>
                            {s.status === 'paid' ? '✅ Paid' : s.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                          </span>
                          {s.status === 'paid' && s.refund_status === 'none' && (
                            <button
                              onClick={() => initiateRefund(s.id)}
                              disabled={isRefunding === s.id}
                              style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: isRefunding === s.id ? '#f3f4f6' : 'white', color: '#374151', cursor: isRefunding === s.id ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                              {isRefunding === s.id ? '...' : '↩️ Refund'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
