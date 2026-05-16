/**
 * Global API Client with Automatic Token Refresh
 * 
 * Phase 2 implementation:
 * - Intercepts 401 errors and attempts token refresh
 * - Retries the original request with new token
 * - Prevents infinite retry loops
 * - Handles all 4 roles (user, restaurant, admin, delivery)
 * 
 * Usage: import { apiFetch } from '@/utils/apiClient';
 *        const res = await apiFetch('/api/orders/', { method: 'GET' }, 'user');
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Token Storage Helpers ─────────────────────────────────────────────────

export function getAccessToken(role: string): string | null {
  if (typeof window === 'undefined') return null;
  switch (role) {
    case 'user': return localStorage.getItem('token');
    case 'restaurant': return sessionStorage.getItem('restaurantToken');
    case 'admin': return localStorage.getItem('adminToken');
    case 'delivery': return sessionStorage.getItem('deliveryToken');
    default: return null;
  }
}

export function getRefreshToken(role: string): string | null {
  if (typeof window === 'undefined') return null;
  switch (role) {
    case 'user': return localStorage.getItem('refreshToken');
    case 'restaurant': return sessionStorage.getItem('restaurantRefreshToken');
    case 'admin': return localStorage.getItem('adminRefreshToken');
    case 'delivery': return sessionStorage.getItem('deliveryRefreshToken');
    default: return null;
  }
}

export function setTokens(role: string, accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  switch (role) {
    case 'user':
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      break;
    case 'restaurant':
      sessionStorage.setItem('restaurantToken', accessToken);
      sessionStorage.setItem('restaurantRefreshToken', refreshToken);
      break;
    case 'admin':
      localStorage.setItem('adminToken', accessToken);
      localStorage.setItem('adminRefreshToken', refreshToken);
      break;
    case 'delivery':
      sessionStorage.setItem('deliveryToken', accessToken);
      sessionStorage.setItem('deliveryRefreshToken', refreshToken);
      break;
  }
}

export function clearTokens(role: string): void {
  if (typeof window === 'undefined') return;
  switch (role) {
    case 'user':
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      break;
    case 'restaurant':
      sessionStorage.removeItem('restaurantToken');
      sessionStorage.removeItem('restaurantRefreshToken');
      break;
    case 'admin':
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      break;
    case 'delivery':
      sessionStorage.removeItem('deliveryToken');
      sessionStorage.removeItem('deliveryRefreshToken');
      break;
  }
}

// ── Refresh Endpoints ─────────────────────────────────────────────────────

function getRefreshEndpoint(role: string): string {
  switch (role) {
    case 'user': return '/api/auth/refresh';
    case 'restaurant': return '/api/restaurant/refresh';
    case 'admin': return '/api/admin/refresh';
    case 'delivery': return '/api/delivery/refresh';
    default: return '/api/auth/refresh';
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

// ── Refresh Logic (prevents concurrent refresh calls) ─────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(role: string): Promise<boolean> {
  const refreshToken = getRefreshToken(role);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}${getRefreshEndpoint(role)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(role, data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function refreshAccessToken(role: string): Promise<boolean> {
  // Prevent multiple concurrent refresh calls
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = doRefresh(role);
  const result = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;
  return result;
}

// ── Main Fetch Wrapper ────────────────────────────────────────────────────

/**
 * Fetch wrapper with automatic token refresh on 401.
 * 
 * @param endpoint - API path (e.g. '/api/orders/')
 * @param options - Standard fetch options
 * @param role - 'user' | 'restaurant' | 'admin' | 'delivery'
 * @returns Response object (same as fetch)
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  role: string
): Promise<Response> {
  const accessToken = getAccessToken(role);

  // Build headers with auth
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // First attempt
  let response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  // If 401 — try refresh once (no infinite loop)
  if (response.status === 401) {
    const refreshed = await refreshAccessToken(role);

    if (refreshed) {
      // Retry with new token
      const newToken = getAccessToken(role);
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    } else {
      // Refresh failed — clear tokens and redirect to login
      clearTokens(role);
      if (typeof window !== 'undefined') {
        window.location.href = getLoginRoute(role);
      }
    }
  }

  return response;
}
