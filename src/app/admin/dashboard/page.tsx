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
  const router = useRouter(); // Move router to top
  
  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // IMMEDIATE AUTH CHECK - Before any state initialization
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = localStorage.getItem('isAdmin');
    
    console.log('🔍 Admin Dashboard Auth Check:', { 
      hasToken: !!adminToken, 
      userRole, 
      isAdmin 
    });
    
    if (!adminToken || userRole !== 'admin' || isAdmin !== 'true') {
      console.log('🚫 Unauthorized access - redirecting to admin login');
      router.push('/admin');
      return;
    }
    
    console.log('✅ Admin authenticated - access granted');
  }, [router]);

  // AUTO LOGOUT with 10-minute timer + manual logout button
  useEffect(() => {
    // Set login time
    const loginTime = Date.now();
    localStorage.setItem('adminLoginTime', loginTime.toString());
    
    // 10-minute auto-logout timer
    const autoLogoutTimer = setTimeout(() => {
      console.log('🕐 10-minute auto-logout triggered');
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
    
    // Also logout when closing tab/browser
    const handleBeforeUnload = () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminName');
      localStorage.removeItem('adminLoginTime');
      console.log('🚪 Admin logout on page close');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearTimeout(autoLogoutTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router]);

  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(10 * 60); // 10 minutes in seconds
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

  // Enhanced Admin Authentication Check
  useEffect(() => {
    const checkAdminAuth = () => {
      const adminToken = localStorage.getItem('adminToken');
      const userRole = localStorage.getItem('userRole');
      const isAdmin = localStorage.getItem('isAdmin');
      const adminEmail = localStorage.getItem('adminEmail');
      
      console.log('Auth Check:', { adminToken: !!adminToken, userRole, isAdmin, adminEmail });
      
      // Strict validation: ALL must be present and correct
      if (!adminToken || !isAdmin || userRole !== 'admin' || !adminEmail) {
        console.log('Admin access denied: Missing or invalid credentials');
        // Clear any invalid/partial credentials
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');
        
        router.push('/admin');
        return;
      }
      
      // Additional check: adminToken should look like a JWT (has 3 parts separated by dots)
      const tokenParts = adminToken.split('.');
      if (tokenParts.length !== 3) {
        console.log('Admin access denied: Invalid token format');
        // Clear invalid token
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');
        
        router.push('/admin');
        return;
      }
      
      console.log('Admin authentication passed - loading applications');
      fetchApplications();
    };
    
    checkAdminAuth();
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
        console.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === status));
    }
  };

  const updateApplicationStatus = async (applicationId: number, newStatus: 'approved' | 'rejected') => {
    try {
      setIsUpdating(true);
      
      // Get admin info from localStorage
      const adminToken = localStorage.getItem('adminToken');
      const adminEmail = localStorage.getItem('adminEmail');
      
      if (!adminToken) {
        console.error('No admin token found - redirecting to login');
        showNotification('error', 'Session Expired', 'Your session has expired. Please login again.');
        setTimeout(() => router.push('/admin'), 2000);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/restaurant/applications/${applicationId}/status?new_status=${newStatus}&admin_notes=${encodeURIComponent(adminNotes || '')}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        // Refresh applications
        await fetchApplications();
        setSelectedApplication(null);
        setAdminNotes('');
        console.log(`Application ${applicationId} ${newStatus} successfully by ${adminEmail}`);
        
        // Show success message
        const actionText = newStatus === 'approved' ? 'approved' : 'rejected';
        const actionIcon = newStatus === 'approved' ? '✅' : '❌';
        showNotification('success', 'Application Updated', `${actionIcon} Application ${actionText} successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update application status:', errorData);
        showNotification('error', 'Update Failed', `Failed to ${newStatus} application. Please try again.`);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      showNotification('error', 'Network Error', `Network error while trying to ${newStatus} application. Please check your connection.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    // The backend sends UTC time without timezone info
    // We need to explicitly treat it as UTC and convert to local time
    const utcDate = new Date(dateString + 'Z'); // Add 'Z' to indicate UTC
    
    return utcDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

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
        <div style={{ 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(255, 87, 34, 0.3)',
          border: '2px solid rgba(255, 87, 34, 0.2)'
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'spin 2s linear infinite'
          }}>
            🔄
          </div>
          <p style={{ 
            fontSize: '1.5rem', 
            color: '#FF5722',
            margin: 0,
            fontWeight: '700'
          }}>
            Loading Restaurant Applications...
          </p>
          <p style={{ 
            fontSize: '1rem', 
            color: '#64748b',
            margin: '0.5rem 0 0 0',
            fontWeight: '500'
          }}>
            Please wait while we fetch the data
          </p>
        </div>
        
        {/* CSS Animation */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
      fontFamily: 'Anuphan, system-ui, sans-serif',
      padding: '2rem'
    }}>
      {/* Optimized Background Pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2px, transparent 0)',
        backgroundSize: '50px 50px',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px', 
          padding: '2.5rem', 
          marginBottom: '2rem',
          boxShadow: '0 8px 25px rgba(255, 87, 34, 0.2)',
          border: '2px solid rgba(255, 87, 34, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  boxShadow: '0 8px 25px rgba(255, 87, 34, 0.4)'
                }}>
                  🏪
                </div>
                <div>
                  <h1 style={{ 
                    fontSize: '3rem', 
                    fontWeight: '800', 
                    background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '-0.02em'
                  }}>
                    Restaurant Hub
                  </h1>
                  <p style={{ 
                    fontSize: '1.2rem', 
                    color: '#64748b', 
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    Partnership Management Dashboard
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                color: 'white',
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)'
              }}>
                <span style={{ fontSize: '1.2rem' }}>👨‍💼</span>
                Admin Portal Active
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#FF5722',
                  border: '2px solid rgba(255, 87, 34, 0.3)',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🔄</span>
                Refresh
              </button>
              
              <button
                onClick={() => {
                  // Manual logout
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('isAdmin');
                  localStorage.removeItem('userRole');
                  localStorage.removeItem('adminEmail');
                  localStorage.removeItem('adminName');
                  localStorage.removeItem('adminLoginTime');
                  console.log('🚪 Manual admin logout');
                  router.push('/admin');
                }}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(135deg, #dc3545 0%, #e57373 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🚪</span>
                Logout ({formatSessionTime(sessionTimeLeft)})
              </button>
              
              <button
                onClick={() => router.push('/admin')}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🏠</span>
                Admin Home
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Orange Theme */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem', 
          marginBottom: '2rem' 
        }}>
          {[
            { 
              title: 'Total Applications', 
              value: applications.length, 
              icon: '📊', 
              gradient: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              bgColor: 'rgba(255, 87, 34, 0.1)',
              borderColor: 'rgba(255, 87, 34, 0.3)'
            },
            { 
              title: 'Pending Review', 
              value: applications.filter(app => app.status === 'pending').length, 
              icon: '⏳', 
              gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
              bgColor: 'rgba(255, 152, 0, 0.1)',
              borderColor: 'rgba(255, 152, 0, 0.3)'
            },
            { 
              title: 'Approved', 
              value: applications.filter(app => app.status === 'approved').length, 
              icon: '✅', 
              gradient: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              bgColor: 'rgba(76, 175, 80, 0.1)',
              borderColor: 'rgba(76, 175, 80, 0.3)'
            },
            { 
              title: 'Rejected', 
              value: applications.filter(app => app.status === 'rejected').length, 
              icon: '❌', 
              gradient: 'linear-gradient(135deg, #F44336 0%, #E57373 100%)',
              bgColor: 'rgba(244, 67, 54, 0.1)',
              borderColor: 'rgba(244, 67, 54, 0.3)'
            }
          ].map((stat, index) => (
            <div key={index} style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px', 
              padding: '2rem', 
              boxShadow: '0 8px 25px rgba(255, 87, 34, 0.15)',
              border: `2px solid ${stat.borderColor}`,
              transition: 'transform 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: stat.gradient,
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                }}>
                  {stat.icon}
                </div>
                
                <div style={{
                  padding: '0.5rem 1rem',
                  background: stat.bgColor,
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#475569'
                }}>
                  Live Data
                </div>
              </div>
              
              <div>
                <p style={{ 
                  fontSize: '3rem', 
                  fontWeight: '800', 
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 0.5rem 0',
                  lineHeight: '1'
                }}>
                  {stat.value}
                </p>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: '#64748b', 
                  margin: 0,
                  fontWeight: '600'
                }}>
                  {stat.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px', 
          padding: '2rem', 
          marginBottom: '2rem',
          boxShadow: '0 8px 25px rgba(255, 87, 34, 0.15)',
          border: '2px solid rgba(255, 87, 34, 0.2)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#FF5722',
              margin: '0 0 0.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🎯</span>
              Filter Applications
            </h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
              View applications by status or see all submissions
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Applications', icon: '📄', gradient: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)' },
              { key: 'pending', label: 'Pending Review', icon: '⏳', gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' },
              { key: 'approved', label: 'Approved', icon: '✅', gradient: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' },
              { key: 'rejected', label: 'Rejected', icon: '❌', gradient: 'linear-gradient(135deg, #F44336 0%, #E57373 100%)' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => filterApplications(filter.key)}
                style={{
                  padding: '1rem 2rem',
                  background: selectedStatus === filter.key 
                    ? filter.gradient
                    : 'rgba(255, 255, 255, 0.8)',
                  color: selectedStatus === filter.key ? 'white' : '#475569',
                  border: selectedStatus === filter.key ? 'none' : '2px solid rgba(255, 87, 34, 0.2)',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: selectedStatus === filter.key ? '0 4px 15px rgba(0, 0, 0, 0.2)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{filter.icon}</span>
                {filter.label}
                <span style={{
                  background: selectedStatus === filter.key ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 87, 34, 0.1)',
                  color: selectedStatus === filter.key ? 'white' : '#FF5722',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {filter.key === 'all' ? applications.length : applications.filter(app => app.status === filter.key).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications List - Optimized for Performance */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px', 
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(255, 87, 34, 0.15)',
          border: '2px solid rgba(255, 87, 34, 0.2)'
        }}>
          {filteredApplications.length === 0 ? (
            <div style={{ 
              padding: '5rem 2rem', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div style={{ 
                fontSize: '5rem', 
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                📭
              </div>
              <h3 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                margin: '0 0 1rem 0',
                color: '#FF5722'
              }}>
                No applications found
              </h3>
              <p style={{ 
                fontSize: '1.2rem', 
                margin: 0,
                color: '#64748b'
              }}>
                {selectedStatus === 'all' 
                  ? 'No restaurant applications have been submitted yet.' 
                  : `No ${selectedStatus} applications found.`}
              </p>
              
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 87, 34, 0.1)',
                borderRadius: '16px',
                border: '2px dashed rgba(255, 87, 34, 0.3)'
              }}>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#FF5722',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  💡 Applications will appear here once restaurant owners submit their partnership requests
                </p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#FF5722',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    fontSize: '1.5rem'
                  }}>
                    📋
                  </span>
                  {selectedStatus === 'all' ? 'All Applications' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Applications`}
                </h3>
                <p style={{ 
                  color: '#64748b', 
                  margin: 0, 
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>
                  {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gap: '2rem'
              }}>
                {filteredApplications.map((application, index) => (
                  <div
                    key={application.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid rgba(255, 87, 34, 0.2)',
                      borderRadius: '20px',
                      padding: '2rem',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setSelectedApplication(application)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 87, 34, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Status Indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '1.5rem',
                      right: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      background: `linear-gradient(135deg, ${getStatusColor(application.status)}20, ${getStatusColor(application.status)}40)`,
                      color: getStatusColor(application.status),
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      border: `2px solid ${getStatusColor(application.status)}30`
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{getStatusIcon(application.status)}</span>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </div>

                    {/* Application Number */}
                    <div style={{
                      position: 'absolute',
                      top: '1.5rem',
                      left: '1.5rem',
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)'
                    }}>
                      #{index + 1}
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                      {/* Restaurant Info */}
                      <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ 
                          fontSize: '2rem', 
                          fontWeight: '800', 
                          background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          margin: '0 0 0.75rem 0',
                          letterSpacing: '-0.01em'
                        }}>
                          {application.business_name}
                        </h3>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(255, 87, 34, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#FF5722'
                          }}>
                            <span>👨‍💼</span>
                            {application.owner_name}
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(76, 175, 80, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#4CAF50'
                          }}>
                            <span>🍽️</span>
                            {application.cuisine_type}
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1rem',
                          marginBottom: '1.5rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#64748b',
                            fontSize: '0.95rem'
                          }}>
                            <span>📧</span>
                            {application.email}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#64748b',
                            fontSize: '0.95rem'
                          }}>
                            <span>📱</span>
                            {application.phone}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#64748b',
                            fontSize: '0.95rem'
                          }}>
                            <span>📅</span>
                            {formatDate(application.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Address */}
                      <div style={{ 
                        padding: '1.5rem', 
                        background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05), rgba(255, 112, 67, 0.05))',
                        borderRadius: '16px',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(255, 87, 34, 0.1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>📍</span>
                          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FF5722', margin: 0 }}>
                            Restaurant Location
                          </h4>
                        </div>
                        <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                          {application.address}
                        </p>
                      </div>
                      
                      {/* Description */}
                      <div style={{ 
                        padding: '1.5rem', 
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(102, 187, 106, 0.05))',
                        borderRadius: '16px',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(76, 175, 80, 0.1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>📝</span>
                          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#4CAF50', margin: 0 }}>
                            About the Restaurant
                          </h4>
                        </div>
                        <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                          {application.description.length > 200 
                            ? application.description.substring(0, 200) + '...' 
                            : application.description}
                        </p>
                      </div>
                      
                      {/* Documents & Action */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingTop: '1.5rem',
                        borderTop: '2px solid rgba(255, 87, 34, 0.1)'
                      }}>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(244, 67, 54, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#F44336'
                          }}>
                            <span>�</span>
                            License: {application.business_license}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(255, 152, 0, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#FF9800'
                          }}>
                            <span>🍽️</span>
                            Permit: {application.food_permit}
                          </div>
                        </div>
                        
                        <button
                          style={{
                            padding: '1rem 2rem',
                            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplication(application);
                          }}
                        >
                          <span>👁️</span>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Modal Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid rgba(255, 87, 34, 0.2)'
              }}>
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  {selectedApplication.business_name}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '0.5rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Application Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                    Owner Information
                  </h4>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Name:</strong> {selectedApplication.owner_name}</p>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Email:</strong> {selectedApplication.email}</p>
                  <p style={{ margin: 0 }}><strong>Phone:</strong> {selectedApplication.phone}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                    Restaurant Details
                  </h4>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Cuisine:</strong> {selectedApplication.cuisine_type}</p>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Status:</strong> 
                    <span style={{ 
                      color: getStatusColor(selectedApplication.status),
                      fontWeight: '600',
                      marginLeft: '0.5rem'
                    }}>
                      {getStatusIcon(selectedApplication.status)} {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}><strong>Applied:</strong> {formatDate(selectedApplication.created_at)}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                  Address
                </h4>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{selectedApplication.address}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                  Description
                </h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{selectedApplication.description}</p>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                    Business License
                  </h4>
                  <p style={{ margin: 0 }}>{selectedApplication.business_license}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                    Food Service Permit
                  </h4>
                  <p style={{ margin: 0 }}>{selectedApplication.food_permit}</p>
                </div>
              </div>

              {/* Admin Actions */}
              {selectedApplication.status === 'pending' && (
                <div style={{
                  backgroundColor: 'rgba(255, 87, 34, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '2px solid rgba(255, 87, 34, 0.1)'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FF5722', margin: '0 0 1rem 0' }}>
                    Admin Notes (Optional)
                  </h4>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.75rem',
                      border: '2px solid rgba(255, 87, 34, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '2px solid rgba(255, 87, 34, 0.2)'
              }}>
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                      disabled={isUpdating}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: isUpdating ? '#94a3b8' : 'linear-gradient(135deg, #F44336 0%, #E57373 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isUpdating ? 'Updating...' : '❌ Reject'}
                    </button>

                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                      disabled={isUpdating}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: isUpdating ? '#94a3b8' : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isUpdating ? 'Updating...' : '✅ Approve'}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#FF5722',
                    border: '2px solid rgba(255, 87, 34, 0.3)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Close
                </button>
              </div>

              {/* Show admin notes if exists */}
              {selectedApplication.admin_notes && (
                <div style={{
                  backgroundColor: 'rgba(255, 87, 34, 0.05)',
                  border: '2px solid rgba(255, 87, 34, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#FF5722', margin: '0 0 0.5rem 0' }}>
                    Admin Notes:
                  </h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                    {selectedApplication.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Beautiful Notification System */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 2000,
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: `3px solid ${
            notification.type === 'success' ? '#4CAF50' : 
            notification.type === 'error' ? '#F44336' : '#FF9800'
          }`,
          minWidth: '350px',
          maxWidth: '500px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${
                notification.type === 'success' ? '#4CAF50, #66BB6A' : 
                notification.type === 'error' ? '#F44336, #E57373' : '#FF9800, #FFB74D'
              })`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white',
              flexShrink: 0
            }}>
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : '⚠️'}
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 0.5rem 0',
                fontFamily: 'Anuphan, system-ui, sans-serif'
              }}>
                {notification.title}
              </h4>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: 0,
                lineHeight: '1.5',
                fontFamily: 'Anuphan, system-ui, sans-serif'
              }}>
                {notification.message}
              </p>
            </div>
            
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#64748b'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation for Notification */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}