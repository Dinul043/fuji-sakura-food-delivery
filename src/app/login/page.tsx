'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    phone: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    // Must contain @gmail.com and have at least one character before @
    if (!email.includes('@gmail.com')) return false;
    const beforeAt = email.split('@gmail.com')[0];
    return beforeAt.length > 0 && email.endsWith('@gmail.com');
  };

  const validatePhone = (phone: string) => {
    // Remove all non-digits and check if exactly 10 digits
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For phone input, only allow numbers
    if (name === 'phone') {
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error immediately when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation feedback (optional - shows errors as they type)
    // You can uncomment this if you want instant validation
    /*
    if (name === 'email' && value.length > 0) {
      if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Email must end with @gmail.com' }));
      }
    }
    if (name === 'phone' && value.length > 0) {
      if (!validatePhone(value)) {
        setErrors(prev => ({ ...prev, phone: 'Please enter exactly 10 digits' }));
      }
    }
    */
  };

  // Clear form data when switching between login/signup or phone/email
  const handleLoginToggle = (loginState: boolean) => {
    setIsLogin(loginState);
    // Clear all form data and errors
    setFormData({ phone: '', email: '', password: '' });
    setErrors({ phone: '', email: '', password: '' });
  };

  const handlePhoneToggle = (phoneState: boolean) => {
    setIsPhoneLogin(phoneState);
    // Clear all form data and errors
    setFormData({ phone: '', email: '', password: '' });
    setErrors({ phone: '', email: '', password: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = { phone: '', email: '', password: '' };
    
    if (isPhoneLogin) {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter exactly 10 digits';
      }
    } else {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Email must end with @gmail.com (e.g., user@gmail.com)';
      }
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.phone && !newErrors.email && !newErrors.password) {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/home');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleGuestLogin = () => {
    router.push('/home');
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
      animation: 'gradientShift 15s ease infinite',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Food Emojis - Slower and More Subtle */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '2rem', animation: 'float 6s ease-in-out infinite', opacity: 0.7 }}>🍜</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '1.5rem', animation: 'float 5s ease-in-out infinite 1s', opacity: 0.6 }}>🍱</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: '1.8rem', animation: 'float 7s ease-in-out infinite 2s', opacity: 0.7 }}>🍣</div>
      <div style={{ position: 'absolute', bottom: '30%', right: '10%', fontSize: '2.2rem', animation: 'float 5.5s ease-in-out infinite 3s', opacity: 0.6 }}>🍙</div>
      <div style={{ position: 'absolute', top: '50%', left: '5%', fontSize: '1.6rem', animation: 'float 6.5s ease-in-out infinite 4s', opacity: 0.5 }}>🥢</div>
      <div style={{ position: 'absolute', top: '60%', right: '5%', fontSize: '1.9rem', animation: 'float 5.2s ease-in-out infinite 1.5s', opacity: 0.6 }}>🍵</div>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Fuji Sakura
          </h1>
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
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                color: '#333',
                fontSize: '1.8rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                margin: 0
              }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p style={{
                color: '#666',
                fontSize: '0.9rem',
                margin: 0
              }}>
                {isLogin ? 'Sign in to continue' : 'Join us today'}
              </p>
            </div>

            {/* Login/Signup Toggle - Using Shadcn Button */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '1.5rem'
            }}>
              <Button
                onClick={() => handleLoginToggle(true)}
                variant="ghost"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isLogin ? '#ff6b6b' : 'transparent',
                  color: isLogin ? 'white' : '#666',
                  height: 'auto'
                }}
              >
                Sign In
              </Button>
              <Button
                onClick={() => handleLoginToggle(false)}
                variant="ghost"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: !isLogin ? '#ff6b6b' : 'transparent',
                  color: !isLogin ? 'white' : '#666',
                  height: 'auto'
                }}
              >
                Sign Up
              </Button>
            </div>

            {/* Phone/Email Toggle - Using Shadcn Button */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '1.5rem'
            }}>
              <Button
                onClick={() => handlePhoneToggle(false)}
                variant="ghost"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: !isPhoneLogin ? '#ff6b6b' : 'transparent',
                  color: !isPhoneLogin ? 'white' : '#666',
                  height: 'auto'
                }}
              >
                📧 Email
              </Button>
              <Button
                onClick={() => handlePhoneToggle(true)}
                variant="ghost"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isPhoneLogin ? '#ff6b6b' : 'transparent',
                  color: isPhoneLogin ? 'white' : '#666',
                  height: 'auto'
                }}
              >
                📱 Phone
              </Button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email/Phone Input - Keep Original Styling */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  {isPhoneLogin ? 'Phone Number' : 'Email Address'}
                </label>
                <input
                  type={isPhoneLogin ? 'tel' : 'text'}
                  name={isPhoneLogin ? 'phone' : 'email'}
                  value={isPhoneLogin ? formData.phone : formData.email}
                  onChange={handleInputChange}
                  maxLength={isPhoneLogin ? 10 : undefined}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${(isPhoneLogin ? errors.phone : errors.email) ? '#e74c3c' : '#e1e5e9'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder={isPhoneLogin ? 'Enter 10-digit phone number' : 'Enter email ending with @gmail.com'}
                  onFocus={(e) => {
                    if (!(isPhoneLogin ? errors.phone : errors.email)) {
                      e.target.style.borderColor = '#ff6b6b';
                    }
                  }}
                  onBlur={(e) => {
                    if (!(isPhoneLogin ? errors.phone : errors.email)) {
                      e.target.style.borderColor = '#e1e5e9';
                    }
                  }}
                />
                {(isPhoneLogin ? errors.phone : errors.email) && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem'
                  }}>
                    {isPhoneLogin ? errors.phone : errors.email}
                  </div>
                )}
              </div>

              {/* Password Input - Keep Original Styling */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingRight: '3rem',
                      border: `2px solid ${errors.password ? '#e74c3c' : '#e1e5e9'}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your password"
                    onFocus={(e) => {
                      if (!errors.password) {
                        e.target.style.borderColor = '#ff6b6b';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.password) {
                        e.target.style.borderColor = '#e1e5e9';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '1.2rem'
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem'
                  }}>
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Forgot Password - Only for Sign In */}
              {isLogin && (
                <div style={{
                  textAlign: 'right',
                  marginBottom: '1.5rem'
                }}>
                  <Button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    variant="ghost"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '0',
                      height: 'auto'
                    }}
                  >
                    Forgot Password?
                  </Button>
                </div>
              )}

              {/* Submit Button - Using Shadcn Button */}
              <Button
                type="submit"
                disabled={isLoading}
                variant="ghost"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: isLoading ? '#ccc' : '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  marginBottom: '1rem',
                  height: 'auto'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#ee5a24';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#ff6b6b';
                  }
                }}
              >
                {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>

              {/* Continue as Guest - Using Shadcn Button */}
              <Button
                type="button"
                onClick={handleGuestLogin}
                variant="ghost"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e1e5e9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
              >
                Continue as Guest
              </Button>
            </form>
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

        @media (max-width: 480px) {
          .main {
            padding: 1rem;
          }
          .login-card {
            padding: 2rem;
          }
          .login-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}