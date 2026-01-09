'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Choose method, 2: Enter details, 3: OTP, 4: Reset password
  const [method, setMethod] = useState(''); // 'phone' or 'email'
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    phone: '',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMethodSelect = (selectedMethod: string) => {
    setMethod(selectedMethod);
    setStep(2);
  };

  const handleSendOTP = () => {
    const newErrors = { phone: '', email: '', otp: '', newPassword: '', confirmPassword: '' };
    
    if (method === 'phone') {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    } else {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    
    if (!newErrors.phone && !newErrors.email) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep(3);
      }, 1000);
    }
  };

  const handleVerifyOTP = () => {
    const newErrors = { phone: '', email: '', otp: '', newPassword: '', confirmPassword: '' };
    
    if (!formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.otp) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep(4);
      }, 1000);
    }
  };

  const handleResetPassword = () => {
    const newErrors = { phone: '', email: '', otp: '', newPassword: '', confirmPassword: '' };
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.newPassword && !newErrors.confirmPassword) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        alert('Password reset successful! Please login with your new password.');
        router.push('/login');
      }, 1000);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 style={{
              color: '#333',
              fontSize: '1.8rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              textAlign: 'center',
              margin: '0 0 0.5rem 0'
            }}>
              Reset Password
            </h2>
            <p style={{
              color: '#666',
              fontSize: '0.9rem',
              textAlign: 'center',
              margin: '0 0 2rem 0'
            }}>
              Choose how you'd like to reset your password
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => handleMethodSelect('email')}
                style={{
                  padding: '1rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.backgroundColor = '#f8f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e1e5e9';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📧</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#333' }}>Email</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Reset via email address</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('phone')}
                style={{
                  padding: '1rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.backgroundColor = '#f8f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e1e5e9';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📱</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#333' }}>Phone</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Reset via SMS</div>
                </div>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{
              color: '#333',
              fontSize: '1.8rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              textAlign: 'center',
              margin: '0 0 0.5rem 0'
            }}>
              Enter {method === 'phone' ? 'Phone Number' : 'Email'}
            </h2>
            <p style={{
              color: '#666',
              fontSize: '0.9rem',
              textAlign: 'center',
              margin: '0 0 2rem 0'
            }}>
              We'll send you a verification code
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                {method === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              <input
                type={method === 'phone' ? 'tel' : 'email'}
                name={method}
                value={method === 'phone' ? formData.phone : formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${(method === 'phone' ? errors.phone : errors.email) ? '#e74c3c' : '#e1e5e9'}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder={method === 'phone' ? 'Enter your phone number' : 'Enter your email'}
                onFocus={(e) => {
                  if (!(method === 'phone' ? errors.phone : errors.email)) {
                    e.target.style.borderColor = '#667eea';
                  }
                }}
                onBlur={(e) => {
                  if (!(method === 'phone' ? errors.phone : errors.email)) {
                    e.target.style.borderColor = '#e1e5e9';
                  }
                }}
              />
              {(method === 'phone' ? errors.phone : errors.email) && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  {method === 'phone' ? errors.phone : errors.email}
                </div>
              )}
            </div>

            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isLoading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{
              color: '#333',
              fontSize: '1.8rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              textAlign: 'center',
              margin: '0 0 0.5rem 0'
            }}>
              Enter Verification Code
            </h2>
            <p style={{
              color: '#666',
              fontSize: '0.9rem',
              textAlign: 'center',
              margin: '0 0 2rem 0'
            }}>
              We sent a 6-digit code to your {method}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Verification Code
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${errors.otp ? '#e74c3c' : '#e1e5e9'}`,
                  borderRadius: '8px',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="000000"
                onFocus={(e) => {
                  if (!errors.otp) {
                    e.target.style.borderColor = '#667eea';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.otp) {
                    e.target.style.borderColor = '#e1e5e9';
                  }
                }}
              />
              {errors.otp && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  {errors.otp}
                </div>
              )}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isLoading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Resend Code
            </button>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={{
              color: '#333',
              fontSize: '1.8rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              textAlign: 'center',
              margin: '0 0 0.5rem 0'
            }}>
              Create New Password
            </h2>
            <p style={{
              color: '#666',
              fontSize: '0.9rem',
              textAlign: 'center',
              margin: '0 0 2rem 0'
            }}>
              Enter your new password
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${errors.newPassword ? '#e74c3c' : '#e1e5e9'}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter new password"
                onFocus={(e) => {
                  if (!errors.newPassword) {
                    e.target.style.borderColor = '#667eea';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.newPassword) {
                    e.target.style.borderColor = '#e1e5e9';
                  }
                }}
              />
              {errors.newPassword && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  {errors.newPassword}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${errors.confirmPassword ? '#e74c3c' : '#e1e5e9'}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirm new password"
                onFocus={(e) => {
                  if (!errors.confirmPassword) {
                    e.target.style.borderColor = '#667eea';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.confirmPassword) {
                    e.target.style.borderColor = '#e1e5e9';
                  }
                }}
              />
              {errors.confirmPassword && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isLoading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 6s ease infinite',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Food Emojis */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '2rem', animation: 'float 3s ease-in-out infinite' }}>🍜</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '1.5rem', animation: 'float 2.5s ease-in-out infinite 0.5s' }}>🍱</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: '1.8rem', animation: 'float 3.5s ease-in-out infinite 1s' }}>🍣</div>
      <div style={{ position: 'absolute', bottom: '30%', right: '10%', fontSize: '2.2rem', animation: 'float 2.8s ease-in-out infinite 1.5s' }}>🍙</div>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/login')}
          >
            Fuji Sakura
          </h1>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Back to Login
          </button>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '400px'
          }}>
            {renderStep()}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}