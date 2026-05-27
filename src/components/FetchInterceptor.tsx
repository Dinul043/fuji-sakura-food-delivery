'use client';

import { useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * FetchInterceptor — overrides global fetch to handle 401 + token refresh.
 * 
 * How it works:
 * 1. Wraps the native fetch function
 * 2. If any API call returns 401 → tries to refresh the token
 * 3. If refresh succeeds → retries the original request
 * 4. If refresh fails → redirects to login
 * 
 * This means NO individual page needs to be changed.
 * Just wrap the app with this component in layout.tsx.
 */

function getRoleFromUrl(url: string): string | null {
  if (url.includes('/api/admin/')) return 'admin';
  if (url.includes('/api/restaurant/')) return 'restaurant';
  if (url.includes('/api/delivery/')) return 'delivery';
  // Default to user for /api/auth/, /api/cart/, /api/orders/, etc.
  return 'user';
}

function getRefreshToken(role: string): string | null {
  switch (role) {
    case 'user': return localStorage.getItem('refreshToken');
    case 'restaurant': return localStorage.getItem('restaurantRefreshToken') || sessionStorage.getItem('restaurantRefreshToken');
    case 'admin': return localStorage.getItem('adminRefreshToken');
    case 'delivery': return localStorage.getItem('deliveryRefreshToken') || sessionStorage.getItem('deliveryRefreshToken');
    default: return null;
  }
}

function getRefreshEndpoint(role: string): string {
  switch (role) {
    case 'user': return `${API_BASE_URL}/api/auth/refresh`;
    case 'restaurant': return `${API_BASE_URL}/api/restaurant/refresh`;
    case 'admin': return `${API_BASE_URL}/api/admin/refresh`;
    case 'delivery': return `${API_BASE_URL}/api/delivery/refresh`;
    default: return `${API_BASE_URL}/api/auth/refresh`;
  }
}

function setTokens(role: string, accessToken: string, refreshToken: string) {
  switch (role) {
    case 'user':
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      break;
    case 'restaurant': {
      // Check which storage has the token (remember me = localStorage)
      const rStorage = localStorage.getItem('restaurantRememberMe') === 'true' ? localStorage : sessionStorage;
      rStorage.setItem('restaurantToken', accessToken);
      rStorage.setItem('restaurantRefreshToken', refreshToken);
      break;
    }
    case 'admin':
      localStorage.setItem('adminToken', accessToken);
      localStorage.setItem('adminRefreshToken', refreshToken);
      break;
    case 'delivery': {
      // Check which storage has the token (remember me = localStorage)
      const dStorage = localStorage.getItem('deliveryRememberMe') === 'true' ? localStorage : sessionStorage;
      dStorage.setItem('deliveryToken', accessToken);
      dStorage.setItem('deliveryRefreshToken', refreshToken);
      break;
    }
  }
}

function getLoginRoute(role: string): string {
  switch (role) {
    case 'restaurant': return '/restaurant/login';
    case 'admin': return '/admin';
    case 'delivery': return '/delivery/login';
    default: return '/login';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Helper: check if a JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Invalid token = treat as expired
  }
}

export default function FetchInterceptor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // On mount: check ALL tokens — if expired AND no valid refresh token, clear and redirect
    const currentPath = window.location.pathname;

    // User token check
    const userToken = localStorage.getItem('token');
    if (userToken && isTokenExpired(userToken)) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isGuest');
        if (currentPath.startsWith('/home') || currentPath.startsWith('/orders') || currentPath.startsWith('/checkout') || currentPath.startsWith('/profile') || currentPath.startsWith('/cart')) {
          window.location.href = '/login';
          return;
        }
      }
    }

    // Restaurant token check
    const restaurantToken = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken');
    if (restaurantToken && isTokenExpired(restaurantToken)) {
      const rRefresh = localStorage.getItem('restaurantRefreshToken') || sessionStorage.getItem('restaurantRefreshToken');
      if (!rRefresh) {
        localStorage.removeItem('restaurantToken');
        sessionStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantRefreshToken');
        sessionStorage.removeItem('restaurantRefreshToken');
        if (currentPath.startsWith('/restaurant/dashboard') || currentPath.startsWith('/restaurant/orders') || currentPath.startsWith('/restaurant/menu') || currentPath.startsWith('/restaurant/profile') || currentPath.startsWith('/restaurant/earnings')) {
          window.location.href = '/restaurant/login';
          return;
        }
      }
    }

    // Admin token check
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && isTokenExpired(adminToken)) {
      const aRefresh = localStorage.getItem('adminRefreshToken');
      if (!aRefresh) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('isAdmin');
        if (currentPath.startsWith('/admin/dashboard') || currentPath.startsWith('/admin/settings') || currentPath.startsWith('/admin/payouts')) {
          window.location.href = '/admin';
          return;
        }
      }
    }

    // Delivery token check
    const deliveryToken = localStorage.getItem('deliveryToken') || sessionStorage.getItem('deliveryToken');
    if (deliveryToken && isTokenExpired(deliveryToken)) {
      const dRefresh = localStorage.getItem('deliveryRefreshToken') || sessionStorage.getItem('deliveryRefreshToken');
      if (!dRefresh) {
        localStorage.removeItem('deliveryToken');
        sessionStorage.removeItem('deliveryToken');
        localStorage.removeItem('deliveryRefreshToken');
        sessionStorage.removeItem('deliveryRefreshToken');
        if (currentPath.startsWith('/delivery/dashboard') || currentPath.startsWith('/delivery/profile') || currentPath.startsWith('/delivery/earnings') || currentPath.startsWith('/delivery/settle')) {
          window.location.href = '/delivery/login';
          return;
        }
      }
    }

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // First attempt — normal fetch
      const response = await originalFetch(input, init);

      // Only intercept 401 on our API calls
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (response.status !== 401 || !url.includes(API_BASE_URL)) {
        return response;
      }
      
      // Don't intercept refresh endpoint itself (prevent infinite loop)
      if (url.includes('/refresh') || url.includes('/login') || url.includes('/verify')) {
        return response;
      }

      // Detect role based on the URL being called (not just which tokens exist)
      const role = getRoleFromUrl(url);
      if (!role) return response;

      const refreshToken = getRefreshToken(role);
      if (!refreshToken) return response;

      // Prevent concurrent refresh calls
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const refreshRes = await originalFetch(getRefreshEndpoint(role), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              setTokens(role, data.access_token, data.refresh_token);
              return true;
            }
            return false;
          } catch {
            return false;
          } finally {
            isRefreshing = false;
          }
        })();
      }

      const refreshed = await refreshPromise;

      if (refreshed) {
        // Retry original request with new token
        const newInit = { ...init };
        const headers = new Headers(init?.headers || {});
        
        // Get the new access token
        let newToken: string | null = null;
        switch (role) {
          case 'user': newToken = localStorage.getItem('token'); break;
          case 'restaurant': newToken = localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken'); break;
          case 'admin': newToken = localStorage.getItem('adminToken'); break;
          case 'delivery': newToken = localStorage.getItem('deliveryToken') || sessionStorage.getItem('deliveryToken'); break;
        }

        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
        }
        newInit.headers = headers;

        return originalFetch(input, newInit);
      } else {
        // Refresh failed — clear tokens and redirect to login
        // This prevents the login page from redirecting back (loop)
        if (role === 'user') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        } else if (role === 'restaurant') {
          localStorage.removeItem('restaurantToken');
          sessionStorage.removeItem('restaurantToken');
          localStorage.removeItem('restaurantRefreshToken');
          sessionStorage.removeItem('restaurantRefreshToken');
        } else if (role === 'admin') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
        } else if (role === 'delivery') {
          localStorage.removeItem('deliveryToken');
          sessionStorage.removeItem('deliveryToken');
          localStorage.removeItem('deliveryRefreshToken');
          sessionStorage.removeItem('deliveryRefreshToken');
        }
        window.location.href = getLoginRoute(role);
        return response;
      }
    };

    // Cleanup — restore original fetch on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
