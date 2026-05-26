'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PlatformSettings {
  [key: string]: { value: string; description: string; updated_at: string | null };
}

interface TaxCategory {
  name: string;
  display_name: string;
  tax_percent: number;
  description: string;
}

export default function DeliveryPlatformInfo() {
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/geocode/platform-info`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSettings(data.settings || {});
          setTaxCategories(data.tax_categories || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const settingDisplay: Record<string, { label: string; icon: string; unit: string; relevant: boolean }> = {
    delivery_fee: { label: 'Your Delivery Earning', icon: '💰', unit: '₹', relevant: true },
    cod_limit: { label: 'COD Holding Limit', icon: '💵', unit: '₹', relevant: true },
    delivery_radius_km: { label: 'Order Visibility Radius', icon: '🗺️', unit: 'km', relevant: true },
    restaurant_radius_km: { label: 'Restaurant Delivery Radius', icon: '📍', unit: 'km', relevant: false },
    platform_fee: { label: 'Platform Fee (per order)', icon: '🏢', unit: '₹', relevant: false },
    default_gst_rate: { label: 'Default GST Rate', icon: '📊', unit: '%', relevant: false },
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)' }}>
        <p style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>📢 Platform Info</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>Fees, limits & settings that affect you</p>
          </div>
          <button onClick={() => router.push('/delivery/dashboard')}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.6rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Relevant to you */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', margin: '0 0 1rem' }}>
            💰 Relevant to You
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(settings)
              .filter(([key]) => settingDisplay[key]?.relevant)
              .map(([key, val]) => {
                const meta = settingDisplay[key];
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#166534', fontSize: '0.9rem' }}>{meta.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{val.description}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#166534' }}>
                      {meta.unit === '₹' && '₹'}{val.value}{meta.unit === '%' && '%'}{meta.unit === 'km' && ' km'}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Other settings */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', margin: '0 0 1rem' }}>
            ℹ️ Other Platform Settings
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Object.entries(settings)
              .filter(([key]) => settingDisplay[key] && !settingDisplay[key].relevant)
              .map(([key, val]) => {
                const meta = settingDisplay[key];
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{meta.icon}</span>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{meta.label}</span>
                    </div>
                    <span style={{ fontWeight: '700', color: '#374151' }}>
                      {meta.unit === '₹' && '₹'}{val.value}{meta.unit === '%' && '%'}{meta.unit === 'km' && ' km'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#92400e' }}>
          💡 Your delivery earning is ₹{settings.delivery_fee?.value || '40'} per completed delivery. COD limit is the maximum cash you can hold before settling.
        </div>
      </div>
    </div>
  );
}
