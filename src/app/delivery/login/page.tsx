/*
 * Delivery Partner Login Page
 * ✅ Phase 1: DB tables — delivery_partners, delivery_tokens
 * ✅ Phase 2: Apply form + POST /api/delivery/apply
 * ✅ Phase 3: Admin approval UI
 * ✅ Phase 4: Login + forgot password (this page)
 * 🔜 Phase 5: Dashboard — available orders, accept, complete
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Step = 'login' | 'forgot' | 'verify-code' | 'new-password' | 'success';

export default function DeliveryLoginPage() {
  const router = useRouter();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [step, setStep] = useState<Step>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please enter email and password'); return; }
    setIsLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem('deliveryToken', data.access_token);
        sessionStorage.setItem('deliveryPartner', JSON.stringify(data.partner));
        router.push('/delivery/dashboard');
      } else {
        setError(data.detail || 'Login failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally { setIsLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setForgotError('Please enter your email'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
      });
      if (res.ok) { setStep('verify-code'); }
      else { const d = await res.json(); setForgotError(d.detail || 'Failed to send reset code'); }
    } catch { setForgotError('Network error. Please check your connection.'); }
    finally { setForgotLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (!resetCode.trim()) { setForgotError('Please enter the reset code'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, token: resetCode, new_password: 'placeholder' })
      });
      if (res.ok) { setStep('new-password'); }
      else { const d = await res.json(); setForgotError(d.detail || 'Invalid or expired code'); }
    } catch { setForgotError('Network error. Please check your connection.'); }
    finally { setForgotLoading(false); }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) { setForgotError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setForgotError('Passwords do not match'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, token: resetCode, new_password: newPassword })
      });
      if (res.ok) { setStep('success'); setTimeout(() => { setStep('login'); setForgotEmail(''); setResetCode(''); setNewPassword(''); setConfirmPassword(''); }, 3000); }
      else { const d = await res.json(); setForgotError(d.detail || 'Failed to reset password'); }
    } catch { setForgotError('Network error. Please check your connection.'); }
    finally { setForgotLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem', borderRadius: '12px',
    border: '2px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', backgroundColor: '#fafafa'
  };

  const stepTitle: Record<Step, string> = {
    login: 'Delivery Partner Login',
    forgot: 'Forgot Password',
    'verify-code': 'Enter Reset Code',
    'new-password': 'Set New Password',
    success: 'Password Reset!'
  };

  const stepSubtitle: Record<Step, string> = {
    login: 'Sign in to your delivery dashboard',
    forgot: 'Enter your registered email',
    'verify-code': `Code sent to ${forgotEmail} — expires in 10 mins`,
    'new-password': 'Choose a strong new password',
    success: 'Redirecting to login...'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 50%, #FF8A65 100%)',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '2.5rem 2rem',
        maxWidth: '420px', width: '100%',
        boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #FF5722, #FF7043, #FF8A65)' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', background: 'linear-gradient(135deg, #FF5722, #FF7043)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.5rem', boxShadow: '0 8px 25px rgba(255,87,34,0.3)'
          }}>
            {step === 'success' ? '✅' : '🛵'}
          </div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.5rem',
            background: 'linear-gradient(135deg, #FF5722, #FF7043)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>{stepTitle[step]}</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>{stepSubtitle[step]}</p>
        </div>

        {/* Error */}
        {(error && step === 'login') && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
            {error}
          </div>
        )}
        {(forgotError && step !== 'login') && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
            {forgotError}
          </div>
        )}

        {/* Login Form */}
        {step === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => { setStep('forgot'); setForgotEmail(email); setForgotError(''); }}
                style={{ background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', textDecoration: 'underline' }}>
                Forgot Password?
              </button>
            </div>
            <button type="submit" disabled={isLoading}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: isLoading ? 'none' : '0 4px 15px rgba(255,87,34,0.3)' }}>
              {isLoading ? 'Signing in...' : '🛵 Sign In'}
            </button>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              Not a partner yet?{' '}
              <button type="button" onClick={() => router.push('/delivery/apply')}
                style={{ background: 'none', border: 'none', color: '#FF5722', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'underline' }}>
                Apply here
              </button>
            </p>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', textAlign: 'center' }}>
              <button type="button" onClick={() => router.push('/delivery')}
                style={{ background: 'none', border: '1.5px solid #e2e8f0', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', padding: '0.5rem 1.25rem', borderRadius: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.color = '#FF5722'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#6b7280'; }}>
                ← Back to Delivery Portal
              </button>
            </div>
          </form>
        )}

        {/* Forgot — enter email */}
        {step === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Registered email" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            <button onClick={handleForgotPassword} disabled={forgotLoading}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              {forgotLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <button onClick={() => { setStep('login'); setForgotError(''); }}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', color: '#555', fontWeight: '600', cursor: 'pointer' }}>
              ← Back to Login
            </button>
          </div>
        )}

        {/* Verify code */}
        {step === 'verify-code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit code" maxLength={4}
              style={{ ...inputStyle, fontSize: '2rem', textAlign: 'center', letterSpacing: '0.75rem' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
            <button onClick={handleVerifyCode} disabled={forgotLoading}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              {forgotLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button onClick={() => { setStep('forgot'); setForgotError(''); setResetCode(''); }}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', color: '#555', fontWeight: '600', cursor: 'pointer' }}>
              ← Back
            </button>
          </div>
        )}

        {/* New password */}
        {step === 'new-password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[{ label: 'New Password', value: newPassword, setter: setNewPassword }, { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword }].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>{f.label}</label>
                <input type="password" value={f.value} onChange={e => f.setter(e.target.value)} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.backgroundColor = '#fff'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }} />
              </div>
            ))}
            <button onClick={handleResetPassword} disabled={forgotLoading}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5722, #FF7043)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              {forgotLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Your password has been updated. Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}
