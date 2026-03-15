import axios, { AxiosInstance } from 'axios';

// Custom error class so tests can match by name/status
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Non-retryable HTTP status codes
const NO_RETRY_STATUSES = new Set([400, 401, 403, 404, 422]);

// In dev: use Vite proxy (/api → backend). In production/Capacitor: direct URL.
const BASE_URL = import.meta.env.DEV
  ? '/api'
  : `${import.meta.env.VITE_BACKEND_URL ?? 'https://inversionappb-backend.onrender.com'}`;

// Extend AxiosInstance with token helper
export interface AppApiClient extends AxiosInstance {
  setToken: (token: string | null) => void;
}

function createClient(): AppApiClient {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  }) as AppApiClient;

  // Inject auth token from localStorage on every request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token') ?? 'inversionapp2024';
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Retry with exponential backoff; wrap errors as ApiError
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      const status: number | undefined = error.response?.status;

      // Don't retry on client errors
      if (status && NO_RETRY_STATUSES.has(status)) {
        return Promise.reject(new ApiError(status, error.response?.data?.detail ?? error.message));
      }

      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount >= 3) {
        const finalStatus = status ?? 0;
        return Promise.reject(new ApiError(finalStatus, error.message));
      }

      const wait = [1000, 2000, 4000][config._retryCount - 1] ?? 4000;
      await new Promise((r) => setTimeout(r, wait));
      return instance(config);
    },
  );

  // Token management helper
  instance.setToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  return instance;
}

export const apiClient = createClient();

// Typed helper wrappers that unwrap .data
export const get = <T>(url: string, params?: object) =>
  apiClient.get<T>(url, { params }).then((r) => r.data);
export const post = <T>(url: string, data?: object) =>
  apiClient.post<T>(url, data).then((r) => r.data);
export const put = <T>(url: string, data?: object) =>
  apiClient.put<T>(url, data).then((r) => r.data);
export const del = <T>(url: string) =>
  apiClient.delete<T>(url).then((r) => r.data);

export default apiClient;
