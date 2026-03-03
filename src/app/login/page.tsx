'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type AuthStep = 'welcome' | 'signin' | 'signup' | 'otp-signin' | 'otp-signup' | 'forgot-password' | 'reset-code' | 'new-password' | 'password-success' | 'register-name';

export default function LoginPage() {
  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(25);
  const [canResend, setCanResend] = useState(false);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(-1);
  
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

  // Auto-redirect after password success
  useEffect(() => {
    if (currentStep === 'password-success') {
      const timer = setTimeout(() => {
        changeStep('signin');
      }, 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // OTP Timer
  useEffect(() => {
    if ((currentStep === 'otp-signin' || currentStep === 'otp-signup') && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
  }, [otpTimer, currentStep]);

  // Clear form when changing steps (but preserve email for OTP steps)
  const changeStep = (step: AuthStep) => {
    setCurrentStep(step);
    // Don't clear email when moving to OTP steps or reset steps
    if (step === 'otp-signup' || step === 'otp-signin' || step === 'register-name' || step === 'reset-code' || step === 'new-password' || step === 'password-success') {
      // Keep email, only clear other fields
      setFormData(prev => ({ 
        ...prev, 
        password: '', 
        newPassword: '', 
        firstName: '', 
        lastName: '' 
      }));
    } else {
      // Clear all form data for other steps
      setFormData({ email: '', password: '', newPassword: '', firstName: '', lastName: '' });
    }
    setErrors({ email: '', password: '', newPassword: '', firstName: '', lastName: '', otp: '' });
    
    // Don't clear OTP when moving from reset-code to new-password or to success (preserve the reset code)
    if (!(currentStep === 'reset-code' && (step === 'new-password' || step === 'password-success'))) {
      setOtp(['', '', '', '']);
    }
    
    setOtpTimer(25);
    setCanResend(false);
    setFocusedOtpIndex(-1);
  };

  const validateEmail = (email: string) => {
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleanEmail) && cleanEmail.includes('@') && cleanEmail.split('@').length === 2;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    const uppercase = password.replace(/[^A-Z]/g, '').length;
    const lowercase = password.replace(/[^a-z]/g, '').length;
    const numbers = password.replace(/[^0-9]/g, '').length;
    return uppercase >= 1 && lowercase >= 1 && numbers >= 1;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Trim whitespace for email field
    const cleanValue = name === 'email' ? value.trim() : value;
    setFormData(prev => ({ ...prev, [name]: cleanValue }));
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
      setFocusedOtpIndex(index + 1);
    }
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
      setFocusedOtpIndex(index - 1);
    }
  };

  const handleOtpFocus = (index: number) => {
    setFocusedOtpIndex(index);
  };

  const handleOtpBlur = () => {
    setFocusedOtpIndex(-1);
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      
      // Call resend OTP API
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase()
        })
      });
      
      if (response.ok) {
        setOtpTimer(25);
        setCanResend(false);
        setOtp(['', '', '', '']);
        setErrors(prev => ({ ...prev, otp: '' }));
      } else {
        const error = await response.json();
        let errorMessage = 'Failed to resend OTP';
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail[0]?.msg || errorMessage;
          }
        }
        setErrors(prev => ({ ...prev, otp: errorMessage }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, otp: 'Network error. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement Google OAuth integration later
  const handleGoogleSignIn = () => {
    // Temporary mock implementation - will be replaced with real OAuth
    // localStorage.setItem('userName', 'Google User');
    // localStorage.setItem('isGuest', 'false');
    // router.push('/home');
  };

  const handleGuestLogin = () => {
    localStorage.setItem('userName', 'Guest');
    localStorage.setItem('isGuest', 'true');
    router.push('/home');
  };

  const handleSignIn = async (e: React.FormEvent) => {
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
        
        // Real API call - login with email and password
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail.toLowerCase(),
            password: formData.password.trim(), // Trim password for consistency
            rememberMe: rememberMe
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // ALWAYS store auth data in localStorage for CartContext compatibility
          localStorage.setItem('userName', data.user.name);
          localStorage.setItem('userEmail', data.user.email);
          localStorage.setItem('isGuest', 'false');
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('rememberMe', rememberMe.toString());
          
          // Dispatch custom event to notify CartContext of token change
          window.dispatchEvent(new Event('tokenChanged'));
          
          // Force a page reload to ensure CartContext picks up the new token
          window.location.href = '/home';
        } else {
          const error = await response.json();
          let errorMessage = 'Login failed. Please check your credentials.';
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (response.status === 403) {
            if (error.detail && error.detail.includes('verify')) {
              // User exists but not verified - suggest completing signup
              errorMessage = 'Email not verified. Please complete your signup process or check your inbox for verification code.';
            } else {
              errorMessage = 'Account is deactivated. Please contact support.';
            }
          } else if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
            } else if (Array.isArray(error.detail)) {
              errorMessage = error.detail[0]?.msg || errorMessage;
            }
          }
          
          setErrors(prev => ({ ...prev, password: errorMessage }));
        }
      } catch (error) {
        // Silent fallback - no console errors
        setErrors(prev => ({ ...prev, password: 'Network error. Please try again.' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifySignInOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setErrors(prev => ({ ...prev, otp: 'Please enter complete OTP' }));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Verify OTP for unverified user trying to sign in
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: otpValue
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store user info and token
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('isGuest', 'false');
        localStorage.setItem('token', data.access_token);
        
        // Dispatch custom event to notify CartContext of token change
        window.dispatchEvent(new Event('tokenChanged'));
        
        // Redirect to home - CartContext will automatically fetch cart on mount
        router.push('/home');
      } else {
        const error = await response.json();
        let errorMessage = 'Invalid OTP. Please try again.';
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail[0]?.msg || errorMessage;
          }
        }
        setErrors(prev => ({ ...prev, otp: errorMessage }));
      }
    } catch (error) {
      // Silent fallback - no console errors
      setErrors(prev => ({ ...prev, otp: 'Network error. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    if (!newErrors.email) {
      try {
        setIsLoading(true);
        
        // Clean and validate email before sending
        const cleanEmail = formData.email.trim().toLowerCase();
        
        // Real API call - send OTP to email (create user with signup data)
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            firstName: formData.firstName || 'User',
            lastName: formData.lastName || 'Name', 
            password: formData.password || 'TempPass123@'
          })
        });
        
        if (response.ok) {
          setOtpTimer(25); // Set timer to 25 seconds as user requested
          changeStep('otp-signup');
        } else {
          const error = await response.json();
          let errorMessage = 'Failed to send OTP. Please try again.';
          
          // Handle specific error cases
          if (response.status === 409) {
            // User already exists and is verified
            errorMessage = 'This email is already registered. Please try with a different email or use Sign In if you have an account.';
          } else if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
            } else if (Array.isArray(error.detail)) {
              errorMessage = error.detail[0]?.msg || errorMessage;
            }
          }
          
          setErrors(prev => ({ ...prev, email: errorMessage }));
        }
      } catch (error) {
        // Silent fallback - no console errors
        setErrors(prev => ({ ...prev, email: 'Network error. Please try again.' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifySignUpOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setErrors(prev => ({ ...prev, otp: 'Please enter complete OTP' }));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Verify OTP with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: otpValue
        })
      });
      
      if (response.ok) {
        // OTP verified successfully, move to name registration
        changeStep('register-name');
      } else {
        const error = await response.json();
        let errorMessage = 'Invalid OTP. Please try again.';
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail[0]?.msg || errorMessage;
          }
        }
        setErrors(prev => ({ ...prev, otp: errorMessage }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, otp: 'Network error. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterName = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Minimum 8 characters, with at least 1 uppercase, 1 lowercase, and 1 number (0-9) required';
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Please confirm your password';
    } else if (formData.password !== formData.newPassword) {
      newErrors.newPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (!newErrors.firstName && !newErrors.lastName && !newErrors.password && !newErrors.newPassword) {
      try {
        setIsLoading(true);
        
        // Update user details in database
        const response = await fetch(`${API_BASE_URL}/api/auth/update-user-details`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            password: formData.password.trim() // Trim password for consistency
          })
        });
        
        if (response.ok) {
          localStorage.setItem('userName', formData.firstName + ' ' + formData.lastName);
          localStorage.setItem('isGuest', 'false');
          
          // Dispatch custom event to notify CartContext of token change
          window.dispatchEvent(new Event('tokenChanged'));
          
          router.push('/home');
        } else {
          const error = await response.json();
          let errorMessage = 'Registration failed. Please try again.';
          if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
            } else if (Array.isArray(error.detail)) {
              errorMessage = error.detail[0]?.msg || errorMessage;
            }
          }
          setErrors(prev => ({ ...prev, password: errorMessage }));
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, password: 'Network error. Please try again.' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    
    if (!newErrors.email) {
      try {
        setIsLoading(true);
        
        // Real API call - request password reset
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail.toLowerCase()
          })
        });
        
        if (response.ok) {
          // Move to reset code entry step
          changeStep('reset-code');
        } else {
          const error = await response.json();
          let errorMessage = 'Failed to send reset code. Please try again.';
          if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
            } else if (Array.isArray(error.detail)) {
              errorMessage = error.detail[0]?.msg || errorMessage;
            }
          }
          setErrors(prev => ({ ...prev, email: errorMessage }));
        }
      } catch (error) {
        // Silent fallback - no console errors
        setErrors(prev => ({ ...prev, email: 'Network error. Please try again.' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyResetCode = async () => {
    const resetCode = otp.join('');
    if (resetCode.length !== 4) {
      setErrors(prev => ({ ...prev, otp: 'Please enter complete reset code' }));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Verify the reset code with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          token: resetCode
        })
      });
      
      if (response.ok) {
        // Reset code is valid, move to new password step
        setErrors(prev => ({ ...prev, otp: '' }));
        changeStep('new-password');
      } else {
        const error = await response.json();
        let errorMessage = 'Invalid reset code. Please check the code from your email.';
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          }
        }
        setErrors(prev => ({ ...prev, otp: errorMessage }));
      }
    } catch (error) {
      // Silent fallback - no console errors
      setErrors(prev => ({ ...prev, otp: 'Network error. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...errors };
    
    // Validate new password
    if (!formData.password.trim()) {
      newErrors.password = 'New password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Minimum 8 characters, with at least 1 uppercase, 1 lowercase, and 1 number (0-9) required';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.password) {
      try {
        setIsLoading(true);
        
        // Reset password (OTP already verified in previous step)
        const resetCode = otp.join('');
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            token: resetCode,
            newPassword: formData.password.trim() // Trim password for consistency
          })
        });
        
        if (response.ok) {
          // Show success message instead of alert
          changeStep('password-success');
          // Clear form data
          setFormData({
            email: '',
            password: '',
            newPassword: '',
            firstName: '',
            lastName: ''
          });
          setOtp(['', '', '', '']);
        } else {
          const error = await response.json();
          let errorMessage = 'Failed to reset password. Please try again.';
          if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
              // Handle specific error cases
              if (errorMessage.includes('same as your current password')) {
                errorMessage = 'New password cannot be the same as your current password. Please choose a different password.';
              }
            } else if (Array.isArray(error.detail)) {
              errorMessage = error.detail[0]?.msg || errorMessage;
            }
          }
          setErrors(prev => ({ ...prev, password: errorMessage }));
        }
      } catch (error) {
        // Silent fallback - no console errors
        setErrors(prev => ({ ...prev, password: 'Network error. Please try again.' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', margin: 0, padding: 0,  overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Left Column - 60% width - 4 Image Panels */}
      <div style={{ width: '60%', display: 'flex', minHeight: '100vh', margin: 0, padding: 0, backgroundColor: '#D9D9D9' }}>
        {/* Image Panel 1 - visible but lighter */}
        <div style={{ width: '231px', minHeight: '100vh', height: '100%', margin: 0, padding: 0, position: 'relative', flex: '1', display: 'flex' }}>
          <Image src="/images/auth/Rectangle 1681 .png" alt="" fill style={{ objectFit: 'cover', opacity: 0.45 }} />
        </div>
        
        {/* Image Panel 2 - high opacity (clear/HD) */}
        <div style={{ width: '230px', minHeight: '100vh', height: '100%', margin: 0, padding: 0, position: 'relative', flex: '1', display: 'flex' }}>
          <Image src="/images/auth/Rectangle 1682 (1).png" alt="" fill style={{ objectFit: 'cover', opacity: 0.85 }} />
        </div>
        
        {/* Image Panel 3 - visible but lighter (same as Image 1) */}
        <div style={{ width: '230px', minHeight: '100vh', height: '100%', margin: 0, padding: 0, position: 'relative', flex: '1', display: 'flex' }}>
          <Image src="/images/auth/Rectangle 1683 .png" alt="" fill style={{ objectFit: 'cover', opacity: 0.45 }} />
        </div>
        
        {/* Image Panel 4 - high opacity (same as Image 2) */}
        <div style={{ width: '231px', minHeight: '100vh', height: '100%', margin: 0, padding: 0, position: 'relative', flex: '1', display: 'flex' }}>
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
              <h1 style={{ 
                fontFamily: 'Anuphan, system-ui, sans-serif', 
                fontWeight: 600, 
                fontSize: '32px', 
                lineHeight: '40px', 
                letterSpacing: '0%', 
                marginBottom: '1rem', 
                color: '#1a1a1a', 
                textAlign: 'center' 
              }}>
                Welcome
              </h1>
              <p style={{ 
                fontFamily: 'Anuphan, system-ui, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#667085',
                marginBottom: '2rem',
                marginTop: '0.5rem'
              }}>
                Get Started by signing in to your account or create a new one to began your journey
              </p>
              
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
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '16px', 
                  fontWeight: 600, 
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
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '16px', 
                  fontWeight: 600, 
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
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontWeight: 600, 
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
                  color: '#1D2939', 
                  border: '1px solid #D0D5DD', 
                  borderRadius: '8px', 
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '24px',
                  letterSpacing: '0%',
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
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '16px', 
                  fontWeight: 500, 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}
              >
                Continue as Guest
              </button>

              {/* Restaurant Partner Section */}
              <div style={{
                textAlign: 'center',
                padding: '1.5rem 0 1rem 0',
                borderTop: '1px solid #F5D5C8',
                marginTop: '0.5rem'
              }}>
                <p style={{
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '0.95rem',
                  color: '#8B4513',
                  margin: '0 0 1rem 0',
                  fontWeight: '600'
                }}>
                  🏪 Own a restaurant?
                </p>
                
                <a 
                  href="/restaurant"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.5rem',
                    background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
                    border: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #E64A19 0%, #FF5722 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 87, 34, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.3)';
                  }}
                >
                  <span>🚀</span>
                  Join as Restaurant Partner
                </a>
                
                <p style={{
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '0.8rem',
                  color: '#A0522D',
                  margin: '0.75rem 0 0 0',
                  lineHeight: '1.4'
                }}>
                  Grow your business with our platform
                </p>
              </div>
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
                    <input 
                      type="text" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="Enter your email" 
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 0.75rem 0.75rem 3rem', 
                        border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, 
                        borderRadius: '8px', 
                        fontSize: '0.95rem', 
                        outline: 'none' 
                      }}
                      onFocus={(e) => {
                        if (!errors.email) {
                          e.target.style.borderColor = '#F15D31';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.email) {
                          e.target.style.borderColor = '#ddd';
                        }
                      }}
                    />
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1F2937', textAlign: 'center' }}>Enter OTP to verify your email</h2>
              
              <div style={{ marginTop: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: '#333', fontWeight: '500' }}>Enter OTP</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  {otp.map((digit, index) => (
                    <input 
                      key={index} 
                      id={`otp-${index}`} 
                      type="text" 
                      maxLength={1} 
                      value={digit} 
                      onChange={(e) => handleOtpChange(index, e.target.value)} 
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={() => handleOtpFocus(index)}
                      onBlur={handleOtpBlur}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        textAlign: 'center', 
                        fontSize: '1.5rem', 
                        border: `2px solid ${
                          errors.otp ? '#dc3545' : 
                          focusedOtpIndex === index ? '#F15D31' : 
                          '#ddd'
                        }`, 
                        borderRadius: '8px', 
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        fontFamily: 'Anuphan, system-ui, sans-serif',
                        fontWeight: 600
                      }} 
                    />
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
                    <input type="text" name="email" value={formData.email} onChange={handleInputChange} placeholder="viaoli@untitledui.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 3rem', border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
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
                    <input 
                      key={index} 
                      id={`otp-${index}`} 
                      type="text" 
                      maxLength={1} 
                      value={digit} 
                      onChange={(e) => handleOtpChange(index, e.target.value)} 
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={() => handleOtpFocus(index)}
                      onBlur={handleOtpBlur}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        textAlign: 'center', 
                        fontSize: '1.5rem', 
                        border: `2px solid ${
                          errors.otp ? '#dc3545' : 
                          focusedOtpIndex === index ? '#F15D31' : 
                          '#ddd'
                        }`, 
                        borderRadius: '8px', 
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        fontFamily: 'Anuphan, system-ui, sans-serif',
                        fontWeight: 600
                      }} 
                    />
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
                  <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>Minimum 8 characters, with at least 1 uppercase, 1 lowercase, and 1 number (0-9) required.</p>
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
                    <input type="text" name="email" value={formData.email} onChange={handleInputChange} placeholder="viaoli@untitledui.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 3rem', border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
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

          {/* Reset Code Entry */}
          {currentStep === 'reset-code' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Enter Reset Code</h2>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>We've sent a 4-digit reset code to your email. Please enter it below.</p>
              
              <div style={{ marginTop: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: '#333', fontWeight: '500' }}>Reset Code</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  {otp.map((digit, index) => (
                    <input 
                      key={index} 
                      id={`otp-${index}`} 
                      type="text" 
                      maxLength={1} 
                      value={digit} 
                      onChange={(e) => handleOtpChange(index, e.target.value)} 
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={() => handleOtpFocus(index)}
                      onBlur={handleOtpBlur}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        textAlign: 'center', 
                        fontSize: '1.5rem', 
                        border: `2px solid ${
                          errors.otp ? '#dc3545' : 
                          focusedOtpIndex === index ? '#F15D31' : 
                          '#ddd'
                        }`, 
                        borderRadius: '8px', 
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        fontFamily: 'Anuphan, system-ui, sans-serif',
                        fontWeight: 600
                      }} 
                    />
                  ))}
                </div>
                {errors.otp && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginBottom: '1rem' }}>{errors.otp}</p>}
                
                <button onClick={handleVerifyResetCode} disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                
                <button type="button" onClick={() => changeStep('forgot-password')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to Email
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          {currentStep === 'new-password' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Set New Password</h2>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Enter your new password below.</p>
              
              <form onSubmit={handleChangePassword} style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter new password" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${errors.password ? '#dc3545' : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                  <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>Minimum 8 characters, with at least 1 uppercase, 1 lowercase, and 1 number (0-9) required.</p>
                </div>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </button>
                
                <button type="button" onClick={() => changeStep('reset-code')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '500' }}>
                  ← Back to Reset Code
                </button>
              </form>
            </div>
          )}

          {/* Password Success */}
          {currentStep === 'password-success' && (
            <div style={{ textAlign: 'center' }}>
              {/* Success Icon */}
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#4CAF50', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)'
              }}>
                <span style={{ fontSize: '2.5rem', color: 'white' }}>✓</span>
              </div>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>Password Changed Successfully!</h2>
              <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                Your password has been updated successfully.<br />
                You can now sign in with your new password.
              </p>
              
              {/* Animated progress or auto-redirect message */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                  🌸 Redirecting to sign in page in a moment...
                </p>
              </div>
              
              <button 
                onClick={() => changeStep('signin')} 
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 87, 34, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.3)';
                }}
              >
                Continue to Sign In
              </button>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
