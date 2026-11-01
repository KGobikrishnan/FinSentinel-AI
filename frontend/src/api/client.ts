import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Crypto-safe UUID generator for Idempotency-Key
function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer Token and Idempotency-Key
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('finsentinel_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach Idempotency-Key for all mutating HTTP methods
    const method = config.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '') && config.headers) {
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = generateIdempotencyKey();
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Seamless Refresh Token Rotation
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('finsentinel_refresh_token');
      const username = localStorage.getItem('finsentinel_username');

      if (!refreshToken || !username) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          username,
          refreshToken,
        });

        localStorage.setItem('finsentinel_access_token', data.accessToken);
        localStorage.setItem('finsentinel_refresh_token', data.refreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        processQueue(null, data.accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        localStorage.removeItem('finsentinel_access_token');
        localStorage.removeItem('finsentinel_refresh_token');
        localStorage.removeItem('finsentinel_username');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
