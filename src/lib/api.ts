// API utility functions for backend communication
const API_BASE_URL = 'http://localhost:8000/api';

// Types for API requests and responses
export interface SignupRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
    is_verified: boolean;
  };
}

export interface ApiResponse {
  message: string;
  email?: string;
  requires_verification?: boolean;
  email_sent?: boolean;
}

// API Functions
export const authAPI = {
  // User signup
  signup: async (data: SignupRequest): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    return response.json();
  },

  // Verify OTP
  verifyOTP: async (data: OTPVerificationRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'OTP verification failed');
    }

    return response.json();
  },

  // User login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resend OTP');
    }

    return response.json();
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send reset email');
    }

    return response.json();
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password reset failed');
    }

    return response.json();
  },
};

// Token management utilities
export const tokenUtils = {
  // Save JWT token to localStorage
  saveToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  // Get JWT token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Remove JWT token
  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  // Save user data
  saveUser: (user: any) => {
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('userName', user.name);
    localStorage.setItem('isGuest', 'false');
  },

  // Get user data
  getUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userName');
    localStorage.removeItem('isGuest');
  },
};