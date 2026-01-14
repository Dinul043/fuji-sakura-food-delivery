'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type AuthStep = 'welcome' | 'signin' | 'signup' | 'otp-signin' | 'otp-signup' | 'forgot-password' | 'change-password' | 'register-name';

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(5);
  const [canResend, setCanResend] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
    firstName: '',
    lastName: ''
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    newPassword: '',
    firstName: '',
    lastName: '',
    otp: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // OTP Timer
  useEffect(() => {
    if ((currentStep === 'otp-signin' || currentStep === 'otp-signup') && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
  }, [otpTimer, currentStep]);

  // Clear form when changing steps
  const changeStep = (step: AuthStep) => {
    setCurrentStep(step);
    setFormData({ email: '', password: '', newPassword: '', firstName: '', lastName: '' });
    setErrors({ email: '', password: '', newPassword: '', firstName: '', lastName: '', otp: '' });
    setOtp(['', '', '', '']);
    setOtpTimer(5);
    setCanResend(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    const uppercase = password.replace(/[^A-Z]/g, '').length;
    const lowercase = password.replace(/[^a-z]/g, '').length;
    const numbers = password.replace(/[^0-9]/g, '').length;
    return uppercase >= 5 && lowercase >= 1 && numbers >= 1;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOtp = () => {
    setOtpTimer(5);
    setCanResend(false);
    setOtp(['', '', '', '']);
  };

  const handleGoogleSignIn = () => {
    localStorage.setItem('userName', 'Google User');
    localStorage.setItem('isGuest', 'false');
    router.push('/home');
  };

  const handleGuestLogin = () => {
    localStorage.setItem('userName', 'Guest');
    localStorage.setItem('isGuest', 'true');
    router.push('/home');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    if (!newErrors.email && !newErrors.password) {
      setIsLoading(true);
      setTimeout(() => {
        changeStep('otp-signin');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleVerifySignInOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setErrors(prev => ({ ...prev, otp: 'Please enter complete OTP' }));
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('userName', formData.email.split('@')[0]);
      localStorage.setItem('isGuest', 'false');
      router.push('/home');
      setIsLoading(false);
    }, 1000);
  };

  const handleSignUpEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    if (!newErrors.email) {
      setIsLoading(true);
      setTimeout(() => {
        changeStep('otp-signup');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleVerifySignUpOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setErrors(prev => ({ ...prev, otp: 'Please enter complete OTP' }));
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      changeStep('register-name');
      setIsLoading(false);
    }, 1000);
  };

  const handleRegisterName = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Minimum 8 characters, with at least 5 uppercase, 1 lowercase, and 1 number (0-9) required';
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Please confirm your password';
    } else if (formData.password !== formData.newPassword) {
      newErrors.newPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (!newErrors.firstName && !newErrors.lastName && !newErrors.password && !newErrors.newPassword) {
      setIsLoading(true);
      setTimeout(() => {
        localStorage.setItem('userName', formData.firstName + ' ' + formData.lastName);
        localStorage.setItem('isGuest', 'false');
        router.push('/home');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    if (!newErrors.email) {
      setIsLoading(true);
      setTimeout(() => {
        changeStep('change-password');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Minimum 8 characters, with at least 5 uppercase, 1 lowercase, and 1 number (0-9) required';
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Please confirm your password';
    } else if (formData.password !== formData.newPassword) {
      newErrors.newPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (!newErrors.password && !newErrors.newPassword) {
      setIsLoading(true);
      setTimeout(() => {
        alert('Password changed successfully!');
        changeStep('signin');
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      {/* Left Column - 60% width - 4 Image Panels */}
      <div style={{ width: '60%', display: 'flex', height: '100vh', margin: 0, padding: 0, backgroundColor: '#D9D9D9' }}>
        {/* Image Panel 1 - visible but lighter */}
        <div style={{ width: '231px', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
          <Image src="/images/auth/Rectangle 1681 .png" alt="" fill style={{ objectFit: 'cover', opacity: 0.45 }} />
        </div>
        
        {/* Image Panel 2 - high opacity (clear/HD) */}
        <div style={{ width: '230px', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
          <Image src="/images/auth/Rectangle 1682 (1).png" alt="" fill style={{ objectFit: 'cover', opacity: 0.85 }} />
        </div>
        
        {/* Image Panel 3 - visible but lighter (same as Image 1) */}
        <div style={{ width: '230px', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
          <Image src="/images/auth/Rectangle 1683 .png" alt="" fill style={{ objectFit: 'cover', opacity: 0.45 }} />
        </div>
        
        {/* Image Panel 4 - high opacity (same as Image 2) */}
        <div style={{ width: '231px', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
          <Image src="/images/auth/Rectangle 1684 .png" alt="" fill style={{ objectFit: 'cover', opacity: 0.85 }} />
        </div>
      </div>

      {/* Right Column - 40% width - Content Area */}
      <div style={{ width: '40%', backgroundColor: '#FFF7EE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
        {/* Decorative Images */}
        <div style={{ position: 'absolute', top: '-60px', right: '100px', width: '191px', height: '191px', opacity: 0.09, zIndex: 0 }}>
          <Image src="/images/auth/Ellipse 11.png" alt="" fill style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ position: 'absolute', top: '56px', right: '-50px', width: '75px', height: '75px', opacity: 0.11, zIndex: 0 }}>
          <Image src="/images/auth/Ellipse 12.png" alt="" fill style={{ objectFit: 'contain' }} />
        </div>
        
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Logo - OUTSIDE the card */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <Image src="/images/logo/Logo.png" alt="Fuji foods" width={180} height={54} />
          </div>
          
          {/* White Card */}
          <div style={{ 
            width: '100%', 
            backgroundColor: 'white', 
            borderRadius: '20px', 
            padding: '2.5rem 2rem', 
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
          }}>

          {/* Welcome Screen */}
          {currentStep === 'welcome' && (
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1F2937', textAlign: 'center' }}>Welcome</h1>
              <p style={{ color: '#6B7280', marginBottom: '2rem', fontSize: '0.95rem', textAlign: 'center', lineHeight: '1.5' }}>Get Started by signing in to your account or create a new one to began your journey</p>
              
              {/* Sign in button */}
              <button 
                onClick={() => changeStep('signin')} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d94d25'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F15D31'}
                style={{ 
                  width: '100%', 
                  height: '54px', 
                  backgroundColor: '#F15D31', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  marginBottom: '1rem',
                  padding: '16px 28px',
                  boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign in
              </button>
              
              {/* Sign up button */}
              <button 
                onClick={() => changeStep('signup')} 
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF5F2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                style={{ 
                  width: '100%', 
                  height: '54px', 
                  backgroundColor: 'white', 
                  color: '#F15D31', 
                  border: '1px solid #F15D31', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  padding: '16px 28px',
                  boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign up
              </button>
              
              {/* Divider with "or with Google" */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#D7CDCD' }}></div>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '16px', 
                  lineHeight: '24px', 
                  color: '#667085',
                  whiteSpace: 'nowrap'
                }}>
                  or with Google
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#D7CDCD' }}></div>
              </div>
              
              {/* Sign in with Google button */}
              <button 
                onClick={handleGoogleSignIn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#999';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#D0D5DD';
                }}
                style={{ 
                  width: '100%', 
                  height: '52px', 
                  backgroundColor: 'white', 
                  color: '#344054', 
                  border: '1px solid #D0D5DD', 
                  borderRadius: '8px', 
                  fontSize: '0.95rem', 
                  fontWeight: '500', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  marginBottom: '1.5rem',
                  padding: '12px 20px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Sign in with Google
              </button>
              
              {/* Continue as Guest */}
              <button 
                onClick={handleGuestLogin}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8e8e8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                style={{ 
                  width: '100%', 
                  padding: '0.875rem', 
                  backgroundColor: '#f5f5f5', 
                  color: '#666', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '500', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                Continue as Guest
              </button>
            </div>
          )}

          {/* Sign In Screen */}
          {currentStep === 'signin' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1F2937', textAlign: 'center' }}>Welcome back! Sign in to your account</h2>
              
              <form onSubmit={handleSignIn} style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500', fontSize: '0.95rem' }}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>✉️</span>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="viaoli@untitledui.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 3rem', border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                  {errors.email && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500', fontSize: '0.95rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.password ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span style={{ color: '#666' }}>Remember me</span>
                  </label>
                  <button type="button" onClick={() => changeStep('forgot-password')} style={{ background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
                    Forgot Password?
                  </button>
                </div>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s' }}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                
                <button type="button" onClick={() => changeStep('welcome')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
                  ← Back to welcome
                </button>
              </form>
            </div>
          )}

          {/* OTP Verification for Sign In */}
          {currentStep === 'otp-signin' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Enter OTP to verify your email</h2>
              
              <div style={{ marginTop: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: '#333', fontWeight: '500' }}>Enter OTP</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  {otp.map((digit, index) => (
                    <input key={index} id={`otp-${index}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} style={{ width: '60px', height: '60px', textAlign: 'center', fontSize: '1.5rem', border: `2px solid ${errors.otp ? '#dc3545' : '#ddd'}`, borderRadius: '8px', outline: 'none' }} />
                  ))}
                </div>
                {errors.otp && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginBottom: '1rem' }}>{errors.otp}</p>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>Valid for {otpTimer} sec</span>
                  <button type="button" onClick={handleResendOtp} disabled={!canResend} style={{ background: 'none', border: 'none', color: canResend ? '#FF5722' : '#999', cursor: canResend ? 'pointer' : 'not-allowed', fontWeight: '500' }}>
                    Resend
                  </button>
                </div>
                
                <button onClick={handleVerifySignInOtp} disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Verifying...' : 'Verify email'}
                </button>
                
                <button type="button" onClick={() => changeStep('signin')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to Email
                </button>
              </div>
            </div>
          )}

          {/* Sign Up - Email Entry */}
          {currentStep === 'signup' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Create new account</h2>
              
              <form onSubmit={handleSignUpEmail} style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>✉️</span>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="viaoli@untitledui.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 3rem', border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                  </div>
                  {errors.email && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>
                
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>We send you an OTP to your registered E-mail.</p>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
                
                <button type="button" onClick={() => changeStep('welcome')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to welcome
                </button>
              </form>
            </div>
          )}

          {/* OTP Verification for Sign Up */}
          {currentStep === 'otp-signup' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Enter OTP to verify your E-mail</h2>
              
              <div style={{ marginTop: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: '#333', fontWeight: '500' }}>Enter OTP</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  {otp.map((digit, index) => (
                    <input key={index} id={`otp-${index}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} style={{ width: '60px', height: '60px', textAlign: 'center', fontSize: '1.5rem', border: `2px solid ${errors.otp ? '#dc3545' : '#ddd'}`, borderRadius: '8px', outline: 'none' }} />
                  ))}
                </div>
                {errors.otp && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginBottom: '1rem' }}>{errors.otp}</p>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>Valid for {otpTimer} sec</span>
                  <button type="button" onClick={handleResendOtp} disabled={!canResend} style={{ background: 'none', border: 'none', color: canResend ? '#FF5722' : '#999', cursor: canResend ? 'pointer' : 'not-allowed', fontWeight: '500' }}>
                    Resend
                  </button>
                </div>
                
                <button onClick={handleVerifySignUpOtp} disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Verifying...' : 'Verify email'}
                </button>
                
                <button type="button" onClick={() => changeStep('signup')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to Email
                </button>
              </div>
            </div>
          )}

          {/* Register Name and Password */}
          {currentStep === 'register-name' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Register your name</h2>
              
              <form onSubmit={handleRegisterName} style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>First name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.firstName ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                  {errors.firstName && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.firstName}</p>}
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>last name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.lastName ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                  {errors.lastName && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.lastName}</p>}
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.password ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                  <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>Minimum 8 characters, with at least 5 uppercase, 1 lowercase, and 1 number (0-9) required.</p>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>New password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={formData.newPassword} onChange={handleInputChange} placeholder="Password" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.newPassword ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.newPassword && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.newPassword}</p>}
                </div>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Creating account...' : 'Sign up'}
                </button>
                
                <button type="button" onClick={() => changeStep('otp-signup')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to OTP
                </button>
              </form>
            </div>
          )}

          {/* Forgot Password */}
          {currentStep === 'forgot-password' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Change your password</h2>
              
              <form onSubmit={handleForgotPassword} style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>✉️</span>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="viaoli@untitledui.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 3rem', border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                  </div>
                  {errors.email && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>
                
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>We send you an OTP to your registered E-mail.</p>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Sending OTP...' : 'Sent OTP'}
                </button>
                
                <button type="button" onClick={() => changeStep('welcome')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to welcome
                </button>
              </form>
            </div>
          )}

          {/* Change Password */}
          {currentStep === 'change-password' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Change Password</h2>
              
              <form onSubmit={handleChangePassword} style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.password ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                  <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>Minimum 8 characters, with at least 5 uppercase, 1 lowercase, and 1 number (0-9) required.</p>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>New password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={formData.newPassword} onChange={handleInputChange} placeholder="Password" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.newPassword ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.newPassword && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.newPassword}</p>}
                </div>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Changing password...' : 'Change Password'}
                </button>
                
                <button type="button" onClick={() => changeStep('forgot-password')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to OTP
                </button>
              </form>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
