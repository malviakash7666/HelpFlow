import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for receiving/sending HTTP-Only cookies (like refreshTokens)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach in-memory Access Token to every outbound request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Catch expired access tokens and seamlessly refresh them
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token request itself fails with 401
    if (originalRequest.url?.includes('/api/company/refresh-token')) {
      setAccessToken(null);
      window.dispatchEvent(new Event('auth-logout'));
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call refresh token endpoint with credentials (cookie is passed automatically)
        const refreshRes = await axios.post(
          `${API_URL}/api/company/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (refreshRes.data?.success && refreshRes.data?.data) {
          const { accessToken } = refreshRes.data.data;
          setAccessToken(accessToken);

          // Update header and retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh token failed or expired -> log user out
        setAccessToken(null);
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
