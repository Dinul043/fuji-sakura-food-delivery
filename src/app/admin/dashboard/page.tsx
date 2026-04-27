/*
 * Admin Dashboard
 * ✅ Phase 1: DB tables created — delivery_partners, delivery_tokens
 * ✅ Phase 2: Delivery partner apply form + POST /api/delivery/apply
 * ✅ Phase 3: Admin approval UI — Delivery Partners tab (approve/reject with notes)
 * 🔜 Phase 4: Delivery partner login — /delivery/login + POST /api/delivery/login
 * 🔜 Phase 5: Delivery dashboard — available orders, accept, complete
 * 🔜 Phase 6: Order flow — out_for_delivery → delivered via partner
 * 🔜 Phase 7: Earnings — fixed fee per delivery
 */
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
  const [activeTab, setActiveTab] = useState<'restaurants' | 'delivery' | 'payouts' | 'live'>('restaurants');
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isMarkingPaid, setIsMarkingPaid] = useState<number | null>(null);
  const [confirmMarkPaid, setConfirmMarkPaid] = useState<any | null>(null);
  const [viewSettlements, setViewSettlements] = useState<any | null>(null); // partner whose settlements to view
  const [partnerSettlements, setPartnerSettlements] = useState<any[]>([]);
  const [isRefunding, setIsRefunding] = useState<number | null>(null); // settlement id being refunded
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
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
    if (activeTab === 'payouts') fetchPayouts();
    if (activeTab === 'live') fetchLiveOrders();
  }, [activeTab, deliveryFilter]);

  const fetchLiveOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/live-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveOrders(data.orders || []);
      }
    } catch { showNotification('error', 'Error', 'Failed to fetch live orders'); }
  };

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-payouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.partners || []);
      }
    } catch { showNotification('error', 'Error', 'Failed to fetch payouts'); }
  };

  const markPaid = async (partnerId: number, partnerName: string) => {
    setIsMarkingPaid(partnerId);
    setConfirmMarkPaid(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-payout/mark-paid/${partnerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification('success', 'Paid', `${data.message} — ₹${data.amount_paid} via ${data.partner_upi}`);
        fetchPayouts();
      } else {
        const d = await res.json();
        showNotification('error', 'Error', d.detail || 'Failed to mark as paid');
      }
    } catch { showNotification('error', 'Error', 'Network error'); }
    finally { setIsMarkingPaid(null); }
  };

  const fetchPartnerSettlements = async (partnerId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/delivery-partner/${partnerId}/cod-settlements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerSettlements(data.settlements || []);
      }
    } catch { showNotification('error', 'Error', 'Failed to fetch settlements'); }
  };

  const initiateRefund = async (settlementId: number, reason: string) => {
    setIsRefunding(settlementId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/cod-settlement/${settlementId}/refund`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification('success', 'Refund Initiated', `₹${data.amount} refund initiated. Refund ID: ${data.refund_id}`);
        if (viewSettlements) fetchPartnerSettlements(viewSettlements.id);
      } else {
        const d = await res.json();
        showNotification('error', 'Refund Failed', d.detail || 'Failed to initiate refund');
      }
    } catch { showNotification('error', 'Error', 'Network error'); }
    finally { setIsRefunding(null); }
  };

  // WebSocket — live delivery partner application notifications + COD settlement updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/admin');
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_delivery_application') {
          showNotification('success', '🛵 New Application', `${msg.partner.name} applied as delivery partner`);
          setDeliveryPartners(prev => [msg.partner, ...prev]);
        }
        // Auto-refresh payouts tab when a partner settles COD
        if (msg.type === 'cod_settlement_paid') {
          showNotification('success', '💸 COD Settled', `${msg.partner_name} paid ₹${msg.amount_paid} COD settlement`);
          fetchPayouts(); // Refresh payout data immediately
        }
      } catch { /* ignore non-JSON */ }
    };
    ws.onclose = () => {};
    return () => ws.close();
  }, []);

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
            { label: 'Approved Restaurants', value: applications.filter(app => app.status === 'approved').length, icon: '✅', color: '#2196F3' },
            { label: 'Delivery Partners', value: deliveryPartners.length, icon: '🛵', color: '#9c27b0' }
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
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'restaurants', label: '🏪 Restaurant Applications', count: applications.length },
            { key: 'delivery', label: '🛵 Delivery Partners', count: deliveryPartners.length },
            { key: 'live', label: '📍 Live Orders', count: liveOrders.length }
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
          {/* Restaurant Payouts — separate screen */}
          <button
            onClick={() => router.push('/admin/payouts/restaurant')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', background: 'white', color: '#FF5722', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1.5px solid #FF7043' }}>
            🏪 Restaurant Payouts
          </button>
          {/* Delivery Partner Payouts — separate screen */}
          <button
            onClick={() => router.push('/admin/payouts/delivery')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', background: 'white', color: '#FF5722', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1.5px solid #FF7043' }}>
            💸 Partner Payouts
          </button>
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
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{partner.vehicle_type} · {partner.vehicle_number} · {partner.city}{partner.area ? ` · ${partner.area}` : ''}</div>
                        {partner.driving_license && <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>🪪 License: {partner.driving_license}</div>}
                        {partner.aadhar_number && <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>🆔 Aadhar: {partner.aadhar_number}</div>}
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
                      {partner.status !== 0 && (
                        <button onClick={() => { setSelectedDelivery(partner); setDeliveryNotes(''); }}
                          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#555', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                          👁️ View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#333', margin: 0 }}>
                💸 Delivery Partner Payouts ({payouts.length})
              </h3>
              <button onClick={fetchPayouts} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280' }}>
                🔄 Refresh
              </button>
            </div>

            {/* Legend */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#374151', lineHeight: '1.8' }}>
              <strong>How COD settlement works:</strong><br />
              🟢 <strong>Delivery Earnings</strong> = ₹40 per order — partner keeps this, company pays via UPI<br />
              🔴 <strong>COD Collected</strong> = Full cash received from customer — partner holds this temporarily<br />
              💳 <strong>Platform Received</strong> = Amount partner already paid back via Razorpay<br />
              🔵 <strong>Still Pending</strong> = COD Collected − Delivery Earnings − Platform Received (still owed to company)
            </div>

            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                <p style={{ margin: 0 }}>No approved delivery partners yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {payouts.map((p: any) => {
                  const amountToReturn = p.net_cod_to_return || 0;
                  const netToPay = p.net_settlement || 0;
                  return (
                    <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.25rem', borderLeft: `4px solid ${p.pending_payout > 0 ? '#f59e0b' : '#10b981'}` }}>
                      {/* Partner info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{p.name}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{p.email} · {p.phone}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{p.city}{p.area ? ` · ${p.area}` : ''} · {p.total_deliveries} deliveries</div>
                          {p.upi_id && <div style={{ color: '#374151', fontSize: '0.82rem', marginTop: '0.2rem' }}>💳 UPI: <strong>{p.upi_id}</strong></div>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Paid so far: ₹{p.total_paid}</div>
                      </div>

                      {/* Settlement breakdown — 4 columns */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                          <div style={{ fontSize: '0.65rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🟢 Delivery Earnings</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16a34a' }}>₹{p.pending_payout}</div>
                          <div style={{ fontSize: '0.62rem', color: '#4ade80' }}>Partner keeps</div>
                        </div>
                        <div style={{ background: p.cod_collected_by_partner > 0 ? '#fef2f2' : '#f9fafb', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: `1px solid ${p.cod_collected_by_partner > 0 ? '#fecaca' : '#e5e7eb'}` }}>
                          <div style={{ fontSize: '0.65rem', color: p.cod_collected_by_partner > 0 ? '#991b1b' : '#9ca3af', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🔴 COD Collected</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: p.cod_collected_by_partner > 0 ? '#dc2626' : '#9ca3af' }}>₹{p.cod_collected_by_partner}</div>
                          <div style={{ fontSize: '0.62rem', color: '#f87171' }}>{p.cod_collected_by_partner > 0 ? 'Cash from customer' : 'No COD'}</div>
                        </div>
                        <div style={{ background: p.total_settled_by_partner > 0 ? '#eff6ff' : '#f9fafb', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: `1px solid ${p.total_settled_by_partner > 0 ? '#bfdbfe' : '#e5e7eb'}` }}>
                          <div style={{ fontSize: '0.65rem', color: p.total_settled_by_partner > 0 ? '#1e40af' : '#9ca3af', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>💳 Platform Received</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: p.total_settled_by_partner > 0 ? '#2563eb' : '#9ca3af' }}>₹{p.total_settled_by_partner || 0}</div>
                          <div style={{ fontSize: '0.62rem', color: '#60a5fa' }}>{p.total_settled_by_partner > 0 ? 'Via Razorpay' : 'Not settled yet'}</div>
                        </div>
                        <div style={{ background: p.net_cod_to_return > 0 ? '#fef3c7' : '#f0fdf4', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: `1px solid ${p.net_cod_to_return > 0 ? '#fde68a' : '#bbf7d0'}` }}>
                          <div style={{ fontSize: '0.65rem', color: p.net_cod_to_return > 0 ? '#92400e' : '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🔵 Still Pending</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: p.net_cod_to_return > 0 ? '#d97706' : '#16a34a' }}>₹{p.net_cod_to_return}</div>
                          <div style={{ fontSize: '0.62rem', color: p.net_cod_to_return > 0 ? '#fbbf24' : '#4ade80' }}>{p.net_cod_to_return > 0 ? 'Partner still owes' : '✅ All clear'}</div>
                        </div>
                      </div>

                      {amountToReturn > 0 && (
                        <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '0.6rem 0.875rem', marginBottom: '0.875rem', fontSize: '0.82rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ⚠️ Partner must return <strong>₹{amountToReturn}</strong> to platform (COD collected − delivery earnings)
                        </div>
                      )}

                      {p.pending_payout > 0 && (
                        <button
                          onClick={() => setConfirmMarkPaid(p)}
                          disabled={isMarkingPaid === p.id}
                          style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: 'none', background: isMarkingPaid === p.id ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: '700', cursor: isMarkingPaid === p.id ? 'not-allowed' : 'pointer', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          {isMarkingPaid === p.id ? 'Processing...' : `✅ Mark ₹${p.pending_payout} as Paid via UPI`}
                        </button>
                      )}
                      {p.pending_payout === 0 && (
                        <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '600', fontSize: '0.875rem', padding: '0.5rem 0' }}>✅ All settled</div>
                      )}
                      <button
                        onClick={() => { setViewSettlements(p); fetchPartnerSettlements(p.id); }}
                        style={{ width: '100%', padding: '0.5rem', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                        🔍 View COD Settlement History
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COD Settlement History Modal */}
        {viewSettlements && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem', fontWeight: '700' }}>
                  💳 COD Settlements — {viewSettlements.name}
                </h3>
                <button onClick={() => { setViewSettlements(null); setPartnerSettlements([]); }}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
              </div>

              {partnerSettlements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No settlement records found</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {partnerSettlements.map((s: any) => (
                    <div key={s.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', borderLeft: `3px solid ${s.status === 'paid' ? '#10b981' : s.status === 'failed' ? '#ef4444' : '#f59e0b'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>
                            {s.status === 'paid' ? '✅ Paid' : s.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                            {s.refund_status !== 'none' && (
                              <span style={{ marginLeft: '0.5rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600' }}>
                                Refund: {s.refund_status}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                            {new Date(s.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {s.razorpay_payment_id && <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace', marginTop: '0.1rem' }}>{s.razorpay_payment_id}</div>}
                          {s.failure_reason && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.1rem' }}>{s.failure_reason}</div>}
                          {s.refund_id && <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '0.1rem' }}>Refund ID: {s.refund_id}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>₹{s.amount}</div>
                          {s.status === 'paid' && s.refund_status === 'none' && (
                            <button
                              onClick={() => initiateRefund(s.id, 'Manual refund by admin')}
                              disabled={isRefunding === s.id}
                              style={{ marginTop: '0.4rem', padding: '0.3rem 0.6rem', background: isRefunding === s.id ? '#9ca3af' : '#fef2f2', color: isRefunding === s.id ? 'white' : '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', cursor: isRefunding === s.id ? 'not-allowed' : 'pointer' }}>
                              {isRefunding === s.id ? '...' : '↩ Refund'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mark Paid Confirmation Modal */}
        {confirmMarkPaid && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>💸</div>
              <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem', color: '#111827', fontSize: '1.2rem', fontWeight: '700' }}>Confirm Payout</h3>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
                You are about to mark <strong>₹{confirmMarkPaid.pending_payout}</strong> as paid to <strong>{confirmMarkPaid.name}</strong> via UPI <strong>{confirmMarkPaid.upi_id || 'N/A'}</strong>.
              </p>
              {confirmMarkPaid.net_cod_to_return > 0 && (
                <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#92400e', textAlign: 'center' }}>
                  ⚠️ Ensure partner has returned <strong>₹{confirmMarkPaid.net_cod_to_return}</strong> COD amount before confirming.
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setConfirmMarkPaid(null)} style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => markPaid(confirmMarkPaid.id, confirmMarkPaid.name)} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  ✅ Confirm Paid
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Orders Tab */}
        {activeTab === 'live' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#333', margin: 0 }}>
                📍 Live Order Tracking ({liveOrders.length})
              </h3>
              <button onClick={fetchLiveOrders} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280' }}>
                🔄 Refresh
              </button>
            </div>
            {liveOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p style={{ margin: 0 }}>No active orders right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {liveOrders.map((order: any) => {
                  const statusColors: Record<string, string> = { confirmed: '#3b82f6', preparing: '#f59e0b', ready: '#f59e0b', out_for_delivery: '#8b5cf6' };
                  const statusLabels: Record<string, string> = { confirmed: '✅ Confirmed', preparing: '🍳 Preparing', ready: '📦 Ready / Partner On Way', out_for_delivery: '🛵 Out for Delivery' };
                  return (
                    <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', borderLeft: `4px solid ${statusColors[order.status] || '#6b7280'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '700', color: '#111827' }}>{order.order_number}</span>
                            <span style={{ padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
                              {statusLabels[order.status] || order.status}
                            </span>
                            {order.payment_method === 'cod' && (
                              <span style={{ padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: '#fef3c7', color: '#92400e' }}>COD</span>
                            )}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>🏪 {order.restaurant_name}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>👤 {order.customer_name} · 📞 {order.delivery_phone}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>📍 {order.delivery_address}</div>
                          {order.delivery_partner_name ? (
                            <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: '#ede9fe', borderRadius: '8px', fontSize: '0.82rem', color: '#6d28d9', fontWeight: '600' }}>
                              🛵 {order.delivery_partner_name} · {order.delivery_partner_phone}
                            </div>
                          ) : (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>No delivery partner assigned yet</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                          <div style={{ fontWeight: '800', color: '#FF5722', fontSize: '1.1rem' }}>₹{order.total_amount}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab removed — company UPI no longer needed, using Razorpay directly */}

      </div>
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
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#111827' }}>
                {selectedDelivery.status === 0 ? 'Review Application' : 'Delivery Partner Profile'}
              </h3>
              <button onClick={() => setSelectedDelivery(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Name', value: selectedDelivery.name },
                { label: 'Email', value: selectedDelivery.email },
                { label: 'Phone', value: selectedDelivery.phone },
                { label: 'Vehicle', value: `${selectedDelivery.vehicle_type} · ${selectedDelivery.vehicle_number}` },
                { label: 'Location', value: `${selectedDelivery.city}${selectedDelivery.area ? ` · ${selectedDelivery.area}` : ''}` },
                selectedDelivery.driving_license && { label: '🪪 License', value: selectedDelivery.driving_license },
                selectedDelivery.aadhar_number && { label: '🆔 Aadhar', value: selectedDelivery.aadhar_number },
                selectedDelivery.upi_id && { label: '💳 UPI', value: selectedDelivery.upi_id },
              ].filter(Boolean).map((f: any) => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.82rem', fontWeight: '600' }}>{f.label}</span>
                  <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: '600' }}>{f.value}</span>
                </div>
              ))}
              {selectedDelivery.admin_notes && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.82rem', color: '#92400e' }}>
                  📝 {selectedDelivery.admin_notes}
                </div>
              )}
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
                Close
              </button>
              {selectedDelivery.status === 0 && (<>
              <button onClick={() => handleDeliveryAction(selectedDelivery.id, 'reject')} disabled={isUpdatingDelivery}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: isUpdatingDelivery ? 'not-allowed' : 'pointer' }}>
                {isUpdatingDelivery ? '...' : 'Reject'}
              </button>
              <button onClick={() => handleDeliveryAction(selectedDelivery.id, 'approve')} disabled={isUpdatingDelivery}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: isUpdatingDelivery ? 'not-allowed' : 'pointer' }}>
                {isUpdatingDelivery ? '...' : 'Approve'}
              </button>
              </>)}
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
                  type="text"
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
