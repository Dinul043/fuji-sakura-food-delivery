/**
 * Authentication utilities for checking login status and managing sessions
 */

export interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

/**
 * Check if user is logged in by looking in both localStorage and sessionStorage
 */
export function isLoggedIn(): boolean {
  // Check localStorage first (remember me)
  const localToken = localStorage.getItem('accessToken');
  const localIsGuest = localStorage.getItem('isGuest');
  
  if (localToken && localIsGuest === 'false') {
    return true;
  }
  
  // Check sessionStorage (normal login)
  const sessionToken = sessionStorage.getItem('accessToken');
  const sessionIsGuest = sessionStorage.getItem('isGuest');
  
  if (sessionToken && sessionIsGuest === 'false') {
    return true;
  }
  
  return false;
}

/**
 * Get current user info from storage
 */
export function getCurrentUser(): User | null {
  // Check localStorage first (remember me)
  let userName = localStorage.getItem('userName');
  let userEmail = localStorage.getItem('userEmail');
  let isGuest = localStorage.getItem('isGuest');
  
  if (!userName) {
    // Check sessionStorage (normal login)
    userName = sessionStorage.getItem('userName');
    userEmail = sessionStorage.getItem('userEmail');
    isGuest = sessionStorage.getItem('isGuest');
  }
  
  if (userName && userEmail) {
    return {
      name: userName,
      email: userEmail,
      isGuest: isGuest === 'true'
    };
  }
  
  return null;
}

/**
 * Get access token from storage
 */
export function getAccessToken(): string | null {
  // Check localStorage first (remember me)
  let token = localStorage.getItem('accessToken');
  
  if (!token) {
    // Check sessionStorage (normal login)
    token = sessionStorage.getItem('accessToken');
  }
  
  return token;
}

/**
 * Logout user by clearing all auth data
 */
export function logout(): void {
  // Clear localStorage
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('isGuest');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('rememberMe');
  
  // Clear sessionStorage
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('userEmail');
  sessionStorage.removeItem('isGuest');
  sessionStorage.removeItem('accessToken');
}

/**
 * Check if user has "Remember Me" enabled
 */
export function hasRememberMe(): boolean {
  return localStorage.getItem('rememberMe') === 'true';
}