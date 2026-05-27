'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_image: string | null;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Contact & address state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { getValidToken } = await import('@/utils/authHelper');
      const token = await getValidToken();
      if (!token) { router.push('/login'); return; }

      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) { router.push('/login'); return; }

      const data = await res.json();
      setProfile(data);
      setNewName(data.name);
      setNewPhone(data.phone || '');
      setNewAddress(data.address || '');
    } catch {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), phone: profile?.phone, address: profile?.address })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, name: data.name } : null);
        localStorage.setItem('userName', data.name);
        setIsEditingName(false);
        showToast('success', 'Name updated successfully!');
      } else {
        const err = await res.json();
        showToast('error', err.detail || 'Failed to update name');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveContact = async () => {
    if (!profile) return;
    setIsSavingContact(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: profile.name || newName.trim() || 'User',
          phone: newPhone.trim() || null, 
          address: newAddress.trim() || null 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, phone: data.phone, address: data.address } : null);
        setIsEditingContact(false);
        showToast('success', 'Contact details updated!');
      } else {
        const err = await res.json();
        showToast('error', err.detail || 'Failed to update contact');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('error', 'Please fill all password fields'); return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match'); return;
    }

    setIsSavingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/me/change-password`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      if (res.ok) {
        showToast('success', 'Password changed successfully!');
        setShowPasswordForm(false);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        const err = await res.json();
        showToast('error', err.detail || 'Failed to change password');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) { showToast('error', 'Only JPEG, PNG, WebP allowed'); return; }
    setIsUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/auth/me/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, profile_image: data.profile_image } : null);
        localStorage.setItem('userProfileImage', data.profile_image);
        showToast('success', 'Profile photo updated!');
      } else {
        showToast('error', 'Failed to upload image');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
          padding: '3rem', textAlign: 'center'
        }}>
          <div style={{
            width: '50px', height: '50px',
            border: '4px solid #f3f4f6', borderTop: '4px solid #ff6b6b',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#666', margin: 0 }}>Loading profile...</p>
        </div>
        <style jsx>{`
          @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      padding: '2rem'
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', borderRadius: '14px', padding: '1rem 1.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideInRight 0.3s ease-out', fontSize: '0.95rem', fontWeight: '600'
        }}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem',
        background: 'rgba(20, 10, 40, 0.55)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '0 0 24px 24px',
        padding: '1rem 2rem',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 100,
        margin: '-2rem -2rem 2rem -2rem'
      }}>
        <button
          onClick={() => router.push('/home')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px', padding: '0.6rem 1rem',
            color: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
        >
          ← Back
        </button>
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          🌸 My Profile
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Avatar + Name Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
          padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          {/* Avatar - click to upload */}
          <div style={{ position: 'relative', width: '90px', margin: '0 auto 1rem', cursor: 'pointer' }}
            onClick={() => document.getElementById('avatarInput')?.click()}
          >
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b, #5f27cd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: '700', color: 'white',
              boxShadow: '0 8px 24px rgba(255,107,107,0.4)',
              overflow: 'hidden'
            }}>
              {profile?.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE_URL}${profile.profile_image}`}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                profile ? getInitials(profile.name) : '?'
              )}
            </div>
            {/* Camera badge */}
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b, #5f27cd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', border: '2px solid white'
            }}>
              {isUploadingImage ? '⏳' : '📷'}
            </div>
            <input
              id="avatarInput" type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={handleImageUpload}
            />
          </div>

          {/* Name */}
          {isEditingName ? (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                style={{
                  padding: '0.6rem 1rem', borderRadius: '10px',
                  border: '2px solid #ff6b6b', fontSize: '1.1rem',
                  outline: 'none', textAlign: 'center', width: '200px'
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={isSavingName}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                {isSavingName ? '...' : 'Save'}
              </button>
              <button
                onClick={() => { setIsEditingName(false); setNewName(profile?.name || ''); }}
                style={{
                  padding: '0.6rem 1rem', borderRadius: '10px',
                  border: '2px solid #e5e7eb', background: 'white',
                  color: '#666', cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {profile?.name}
              </h2>
              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  background: 'rgba(255,107,107,0.1)', border: 'none',
                  borderRadius: '8px', padding: '0.4rem 0.75rem',
                  color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                }}
              >
                ✏️ Edit
              </button>
            </div>
          )}

          <p style={{ color: '#6b7280', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
            {profile?.email}
          </p>
          {profile?.is_verified && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: '#d1fae5', color: '#059669',
              padding: '0.3rem 0.75rem', borderRadius: '20px',
              fontSize: '0.8rem', fontWeight: '600', marginTop: '0.75rem'
            }}>
              ✓ Verified Account
            </span>
          )}
        </div>

        {/* Account Info Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
          padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1.25rem' }}>
            Account Details
          </h3>
          {[
            { label: 'Email', value: profile?.email, icon: '📧' },
            { label: 'Member Since', value: formatDate(profile?.created_at || ''), icon: '📅' },
            { label: 'Last Login', value: formatDate(profile?.last_login || ''), icon: '🕐' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.875rem 0',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact & Address Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
          padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              📋 Contact & Address
            </h3>
            {!isEditingContact && (
              <button
                onClick={() => setIsEditingContact(true)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                }}
              >
                Edit
              </button>
            )}
          </div>

          {isEditingContact ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  📞 Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{  
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                    border: '2px solid #e5e7eb', fontSize: '0.95rem', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b6b'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                />
              </div>
              <div>
                <label style={{ fontSize:  '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  📍 Default Delivery Address
                </label>
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter your default delivery address (auto-fills at checkout)..."
                  rows={3}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                    border: '2px solid #e5e7eb', fontSize: '0.95rem', outline: 'none',
                    boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b6b'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleSaveContact}
                  disabled={isSavingContact}
                  style={{
                    flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none',
                    background: isSavingContact ? '#9ca3af' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white', fontSize: '1rem', fontWeight: '600',
                    cursor: isSavingContact ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSavingContact ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setIsEditingContact(false); setNewPhone(profile?.phone || ''); setNewAddress(profile?.address || ''); }}
                  style={{
                    padding: '0.875rem 1.5rem', borderRadius: '12px',
                    border: '2px solid #e5e7eb', background: 'white',
                    color: '#666', cursor: 'pointer', fontSize: '1rem', fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {[
                { label: 'Phone', value: profile?.phone || 'Not added', icon: '📞' },
                { label: 'Address', value: profile?.address || 'Not added', icon: '📍' },
              ].map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  padding: '0.875rem 0',
                  borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>{item.label}</p>
                    <p style={{
                      margin: 0, fontSize: '0.95rem', fontWeight: '600',
                      color: item.value === 'Not added' ? '#d1d5db' : '#1f2937',
                      fontStyle: item.value === 'Not added' ? 'italic' : 'normal'
                    }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Location Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
          padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              📍 Delivery Location
            </h3>
          </div>
          
          <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 1rem' }}>
            Where should we deliver? This is separate from your profile address.
          </p>

          {/* Current delivery location */}
          {typeof window !== 'undefined' && localStorage.getItem('userLocationAddress') ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px',
              padding: '0.875rem 1rem', marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.3rem' }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>Current Delivery Location</div>
                <div style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: '600', marginTop: '0.15rem' }}>
                  {localStorage.getItem('userLocationAddress')}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px',
              padding: '0.875rem 1rem', marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.3rem' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600' }}>No delivery location set</div>
                <div style={{ fontSize: '0.75rem', color: '#a16207' }}>Detect your location to see nearby restaurants</div>
              </div>
            </div>
          )}

          {/* Detect location button */}
          <button
            onClick={async () => {
              if (!navigator.geolocation) { showToast('error', 'Geolocation not supported'); return; }
              const btn = document.getElementById('profile-detect-btn');
              if (btn) { btn.textContent = '⏳ Detecting...'; (btn as HTMLButtonElement).disabled = true; }
              try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
                  });
                });
                const { latitude, longitude } = position.coords;
                const res = await fetch(`${API_BASE_URL}/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
                let label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                let fullAddress = label;
                let cityVal = '';
                let areaVal = '';
                if (res.ok) {
                  const data = await res.json();
                  label = data.area ? `${data.area}, ${data.city}` : data.city || data.full_address;
                  fullAddress = data.full_address || label;
                  cityVal = data.city || '';
                  areaVal = data.area || '';
                }
                localStorage.setItem('userLat', latitude.toString());
                localStorage.setItem('userLng', longitude.toString());
                localStorage.setItem('userLocationAddress', label);
                
                // Save to user_addresses table in DB
                const token = localStorage.getItem('token');
                if (token) {
                  fetch(`${API_BASE_URL}/api/geocode/addresses`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      label: 'Current',
                      full_address: fullAddress,
                      city: cityVal,
                      area: areaVal,
                      latitude: latitude,
                      longitude: longitude,
                      is_default: true
                    })
                  }).catch(() => {});
                }
                
                showToast('success', `📍 Location updated: ${label}`);
                setProfile(prev => prev ? { ...prev } : null); // Force re-render
              } catch {
                showToast('error', 'Could not detect location. Please allow GPS access in browser settings.');
              } finally {
                const btn = document.getElementById('profile-detect-btn');
                if (btn) { btn.textContent = '📍 Detect My Location'; (btn as HTMLButtonElement).disabled = false; }
              }
            }}
            id="profile-detect-btn"
            style={{
              width: '100%', padding: '0.875rem', borderRadius: '12px', border: '2px solid #FF5722',
              background: 'linear-gradient(135deg, #fff5f2, #ffffff)', color: '#FF5722',
              fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
            }}
          >
            📍 Detect My Location
          </button>
        </div>

        {/* Change Password Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
          padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPasswordForm ? '1.25rem' : 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              🔒 Change Password
            </h3>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                background: showPasswordForm ? '#f3f4f6' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                color: showPasswordForm ? '#666' : 'white',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
              }}
            >
              {showPasswordForm ? 'Cancel' : 'Change'}
            </button>
          </div>

          {showPasswordForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Current Password', value: currentPassword, setter: setCurrentPassword },
                { label: 'New Password', value: newPassword, setter: setNewPassword },
                { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword },
              ].map((field) => (
                <div key={field.label}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                    {field.label}
                  </label>
                  <input
                    type="password"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      borderRadius: '10px', border: '2px solid #e5e7eb',
                      fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b6b'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  />
                </div>
              ))}
              <button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                style={{
                  padding: '0.875rem', borderRadius: '12px', border: 'none',
                  background: isSavingPassword ? '#9ca3af' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  color: 'white', fontSize: '1rem', fontWeight: '600',
                  cursor: isSavingPassword ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Links removed - back button handles home, orders in main nav */}

      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
