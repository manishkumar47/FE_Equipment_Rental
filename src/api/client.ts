import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage on every request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const sessionStr = localStorage.getItem('equipflow_auth');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth session from localStorage', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction & 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: string[] | null }>) => {
    if (error.response?.status === 401) {
      // If token expired or unauthorized, and not currently on auth pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/forgot-password') && !currentPath.includes('/reset-password')) {
        localStorage.removeItem('equipflow_auth');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    if (responseData?.message) {
      if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        return `${responseData.message}: ${responseData.errors.join(', ')}`;
      }
      return responseData.message;
    }
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 401) return 'Session expired or not authenticated. Please log in again.';
    if (error.response?.status === 429) return 'Too many requests. Please slow down and try again.';
    if (error.message) return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
export function getRetryAfterSeconds(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    return error.response.data?.data?.retryAfterSeconds ?? null;
  }
  return null;
}