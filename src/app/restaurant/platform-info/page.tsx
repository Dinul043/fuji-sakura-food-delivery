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

export default function RestaurantPlatformInfo() {
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

  const settingDisplay: Record<string, { label: string; icon: string; unit: string }> = {
    delivery_fee: { label: 'Delivery Fee', icon: '🛵', unit: '₹' },
    cod_limit: { label: 'COD Limit for Partners', icon: '💵', unit: '₹' },
    restaurant_radius_km: { label: 'Delivery Radius', icon: '📍', unit: 'km' },
    delivery_radius_km: { label: 'Partner Order Radius', icon: '🗺️', unit: 'km' },
    platform_fee: { label: 'Platform Fee', icon: '🏢', unit: '₹' },
    default_gst_rate: { label: 'Default GST Rate', icon: '📊', unit: '%' },
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)' }}>
        <p style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF7EE', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722, #FF7043)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>📢 Platform Information</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>Current fees, tax rates & delivery settings</p>
          </div>
          <button onClick={() => router.push('/restaurant/dashboard')}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Platform Settings */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: '0 0 1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            🏢 Current Platform Settings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {Object.entries(settings).map(([key, val]) => {
              const meta = settingDisplay[key] || { label: key, icon: '⚙️', unit: '' };
              return (
                <div key={key} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111827' }}>
                    {meta.unit === '₹' && '₹'}{val.value}{meta.unit === '%' && '%'}{meta.unit === 'km' && ' km'}
                  </div>
                  {val.updated_at && (
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                      Updated: {new Date(val.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax Categories */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: '0 0 1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            📊 GST Tax Rates
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {taxCategories.map(cat => (
              <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>{cat.display_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{cat.description}</div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FF5722' }}>{cat.tax_percent}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ marginTop: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#1d4ed8' }}>
          ℹ️ These settings are managed by the platform admin. Tax is applied automatically based on menu item category. Delivery fee is charged per order.
        </div>
      </div>
    </div>
  );
}
