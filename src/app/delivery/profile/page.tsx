/*
 * Delivery Partner Profile Page
 * Route: /delivery/profile
 * Purpose: View and update UPI ID, area, phone
 * DB: delivery_partners (upi_id, area, phone, city, vehicle_type, vehicle_number)
 * API: GET /api/delivery/profile, PUT /api/delivery/profile
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DeliveryPartner {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  city: string;
  area: string | null;
  upi_id: string | null;
  is_available: boolean;
  status: number;
}

export default function DeliveryProfilePage() {
  const router = useRouter();
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Editable fields
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [upiId, setUpiId] = useState('');

  const getToken = () => (localStorage.getItem('deliveryToken') || sessionStorage.getItem('deliveryToken'));

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/delivery/login'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/profile`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartner(data);
        setPhone(data.phone || '');
        setCity(data.city || '');
        setArea(data.area || '');
        setUpiId(data.upi_id || '');
      } else if (res.status === 401) {
        router.push('/delivery/login');
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!upiId.trim()) { showToast('UPI ID is required to take orders', 'error'); return; }
    setIsSaving(true);
    try {
      const params = new URLSearchParams();
      if (phone.trim()) params.append('phone', phone.trim());
      if (city.trim()) params.append('city', city.trim());
      if (area.trim()) params.append('area', area.trim());
      params.append('upi_id', upiId.trim());

      const res = await fetch(`${API_BASE_URL}/api/delivery/profile?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartner(data.partner);
        // Update sessionStorage
        const stored = (localStorage.getItem('deliveryPartner') || sessionStorage.getItem('deliveryPartner'));
        if (stored) {
          const p = JSON.parse(stored);
          sessionStorage.setItem('deliveryPartner', JSON.stringify({ ...p, upi_id: upiId.trim(), area: area.trim(), phone: phone.trim() }));
        }
        setIsEditing(false);
        showToast('Profile updated successfully!');
      } else {
        const d = await res.json();
        showToast(d.detail || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem', borderRadius: '12px',
    border: '2px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', backgroundColor: '#fafafa', fontFamily: 'inherit'
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722, #FF7043)' }}>
      <div style={{ color: 'white', fontSize: '1rem' }}>Loading...</div>
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
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <button onClick={() => router.push('/delivery/dashboard')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          ← Dashboard
        </button>
        <h1 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>My Profile</h1>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.5rem' }}>

        {/* UPI Warning */}
        {!partner?.upi_id && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.9rem' }}>UPI ID required</div>
              <div style={{ color: '#b45309', fontSize: '0.8rem' }}>Add your UPI ID below to start accepting delivery orders.</div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>

          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5722, #FF7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.3rem', flexShrink: 0 }}>
              {partner?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.1rem' }}>{partner?.name}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{partner?.email}</div>
              <div style={{ marginTop: '0.25rem' }}>
                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: '#d1fae5', color: '#065f46' }}>
                  ✅ Approved Partner
                </span>
              </div>
            </div>
          </div>

          {/* Read-only fields */}
          {[
            { label: '🛵 Vehicle', value: `${partner?.vehicle_type} · ${partner?.vehicle_number}` },
            { label: '🏙️ City', value: partner?.city || '—' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{f.label}</div>
              <div style={{ fontSize: '0.95rem', color: '#374151', fontWeight: '500' }}>{f.value}</div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            {!isEditing ? (
              <>
                {[
                  { label: '📞 Phone', value: partner?.phone || '—' },
                  { label: '📍 Area', value: partner?.area || 'Not set' },
                  { label: '💳 UPI ID', value: partner?.upi_id || 'Not set — required before taking orders', highlight: !partner?.upi_id },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{f.label}</div>
                    <div style={{ fontSize: '0.95rem', color: f.highlight ? '#ef4444' : '#374151', fontWeight: f.highlight ? '600' : '500' }}>{f.value}</div>
                  </div>
                ))}
                <button onClick={() => setIsEditing(true)}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(255,87,34,0.3)' }}>
                  ✏️ Edit Profile
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Location change warning */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1d4ed8' }}>
                  ℹ️ Changing city or area updates which orders you see. Cannot change during an active delivery.
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>📞 Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>🏙️ City *</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Chennai, Coimbatore" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>📍 Area / Locality *</label>
                  <input value={area} onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Velachery, T. Nagar, Karapakkam" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Required — used to match you with nearby orders</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                    💳 UPI ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@upi or 9876543210@paytm" style={{ ...inputStyle, borderColor: !upiId.trim() ? '#fca5a5' : '#e2e8f0' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = !upiId.trim() ? '#fca5a5' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Required to receive delivery payments</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => { setIsEditing(false); setPhone(partner?.phone || ''); setCity(partner?.city || ''); setArea(partner?.area || ''); setUpiId(partner?.upi_id || ''); }}
                    style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', color: '#555', fontWeight: '600', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving}
                    style={{ flex: 2, padding: '0.875rem', borderRadius: '12px', border: 'none', background: isSaving ? '#9ca3af' : 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                    {isSaving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
