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

function getRole(): string | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem('token')) return 'user';
  if (sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken')) return 'restaurant';
  if (localStorage.getItem('adminToken')) return 'admin';
  if (sessionStorage.getItem('deliveryToken') || localStorage.getItem('deliveryToken')) return 'delivery';
  return null;
}

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

export default function FetchInterceptor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

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
      refreshPromise = null;

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
        // Refresh failed — redirect to login
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
