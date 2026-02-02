'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RestaurantProfile {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  cuisine_type: string;
  description: string;
  business_license: string;
  food_permit: string;
  status: string;
  created_at: string;
  approved_at: string;
}

export default function RestaurantProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    address: '',
    cuisine_type: '',
    description: ''
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('restaurantToken');
      
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/restaurant/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setEditForm({
          business_name: profileData.business_name,
          owner_name: profileData.owner_name,
          phone: profileData.phone,
          address: profileData.address,
          cuisine_type: profileData.cuisine_type,
          description: profileData.description
        });
      } else {
        showNotification('error', 'Failed to load profile data');
        router.push('/restaurant/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('restaurantToken');

      const response = await fetch(`${API_BASE_URL}/api/restaurant/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(prev => ({ ...prev, ...result.profile }));
        setIsEditing(false);
        showNotification('success', 'Profile updated successfully!');
        
        // Update localStorage with new data
        const updatedProfile = { ...profile, ...result.profile };
        localStorage.setItem('restaurantInfo', JSON.stringify(updatedProfile));
      } else {
        const error = await response.json();
        showNotification('error', error.detail || 'Failed to update profile');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        business_name: profile.business_name,
        owner_name: profile.owner_name,
        phone: profile.phone,
        address: profile.address,
        cuisine_type: profile.cuisine_type,
        description: profile.description
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #FF5722', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/images/logo/Logo.png" alt="Fuji Sakura" width={120} height={36} />
          <div style={{ 
            width: '1px', 
            height: '30px', 
            background: '#e0e0e0' 
          }}></div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            color: '#333',
            fontWeight: '600'
          }}>
            Restaurant Profile
          </h1>
        </div>
        
        <button
          onClick={() => router.push('/restaurant/dashboard')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: 'white',
            color: '#666',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div>
              <h2 style={{ 
                margin: '0 0 0.5rem 0', 
                color: '#333',
                fontSize: '1.8rem',
                fontWeight: '600'
              }}>
                🏪 {profile?.business_name}
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#666',
                fontSize: '1rem'
              }}>
                Manage your restaurant information and settings
              </p>
            </div>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#666',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSaving ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSaving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Business Name */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                🏪 Business Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5722';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              ) : (
                <p style={{ 
                  margin: 0, 
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333'
                }}>
                  {profile?.business_name}
                </p>
              )}
            </div>

            {/* Owner Name */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                👤 Owner Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5722';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              ) : (
                <p style={{ 
                  margin: 0, 
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333'
                }}>
                  {profile?.owner_name}
                </p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                📧 Email Address
              </label>
              <p style={{ 
                margin: 0, 
                padding: '0.75rem',
                background: '#f1f3f4',
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#666',
                border: '1px solid #e0e0e0'
              }}>
                {profile?.email} <span style={{ fontSize: '0.8rem', color: '#999' }}>(Cannot be changed)</span>
              </p>
            </div>

            {/* Phone */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                📞 Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5722';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              ) : (
                <p style={{ 
                  margin: 0, 
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333'
                }}>
                  {profile?.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                📍 Restaurant Address
              </label>
              {isEditing ? (
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5722';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              ) : (
                <p style={{ 
                  margin: 0, 
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                  lineHeight: '1.5'
                }}>
                  {profile?.address}
                </p>
              )}
            </div>

            {/* Cuisine Type */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                🍽️ Cuisine Type
              </label>
              {isEditing ? (
                <select
                  value={editForm.cuisine_type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cuisine_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5722';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                >
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Thai">Thai</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Continental">Continental</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Multi-Cuisine">Multi-Cuisine</option>
                </select>
              ) : (
                <p style={{ 
                  margin: 0, 
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333'
                }}>
                  {profile?.cuisine_type}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                📝 Restaurant Description
              </label>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Tell customers about your restaurant..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5722';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              ) : (
                <p style={{ 
                  margin: 0, 
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                  lineHeight: '1.6',
                  fontStyle: 'italic'
                }}>
                  "{profile?.description}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Application Details (Read-only) */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#333',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            📋 Application Details
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>
                📄 BUSINESS LICENSE
              </p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
                {profile?.business_license}
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>
                🍽️ FOOD PERMIT
              </p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
                {profile?.food_permit}
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem',
              background: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c3e6c3'
            }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#2e7d32', fontWeight: '600' }}>
                ✅ STATUS
              </p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#2e7d32', fontWeight: '600' }}>
                APPROVED
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>
                📅 APPROVED ON
              </p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
                {profile?.approved_at ? new Date(profile.approved_at + 'Z').toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: notification.type === 'success' ? '#4CAF50' : '#F44336',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 1001,
          maxWidth: '400px'
        }}>
          <div style={{ fontWeight: '600' }}>
            {notification.message}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}