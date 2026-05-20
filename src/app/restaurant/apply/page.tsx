'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RestaurantApplicationPage() {
  // Load Anuphan font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Business Details
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    
    // Restaurant Details
    address: '',
    city: '',
    area: '',
    cuisineType: '',
    description: '',
    
    // Documents (for now just text fields, later we'll add file upload)
    businessLicense: '',
    foodPermit: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const licenseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const permitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData; // Always keep ref in sync

  const validateEmail = (email: string) => {
    const cleanEmail = email.trim();
    // Requires: something@something.something (min 2 chars in domain, min 2 chars in TLD)
    const emailRegex = /^[^\s@]+@[a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,}$/;
    return emailRegex.test(cleanEmail);
  };

  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || phone.length < 10) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/check-phone/${phone}`);
      if (response.ok) {
        const data = await response.json();
        // Only set error if the field STILL has this value (user hasn't changed it)
        if (formDataRef.current.phone === phone && !data.available) {
          setErrors(e => ({ ...e, phone: data.message }));
        }
      }
    } catch {
      // Silently fail - don't show network errors for real-time validation
    }
  };

  const checkLicenseAvailability = async (license: string) => {
    if (!license || license.length < 3) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/check-license/${encodeURIComponent(license)}`);
      if (response.ok) {
        const data = await response.json();
        // Only set error if the field STILL has this value (user hasn't changed it)
        if (formDataRef.current.businessLicense.trim() === license && !data.available) {
          setErrors(e => ({ ...e, businessLicense: data.message }));
        }
      }
    } catch {
      // Silently fail - don't show network errors for real-time validation
    }
  };

  const checkPermitAvailability = async (permit: string) => {
    if (!permit || permit.length < 3) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/check-permit/${encodeURIComponent(permit)}`);
      if (response.ok) {
        const data = await response.json();
        // Only set error if the field STILL has this value (user hasn't changed it)
        if (formDataRef.current.foodPermit.trim() === permit && !data.available) {
          setErrors(e => ({ ...e, foodPermit: data.message }));
        }
      }
    } catch {
      // Silently fail - don't show network errors for real-time validation
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number - only allow digits
    if (name === 'phone') {
      const numbersOnly = value.replace(/\D/g, ''); // Remove all non-digits
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      
      // Real-time phone validation (debounced)
      if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
      if (numbersOnly.length >= 10) {
        phoneTimerRef.current = setTimeout(() => checkPhoneAvailability(numbersOnly), 500);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Real-time validation for business license and food permit (debounced)
      if (name === 'businessLicense' && value.trim().length >= 3) {
        if (licenseTimerRef.current) clearTimeout(licenseTimerRef.current);
        licenseTimerRef.current = setTimeout(() => checkLicenseAvailability(value.trim()), 500);
      } else if (name === 'foodPermit' && value.trim().length >= 3) {
        if (permitTimerRef.current) clearTimeout(permitTimerRef.current);
        permitTimerRef.current = setTimeout(() => checkPermitAvailability(value.trim()), 500);
      }
    }
    
    // Always clear error for this field when user types (unconditional)
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleNextStep = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (currentStep === 1) {
      // Validate Step 1
      if (!formData.businessName.trim()) newErrors.businessName = 'Restaurant name is required';
      if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData.password.trim().length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d+$/.test(formData.phone.trim())) {
        newErrors.phone = 'Phone number should contain only numbers';
      } else if (formData.phone.trim().length < 10) {
        newErrors.phone = 'Phone number should be at least 10 digits';
      }
    } else if (currentStep === 2) {
      // Validate Step 2
      if (!formData.address.trim()) newErrors.address = 'Restaurant address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.area.trim()) newErrors.area = 'Area is required';
      if (!formData.cuisineType) newErrors.cuisineType = 'Please select cuisine type';
      if (!formData.description.trim()) newErrors.description = 'Restaurant description is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // If Step 1 is valid, check for duplicate email before moving to Step 2
      if (currentStep === 1) {
        checkEmailAndProceed();
      } else if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const checkEmailAndProceed = async () => {
    try {
      setIsLoading(true);
      
      // First check phone number availability
      const phoneResponse = await fetch(`${API_BASE_URL}/api/restaurant/check-phone/${formData.phone}`);
      if (phoneResponse.ok) {
        const phoneData = await phoneResponse.json();
        if (!phoneData.available) {
          setErrors(prev => ({ ...prev, phone: phoneData.message }));
          setIsLoading(false);
          return;
        }
      }
      
      // Then check email availability
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Check if email already has a pending application
      const response = await fetch(`${API_BASE_URL}/api/restaurant/applications`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const applications = await response.json();
        const existingApplication = applications.find((app: any) => 
          app.email.toLowerCase() === formData.email.trim().toLowerCase() && 
          app.status === 'pending'
        );
        
        if (existingApplication) {
          setErrors(prev => ({ 
            ...prev, 
            email: 'An application with this email is already pending review. Please wait for the current application to be processed or use a different email.' 
          }));
          return;
        }
        
        // Email is available, proceed to next step
        setCurrentStep(2);
      } else {
        // Server error - show error message, don't proceed
        let errorMessage = 'Unable to verify email. Please try again.';
        if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status === 404) {
          errorMessage = 'Service unavailable. Please try again.';
        }
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } catch (error) {
      // Handle different network error types silently
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        }
      }
      
      // Show error message, don't proceed to next step
      setErrors(prev => ({ ...prev, email: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitApplication = async () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate Step 3
    if (!formData.businessLicense.trim()) newErrors.businessLicense = 'Business license number is required';
    if (!formData.foodPermit.trim()) newErrors.foodPermit = 'Food service permit is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        setIsLoading(true);
        
        // First check business license availability
        const licenseResponse = await fetch(`${API_BASE_URL}/api/restaurant/check-license/${encodeURIComponent(formData.businessLicense)}`);
        if (licenseResponse.ok) {
          const licenseData = await licenseResponse.json();
          if (!licenseData.available) {
            setErrors(prev => ({ ...prev, businessLicense: licenseData.message }));
            setIsLoading(false);
            return;
          }
        }
        
        // Then check food permit availability
        const permitResponse = await fetch(`${API_BASE_URL}/api/restaurant/check-permit/${encodeURIComponent(formData.foodPermit)}`);
        if (permitResponse.ok) {
          const permitData = await permitResponse.json();
          if (!permitData.available) {
            setErrors(prev => ({ ...prev, foodPermit: permitData.message }));
            setIsLoading(false);
            return;
          }
        }
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for submission
        
        // Real API call to backend
        const response = await fetch(`${API_BASE_URL}/api/restaurant/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            businessName: formData.businessName,
            ownerName: formData.ownerName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            area: formData.area,
            cuisineType: formData.cuisineType,
            description: formData.description,
            businessLicense: formData.businessLicense,
            foodPermit: formData.foodPermit
          })
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          // Don't log success to console in production
          
          // Show success page instead of alert
          setCurrentStep(4); // We'll create a success step
        } else {
          let errorMessage = 'Failed to submit application. Please try again.';
          
          try {
            const error = await response.json();
            
            if (response.status === 409) {
              const errorText = error.detail || 'Duplicate data found';
              
              // Route error to appropriate field based on error message
              if (errorText.includes('email')) {
                setErrors(prev => ({ ...prev, email: errorText }));
                setCurrentStep(1); // Go back to step 1 for email error
              } else if (errorText.includes('phone')) {
                setErrors(prev => ({ ...prev, phone: errorText }));
                setCurrentStep(1); // Go back to step 1 for phone error
              } else if (errorText.includes('business license') || errorText.includes('license')) {
                setErrors(prev => ({ ...prev, businessLicense: errorText }));
              } else if (errorText.includes('food permit') || errorText.includes('permit')) {
                setErrors(prev => ({ ...prev, foodPermit: errorText }));
              } else {
                setErrors(prev => ({ ...prev, businessLicense: errorText }));
              }
              return;
            } else if (error.detail) {
              if (typeof error.detail === 'string') {
                errorMessage = error.detail;
              } else if (Array.isArray(error.detail)) {
                // Pydantic validation errors
                const firstError = error.detail[0];
                errorMessage = firstError?.msg || firstError?.message || errorMessage;
              }
            }
          } catch (parseError) {
            // Error parsing response, use status-based message
            errorMessage = `Server error (${response.status}). Please try again later.`;
          }
          
          // Show error in business license field for other errors
          setErrors(prev => ({ ...prev, businessLicense: errorMessage }));
        }
      } catch (error) {
        // Handle different types of network errors with user-friendly messages silently
        let errorMessage = 'Network error. Please try again.';
        
        if (error instanceof Error) {
          if (error.message === 'Failed to fetch') {
            errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
          } else if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network connection failed. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else {
            errorMessage = 'Connection error. Please check your internet connection and try again.';
          }
        }
        
        // Show error in business license field (current step)
        setErrors(prev => ({ ...prev, businessLicense: errorMessage }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      {/* Left Column - 60% width - Orange Restaurant Theme */}
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
          top: '15%',
          left: '15%',
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '20%',
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        {/* Main Content */}
        <div style={{ textAlign: 'center', zIndex: 2, color: 'white' }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1.5rem',
            background: 'linear-gradient(45deg, #fff, #ffe0d6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            🏪
          </div>
          
          <h1 style={{ 
            fontFamily: 'Anuphan, system-ui, sans-serif',
            fontSize: '2.8rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Join Our Platform
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: 0.9, 
            maxWidth: '450px',
            lineHeight: '1.6',
            fontWeight: '400',
            marginBottom: '2rem'
          }}>
            Partner with us to reach thousands of hungry customers and grow your restaurant business
          </p>
          
          {/* Benefits List */}
          <div style={{
            textAlign: 'left',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>📈</div>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Increase your sales & reach</span>
            </div>
            
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>🚀</div>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Easy online management</span>
            </div>
            
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>💰</div>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Competitive commission rates</span>
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

      {/* Right Column - 40% width - Application Form */}
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
          
          {/* Progress Indicator */}
          <div style={{ width: '100%', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              {[1, 2, 3].map((step) => (
                <div key={step} style={{
                  width: '30%',
                  height: '4px',
                  background: step <= currentStep ? '#FF5722' : '#e0e0e0',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease'
                }}></div>
              ))}
            </div>
            <p style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '0.9rem',
              fontFamily: 'Anuphan, system-ui, sans-serif',
              margin: 0
            }}>
              Step {currentStep} of 3
            </p>
          </div>
          
          {/* Application Form Card */}
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
            {/* Top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FF5722, #FF7043, #FF8A65)',
            }}></div>

            {/* Step 1: Business Details */}
            {currentStep === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #FF5722, #FF7043)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: '0 8px 25px rgba(255, 87, 34, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.5rem', color: 'white' }}>🏪</span>
                  </div>
                  <h3 style={{
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Business Information
                  </h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Restaurant Name *
                  </label>
                  <input 
                    type="text" 
                    name="businessName" 
                    value={formData.businessName} 
                    onChange={handleInputChange} 
                    placeholder="e.g., Mario's Italian Kitchen" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.businessName ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.businessName) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.businessName) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.businessName && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.businessName}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Owner Full Name *
                  </label>
                  <input 
                    type="text" 
                    name="ownerName" 
                    value={formData.ownerName} 
                    onChange={handleInputChange} 
                    placeholder="e.g., John Smith" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.ownerName ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.ownerName) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.ownerName) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.ownerName && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.ownerName}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Business Email *
                  </label>
                  <input 
                    type="text" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="restaurant@example.com" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
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
                      const val = e.target.value.trim();
                      const emailRegex = /^[^\s@]+@[a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,}$/;
                      if (val && !emailRegex.test(val)) {
                        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                        e.target.style.borderColor = '#ef4444';
                      } else if (!val) {
                        setErrors(prev => ({ ...prev, email: 'Email is required' }));
                        e.target.style.borderColor = '#ef4444';
                      } else {
                        setErrors(prev => ({ ...prev, email: '' }));
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.email && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Password *
                  </label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Create a secure password (min 8 characters)" 
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
                  {errors.password && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.password}</p>}
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    💡 Remember this password - you'll use it to login after approval
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="1234567890 (unique per restaurant)" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.phone ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.phone) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.phone) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.phone && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.phone}</p>}
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    📞 Each restaurant must have a unique phone number
                  </p>
                </div>

                <button 
                  onClick={handleNextStep}
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
                    boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)'
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
                  {isLoading ? 'Checking Email...' : 'Continue to Restaurant Details →'}
                </button>
              </div>
            )}

            {/* Step 2: Restaurant Details */}
            {currentStep === 2 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #FF5722, #FF7043)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: '0 8px 25px rgba(255, 87, 34, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.5rem', color: 'white' }}>📍</span>
                  </div>
                  <h3 style={{
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Restaurant Details
                  </h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Restaurant Address *
                  </label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    placeholder="123 Main Street, City, State, ZIP Code" 
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.address ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      if (!errors.address) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.address) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.address && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.address}</p>}
                </div>

                {/* City and Area — both mandatory */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                      City *
                    </label>
                    <input
                      name="city" value={formData.city} onChange={handleInputChange}
                      placeholder="e.g. Chennai"
                      style={{ width: '100%', padding: '0.875rem', border: `2px solid ${errors.city ? '#ef4444' : '#e2e8f0'}`, borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'Anuphan, system-ui, sans-serif', backgroundColor: '#fafafa', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#FF5722'; e.target.style.backgroundColor = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = errors.city ? '#ef4444' : '#e2e8f0'; e.target.style.backgroundColor = '#fafafa'; }}
                    />
                    {errors.city && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.city}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                      Area / Locality *
                    </label>
                    <input
                      name="area" value={formData.area} onChange={handleInputChange}
                      placeholder="e.g. Karapakkam, T. Nagar"
                      style={{ width: '100%', padding: '0.875rem', border: `2px solid ${errors.area ? '#ef4444' : '#e2e8f0'}`, borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'Anuphan, system-ui, sans-serif', backgroundColor: '#fafafa', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#FF5722'; e.target.style.backgroundColor = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = errors.area ? '#ef4444' : '#e2e8f0'; e.target.style.backgroundColor = '#fafafa'; }}
                    />
                    {errors.area && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.area}</p>}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Cuisine Type *
                  </label>
                  <select 
                    name="cuisineType" 
                    value={formData.cuisineType} 
                    onChange={handleInputChange} 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.cuisineType ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.cuisineType) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.cuisineType) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  >
                    <option value="">Select cuisine type</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Indian">Indian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Japanese">Japanese</option>
                    <option value="American">American</option>
                    <option value="Thai">Thai</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.cuisineType && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.cuisineType}</p>}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Restaurant Description *
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Tell us about your restaurant, specialties, and what makes you unique..." 
                    rows={4}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      if (!errors.description) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.description) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.description && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.description}</p>}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={handlePrevStep}
                    style={{ 
                      flex: 1,
                      padding: '1rem', 
                      background: 'white', 
                      color: '#FF5722', 
                      border: '2px solid #FF5722', 
                      borderRadius: '12px', 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      fontFamily: 'Anuphan, system-ui, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFF5F2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    ← Back
                  </button>
                  
                  <button 
                    onClick={handleNextStep}
                    style={{ 
                      flex: 2,
                      padding: '1rem', 
                      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.4)';
                    }}
                  >
                    Continue to Documents →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #FF5722, #FF7043)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: '0 8px 25px rgba(255, 87, 34, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.5rem', color: 'white' }}>📄</span>
                  </div>
                  <h3 style={{
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Required Documents
                  </h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Business License Number *
                  </label>
                  <input 
                    type="text" 
                    name="businessLicense" 
                    value={formData.businessLicense} 
                    onChange={handleInputChange} 
                    placeholder="e.g., BL-2024-001234 (must be unique)" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.businessLicense ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.businessLicense) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.businessLicense) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.businessLicense && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.businessLicense}</p>}
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    📄 Each restaurant must have a unique business license
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', fontSize: '0.95rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    Food Service Permit Number *
                  </label>
                  <input 
                    type="text" 
                    name="foodPermit" 
                    value={formData.foodPermit} 
                    onChange={handleInputChange} 
                    placeholder="e.g., FSP-2024-567890 (must be unique)" 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem', 
                      border: `2px solid ${errors.foodPermit ? '#ef4444' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      fontSize: '0.95rem', 
                      outline: 'none',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => {
                      if (!errors.foodPermit) {
                        e.target.style.borderColor = '#FF5722';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.foodPermit) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fafafa';
                      }
                    }}
                  />
                  {errors.foodPermit && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>{errors.foodPermit}</p>}
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'Anuphan, system-ui, sans-serif' }}>
                    🍽️ Each restaurant must have a unique food service permit
                  </p>
                </div>

                <div style={{ 
                  background: '#FFF5F2', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  marginBottom: '2rem',
                  border: '1px solid #FFE0D6'
                }}>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#D84315', 
                    margin: 0,
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    lineHeight: '1.4'
                  }}>
                    📋 <strong>Important:</strong> Business license and food permit numbers must be unique for each restaurant. If you have multiple branches, each branch needs separate license and permit numbers. After submission, our team will review your application within 2-3 business days.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={handlePrevStep}
                    style={{ 
                      flex: 1,
                      padding: '1rem', 
                      background: 'white', 
                      color: '#FF5722', 
                      border: '2px solid #FF5722', 
                      borderRadius: '12px', 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      fontFamily: 'Anuphan, system-ui, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFF5F2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    ← Back
                  </button>
                  
                  <button 
                    onClick={handleSubmitApplication}
                    disabled={isLoading}
                    style={{ 
                      flex: 2,
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
                      boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)'
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
                    {isLoading ? 'Submitting Application...' : 'Submit Application 🚀'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                {/* Success Icon */}
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  backgroundColor: '#4CAF50', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 2rem auto',
                  boxShadow: '0 8px 30px rgba(76, 175, 80, 0.4)'
                }}>
                  <span style={{ fontSize: '3rem', color: 'white' }}>✓</span>
                </div>
                
                <h2 style={{
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 1rem 0',
                  textAlign: 'center'
                }}>
                  Application Submitted Successfully! 🎉
                </h2>
                
                <div style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                }}>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    margin: '0 0 1rem 0', 
                    fontWeight: '600',
                    fontFamily: 'Anuphan, system-ui, sans-serif'
                  }}>
                    🏪 Thank you for your interest in partnering with Fuji Sakura!
                  </p>
                  <p style={{ 
                    fontSize: '1rem', 
                    margin: 0, 
                    lineHeight: '1.6',
                    opacity: 0.95,
                    fontFamily: 'Anuphan, system-ui, sans-serif'
                  }}>
                    We will review your application and contact you within <strong>2-3 business days</strong>. Once approved, use your <strong>email and password</strong> to login to the restaurant portal.
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  border: '2px solid #e9ecef'
                }}>
                  <h3 style={{
                    fontFamily: 'Anuphan, system-ui, sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#495057',
                    margin: '0 0 1rem 0'
                  }}>
                    📋 What happens next?
                  </h3>
                  <ul style={{
                    textAlign: 'left',
                    color: '#6c757d',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    margin: 0,
                    paddingLeft: '1.5rem',
                    fontFamily: 'Anuphan, system-ui, sans-serif'
                  }}>
                    <li>Our team will review your application and documents</li>
                    <li>We may contact you for additional information if needed</li>
                    <li>Once approved, you'll receive login credentials for the restaurant portal</li>
                    <li>You can then start managing your menu and receiving orders</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <a 
                    href="/restaurant"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 2rem',
                      background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 87, 34, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 87, 34, 0.4)';
                    }}
                  >
                    <span>🏪</span>
                    Back to Restaurant Portal
                  </a>
                  
                  <button 
                    onClick={() => {
                      setCurrentStep(1);
                      setFormData({
                        businessName: '',
                        ownerName: '',
                        email: '',
                        password: '',
                        phone: '',
                        address: '',
                        city: '',
                        area: '',
                        cuisineType: '',
                        description: '',
                        businessLicense: '',
                        foodPermit: ''
                      });
                      setErrors({});
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 2rem',
                      background: 'white',
                      color: '#FF5722',
                      border: '2px solid #FF5722',
                      borderRadius: '12px',
                      fontFamily: 'Anuphan, system-ui, sans-serif',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFF5F2';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>📝</span>
                    Submit Another Application
                  </button>
                </div>
              </div>
            )}

            {/* Back to Login Link */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a 
                href="/restaurant" 
                style={{ 
                  color: '#FF5722', 
                  textDecoration: 'none', 
                  fontSize: '0.95rem',
                  fontFamily: 'Anuphan, system-ui, sans-serif',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF5F2';
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span>←</span> Back to Restaurant Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}