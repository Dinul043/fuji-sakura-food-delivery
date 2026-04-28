'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_BASE_URL, getFullImageUrl } from '../../../config/constants';

interface RestaurantProfile {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  upi_id?: string;
  cuisine_type: string;
  description: string;
  business_license: string;
  food_permit: string;
  restaurant_image?: string;
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
    description: '',
    upi_id: ''
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('error', 'Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showNotification('error', 'File size must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadRestaurantImage = async () => {
    if (!imageFile) return;

    setIsUploadingImage(true);
    try {
      const token = sessionStorage.getItem('restaurantToken');
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${API_BASE_URL}/api/restaurant/upload-restaurant-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        showNotification('success', 'Restaurant image uploaded successfully!');
        
        // Update profile with new image URL
        setProfile(prev => prev ? { ...prev, restaurant_image: result.image_url } : null);
        
        // Clear the file input
        setImageFile(null);
        setImagePreview(null);
        
        // Reset file input
        const fileInput = document.getElementById('restaurant-image-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
      } else {
        const error = await response.json();
        showNotification('error', error.detail || 'Failed to upload image');
      }
    } catch (error) {
      // Silent fallback - no console errors
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('restaurantToken');
      
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
          description: profileData.description,
          upi_id: profileData.upi_id || ''
        });
      } else {
        showNotification('error', 'Failed to load profile data');
        router.push('/restaurant/login');
      }
    } catch (error) {
      // Silent fallback - no console errors
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = sessionStorage.getItem('restaurantToken');

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
        sessionStorage.setItem('restaurantInfo', JSON.stringify(updatedProfile));
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
        description: profile.description,
        upi_id: profile.upi_id || ''
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
          {/* Image Upload Reminder */}
          {!profile?.restaurant_image && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <div>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#92400e',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Restaurant Image Required
                </h4>
                <p style={{ 
                  margin: 0, 
                  color: '#92400e',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  Your restaurant won't appear on the customer home page until you upload a restaurant image. Please upload an image below to make your restaurant visible to customers.
                </p>
              </div>
            </div>
          )}
          
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

            {/* Restaurant Image */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                🖼️ Restaurant Image
              </label>
              
              {/* Current Image Display */}
              {profile?.restaurant_image && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    width: '200px',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #e9ecef',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getFullImageUrl(profile.restaurant_image).startsWith('http') ? (
                      <img 
                        src={getFullImageUrl(profile.restaurant_image)}
                        alt="Restaurant"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div style="
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center; 
                                height: 100%; 
                                color: #6c757d;
                                font-size: 0.8rem;
                                text-align: center;
                                padding: 1rem;
                              ">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🖼️</div>
                                <div>Image not available</div>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        fontSize: '2rem'
                      }}>
                        {getFullImageUrl(profile.restaurant_image)}
                      </div>
                    )}
                  </div>
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0'
                  }}>
                    Current restaurant image
                  </p>
                </div>
              )}

              {/* Image Upload Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  id="restaurant-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                
                <button
                  type="button"
                  onClick={() => document.getElementById('restaurant-image-input')?.click()}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '2px dashed #FF5722',
                    borderRadius: '8px',
                    background: 'rgba(255, 87, 34, 0.05)',
                    color: '#FF5722',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 87, 34, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 87, 34, 0.05)';
                  }}
                >
                  📁 Choose Restaurant Image
                </button>

                {/* Image Preview */}
                {imagePreview && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      width: '200px',
                      height: '120px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #FF5722',
                      position: 'relative',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div style="
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center; 
                                height: 100%; 
                                color: #FF5722;
                                font-size: 0.8rem;
                                text-align: center;
                                padding: 1rem;
                              ">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                                <div>Preview not available</div>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={uploadRestaurantImage}
                        disabled={isUploadingImage}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#FF5722',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                          opacity: isUploadingImage ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isUploadingImage ? '⏳ Uploading...' : '✅ Upload Image'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          const fileInput = document.getElementById('restaurant-image-input') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}

                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#666', 
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Upload a banner image for your restaurant. Recommended size: 400x240px. Max file size: 5MB. Supported formats: JPEG, PNG, WebP.
                </p>
              </div>
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

            {/* UPI ID — mandatory for receiving payouts */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600', fontSize: '0.95rem' }}>
                💳 UPI ID <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '400', marginLeft: '0.5rem' }}>Required for receiving payouts from admin</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.upi_id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, upi_id: e.target.value }))}
                  placeholder="e.g. restaurant@upi or 9876543210@paytm"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${!editForm.upi_id ? '#f59e0b' : '#e9ecef'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#FF5722'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = editForm.upi_id ? '#e9ecef' : '#f59e0b'; }}
                />
              ) : (
                <div style={{
                  padding: '0.75rem',
                  background: profile?.upi_id ? '#f0fdf4' : '#fef3c7',
                  borderRadius: '8px',
                  border: `1px solid ${profile?.upi_id ? '#bbf7d0' : '#fde68a'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {profile?.upi_id ? (
                    <span style={{ color: '#166534', fontWeight: '600' }}>✅ {profile.upi_id}</span>
                  ) : (
                    <span style={{ color: '#92400e', fontWeight: '600' }}>⚠️ Not set — click Edit to add your UPI ID to receive payouts</span>
                  )}
                </div>
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
                {profile?.approved_at ? new Date(profile.approved_at).toLocaleDateString() : 'N/A'}
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