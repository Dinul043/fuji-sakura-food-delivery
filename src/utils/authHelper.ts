/**
 * Auth Helper — handles token refresh before redirecting to login.
 * Use this instead of raw `if (!token) redirect` checks.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get a valid access token. If expired/missing, tries to refresh.
 * Returns the token if valid, or null if refresh also failed.
 */
export async function getValidToken(): Promise<string | null> {
  let token = localStorage.getItem('token');
  
  // Token exists and not expired — return it
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() < payload.exp * 1000) {
        return token; // Valid
      }
    } catch {
      // Invalid format — treat as expired
    }
  }

  // Token missing or expired — try refresh
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      return data.access_token;
    }
  } catch {}

  // Refresh failed — clear everything
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return null;
}
