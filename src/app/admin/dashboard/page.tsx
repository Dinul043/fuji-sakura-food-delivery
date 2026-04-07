'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Application {
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
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tab + Delivery Partners state
  const [activeTab, setActiveTab] = useState<'restaurants' | 'delivery'>('restaurants');
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(10 * 60); // 10 minutes in seconds
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAdminListModal, setShowAdminListModal] = useState(false);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState<{show: boolean, admin: any}>({show: false, admin: null});
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const isModalOpen = selectedApplication || showLogoutConfirm || showAddAdminModal || showAdminListModal || showConfirmDeactivate.show;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedApplication, showLogoutConfirm, showAddAdminModal, showAdminListModal, showConfirmDeactivate.show]);

  // SINGLE AUTHENTICATION CHECK - handles both initial load and refresh
  useEffect(() => {
    const authenticateAdmin = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const userRole = localStorage.getItem('userRole');
        const isAdmin = localStorage.getItem('isAdmin');
        const adminEmail = localStorage.getItem('adminEmail');
        
        // Check if we have basic credentials
        if (!adminToken || userRole !== 'admin' || isAdmin !== 'true' || !adminEmail) {
          setIsAuthenticating(false);
          router.push('/admin');
          return;
        }
        
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/api/admin/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const verificationData = await response.json();
          
          // Update admin info if needed
          if (verificationData.admin) {
            localStorage.setItem('adminName', verificationData.admin.name);
            localStorage.setItem('adminEmail', verificationData.admin.email);
            setCurrentAdmin(verificationData.admin);
          }
          
          setIsAuthenticating(false);
          // Load applications after successful authentication
          fetchApplications();
        } else {
          // Clear invalid session
          localStorage.removeItem('adminToken');
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('userRole');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminName');
          localStorage.removeItem('adminLoginTime');
          
          setIsAuthenticating(false);
          router.push('/admin');
        }
        
      } catch (error) {
        // Silent fallback - no console errors
        
        // On network error, allow access with cached credentials
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setIsAuthenticating(false);
          fetchApplications();
        } else {
          setIsAuthenticating(false);
          router.push('/admin');
        }
      }
    };
    
    authenticateAdmin();
  }, [router]);

  // AUTO LOGOUT with 10-minute timer
  useEffect(() => {
    // Set login time
    const loginTime = Date.now();
    localStorage.setItem('adminLoginTime', loginTime.toString());
    
    // 10-minute auto-logout timer
    const autoLogoutTimer = setTimeout(() => {
      showNotification('error', 'Session Expired', 'Your admin session has expired after 10 minutes. Redirecting to login...');
      
      // Delay redirect to show notification
      setTimeout(() => {
        // Clear admin session
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminLoginTime');
        
        router.push('/admin');
      }, 2000);
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
    
    // Cleanup
    return () => {
      clearTimeout(autoLogoutTimer);
    };
  }, [router]);

  // Session timer - updates every second
  useEffect(() => {
    const sessionTimer = setInterval(() => {
      const loginTime = localStorage.getItem('adminLoginTime');
      if (loginTime) {
        const elapsed = Math.floor((Date.now() - parseInt(loginTime)) / 1000);
        const remaining = Math.max(0, (10 * 60) - elapsed); // 10 minutes - elapsed
        setSessionTimeLeft(remaining);
        
        // Warning at 2 minutes left
        if (remaining === 120) {
          showNotification('warning', 'Session Expiring Soon', 'Your admin session will expire in 2 minutes. Please save any work.');
        }
        
        // Warning at 30 seconds left
        if (remaining === 30) {
          showNotification('warning', 'Session Expiring!', 'Your admin session will expire in 30 seconds!');
        }
      }
    }, 1000);
    
    return () => clearInterval(sessionTimer);
  }, []);

  // Format time for display
  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show notification function
  const showNotification = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/restaurant/applications`);
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
        setFilteredApplications(data);
      } else {
        showNotification('error', 'Error', 'Failed to fetch applications');
      }
    } catch (error) {
      // Silent fallback - no console errors
      showNotification('error', 'Error', 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter applications by status
  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === selectedStatus));
    }
  }, [selectedStatus, applications]);

  // Fetch delivery partners when tab or filter changes
  useEffect(() => {
    if (activeTab === 'delivery') fetchDeliveryPartners(deliveryFilter);
  }, [activeTab, deliveryFilter]);

  const fetchDeliveryPartners = async (filter = 'all') => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-partners?status_filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveryPartners(data.partners || []);
      }
    } catch { showNotification('error', 'Error', 'Failed to fetch delivery partners'); }
  };

  const handleDeliveryAction = async (partnerId: number, action: 'approve' | 'reject') => {
    setIsUpdatingDelivery(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery/${action}/${partnerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: deliveryNotes })
      });
      if (res.ok) {
        showNotification('success', 'Done', `Delivery partner ${action}d successfully`);
        setSelectedDelivery(null);
        setDeliveryNotes('');
        fetchDeliveryPartners(deliveryFilter);
      } else {
        const d = await res.json();
        showNotification('error', 'Error', d.detail || `Failed to ${action}`);
      }
    } catch { showNotification('error', 'Error', 'Network error'); }
    finally { setIsUpdatingDelivery(false); }
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`${API_BASE_URL}/api/restaurant/applications/${applicationId}/status?new_status=${newStatus}&admin_notes=${encodeURIComponent(adminNotes || '')}&reviewed_by=1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        showNotification('success', 'Success', `Application ${newStatus} successfully`);
        setSelectedApplication(null);
        setAdminNotes('');
        fetchApplications(); // Refresh the list
      } else {
        showNotification('error', 'Error', `Failed to ${newStatus} application`);
      }
    } catch (error) {
      // Silent fallback - no console errors
      showNotification('error', 'Error', `Failed to ${newStatus} application`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Clear all admin session data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminLoginTime');
    
    showNotification('success', 'Logged Out', 'You have been logged out successfully');
    setTimeout(() => router.push('/admin'), 1000);
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      showNotification('error', 'Validation Error', 'Please fill in all fields');
      return;
    }

    if (newAdmin.password.length < 8) {
      showNotification('error', 'Validation Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password
        })
      });

      if (response.ok) {
        showNotification('success', 'Success', 'New admin created successfully!');
        setNewAdmin({ name: '', email: '', password: '' });
        setShowAddAdminModal(false);
        // Refresh admin list if it's open
        if (showAdminListModal) {
          fetchAdminList();
        }
      } else {
        const error = await response.json();
        showNotification('error', 'Error', error.detail || 'Failed to create admin');
      }
    } catch (error) {
      showNotification('error', 'Error', 'Network error. Please try again.');
    }
  };

  const fetchAdminList = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/list-admins`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminList(data.admins);
      } else {
        showNotification('error', 'Error', 'Failed to fetch admin list');
      }
    } catch (error) {
      showNotification('error', 'Error', 'Failed to fetch admin list');
    }
  };

  const handleDeactivateAdmin = async (adminId: number, adminName: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/deactivate-admin/${adminId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        showNotification('success', 'Success', `Admin "${adminName}" has been deactivated and logged out`);
        setShowConfirmDeactivate({show: false, admin: null});
        fetchAdminList(); // Refresh the list
      } else {
        const error = await response.json();
        showNotification('error', 'Error', error.detail || 'Failed to deactivate admin');
      }
    } catch (error) {
      showNotification('error', 'Error', 'Network error. Please try again.');
    }
  };

  const handleReactivateAdmin = async (adminId: number, adminName: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/reactivate-admin/${adminId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        showNotification('success', 'Success', `Admin "${adminName}" has been reactivated`);
        fetchAdminList(); // Refresh the list
      } else {
        const error = await response.json();
        showNotification('error', 'Error', error.detail || 'Failed to reactivate admin');
      }
    } catch (error) {
      showNotification('error', 'Error', 'Network error. Please try again.');
    }
  };

  // Show authentication loading screen
  if (isAuthenticating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
        fontFamily: 'Anuphan, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            margin: '0 auto 2rem auto'
          }}></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
            Verifying Admin Access...
          </h2>
          <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>
            Please wait while we authenticate your session
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
        fontFamily: 'Anuphan, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            margin: '0 auto 1.5rem auto'
          }}></div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
            Loading Applications...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
      fontFamily: 'Anuphan, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.15)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: 'white', 
              margin: '0 0 0.5rem 0' 
            }}>
              🛡️ Admin Dashboard
            </h1>
            <p style={{ 
              fontSize: '1rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0 
            }}>
              Restaurant Application Management System
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Add Admin Button - Only for Super Admins */}
            {currentAdmin?.is_super_admin && (
              <button
                onClick={() => setShowAddAdminModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                👤+ Add Admin
              </button>
            )}

            {/* Manage Admins Button - Only for Super Admins */}
            {currentAdmin?.is_super_admin && (
              <button
                onClick={() => {
                  setShowAdminListModal(true);
                  fetchAdminList();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                👥 Manage Admins
              </button>
            )}
            
            {/* Session Timer */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.75rem 1.25rem',
              borderRadius: '25px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              ⏱️ {formatSessionTime(sessionTimeLeft)}
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Applications', value: applications.length, icon: '📋', color: '#4CAF50' },
            { label: 'Pending Review', value: applications.filter(app => app.status === 'pending').length, icon: '⏳', color: '#FF9800' },
            { label: 'Approved', value: applications.filter(app => app.status === 'approved').length, icon: '✅', color: '#2196F3' },
            { label: 'Rejected', value: applications.filter(app => app.status === 'rejected').length, icon: '❌', color: '#F44336' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                color: stat.color, 
                marginBottom: '0.5rem' 
              }}>
                {stat.value}
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#666', 
                fontWeight: '600' 
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { key: 'restaurants', label: '🏪 Restaurant Applications', count: applications.length },
            { key: 'delivery', label: '🛵 Delivery Partners', count: deliveryPartners.length }
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as 'restaurants' | 'delivery')}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'white',
                color: activeTab === tab.key ? 'white' : '#555',
                boxShadow: activeTab === tab.key ? '0 4px 15px rgba(76,175,80,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
              }}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filter Buttons — restaurants tab only */}
        {activeTab === 'restaurants' && (<div style={{ 
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: '700', 
            color: '#333', 
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔍 Filter Applications
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Applications', color: '#666' },
              { key: 'pending', label: 'Pending', color: '#FF9800' },
              { key: 'approved', label: 'Approved', color: '#4CAF50' },
              { key: 'rejected', label: 'Rejected', color: '#F44336' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedStatus(filter.key)}
                style={{
                  background: selectedStatus === filter.key ? filter.color : 'white',
                  color: selectedStatus === filter.key ? 'white' : filter.color,
                  border: `2px solid ${filter.color}`,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (selectedStatus !== filter.key) {
                    e.currentTarget.style.background = filter.color;
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedStatus !== filter.key) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = filter.color;
                  }
                }}
              >
                {filter.label} ({filter.key === 'all' ? applications.length : applications.filter(app => app.status === filter.key).length})
              </button>
            ))}
          </div>
        </div>)}

        {/* Applications List — restaurants tab only */}
        {activeTab === 'restaurants' && (<div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: '700', 
            color: '#333', 
            margin: '0 0 2rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Restaurant Applications ({filteredApplications.length})
          </h3>
          
          {filteredApplications.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              color: '#666'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                No Applications Found
              </h4>
              <p style={{ fontSize: '1rem', margin: 0 }}>
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {filteredApplications.map((application) => (
                <div key={application.id} style={{
                  background: '#f8f9fa',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '2rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#FF5722';
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '1.4rem', 
                        fontWeight: '700', 
                        color: '#333', 
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🏪 {application.business_name}
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '1rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                            <strong>👤 Owner:</strong> {application.owner_name}
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                            📧 {application.email}
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                            📞 {application.phone}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                            <strong>🍽️ Cuisine:</strong> {application.cuisine_type}
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                            📅 Applied: {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                      <span style={{
                        background: application.status === 'pending' ? '#FFF3E0' : 
                                   application.status === 'approved' ? '#E8F5E8' : '#FFEBEE',
                        color: application.status === 'pending' ? '#F57C00' : 
                               application.status === 'approved' ? '#2E7D32' : '#C62828',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {application.status === 'pending' ? '⏳ Pending' : 
                         application.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                      
                      <button
                        onClick={() => setSelectedApplication(application)}
                        style={{
                          background: '#FF5722',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#E64A19';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#FF5722';
                        }}
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>)}

        {/* Delivery Partners Tab */}
        {activeTab === 'delivery' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#333', margin: 0 }}>
                🛵 Delivery Partner Applications ({deliveryPartners.length})
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                  <button key={f} onClick={() => setDeliveryFilter(f)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: deliveryFilter === f ? '#FF5722' : '#f3f4f6', color: deliveryFilter === f ? 'white' : '#555' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {deliveryPartners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛵</div>
                <p style={{ margin: 0 }}>No delivery partner applications found</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {deliveryPartners.map((partner: any) => (
                  <div key={partner.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', borderLeft: `4px solid ${partner.status === 0 ? '#f59e0b' : partner.status === 1 ? '#10b981' : '#ef4444'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#111827' }}>{partner.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{partner.email} · {partner.phone}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{partner.vehicle_type} · {partner.vehicle_number} · {partner.city}</div>
                        <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', background: partner.status === 0 ? '#fef3c7' : partner.status === 1 ? '#d1fae5' : '#fee2e2', color: partner.status === 0 ? '#92400e' : partner.status === 1 ? '#065f46' : '#991b1b' }}>
                          {partner.status === 0 ? 'Pending' : partner.status === 1 ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                      {partner.status === 0 && (
                        <button onClick={() => { setSelectedDelivery(partner); setDeliveryNotes(''); }}
                          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#FF5722', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              padding: '2rem',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                    🏪 {selectedApplication.business_name}
                  </h3>
                  <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>
                    Application Details & Review
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '2rem' }}>
              {/* Status Badge */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{
                  background: selectedApplication.status === 'pending' ? '#FFF3E0' : 
                             selectedApplication.status === 'approved' ? '#E8F5E8' : '#FFEBEE',
                  color: selectedApplication.status === 'pending' ? '#F57C00' : 
                         selectedApplication.status === 'approved' ? '#2E7D32' : '#C62828',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {selectedApplication.status === 'pending' ? '⏳ Pending Review' : 
                   selectedApplication.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                </span>
              </div>
              
              {/* Information Grid */}
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Owner Name', value: selectedApplication.owner_name, icon: '👤' },
                  { label: 'Email Address', value: selectedApplication.email, icon: '📧' },
                  { label: 'Phone Number', value: selectedApplication.phone, icon: '📞' },
                  { label: 'Restaurant Address', value: selectedApplication.address, icon: '📍' },
                  { label: 'Cuisine Type', value: selectedApplication.cuisine_type, icon: '🍽️' },
                  { label: 'Business License', value: selectedApplication.business_license, icon: '📄' },
                  { label: 'Food Permit', value: selectedApplication.food_permit, icon: '🍽️' },
                  { label: 'Application Date', value: new Date(selectedApplication.created_at).toLocaleString(), icon: '📅' }
                ].map((item, index) => (
                  <div key={index} style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#666', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      {item.value}
                    </div>
                  </div>
                ))}
                
                {/* Description */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    fontWeight: '600', 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    📝 Restaurant Description
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#333',
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    "{selectedApplication.description}"
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '2rem',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      fontWeight: '600',
                      color: '#333',
                      fontSize: '1rem'
                    }}>
                      📝 Admin Notes (Optional):
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add your review notes here..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        minHeight: '100px',
                        fontFamily: 'Anuphan, system-ui, sans-serif',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                      disabled={isUpdating}
                      style={{
                        flex: 1,
                        background: isUpdating ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background = '#45a049';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background = '#4CAF50';
                        }
                      }}
                    >
                      {isUpdating ? '⏳ Processing...' : '✅ Approve Application'}
                    </button>
                    
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                      disabled={isUpdating}
                      style={{
                        flex: 1,
                        background: isUpdating ? '#ccc' : '#F44336',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background = '#da190b';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background = '#F44336';
                        }
                      }}
                    >
                      {isUpdating ? '⏳ Processing...' : '❌ Reject Application'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Review Modal */}
      {selectedDelivery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: '700', color: '#111827' }}>Review Delivery Partner</h3>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: '700', color: '#111827' }}>{selectedDelivery.name}</p>
              <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>{selectedDelivery.email} · {selectedDelivery.phone}</p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{selectedDelivery.vehicle_type} · {selectedDelivery.vehicle_number} · {selectedDelivery.city}</p>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>Admin Notes (optional)</label>
              <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                rows={3} placeholder="Add notes..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setSelectedDelivery(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', color: '#555', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDeliveryAction(selectedDelivery.id, 'reject')} disabled={isUpdatingDelivery}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: isUpdatingDelivery ? 'not-allowed' : 'pointer' }}>
                {isUpdatingDelivery ? '...' : 'Reject'}
              </button>
              <button onClick={() => handleDeliveryAction(selectedDelivery.id, 'approve')} disabled={isUpdatingDelivery}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: isUpdatingDelivery ? 'not-allowed' : 'pointer' }}>
                {isUpdatingDelivery ? '...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: notification.type === 'success' ? '#4CAF50' : 
                     notification.type === 'error' ? '#F44336' : '#FF9800',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 1001,
          maxWidth: '400px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {notification.title}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚪</div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#333', 
              margin: '0 0 1rem 0' 
            }}>
              Confirm Logout
            </h3>
            <p style={{ 
              fontSize: '1rem', 
              color: '#666', 
              margin: '0 0 2rem 0',
              lineHeight: '1.5'
            }}>
              Are you sure you want to logout? You will need to login again to access the admin dashboard.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#5a6268';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#6c757d';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  background: '#FF5722',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#E64A19';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FF5722';
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal - Only for Super Admins */}
      {showAddAdminModal && currentAdmin?.is_super_admin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              padding: '2rem',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                    👤 Add New Admin
                  </h3>
                  <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>
                    Create a new admin account
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setNewAdmin({ name: '', email: '', password: '' });
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Form Content */}
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '1rem'
                }}>
                  👤 Full Name:
                </label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter admin's full name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
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
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '1rem'
                }}>
                  📧 Email Address:
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter admin's email address"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
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
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '1rem'
                }}>
                  🔒 Password:
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter secure password (min 8 characters)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
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
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#666', 
                  margin: '0.5rem 0 0 0',
                  fontStyle: 'italic'
                }}>
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setNewAdmin({ name: '', email: '', password: '' });
                  }}
                  style={{
                    flex: 1,
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#5a6268';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#6c757d';
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleAddAdmin}
                  style={{
                    flex: 1,
                    background: '#FF5722',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#E64A19';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#FF5722';
                  }}
                >
                  ✅ Create Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin List Modal - Only for Super Admins */}
      {showAdminListModal && currentAdmin?.is_super_admin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              padding: '2rem',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                    👥 Admin Management
                  </h3>
                  <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>
                    Manage all admin accounts ({adminList.length} total)
                  </p>
                </div>
                <button
                  onClick={() => setShowAdminListModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Admin List Content */}
            <div style={{ padding: '2rem' }}>
              {adminList.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 2rem',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                    Loading Admin List...
                  </h4>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {adminList.map((admin) => (
                    <div key={admin.id} style={{
                      background: admin.is_active ? '#f8f9fa' : '#fff3cd',
                      border: `2px solid ${admin.is_active ? '#e9ecef' : '#ffeaa7'}`,
                      borderRadius: '12px',
                      padding: '1.5rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ 
                              fontSize: '1.2rem', 
                              fontWeight: '700', 
                              color: '#333', 
                              margin: 0
                            }}>
                              {admin.is_super_admin ? '👑' : '👤'} {admin.name}
                            </h4>
                            {admin.id === currentAdmin?.id && (
                              <span style={{
                                background: '#007bff',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: '600'
                              }}>
                                YOU
                              </span>
                            )}
                            {admin.is_super_admin && (
                              <span style={{
                                background: '#ffd700',
                                color: '#333',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: '600'
                              }}>
                                SUPER ADMIN
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                            <div>📧 {admin.email}</div>
                            <div>📅 Created: {new Date(admin.created_at).toLocaleDateString()}</div>
                            <div>👤 Created by: {admin.created_by_name}</div>
                            {admin.last_login && (
                              <div>🕐 Last login: {new Date(admin.last_login).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                          <span style={{
                            background: admin.is_active ? '#d4edda' : '#fff3cd',
                            color: admin.is_active ? '#155724' : '#856404',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {admin.is_active ? '✅ Active' : '⚠️ Inactive'}
                          </span>
                          
                          {/* Action Buttons - Don't show for current admin */}
                          {admin.id !== currentAdmin?.id && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              {admin.is_active ? (
                                <button
                                  onClick={() => setShowConfirmDeactivate({show: true, admin: admin})}
                                  style={{
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#c82333';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#dc3545';
                                  }}
                                >
                                  🚫 Logout & Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateAdmin(admin.id, admin.name)}
                                  style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#218838';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#28a745';
                                  }}
                                >
                                  ✅ Reactivate
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Admin Confirmation Modal */}
      {showConfirmDeactivate.show && showConfirmDeactivate.admin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#333', 
              margin: '0 0 1rem 0' 
            }}>
              Deactivate Admin Account
            </h3>
            <p style={{ 
              fontSize: '1rem', 
              color: '#666', 
              margin: '0 0 0.5rem 0',
              lineHeight: '1.5'
            }}>
              Are you sure you want to deactivate <strong>{showConfirmDeactivate.admin.name}</strong>?
            </p>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#dc3545', 
              margin: '0 0 2rem 0',
              lineHeight: '1.4',
              fontWeight: '600'
            }}>
              ⚡ They will be logged out immediately and lose access to the admin dashboard.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowConfirmDeactivate({show: false, admin: null})}
                style={{
                  flex: 1,
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#5a6268';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#6c757d';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleDeactivateAdmin(showConfirmDeactivate.admin.id, showConfirmDeactivate.admin.name)}
                style={{
                  flex: 1,
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#c82333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#dc3545';
                }}
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}