'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_BASE_URL } from '../../../config/constants';

interface MenuItem {
  id: number;
  item_name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  isVeg: boolean;  // Changed to camelCase to match backend response
  restaurant_id: number;
  created_at: string;
  updated_at: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

interface ApiMenuItem {
  item_name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_veg: boolean;
}

export default function MenuManagement() {
  const router = useRouter();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [newItem, setNewItem] = useState({
    item_name: '',
    description: '',
    price: '',
    category: 'Appetizers',
    is_veg: true,
    image_url: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkAuthAndLoadMenu();
  }, []);

  const checkAuthAndLoadMenu = async () => {
    try {
      const token = localStorage.getItem('restaurantToken');
      const restaurantInfo = localStorage.getItem('restaurantInfo');
      
      if (!token || !restaurantInfo) {
        router.push('/restaurant/login');
        return;
      }

      const restaurant = JSON.parse(restaurantInfo);
      setRestaurantData(restaurant);
      
      // Load available categories and menu items
      await Promise.all([
        loadAvailableCategories(),
        loadMenuItems(token)
      ]);
      
    } catch (error) {
      // Silent fallback - no console errors
      router.push('/restaurant/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/categories`);
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories);
        // Set default category for new items
        if (data.categories.length > 0) {
          setNewItem(prev => ({ ...prev, category: data.categories[0] }));
        }
      }
    } catch (error) {
      // Silent fallback - no console errors
    }
  };

