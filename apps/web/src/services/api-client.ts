import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

type TokenProvider = (forceRefresh?: boolean) => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(fn: TokenProvider): void {
  tokenProvider = fn;
}

// Extend InternalAxiosRequestConfig to track retry state
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token when available
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

// Response interceptor — on 401, force-refresh the token and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as { config?: RetryableRequestConfig; response?: { status: number } };
    const originalRequest = axiosError.config;

    if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (tokenProvider) {
        const freshToken = await tokenProvider(true);
        if (freshToken) {
          originalRequest.headers.set('Authorization', `Bearer ${freshToken}`);
        }
      }

      return apiClient(originalRequest as AxiosRequestConfig);
    }

    return Promise.reject(error);
  },
);
