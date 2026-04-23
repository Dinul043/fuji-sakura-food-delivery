'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

declare global {
  interface Window { Razorpay: any; }
}

export default function DeliverySettlePage() {
  const router = useRouter();
  const [codPending, setCodPending] = useState(0);
  const [myEarnings, setMyEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [settlements, setSettlements] = useState<any[]>([]);

  const getToken = () => sessionStorage.getItem('deliveryToken');
  const getPartner = () => {
    const s = sessionStorage.getItem('deliveryPartner');
    return s ? JSON.parse(s) : null;
  };
  const amountToReturn = Math.max(0, codPending - myEarnings);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/delivery/login'); return; }

    // Load Razorpay script
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }

    Promise.all([
      fetch(`${API_BASE_URL}/api/delivery/earnings`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/delivery/cod-settlement/history`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]).then(async ([earningsRes, historyRes]) => {
      if (earningsRes.ok) {
        const d = await earningsRes.json();
        setCodPending(d.cod_to_submit || 0);
        setMyEarnings(d.pending_payout || 0);
      }
      if (historyRes.ok) {
        const d = await historyRes.json();
        setSettlements(d.settlements || []);
      }
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handlePayNow = async () => {
    if (amountToReturn <= 0) return;
    setIsPaying(true);
    try {
      const token = getToken();
      const partner = getPartner();

      // Step 1: Create Razorpay order
      const res = await fetch(`${API_BASE_URL}/api/delivery/cod-settlement/create-order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.detail || 'Failed to initiate payment', 'error');
        setIsPaying(false);
        return;
      }

      const orderData = await res.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key_id || RAZORPAY_KEY,
        amount: orderData.amount_in_paise,
        currency: orderData.currency || 'INR',
        name: 'Fuji Sakura',
        description: 'COD Settlement',
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: orderData.partner_name || partner?.name,
          email: orderData.partner_email || partner?.email,
          contact: orderData.partner_phone || partner?.phone
        },
        theme: { color: '#FF5722' },
        handler: async (response: any) => {
          // Step 3: Verify payment
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/delivery/cod-settlement/verify`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                settlement_id: orderData.settlement_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              const data = await verifyRes.json();
              showToast(`✅ Payment successful! ₹${orderData.amount} settled.`);
              // Refresh earnings from API to get accurate updated values
              const refreshRes = await fetch(`${API_BASE_URL}/api/delivery/earnings`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (refreshRes.ok) {
                const d = await refreshRes.json();
                setCodPending(d.cod_to_submit || 0);
                setMyEarnings(d.pending_payout || 0);
              }
              // Refresh history
              const histRes = await fetch(`${API_BASE_URL}/api/delivery/cod-settlement/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (histRes.ok) { const d = await histRes.json(); setSettlements(d.settlements || []); }
            } else {
              const err = await verifyRes.json();
              showToast(err.detail || 'Payment verification failed. Contact support.', 'error');
            }
          } catch {
            showToast('Verification failed. Contact support with your payment ID.', 'error');
          }
          setIsPaying(false);
        },
        modal: {
          ondismiss: async () => {
            // BUG-4 fix: pass failure reason from frontend
            await fetch(`${API_BASE_URL}/api/delivery/cod-settlement/failed?reason=Payment+dismissed+by+partner`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                settlement_id: orderData.settlement_id,
                razorpay_order_id: orderData.razorpay_order_id,
                razorpay_payment_id: '',
                razorpay_signature: ''
              })
            }).catch(() => {});
            setIsPaying(false);
          }
        },
        // BUG-4 fix: capture Razorpay payment failure with reason
        'payment.failed': async (response: any) => {
          const reason = response?.error?.description || response?.error?.reason || 'Payment failed';
          await fetch(`${API_BASE_URL}/api/delivery/cod-settlement/failed?reason=${encodeURIComponent(reason)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settlement_id: orderData.settlement_id,
              razorpay_order_id: orderData.razorpay_order_id,
              razorpay_payment_id: response?.error?.metadata?.payment_id || '',
              razorpay_signature: ''
            })
          }).catch(() => {});
          showToast(`Payment failed: ${reason}`, 'error');
          setIsPaying(false);
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      showToast('Network error. Please try again.', 'error');
      setIsPaying(false);
    }
  };

  const submitIssue = async () => {
    if (!issueText.trim()) return;
    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/delivery/report-cod-issue`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToReturn, issue_description: issueText.trim() })
      });
      if (res.ok) {
        const ref = `ENQ-${Date.now().toString().slice(-8)}`;
        setEnquiryRef(ref);
        setIssueText('');
        setShowIssueForm(false);
        showToast('Issue reported. Admin will contact you shortly.');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722, #FF7043)' }}>
      <div style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '12px', padding: '0.875rem 1.25rem', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxWidth: '350px' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <button onClick={() => router.push('/delivery/dashboard')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          ← Back
        </button>
        <h1 style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>💸 Settle COD</h1>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem' }}>

        {amountToReturn === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.1rem', marginBottom: '0.5rem' }}>All Settled!</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>You have no pending COD to return.</div>
          </div>
        ) : (
          <>
            {/* COD Limit warning */}
            {amountToReturn >= 1500 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🚫</span>
                <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
                  COD limit reached (₹1500). New COD orders are blocked until you settle.
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '1.25rem' }}>Settlement Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fef2f2', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '0.875rem' }}>💵 COD Collected from Customers</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>Total cash you received</div>
                  </div>
                  <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '1.2rem' }}>₹{codPending}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f0fdf4', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#166534', fontSize: '0.875rem' }}>🟢 Your Delivery Earnings</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>₹40 per delivery — you keep this</div>
                  </div>
                  <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '1.2rem' }}>₹{myEarnings}</div>
                </div>
                <div style={{ height: '1px', background: '#e5e7eb' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: '#fef3c7', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.95rem' }}>🔵 Amount to Return to Company</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>COD collected − your earnings</div>
                  </div>
                  <div style={{ fontWeight: '800', color: '#d97706', fontSize: '1.4rem' }}>₹{amountToReturn}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.3rem' }}>
                  <span>₹0</span><span>₹1500 limit</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (amountToReturn / 1500) * 100)}%`, background: amountToReturn >= 1500 ? '#ef4444' : amountToReturn >= 1200 ? '#f59e0b' : '#10b981', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Pay Now via Razorpay */}
            {amountToReturn > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
                <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.4rem' }}>Pay via Razorpay</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Pay <strong>₹{amountToReturn}</strong> securely via UPI, Card, or Netbanking
                </div>
                <button
                  onClick={handlePayNow}
                  disabled={isPaying || amountToReturn <= 0}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
                    background: isPaying || amountToReturn <= 0 ? '#9ca3af' : 'linear-gradient(135deg, #FF5722, #FF7043)',
                    color: 'white', fontWeight: '700', fontSize: '1rem',
                    cursor: isPaying || amountToReturn <= 0 ? 'not-allowed' : 'pointer',
                    boxShadow: isPaying || amountToReturn <= 0 ? 'none' : '0 4px 15px rgba(255,87,34,0.35)'
                  }}
                >
                  {isPaying ? '⏳ Opening Payment...' : amountToReturn <= 0 ? '✅ Nothing to Pay' : `💸 Pay ₹${amountToReturn} Now`}
                </button>
              </div>
            )}

            {/* Enquiry reference */}
            {enquiryRef && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: '700', color: '#166534', fontSize: '0.875rem', marginBottom: '0.25rem' }}>✅ Issue Reported</div>
                <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                  Enquiry reference: <strong style={{ fontFamily: 'monospace' }}>{enquiryRef}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Save this. Admin will contact you shortly.</div>
              </div>
            )}

            {/* Can't pay? */}
            {!showIssueForm ? (
              <button onClick={() => setShowIssueForm(true)}
                style={{ width: '100%', padding: '0.75rem', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '12px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}>
                Can&apos;t pay right now? Report an issue
              </button>
            ) : (
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.5rem' }}>Report Payment Issue</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Amount: <strong>₹{amountToReturn}</strong>
                </div>
                <textarea value={issueText} onChange={(e) => setIssueText(e.target.value)}
                  placeholder="e.g. Razorpay not loading, payment failed, wrong amount..."
                  rows={4}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '0.875rem' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#FF5722'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => { setShowIssueForm(false); setIssueText(''); }}
                    style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={submitIssue} disabled={!issueText.trim() || isSubmitting}
                    style={{ flex: 1, padding: '0.75rem', background: !issueText.trim() || isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: !issueText.trim() || isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Settlement History */}
        {settlements.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '1.5rem' }}>
            <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '1rem' }}>Settlement History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {settlements.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: '#f9fafb', borderRadius: '10px', borderLeft: `3px solid ${s.status === 'paid' ? '#10b981' : s.status === 'failed' ? '#ef4444' : '#f59e0b'}` }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>
                      {s.status === 'paid' ? '✅ Paid' : s.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {s.razorpay_payment_id && (
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontFamily: 'monospace', marginTop: '0.1rem' }}>{s.razorpay_payment_id}</div>
                    )}
                    {s.failure_reason && (
                      <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.1rem' }}>{s.failure_reason}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', color: s.status === 'paid' ? '#10b981' : '#374151', fontSize: '1rem' }}>₹{s.amount}</div>
                    {s.after_cod_due !== null && (
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>Due after: ₹{s.after_cod_due}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
