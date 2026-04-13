/*
 * Delivery Partner Apply Page
 * ✅ Phase 1: DB tables created — delivery_partners, delivery_tokens
 * ✅ Phase 2: Application form + POST /api/delivery/apply (this page)
 * ✅ Phase 3: Admin approval UI in admin dashboard
 * 🔜 Phase 4: Login page — /delivery/login
 * 🔜 Phase 5: Dashboard — available orders, accept, complete
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DeliveryApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    vehicle_type: '', vehicle_number: '', city: '', area: '', upi_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.vehicle_type) e.vehicle_type = 'Select a vehicle type';
    if (!form.vehicle_number.trim()) e.vehicle_number = 'Vehicle number is required';
    if (!form.city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password.trim(),
          vehicle_type: form.vehicle_type,
          vehicle_number: form.vehicle_number.trim(),
          city: form.city.trim(),
          area: form.area.trim(),
          upi_id: form.upi_id.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setErrors({ submit: data.detail || 'Failed to submit application' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '0.875rem 1rem', borderRadius: '12px',
    border: `2px solid ${errors[field] ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: '#fafafa', fontFamily: 'inherit'
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: '600',
    color: '#374151', marginBottom: '0.4rem'
  };

  // Success screen
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
        alignItems: 'center', justifyContent: 'center', padding: '2rem'
      }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '3rem 2rem', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 25px 80px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937', margin: '0 0 1rem' }}>Application Submitted!</h2>
          <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 2rem' }}>
            We've received your application. Our team will review it and notify you via email once approved.
          </p>
          <button onClick={() => router.push('/delivery')}
            style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
            Back to Delivery Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
      alignItems: 'center', justifyContent: 'center', padding: '2rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '2.5rem 2rem',
        maxWidth: '520px', width: '100%',
        boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #FF5722, #FF7043, #FF8A65)' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px',
            background: 'linear-gradient(135deg, #FF5722, #FF7043)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem',
            boxShadow: '0 8px 25px rgba(255,87,34,0.3)'
          }}>
            🛵
          </div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: '800',
            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 0.5rem'
          }}>
            Become a Delivery Partner
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Fill in your details to apply</p>
        </div>

        {errors.submit && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name" style={inputStyle('name')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.name ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            {errors.name && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com" style={inputStyle('email')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              placeholder="10-digit mobile number" style={inputStyle('phone')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.phone ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            {errors.phone && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.phone}</p>}
          </div>

          {/* Vehicle type + number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Vehicle Type *</label>
              <select value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}
                style={{ ...inputStyle('vehicle_type'), cursor: 'pointer' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.vehicle_type ? '#ef4444' : '#e2e8f0'; }}>
                <option value="">Select</option>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
              </select>
              {errors.vehicle_type && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.vehicle_type}</p>}
            </div>
            <div>
              <label style={labelStyle}>Vehicle Number *</label>
              <input value={form.vehicle_number} onChange={e => setForm(p => ({ ...p, vehicle_number: e.target.value }))}
                placeholder="TN 01 AB 1234" style={inputStyle('vehicle_number')}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.vehicle_number ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
              {errors.vehicle_number && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.vehicle_number}</p>}
            </div>
          </div>

          {/* City */}
          <div>
            <label style={labelStyle}>City / Delivery Area *</label>
            <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Chennai, Coimbatore" style={inputStyle('city')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.city ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            {errors.city && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.city}</p>}
          </div>

          {/* Area */}
          <div>
            <label style={labelStyle}>Area / Locality (optional)</label>
            <input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
              placeholder="e.g. Velachery, OMR, T Nagar" style={inputStyle('area')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Helps match you with nearby orders</p>
          </div>

          {/* UPI ID */}
          <div>
            <label style={labelStyle}>UPI ID (optional — required before taking orders)</label>
            <input value={form.upi_id} onChange={e => setForm(p => ({ ...p, upi_id: e.target.value }))}
              placeholder="e.g. yourname@upi" style={inputStyle('upi_id')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Min 8 characters" style={inputStyle('password')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Re-enter password" style={inputStyle('confirmPassword')}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.confirmPassword ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={isLoading}
            style={{
              width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #FF5722, #FF7043)',
              color: 'white', fontWeight: '700', fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem',
              boxShadow: isLoading ? 'none' : '0 4px 15px rgba(255,87,34,0.3)'
            }}>
            {isLoading ? 'Submitting...' : '🚀 Submit Application'}
          </button>

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Already a partner?{' '}
            <button type="button" onClick={() => router.push('/delivery/login')}
              style={{ background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'underline' }}>
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