  const loadMenuItems = async (token: string) => {
    try {
      console.log('📥 Loading menu items...');
      const response = await fetch(`${API_BASE_URL}/api/menu/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const menuItems: MenuItem[] = await response.json();
        console.log('📋 Loaded menu items:', menuItems);
        
        // Group items by category
        const groupedItems: { [key: string]: MenuItem[] } = {};
        menuItems.forEach(item => {
          if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
          }
          groupedItems[item.category].push(item);
        });

        // Convert to MenuCategory format
        const categories: MenuCategory[] = Object.entries(groupedItems).map(([name, items]) => ({
          name,
          items
        }));

        setMenuCategories(categories);
        console.log('✅ Menu categories updated');
      } else {
        console.error('❌ Failed to load menu items');
      }
    } catch (error) {
      console.error('❌ Error loading menu items:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.item_name || !newItem.price) return;
    
    try {
      console.log('🍽️ Adding menu item:', newItem.item_name);
      
      const token = localStorage.getItem('restaurantToken');
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      let imageUrl = newItem.image_url;

      // If user selected a new image, upload it first
      if (selectedImage) {
        console.log('📸 Uploading selected image:', selectedImage.name);
        imageUrl = await uploadImage(selectedImage);
        console.log('🖼️ Image upload result:', imageUrl);
      }

      const menuItemData: ApiMenuItem = {
        item_name: newItem.item_name,
        description: newItem.description || undefined,
        price: parseFloat(newItem.price),
        category: newItem.category,
        image_url: imageUrl || undefined,
        is_veg: newItem.is_veg
      };

      console.log('📤 Sending menu item data:', menuItemData);

      const response = await fetch(`${API_BASE_URL}/api/menu/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(menuItemData)
      });

      console.log('📡 Menu item creation response:', response.status);

      if (response.ok) {
        console.log('✅ Menu item created successfully');
        // Reload menu items to get the updated list
        await loadMenuItems(token);
        resetForm();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        // Silent fallback - no console errors
        alert(`Failed to add menu item: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      // Silent fallback - no console errors
      alert('Failed to add menu item. Please try again.');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !newItem.item_name || !newItem.price) return;
    
    try {
      console.log('🔄 Starting update for item:', editingItem.id);
      console.log('📝 Update data:', {
        item_name: newItem.item_name,
        is_veg: newItem.is_veg,
        price: newItem.price,
        category: newItem.category
      });
      
      const token = localStorage.getItem('restaurantToken');
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      let imageUrl = newItem.image_url;

      // If user selected a new image, upload it first
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const menuItemData: ApiMenuItem = {
        item_name: newItem.item_name,
        description: newItem.description || undefined,
        price: parseFloat(newItem.price),
        category: newItem.category,
        image_url: imageUrl || undefined,
        is_veg: newItem.is_veg
      };

      console.log('📤 Sending update request:', menuItemData);

      const response = await fetch(`${API_BASE_URL}/api/menu/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(menuItemData)
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const updatedItem = await response.json();
        console.log('✅ Update successful:', updatedItem);
        
        // Reload menu items to get the updated list
        await loadMenuItems(token);
        resetForm();
        setEditingItem(null);
        setShowAddModal(false);
      } else {
        const error = await response.json();
        console.error('❌ Update failed:', error);
        alert(`Failed to update menu item: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      alert('Failed to update menu item. Please try again.');
    }
  };

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log('🔄 Starting image upload...', file.name);
      
      const formData = new FormData();
      formData.append('file', file);  // Changed from 'image' to 'file'

      const token = localStorage.getItem('restaurantToken');
      console.log('🔑 Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/api/menu/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📡 Upload response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        return result.image_url;
      } else {
        const errorText = await response.text();
        // Silent fallback - no console errors
        // If upload fails, return empty string so we use smart defaults
        // Silent fallback - image upload failed, will use smart default image
        return '';
      }
    } catch (error) {
      // Silent fallback - no console errors
      // If upload fails, return empty string so we use smart defaults
      return '';
    }
  };

  const resetForm = () => {
    setNewItem({
      item_name: '',
      description: '',
      price: '',
      category: availableCategories[0] || 'Appetizers',
      is_veg: true,
      image_url: ''
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setNewItem(prev => ({ ...prev, image_url: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      item_name: item.item_name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      is_veg: item.isVeg,  // Map from isVeg to is_veg for form state
      image_url: item.image_url || ''
    });
    setImagePreview(item.image_url || '');
    setShowAddModal(true);
  };

  const toggleAvailability = async (itemId: number) => {
    try {
      const token = localStorage.getItem('restaurantToken');
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/menu/${itemId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Reload menu items to get the updated availability
        await loadMenuItems(token);
      } else {
        const error = await response.json();
        alert(`Failed to toggle availability: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      // Silent fallback - no console errors
      alert('Failed to toggle availability. Please try again.');
    }
  };

  const deleteItem = async (itemId: number) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('restaurantToken');
      if (!token) {
        router.push('/restaurant/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/menu/${itemToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Reload menu items to get the updated list
        await loadMenuItems(token);
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    } catch (error) {
      // Silent fallback
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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
          <p style={{ color: '#666', margin: 0 }}>Loading Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              fontSize: '3rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              🗑️
            </div>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              textAlign: 'center',
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '1rem'
            }}>
              Delete Menu Item?
            </h2>
            
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '1rem',
              lineHeight: '1.6',
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: '2rem'
            }}>
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isDeleting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isDeleting ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button
            onClick={() => router.push('/restaurant/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            ←
          </button>
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
            Menu Management
          </h1>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          + Add New Item
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {/* Menu Categories */}
        {menuCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#333',
              fontSize: '1.5rem',
              fontWeight: '600',
              borderBottom: '2px solid #FF5722',
              paddingBottom: '0.5rem',
              display: 'inline-block'
            }}>
              {category.name} ({category.items.length} items)
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gap: '1rem'
            }}>
              {category.items.map((item) => (
                <div key={item.id} style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  background: item.is_available ? 'white' : '#f8f9fa',
                  opacity: item.is_available ? 1 : 0.7,
                  transition: 'all 0.2s ease'
                }}>
                  {/* Item Image */}
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '8px', 
                    background: item.image_url ? 'transparent' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.item_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span>🍽️</span>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem', fontWeight: '600' }}>
                        {item.item_name}
                      </h3>
                      <span style={{ 
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        background: item.is_available ? '#4CAF50' : '#f44336',
                        color: 'white'
                      }}>
                        {item.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                      {item.description || 'No description'}
                    </p>
                    <p style={{ margin: 0, color: '#FF5722', fontSize: '1.1rem', fontWeight: '600' }}>
                      ₹{item.price}
                    </p>
                  </div>
                  
                  {/* Item Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Availability Toggle */}
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: 'none',
                        background: item.is_available ? '#4CAF50' : '#f44336',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                    
                    {/* Edit Button */}
                    <button
                      onClick={() => startEditItem(item)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                      ✏️
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#ffebee';
                        e.currentTarget.style.borderColor = '#f44336';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {menuCategories.length === 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.5rem' }}>
              No Menu Items Yet
            </h3>
            <p style={{ margin: '0 0 2rem 0', color: '#666' }}>
              Start building your menu by adding your first item.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add Your First Item
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Item Modal */}
      {(showAddModal || editingItem) && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#333', fontSize: '1.5rem' }}>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Item Image
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Custom File Upload Button */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer'
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '2px dashed #ddd',
                        background: '#f8f9fa',
                        color: '#666',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#FF5722';
                        e.currentTarget.style.background = '#fff5f2';
                        e.currentTarget.style.color = '#FF5722';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#ddd';
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.color = '#666';
                      }}
                    >
                      📷 {selectedImage ? selectedImage.name : 'Choose Image'}
                    </button>
                  </div>
                  
                  {/* Remove Image Button */}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #f44336',
                        background: '#ffebee',
                        color: '#f44336',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f44336';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ffebee';
                        e.currentTarget.style.color = '#f44336';
                      }}
                    >
                      🗑️ Remove
                    </button>
                  )}
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #FF5722',
                      boxShadow: '0 2px 8px rgba(255,87,34,0.2)'
                    }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
                </div>
                {selectedImage && (
                  <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    fontSize: '0.8rem', 
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    ✅ {selectedImage.name} selected
                  </p>
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter item name"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter item description"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '1rem'
                    }}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '1rem'
                    }}
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Food Type *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setNewItem(prev => ({ ...prev, is_veg: true }))}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: newItem.is_veg ? '2px solid #10b981' : '1px solid #ddd',
                      background: newItem.is_veg ? '#dcfce7' : 'white',
                      color: newItem.is_veg ? '#10b981' : '#666',
                      fontSize: '0.9rem',
                      fontWeight: newItem.is_veg ? '600' : '400',
                      cursor: 'pointer'
                    }}
                  >
                    🟢 Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItem(prev => ({ ...prev, is_veg: false }))}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: !newItem.is_veg ? '2px solid #ef4444' : '1px solid #ddd',
                      background: !newItem.is_veg ? '#fee2e2' : 'white',
                      color: !newItem.is_veg ? '#ef4444' : '#666',
                      fontSize: '0.9rem',
                      fontWeight: !newItem.is_veg ? '600' : '400',
                      cursor: 'pointer'
                    }}
                  >
                    🔴 Non-Veg
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: 'white',
                  color: '#666',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleEditItem : handleAddItem}
                disabled={!newItem.item_name || !newItem.price}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: newItem.item_name && newItem.price ? 
                    'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)' : '#ccc',
                  color: 'white',
                  fontSize: '1rem',
                  cursor: newItem.item_name && newItem.price ? 'pointer' : 'not-allowed'
                }}
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
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