'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
  updated_at: string | null;
}

interface TaxCategory {
  id: number;
  name: string;
  display_name: string;
  tax_percent: number;
  description: string;
  is_active: boolean;
  updated_at: string | null;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = () => localStorage.getItem('adminToken');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/admin'); return; }
    fetchSettings();
    fetchTaxCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
        const vals: Record<string, string> = {};
        (data.settings || []).forEach((s: Setting) => { vals[s.key] = s.value; });
        setEditValues(vals);
      }
    } catch {} finally { setIsLoading(false); }
  };

  const fetchTaxCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tax-categories`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaxCategories(data.categories || []);
      }
    } catch {}
  };

  const saveSetting = async (key: string) => {
    setIsSaving(key);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValues[key] })
      });
      if (res.ok) {
        showToast(`✅ ${key.replace(/_/g, ' ')} updated successfully`);
        fetchSettings();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to update', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSaving(null); }
  };

  const saveTaxCategory = async (cat: TaxCategory, newPercent: number) => {
    setIsSaving(cat.name);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tax-categories`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cat.name, tax_percent: newPercent })
      });
      if (res.ok) {
        showToast(`✅ ${cat.display_name} tax updated to ${newPercent}%`);
        fetchTaxCategories();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to update', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSaving(null); }
  };

  const settingLabels: Record<string, { label: string; icon: string; unit: string }> = {
    delivery_fee: { label: 'Delivery Fee', icon: '🛵', unit: '₹' },
    cod_limit: { label: 'COD Limit', icon: '💵', unit: '₹' },
    restaurant_radius_km: { label: 'Restaurant Delivery Radius', icon: '📍', unit: 'km' },
    delivery_radius_km: { label: 'Partner Order Radius', icon: '🗺️', unit: 'km' },
    platform_fee: { label: 'Platform Fee', icon: '🏢', unit: '₹' },
    default_gst_rate: { label: 'Default GST Rate', icon: '📊', unit: '%' },
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Loading Settings...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '12px', padding: '1rem 1.5rem',
          color: toast.type === 'success' ? '#166534' : '#dc2626',
          fontWeight: '600', fontSize: '0.9rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white', margin: 0 }}>⚙️ Platform Settings</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>Manage fees, tax rates, limits & radius</p>
          </div>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '25px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {/* Platform Settings Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏢 Business Parameters
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {settings.map(s => {
              const meta = settingLabels[s.key] || { label: s.key, icon: '⚙️', unit: '' };
              const hasChanged = editValues[s.key] !== s.value;
              return (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', background: hasChanged ? '#fff5f2' : '#f9fafb', borderRadius: '14px',
                  border: hasChanged ? '2px solid #FF5722' : '1px solid #e5e7eb',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '1.5rem', width: '40px', textAlign: 'center' }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.95rem' }}>{meta.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>{s.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, minWidth: '180px', justifyContent: 'flex-end' }}>
                    <input
                      type="number"
                      value={editValues[s.key] || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                      style={{
                        width: '90px', padding: '0.6rem 0.5rem', borderRadius: '10px',
                        border: '2px solid #e2e8f0', fontSize: '1.1rem', fontWeight: '700',
                        textAlign: 'center', outline: 'none', background: 'white'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#FF5722'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                    />
                    <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '0.9rem', width: '25px' }}>{meta.unit}</span>
                    {hasChanged ? (
                      <button
                        onClick={() => saveSetting(s.key)}
                        disabled={isSaving === s.key}
                        style={{
                          padding: '0.6rem 1.1rem', borderRadius: '10px', border: 'none',
                          background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700',
                          fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,87,34,0.3)',
                          width: '60px', textAlign: 'center'
                        }}
                      >
                        {isSaving === s.key ? '...' : 'Save'}
                      </button>
                    ) : (
                      <div style={{ width: '60px' }}></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax Categories Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 GST Tax Categories
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 1.5rem' }}>
            Applied automatically based on menu item category. Changes notify all restaurants via email.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {taxCategories.map(cat => (
              <div key={cat.name} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem', background: '#f9fafb', borderRadius: '14px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.95rem' }}>{cat.display_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>{cat.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <input
                    type="number"
                    defaultValue={cat.tax_percent}
                    min={0} max={50} step={0.5}
                    id={`tax-${cat.name}`}
                    style={{
                      width: '70px', padding: '0.5rem', borderRadius: '8px',
                      border: '2px solid #e2e8f0', fontSize: '1rem', fontWeight: '700',
                      textAlign: 'center', outline: 'none'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                  />
                  <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '0.85rem' }}>%</span>
                  <button
                    onClick={() => {
                      const input = document.getElementById(`tax-${cat.name}`) as HTMLInputElement;
                      const newVal = parseFloat(input.value);
                      if (!isNaN(newVal) && newVal !== cat.tax_percent) {
                        saveTaxCategory(cat, newVal);
                      }
                    }}
                    disabled={isSaving === cat.name}
                    style={{
                      padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none',
                      background: '#10b981', color: 'white', fontWeight: '700',
                      fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    {isSaving === cat.name ? '...' : 'Update'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '14px', padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
          ℹ️ Changes take effect immediately. Restaurants are notified via email when delivery fee, GST rate, or platform fee changes.
        </div>
      </div>
    </div>
  );
}
