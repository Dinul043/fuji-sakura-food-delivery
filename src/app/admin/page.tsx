'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type AdminStep = 'login' | 'forgot-password' | 'reset-code' | 'new-password' | 'password-success';

export default function AdminLoginPage() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const [step, setStep] = useState<AdminStep>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(-1);
  const [formData, setFormData] = useState({ email: '', password: '', newPassword: '' });
  const [errors, setErrors] = useState({ email: '', password: '', newPassword: '', otp: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Auto redirect after success
  useEffect(() => {
    if (step === 'password-success') {
      const t = setTimeout(() => setStep('login'), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const changeStep = (s: AdminStep) => {
    setStep(s);
    setErrors({ email: '', password: '', newPassword: '', otp: '' });
    if (!['reset-code', 'new-password', 'password-success'].includes(s)) {
      setOtp(['', '', '', '']);
    }
    if (!['forgot-password', 'reset-code', 'new-password', 'password-success'].includes(s)) {
      setFormData({ email: '', password: '', newPassword: '' });
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'email' ? value.trim() : value }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) { document.getElementById(`admin-otp-${index + 1}`)?.focus(); setFocusedOtpIndex(index + 1); }
    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) { document.getElementById(`admin-otp-${index - 1}`)?.focus(); setFocusedOtpIndex(index - 1); }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    const cleanEmail = formData.email.trim();
    
    if (!cleanEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.email && !newErrors.password) {
      try {
        setIsLoading(true);
        
        // Call admin login API (new endpoint) with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail.toLowerCase(),
            password: formData.password
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          // Store admin info (from new admin table)
          localStorage.setItem('adminName', data.admin.name);
          localStorage.setItem('adminEmail', data.admin.email);
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('adminToken', data.access_token);
          localStorage.setItem('userRole', 'admin');
          
          // Redirect to admin dashboard
          router.push('/admin/dashboard');
        } else {
          let errorMessage = 'Login failed. Please check your credentials.';
          
          try {
            const error = await response.json();
            
            if (response.status === 401) {
              errorMessage = 'Invalid email or password. Please try again.';
            } else if (response.status === 403) {
              errorMessage = 'Account access denied. Please contact system administrator.';
            } else if (response.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (error.detail) {
              if (typeof error.detail === 'string') {
                errorMessage = error.detail;
              }
            }
          } catch (parseError) {
            // Silent fallback - no console errors
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
          
          setErrors(prev => ({ ...prev, password: errorMessage }));
        }
      } catch (error) {
        // Silent fallback - no console errors
        
        // Handle different types of network errors
        let errorMessage = 'Network error. Please try again.';
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (error.message === 'Failed to fetch') {
            errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
          } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network connection failed. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          }
        }
        
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) { setErrors(prev => ({ ...prev, email: 'Please enter a valid email' })); return; }
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE_URL}/api/admin/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.toLowerCase() }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        changeStep('reset-code');
      } else {
        const err = await res.json();
        setErrors(prev => ({ ...prev, email: err.detail || 'Failed to send reset code. Please try again.' }));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setErrors(prev => ({ ...prev, email: 'Request timed out. Please check your connection.' }));
      } else {
        setErrors(prev => ({ ...prev, email: 'Unable to connect to server. Please try again.' }));
      }
    } finally { setIsLoading(false); }
  };

  const handleVerifyResetCode = async () => {
    const code = otp.join('');
    if (code.length !== 4) { setErrors(prev => ({ ...prev, otp: 'Please enter the complete code' })); return; }
    changeStep('new-password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newPassword || formData.newPassword.length < 8) {
      setErrors(prev => ({ ...prev, newPassword: 'Password must be at least 8 characters' })); return;
    }
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE_URL}/api/admin/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.toLowerCase(), token: otp.join(''), new_password: formData.newPassword }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        changeStep('password-success');
      } else {
        const err = await res.json();
        setErrors(prev => ({ ...prev, newPassword: err.detail || 'Failed to reset password. Please try again.' }));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setErrors(prev => ({ ...prev, newPassword: 'Request timed out. Please check your connection.' }));
      } else {
        setErrors(prev => ({ ...prev, newPassword: 'Unable to connect to server. Please try again.' }));
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      {/* Left Column - 60% width - Same Orange Theme as Customer Login */}
      <div style={{ 
        width: '60%', 
        background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        {/* Main Content */}
        <div style={{ textAlign: 'center', zIndex: 2, color: 'white' }}>
          <div style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #fff, #ffe0d6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            🛡️
          </div>
          
          <h1 style={{ 
            fontFamily: 'Anuphan, system-ui, sans-serif',
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Admin Portal
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            opacity: 0.9, 
            maxWidth: '400px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Secure access to system administration and restaurant management dashboard
          </p>
          
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem 2rem',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <p style={{ 
                fontSize: '1rem', 
                margin: 0, 
                fontWeight: '600',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>
                AUTHORIZED PERSONNEL ONLY
              </p>
              <p style={{ 
                fontSize: '0.85rem', 
                margin: '0.5rem 0 0 0', 
                opacity: 0.9,
                color: 'white',
                fontWeight: '400'
              }}>
                Secure Admin Access Portal
              </p>
            </div>
          </div>
        </div>

        {/* CSS Animation */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>

      {/* Right Column - 40% width - Login Form */}
      <div style={{ 
        width: '40%', 
        backgroundColor: '#FFF7EE', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Subtle Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 87, 34, 0.05) 2px, transparent 0)',
          backgroundSize: '50px 50px',
          zIndex: 0
        }}></div>
        
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          
          {/* White Card with Enhanced Design */}
          <div style={{ 
            width: '100%', 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            padding: '2.5rem 2rem', 
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 87, 34, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FF5722, #FF7043, #FF8A65)',
            }}></div>

            {/* Logo and Title Section */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{
                width: '90px',
                height: '90px',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 12px 40px rgba(255, 87, 34, 0.4)',
                border: '3px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span style={{ fontSize: '2.2rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>⚡</span>
              </div>
              
              <h2 style={{
                fontFamily: 'Anuphan, system-ui, sans-serif',
                fontSize: '1.6rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 0.5rem 0',
                textAlign: 'center'
              }}>
                System Administration
              </h2>
              <div style={{
                width: '60px',
                height: '3px',
                background: 'linear-gradient(90deg, #FF5722, #FF7043)',
                borderRadius: '2px',
                margin: '0 auto 1rem auto'
              }}></div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#FF5722',
                borderRadius: '50%'
              }}></div>
              <h3 style={{ 
                fontFamily: 'Anuphan, system-ui, sans-serif', 
                fontWeight: 700, 
                fontSize: '1.6rem', 
                margin: 0, 
                color: '#1e293b',
                textAlign: 'center'
              }}>
                Admin Sign In
              </h3>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#FF5722',
                borderRadius: '50%'
              }}></div>
            </div>
            
            <p style={{ 
              fontFamily: 'Anuphan, system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '1rem',
              textAlign: 'center',
              color: '#64748b',
              marginBottom: '2.5rem',
              marginTop: '0.5rem',
              lineHeight: '1.5'
            }}>
              🔐 Enter your credentials to access the admin dashboard
            </p>
            
            <form onSubmit={handleAdminLogin} style={{ marginTop: '1.5rem', display: step === 'login' ? 'block' : 'none' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#374151', 
                  fontWeight: '500', 
                  fontSize: '0.95rem',
                  fontFamily: 'Anuphan, system-ui, sans-serif'
                }}>
                  Admin Email
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#FF5722',
                    fontSize: '1.1rem'
                  }}>
                    👤
                  </span>
                  <input 
                    type="text" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="admin@fujifood.com" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 0.875rem 0.875rem 3rem', 
                      border: `2px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.email) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.email) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                </div>
                {errors.email && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.email}</p>}
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#374151', 
                  fontWeight: '500', 
                  fontSize: '0.95rem',
                  fontFamily: 'Anuphan, system-ui, sans-serif'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Enter admin password" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.password) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.password) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ 
                      position: 'absolute', 
                      right: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '1.1rem',
                      color: '#FF5722'
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.password}</p>}
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading} 
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: isLoading ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.3s ease',
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)',
                  marginBottom: '1.5rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.4)';
                  }
                }}
              >
                {isLoading ? 'Authenticating...' : 'Access Admin Dashboard'}
              </button>

              {/* Forgot Password Link */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, password: '', newPassword: '' })); changeStep('forgot-password'); }}
                  style={{ background: 'none', border: 'none', color: '#FF5722', fontSize: '0.9rem', fontFamily: 'Anuphan, system-ui, sans-serif', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </button>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <a 
                  href="/login" 
                  style={{ 
                    color: '#FF5722', 
                    textDecoration: 'none', 
                    fontSize: '0.95rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FFF5F2'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <span>←</span> Back to Customer Login
                </a>
              </div>
            </form>

          {/* Forgot Password Step */}
          {step === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', textAlign: 'center' }}>Reset Password</h3>
              <p style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>Enter your admin email to receive a reset code</p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>Admin Email</label>
                <input type="text" name="email" value={formData.email} onChange={handleInputChange} placeholder="admin@fujifood.com"
                  style={{ width: '100%', padding: '0.875rem', border: `2px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`, borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'Anuphan, system-ui, sans-serif', backgroundColor: '#fafafa' }}
                  onFocus={(e) => { e.target.style.borderColor = '#FF5722'; }} onBlur={(e) => { if (!errors.email) e.target.style.borderColor = '#e2e8f0'; }}
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.4rem' }}>{errors.email}</p>}
              </div>
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Anuphan, system-ui, sans-serif', marginBottom: '1rem' }}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => changeStep('login')} style={{ background: 'none', border: 'none', color: '#FF5722', fontSize: '0.9rem', fontFamily: 'Anuphan, system-ui, sans-serif', fontWeight: '600', cursor: 'pointer' }}>← Back to Login</button>
              </div>
            </form>
          )}

          {/* Reset Code Step */}
          {step === 'reset-code' && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', textAlign: 'center' }}>Enter Reset Code</h3>
              <p style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>We sent a 4-digit code to <strong>{formData.email}</strong></p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {otp.map((digit, index) => (
                  <input key={index} id={`admin-otp-${index}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={() => setFocusedOtpIndex(index)} onBlur={() => setFocusedOtpIndex(-1)}
                    style={{ width: '56px', height: '56px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', border: `2px solid ${focusedOtpIndex === index ? '#FF5722' : '#e2e8f0'}`, borderRadius: '12px', outline: 'none', fontFamily: 'Anuphan, system-ui, sans-serif' }}
                  />
                ))}
              </div>
              {errors.otp && <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>{errors.otp}</p>}
              <button onClick={handleVerifyResetCode} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Anuphan, system-ui, sans-serif', marginBottom: '1rem' }}>
                Verify Code
              </button>
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => changeStep('forgot-password')} style={{ background: 'none', border: 'none', color: '#FF5722', fontSize: '0.9rem', fontFamily: 'Anuphan, system-ui, sans-serif', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
              </div>
            </div>
          )}

          {/* New Password Step */}
          {step === 'new-password' && (
            <form onSubmit={handleResetPassword} style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', textAlign: 'center' }}>Set New Password</h3>
              <p style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>Enter your new admin password</p>
              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>New Password</label>
                <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={formData.newPassword} onChange={handleInputChange} placeholder="Min. 8 characters"
                  style={{ width: '100%', padding: '0.875rem', border: `2px solid ${errors.newPassword ? '#ef4444' : '#e2e8f0'}`, borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'Anuphan, system-ui, sans-serif', backgroundColor: '#fafafa' }}
                  onFocus={(e) => { e.target.style.borderColor = '#FF5722'; }} onBlur={(e) => { if (!errors.newPassword) e.target.style.borderColor = '#e2e8f0'; }}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '1rem', top: '2.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#FF5722' }}>
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
                {errors.newPassword && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.4rem' }}>{errors.newPassword}</p>}
              </div>
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Anuphan, system-ui, sans-serif', marginBottom: '1rem' }}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => changeStep('reset-code')} style={{ background: 'none', border: 'none', color: '#FF5722', fontSize: '0.9rem', fontFamily: 'Anuphan, system-ui, sans-serif', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
              </div>
            </form>
          )}

          {/* Success Step */}
          {step === 'password-success' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Password Reset!</h3>
              <p style={{ fontFamily: 'Anuphan, system-ui, sans-serif', fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Your password has been updated. Redirecting to login...</p>
              <button onClick={() => changeStep('login')} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                Go to Login
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}