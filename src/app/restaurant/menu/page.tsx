'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export default function MenuManagement() {
  const router = useRouter();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Starters',
    isVeg: true,
    isAvailable: true,
    image: ''
  });

  const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials'];

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
      
      // Load menu items (mock data for now)
      loadMenuItems();
      
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/restaurant/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenuItems = () => {
    // Mock menu data - will be replaced with real API calls
    const mockMenu: MenuCategory[] = [
      {
        name: 'Starters',
        items: [
          { id: 1, name: 'Chicken 65', description: 'Spicy fried chicken pieces', price: 180, category: 'Starters', isVeg: false, isAvailable: true },
          { id: 2, name: 'Paneer Tikka', description: 'Grilled cottage cheese cubes', price: 160, category: 'Starters', isVeg: true, isAvailable: true },
          { id: 3, name: 'Veg Spring Rolls', description: 'Crispy vegetable rolls', price: 120, category: 'Starters', isVeg: true, isAvailable: false }
        ]
      },
      {
        name: 'Main Course',
        items: [
          { id: 4, name: 'Chicken Biryani', description: 'Aromatic basmati rice with chicken', price: 280, category: 'Main Course', isVeg: false, isAvailable: true },
          { id: 5, name: 'Veg Biryani', description: 'Aromatic basmati rice with vegetables', price: 220, category: 'Main Course', isVeg: true, isAvailable: true },
          { id: 6, name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 320, category: 'Main Course', isVeg: false, isAvailable: true }
        ]
      },
      {
        name: 'Desserts',
        items: [
          { id: 7, name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', price: 80, category: 'Desserts', isVeg: true, isAvailable: true },
          { id: 8, name: 'Ice Cream', description: 'Vanilla ice cream scoop', price: 60, category: 'Desserts', isVeg: true, isAvailable: true }
        ]
      }
    ];
    
    setMenuCategories(mockMenu);
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) return;
    
    const item: MenuItem = {
      id: Date.now(),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      isVeg: newItem.isVeg,
      isAvailable: newItem.isAvailable,
      image: imagePreview || undefined
    };

    setMenuCategories(prev => {
      const updated = [...prev];
      const categoryIndex = updated.findIndex(cat => cat.name === item.category);
      
      if (categoryIndex >= 0) {
        updated[categoryIndex].items.push(item);
      } else {
        updated.push({ name: item.category, items: [item] });
      }
      
      return updated;
    });

    // Reset form
    resetForm();
    setShowAddModal(false);
  };

  const handleEditItem = () => {
    if (!editingItem || !newItem.name || !newItem.price) return;
    
    setMenuCategories(prev => 
      prev.map(category => ({
        ...category,
        items: category.items.map(item => 
          item.id === editingItem.id ? {
            ...item,
            name: newItem.name,
            description: newItem.description,
            price: parseFloat(newItem.price),
            category: newItem.category,
            isVeg: newItem.isVeg,
            isAvailable: newItem.isAvailable,
            image: imagePreview || item.image
          } : item
        )
      }))
    );

    // Reset form
    resetForm();
    setEditingItem(null);
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      price: '',
      category: 'Starters',
      isVeg: true,
      isAvailable: true,
      image: ''
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setNewItem(prev => ({ ...prev, image: '' }));
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
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      image: item.image || ''
    });
    setImagePreview(item.image || '');
    setShowAddModal(true);
  };

  const toggleAvailability = (itemId: number) => {
    setMenuCategories(prev => 
      prev.map(category => ({
        ...category,
        items: category.items.map(item => 
          item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
        )
      }))
    );
  };

  const deleteItem = (itemId: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setMenuCategories(prev => 
        prev.map(category => ({
          ...category,
          items: category.items.filter(item => item.id !== itemId)
        })).filter(category => category.items.length > 0)
      );
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
                  background: item.isAvailable ? 'white' : '#f8f9fa',
                  opacity: item.isAvailable ? 1 : 0.7,
                  transition: 'all 0.2s ease'
                }}>
                  {/* Item Image */}
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '8px', 
                    background: item.image ? 'transparent' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span>{item.isVeg ? '🥗' : '🍖'}</span>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem', fontWeight: '600' }}>
                        {item.name}
                      </h3>
                      <span style={{ 
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        background: item.isVeg ? '#4CAF50' : '#f44336',
                        color: 'white'
                      }}>
                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                      {item.description}
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
                        background: item.isAvailable ? '#4CAF50' : '#f44336',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
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
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
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
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newItem.isVeg}
                    onChange={(e) => setNewItem(prev => ({ ...prev, isVeg: e.target.checked }))}
                  />
                  <span style={{ color: '#333' }}>Vegetarian</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newItem.isAvailable}
                    onChange={(e) => setNewItem(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  />
                  <span style={{ color: '#333' }}>Available</span>
                </label>
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
                disabled={!newItem.name || !newItem.price}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: newItem.name && newItem.price ? 
                    'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)' : '#ccc',
                  color: 'white',
                  fontSize: '1rem',
                  cursor: newItem.name && newItem.price ? 'pointer' : 'not-allowed'
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